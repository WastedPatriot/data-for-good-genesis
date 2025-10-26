import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

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

    if (!category) {
      return new Response(
        JSON.stringify({ error: "Category is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check release policy
    const { data: policy, error: policyError } = await supabaseAdmin
      .from("release_policy")
      .select("*")
      .eq("channel", channel)
      .single();

    if (policyError) {
      return new Response(
        JSON.stringify({ error: "Release policy not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
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
              error: "Throttle limit reached", 
              nextAvailableDate: new Date(
                new Date(policy.last_release_at).getTime() + 
                policy.min_days_between_releases * 24 * 60 * 60 * 1000
              )
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
          );
        }
      }
    }

    // Fetch curated data
    let query = supabaseAdmin
      .from("curated_pool")
      .select("*")
      .eq("category", category)
      .gte("confidence_score", policy.min_confidence)
      .order("confidence_score", { ascending: false })
      .limit(filters.limit || 1000);

    if (filters.minQuality) {
      const tiers = ["bronze", "silver", "gold", "platinum"];
      const idx = tiers.indexOf(String(filters.minQuality));
      const allowed = idx >= 0 ? tiers.slice(idx) : tiers;
      query = query.in("quality_tier", allowed);
    }

    if (filters.enterpriseOnly) {
      query = query.eq("enterprise_grade", true);
    }

    const { data: curatedData, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!curatedData || curatedData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No curated data available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
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
- Category: ${category}
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
        name = `${category.charAt(0).toUpperCase() + category.slice(1)} Data Collection ${new Date().toISOString().split('T')[0]}`;
        description = `Curated ${category} data with ${curatedData.length} records, average confidence ${avgConfidence.toFixed(2)}.`;
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
      user_id: userData.user.id,
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
