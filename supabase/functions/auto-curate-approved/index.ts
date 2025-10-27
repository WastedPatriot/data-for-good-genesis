import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const isServiceCall = token === (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    if (!userData.user && !isServiceCall) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    if (!isServiceCall) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user!.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    console.log("Starting auto-curation process...");

    // Step 1: Find completed processing queue items not yet in review queue
    const { data: processedItems, error: fetchError } = await supabaseAdmin
      .from("data_processing_queue")
      .select("*")
      .eq("processing_status", "completed")
      .is("published_dataset_id", null)
      .limit(50);

    if (fetchError) {
      console.error("Error fetching processed items:", fetchError);
      throw fetchError;
    }

    if (!processedItems || processedItems.length === 0) {
      console.log("No items to curate");
      return new Response(
        JSON.stringify({ success: true, message: "No items to curate", curated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found ${processedItems.length} items to curate`);
    let curatedCount = 0;

    // Step 2: For each item, move to review queue if quality score is good
    for (const item of processedItems) {
      const qualityScore = item.quality_score || 0;
      
      // Only auto-curate items with quality score >= 0.7
      if (qualityScore < 0.7) {
        console.log(`Skipping item ${item.id} - quality score too low: ${qualityScore}`);
        continue;
      }

      // Generate provenance hash
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(item.processed_data));
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const provenanceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check for duplicates in review queue
      const { data: existing } = await supabaseAdmin
        .from("review_queue")
        .select("id")
        .eq("provenance_hash", provenanceHash)
        .maybeSingle();

      if (existing) {
        console.log(`Skipping item ${item.id} - duplicate found in review queue`);
        continue;
      }

      // Determine quality tier based on score
      let qualityTier = "bronze";
      if (qualityScore >= 0.95) qualityTier = "platinum";
      else if (qualityScore >= 0.85) qualityTier = "gold";
      else if (qualityScore >= 0.75) qualityTier = "silver";

      const category = item.categorization?.category || item.ai_analysis?.category || "general";
      const tags = item.categorization?.subcategories || item.ai_analysis?.subcategories || [];

      // Insert into review queue with auto-approve for high quality
      const autoApprove = qualityScore >= 0.85;
      
      const { data: reviewItem, error: reviewError } = await supabaseAdmin
        .from("review_queue")
        .insert({
          source_type: "user_contribution",
          source_reference: item.submission_id,
          raw_payload: item.processed_data,
          normalized_payload: item.processed_data,
          category,
          tags,
          confidence_score: qualityScore,
          quality_tier: qualityTier,
          provenance_hash: provenanceHash,
          status: autoApprove ? "approved" : "pending",
          reviewed_at: autoApprove ? new Date().toISOString() : null,
          publish_decision: autoApprove ? "marketplace" : null,
        })
        .select()
        .single();

      if (reviewError) {
        console.error(`Error inserting review queue item for ${item.id}:`, reviewError);
        continue;
      }

      // If auto-approved and quality is silver or above, add to curated pool
      if (autoApprove && (qualityTier === "silver" || qualityTier === "gold" || qualityTier === "platinum")) {
        const { error: curatedError } = await supabaseAdmin
          .from("curated_pool")
          .insert({
            review_queue_id: reviewItem.id,
            category,
            tags,
            quality_tier: qualityTier,
            confidence_score: qualityScore,
            curated_payload: item.processed_data,
            enterprise_grade: qualityTier === "platinum",
            batch_number: Math.floor(Date.now() / 1000),
          });

        if (curatedError) {
          console.error(`Error adding to curated pool for ${item.id}:`, curatedError);
        } else {
          console.log(`✅ Auto-curated item ${item.id} to ${qualityTier} tier`);
        }
      }

      // Mark as processed in the queue
      await supabaseAdmin
        .from("data_processing_queue")
        .update({ 
          processing_status: autoApprove ? "published" : "in_review",
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      curatedCount++;
    }

    // Log audit trail
    await supabaseAdmin.from("audit_logs").insert({
      action: "auto_curation_run",
      resource_type: "curation_system",
      severity: "info",
      details: {
        items_processed: processedItems.length,
        items_curated: curatedCount,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Auto-curation complete: ${curatedCount}/${processedItems.length} items curated`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedItems.length,
        curated: curatedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Auto-curation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
