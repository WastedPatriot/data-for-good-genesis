import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const ingestSecret = req.headers.get("x-ingest-secret");
    if (ingestSecret !== Deno.env.get("INGEST_SECRET")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { batchId, items } = await req.json();

    if (!batchId || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const queueItems = [];

    for (const item of items) {
      // Generate provenance hash
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(item));
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const provenanceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check for duplicates
      const { data: existingItem } = await supabaseClient
        .from("review_queue")
        .select("id")
        .eq("provenance_hash", provenanceHash)
        .maybeSingle();

      if (existingItem) {
        console.log(`Duplicate detected: ${provenanceHash}`);
        continue;
      }

      // Determine quality tier based on confidence
      const confidenceScore = item.confidence_score || 0.75;
      let qualityTier = "bronze";
      if (confidenceScore >= 0.95) qualityTier = "platinum";
      else if (confidenceScore >= 0.85) qualityTier = "gold";
      else if (confidenceScore >= 0.75) qualityTier = "silver";

      const queueItem = {
        source_type: "external_scraper",
        source_reference: batchId,
        raw_payload: item,
        normalized_payload: item,
        category: item.category || "climate",
        tags: item.tags || [],
        confidence_score: confidenceScore,
        quality_tier: qualityTier,
        provenance_hash: provenanceHash,
        status: "pending",
      };

      queueItems.push(queueItem);
    }

    if (queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0, message: "All items were duplicates" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { data: inserted, error: insertError } = await supabaseClient
      .from("review_queue")
      .insert(queueItems)
      .select();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, inserted: inserted.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("scrape-batch-handoff error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
