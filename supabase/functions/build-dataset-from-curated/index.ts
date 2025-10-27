import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    const ingestSecretHeader = req.headers.get("X-Ingest-Secret");

    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }

    const isServiceCall = token && token === (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const isAgentCall = ingestSecretHeader && ingestSecretHeader === (Deno.env.get("INGEST_SECRET") ?? "");

    // Try to resolve user if a token was provided
    const { data: userData } = token
      ? await supabaseAdmin.auth.getUser(token)
      : { data: { user: null } } as any;

    const actingUserId = userData?.user?.id || null;

    if (!userData?.user && !isServiceCall && !isAgentCall) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // If this is a real user call (not service/agent), enforce admin role
    if (userData?.user && !isServiceCall && !isAgentCall) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    const { 
      category, 
      channel = "on_site",
      burstMode = false,
      filters = {},
      useAI = true,
      manualName = null,
      manualDescription = null,
      manualPrice = null
    } = await req.json();

    console.log("[BUILD-DATASET] Starting build process for category:", category);

    if (!useAI && !category) {
      return new Response(
        JSON.stringify({ success: false, code: "BAD_REQUEST", error: "Category is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check release policy (create default if missing)
    let { data: policy, error: policyError } = await supabaseAdmin
      .from("release_policy")
      .select("*")
      .eq("channel", channel)
      .maybeSingle();

    if (policyError || !policy) {
      console.warn("[BUILD-DATASET] No release policy found for channel", channel, "— creating default");
      const defaultPolicy = {
        channel,
        min_quality_tier: "silver",
        min_confidence: 0.7,
        max_datasets_per_week: 2,
        min_days_between_releases: 7,
        burst_mode_enabled: false,
      } as any;

      const { data: inserted, error: insertPolicyError } = await supabaseAdmin
        .from("release_policy")
        .insert(defaultPolicy)
        .select()
        .single();

      if (insertPolicyError) {
        return new Response(
          JSON.stringify({ error: "Failed to initialize release policy" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      policy = inserted;
    }

    // Check throttles (unless burst mode)
    if (!burstMode && !policy.burst_mode_enabled) {
      if (policy.last_release_at) {
        const daysSinceRelease = Math.floor(
          (Date.now() - new Date(policy.last_release_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceRelease < policy.min_days_between_releases) {
          return new Response(
            JSON.stringify({ 
              success: false,
              code: "THROTTLED",
              error: "Throttle limit reached", 
              nextAvailableDate: new Date(
                new Date(policy.last_release_at).getTime() + 
                policy.min_days_between_releases * 24 * 60 * 60 * 1000
              ).toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }
    }

    // Fetch curated data with AI-friendly fallbacks
    const tiers = ["bronze", "silver", "gold", "platinum"] as const;
    const minTierIdx = Math.max(0, tiers.indexOf(String(policy.min_quality_tier || "silver") as any));
    const policyAllowedQualities = tiers.slice(minTierIdx);

    const applyManualFilters = !useAI;

    const loadCurated = async (
      cat: string | null,
      options: { onlyUnused: boolean; applyManualFilters: boolean }
    ): Promise<any[]> => {
      let q = supabaseAdmin
        .from("curated_pool")
        .select("*")
        .gte("confidence_score", policy.min_confidence as number)
        .order("confidence_score", { ascending: false })
        .limit((filters && (filters as any).limit) || 1000);

      if (cat) q = q.eq("category", cat);

      // Quality filtering: use manual minQuality only in manual mode, otherwise use policy
      if (options.applyManualFilters && (filters as any)?.minQuality) {
        const idx = tiers.indexOf(String((filters as any).minQuality) as any);
        const allowed = idx >= 0 ? tiers.slice(idx) : tiers;
        q = q.in("quality_tier", allowed as any);
      } else {
        q = q.in("quality_tier", policyAllowedQualities as any);
      }

      if (options.onlyUnused) q = q.eq("usage_count", 0);

      if (options.applyManualFilters && (filters as any)?.enterpriseOnly) {
        q = q.eq("enterprise_grade", true);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    };

    let effectiveCategory: string | null = category || null;
    let curatedData: any[] = [];

    // Attempt 1: with provided category and current filter strategy
    curatedData = await loadCurated(effectiveCategory, { onlyUnused: true, applyManualFilters });

    // AI mode fallbacks
    if (useAI && curatedData.length === 0) {
      // Allow previously used records
      curatedData = await loadCurated(effectiveCategory, { onlyUnused: false, applyManualFilters: false });
    }

    if (useAI && curatedData.length === 0) {
      // Discover best available category automatically
      const all = await loadCurated(null, { onlyUnused: true, applyManualFilters: false });
      if (all.length > 0) {
        const counts: Record<string, number> = {};
        for (const r of all) counts[r.category] = (counts[r.category] || 0) + 1;
        const topCat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        effectiveCategory = topCat;
        curatedData = all.filter((r) => r.category === topCat);
      }
    }

    if (useAI && curatedData.length === 0) {
      // Final attempt: trigger AI curation of pending items, then retry
      try {
        await supabaseAdmin.functions.invoke("ai-curate-data", { body: { batchMode: true } });
        // Retry with preferred strategy
        curatedData = await loadCurated(effectiveCategory, { onlyUnused: true, applyManualFilters: false });
        if (curatedData.length === 0) {
          const all = await loadCurated(null, { onlyUnused: true, applyManualFilters: false });
          if (all.length > 0) {
            const counts: Record<string, number> = {};
            for (const r of all) counts[r.category] = (counts[r.category] || 0) + 1;
            const topCat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
            effectiveCategory = topCat;
            curatedData = all.filter((r) => r.category === topCat);
          }
        }
      } catch (e) {
        console.warn("[BUILD-DATASET] AI curation invoke failed", e);
      }
    }

    if (!curatedData || curatedData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, code: "NO_DATA", error: "No curated data available after AI fallback" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`[BUILD-DATASET] Found ${curatedData.length} curated records`);

    // Calculate quality metrics
    const avgConfidence = curatedData.reduce((sum, d) => sum + parseFloat(String(d.confidence_score)), 0) / curatedData.length;
    const qualityTiers = curatedData.map(d => d.quality_tier);
    const topTier = qualityTiers.includes("platinum") ? "platinum" : 
                    qualityTiers.includes("gold") ? "gold" : 
                    qualityTiers.includes("silver") ? "silver" : "bronze";

    // Get data type and domain info
    const domains = [...new Set(curatedData.map(d => d.domain).filter(Boolean))];
    const dataTypes = [...new Set(curatedData.map(d => d.category).filter(Boolean))];
    
    let name = manualName;
    let description = manualDescription;
    let price = manualPrice;

    // AI-powered title and description generation
    if (useAI && !name) {
      console.log("[BUILD-DATASET] Generating AI title and description...");
      
      const samplePayloads = curatedData.slice(0, 10).map(d => d.curated_payload);
      
      const titlePrompt = `Analyze this curated dataset and generate a professional, compelling dataset title and description.

Dataset Metrics:
- Category: ${effectiveCategory || category || 'mixed'}
- Record Count: ${curatedData.length}
- Quality Tiers: ${JSON.stringify(qualityTiers.slice(0, 5))}
- Average Confidence: ${avgConfidence.toFixed(2)}
- Domains: ${domains.join(", ")}
- Data Types: ${dataTypes.join(", ")}

Sample Data (first 10 records):
${JSON.stringify(samplePayloads, null, 2)}

Generate a professional title that:
1. Includes the time period (Q1 2025, etc)
2. Clearly indicates the data type
3. Is compelling for B2B buyers
4. Follows pattern: "[Type] Data: [Specific Focus] [Time Period]"

Example titles:
- "Climate Risk Signals: Global Weather Impact Data Q1 2025"
- "ESG Compliance Intelligence: Corporate Sustainability Metrics 2024-2025"
- "Market Sentiment Tracker: Consumer Sustainability Trends Q4 2024"

Also provide a 2-3 sentence description highlighting:
- What's included
- Key use cases
- Data quality and freshness`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a data product specialist creating compelling dataset titles and descriptions for B2B customers."
            },
            { role: "user", content: titlePrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_dataset_metadata",
              description: "Generate title and description for dataset",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Professional dataset title" },
                  description: { type: "string", description: "2-3 sentence dataset description" },
                  suggested_tags: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "3-5 relevant tags" 
                  }
                },
                required: ["title", "description", "suggested_tags"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "generate_dataset_metadata" } }
        }),
      });

      if (aiResponse.ok) {
        const result = await aiResponse.json();
        if (result.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
          const metadata = JSON.parse(result.choices[0].message.tool_calls[0].function.arguments);
          name = metadata.title;
          description = metadata.description;
          console.log("[BUILD-DATASET] AI generated title:", name);
        }
      } else {
        console.error("[BUILD-DATASET] AI title generation failed, using fallback");
        const catLabel = (effectiveCategory || category || "Curated");
        const catTitle = catLabel.charAt(0).toUpperCase() + catLabel.slice(1);
        name = `${catTitle} Data Collection ${new Date().toISOString().split('T')[0]}`;
        description = `Curated ${catLabel} data with ${curatedData.length} records, average confidence ${avgConfidence.toFixed(2)}.`;
      }
    }

    // AI-powered dynamic pricing
    if (useAI && !price) {
      console.log("[BUILD-DATASET] Calculating AI-powered pricing...");
      
      const pricingResponse = await supabaseAdmin.functions.invoke("ai-dynamic-pricing", {
        body: {
          datasetInfo: { name, description },
          qualityScore: avgConfidence,
          dataType: category,
          category,
          recordCount: curatedData.length
        }
      });

      if (pricingResponse.data && !pricingResponse.error) {
        price = pricingResponse.data.recommended_price;
        console.log("[BUILD-DATASET] AI recommended price: $", price);
      } else {
        console.error("[BUILD-DATASET] Pricing AI failed, using fallback");
        price = 99; // Fallback price
      }
    }

    // Ensure we have all required fields
    if (!name || !description || !price) {
      return new Response(
        JSON.stringify({ error: "Failed to generate dataset metadata" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("[BUILD-DATASET] Creating Stripe product:", name);

    // Create Stripe product
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const product = await stripe.products.create({
      name,
      description,
      metadata: {
        category,
        quality_tier: topTier,
        record_count: curatedData.length.toString(),
        avg_confidence: avgConfidence.toFixed(2)
      }
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: "usd",
    });

    console.log("[BUILD-DATASET] Stripe product created:", product.id);

    // Create dataset record
    const batchNumber = Math.floor(Date.now() / 1000);

    const { data: dataset, error: datasetError } = await supabaseAdmin
      .from("datasets")
      .insert({
        name,
        description,
        category,
        price,
        stripe_product_id: product.id,
        stripe_price_id: stripePrice.id,
        active: true,
        featured: false,
        enterprise_grade: filters.enterpriseOnly || false,
        limited_supply: filters.limitedSupply || null,
        batch_number: batchNumber,
        source_channel: channel,
        sample_data: curatedData.slice(0, 5).map(d => d.curated_payload),
      })
      .select()
      .single();

    if (datasetError) {
      throw datasetError;
    }

    // Update curated pool usage
    const curatedIds = curatedData.map(d => d.id);
    for (const id of curatedIds) {
      const { data: existingPool } = await supabaseAdmin
        .from("curated_pool")
        .select("used_in_datasets, usage_count")
        .eq("id", id)
        .single();

      if (existingPool) {
        await supabaseAdmin
          .from("curated_pool")
          .update({
            used_in_datasets: [...(existingPool.used_in_datasets || []), dataset.id],
            usage_count: (existingPool.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq("id", id);
      }
    }

    // Update release policy
    await supabaseAdmin
      .from("release_policy")
      .update({
        last_release_at: new Date().toISOString(),
        burst_mode_enabled: false,
      })
      .eq("channel", channel);

    // Log event
    await supabaseAdmin.from("agent_events").insert({
      event_type: "dataset_published",
      payload: {
        dataset_id: dataset.id,
        name,
        channel,
        burst_mode: burstMode || policy.burst_mode_enabled,
        avg_confidence: avgConfidence,
        top_quality_tier: topTier,
        record_count: curatedData.length,
      },
    });

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      action: "dataset_built_from_curated",
      resource_type: "dataset",
      resource_id: dataset.id,
      user_id: actingUserId,
      severity: "info",
      details: {
        name,
        channel,
        burst_mode: burstMode || policy.burst_mode_enabled,
        curated_count: curatedData.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        dataset,
        stats: {
          recordCount: curatedData.length,
          avgConfidence,
          topQualityTier: topTier,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("build-dataset error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
