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

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🤖 Starting automated curation and dataset building cycle...");

    // Step 1: Trigger AI curation for pending items
    const { data: pendingItems } = await supabaseAdmin
      .from("review_queue")
      .select("id")
      .eq("status", "pending")
      .limit(10);

    let curatedCount = 0;
    if (pendingItems && pendingItems.length > 0) {
      console.log(`Found ${pendingItems.length} pending items, triggering AI curation...`);
      
      const { error: curateError } = await supabaseAdmin.functions.invoke("ai-curate-data", {
        body: { batchMode: true }
      });

      if (curateError) {
        console.error("AI curation failed:", curateError);
      } else {
        curatedCount = pendingItems.length;
        console.log(`✅ AI curated ${curatedCount} items`);
      }
    }

    // Step 2: Check if we should build a dataset
    const { data: curatedItems, count: curatedCount2 } = await supabaseAdmin
      .from("curated_pool")
      .select("id", { count: "exact", head: true })
      .eq("usage_count", 0);

    const { data: lastDataset } = await supabaseAdmin
      .from("datasets")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const shouldBuild = (curatedCount2 || 0) >= 10 && 
      (!lastDataset || new Date(lastDataset.created_at).getTime() < Date.now() - 2 * 60 * 60 * 1000);

    let datasetBuilt = false;
    if (shouldBuild) {
      console.log(`Building dataset from ${curatedCount2} curated items...`);
      
      const { error: buildError } = await supabaseAdmin.functions.invoke("build-dataset-from-curated", {
        body: {
          category: "sustainability",
          useAI: true,
          burstMode: false,
          min_confidence: 0.7
        }
      });

      if (buildError) {
        console.error("Dataset build failed:", buildError);
      } else {
        datasetBuilt = true;
        console.log("✅ Dataset built and published to marketplace");
      }
    }

    // Log the automation run
    await supabaseAdmin.from("audit_logs").insert({
      action: "automation_cycle",
      resource_type: "automation",
      severity: "info",
      details: {
        pending_processed: curatedCount,
        dataset_built: datasetBuilt,
        curated_pool_size: curatedCount2,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        curated: curatedCount,
        dataset_built: datasetBuilt,
        curated_pool_size: curatedCount2,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Automation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
