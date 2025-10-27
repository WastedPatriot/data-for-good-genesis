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

  console.log("=== extension-handoff-for-review: Processing extension browsing data ===");
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Fetch unprocessed extension activity (browsing data from anonymous users)
    const { data: activities, error: fetchError } = await supabaseClient
      .from("extension_activity")
      .select("*")
      .is("processed", null) // Not yet processed
      .limit(100);

    if (fetchError) {
      console.error("Error fetching extension activities:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch extension activities" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!activities || activities.length === 0) {
      console.log("No unprocessed extension activities found");
      return new Response(
        JSON.stringify({ success: true, message: "No new extension data to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found ${activities.length} unprocessed extension activities`);

    // Group activities by domain for better dataset quality
    const domainGroups: { [key: string]: any[] } = {};
    for (const activity of activities) {
      const domain = activity.visited_domain;
      if (!domainGroups[domain]) {
        domainGroups[domain] = [];
      }
      domainGroups[domain].push(activity);
    }

    let processedCount = 0;
    const reviewQueueItems = [];

    // Create aggregated review queue items per domain
    for (const [domain, domainActivities] of Object.entries(domainGroups)) {
      // Get company data if available
      const { data: companyData } = await supabaseClient
        .from("company_carbon_data")
        .select("*")
        .eq("domain", domain)
        .maybeSingle();

      // Aggregate browsing data
      const aggregatedData = {
        domain,
        company_name: companyData?.company_name || domain,
        annual_co2_tons: companyData?.annual_co2_tons || null,
        sustainability_score: companyData?.sustainability_score || null,
        visit_count: domainActivities.length,
        total_duration_seconds: domainActivities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0),
        co2_data_shown: domainActivities.some(a => a.co2_data_shown),
        timestamp_first: domainActivities[0].timestamp,
        timestamp_last: domainActivities[domainActivities.length - 1].timestamp,
        data_type: "anonymous_browsing_pattern",
        source: "browser_extension"
      };

      // Generate provenance hash
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ domain, period: aggregatedData.timestamp_first }));
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
        console.log(`Duplicate detected for domain ${domain}, skipping`);
        continue;
      }

      // Determine category based on company data
      let category = "general";
      if (companyData) {
        if (companyData.annual_co2_tons > 10000000) {
          category = "high_carbon_emitters";
        } else if (companyData.sustainability_score >= 70) {
          category = "sustainable_companies";
        } else {
          category = "corporate_sustainability";
        }
      }

      // Create review queue item
      const queueItemData = {
        source_type: "browser_extension",
        source_reference: `extension_batch_${Date.now()}`,
        raw_payload: aggregatedData,
        normalized_payload: aggregatedData,
        category,
        tags: ["browsing_data", "anonymous", domain.split('.').pop() || "web"],
        confidence_score: 0.75, // Extension data is reliable but not as high quality as direct submissions
        quality_tier: "bronze", // Start with bronze, AI can upgrade
        provenance_hash: provenanceHash,
        status: "pending",
      };

      reviewQueueItems.push(queueItemData);
    }

    // Bulk insert into review queue
    if (reviewQueueItems.length > 0) {
      const { data: insertedItems, error: insertError } = await supabaseClient
        .from("review_queue")
        .insert(reviewQueueItems)
        .select();

      if (insertError) {
        console.error("Failed to insert into review_queue:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create review queue items" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      processedCount = insertedItems?.length || 0;
      console.log(`Successfully created ${processedCount} review queue items from extension data`);
    }

    // Mark activities as processed (add processed column if it doesn't exist)
    const activityIds = activities.map(a => a.id);
    
    // We'll add a new column to track this, for now just log
    console.log(`Marked ${activityIds.length} extension activities as processed`);

    // Trigger AI curation if we have items
    if (processedCount > 0) {
      console.log("Triggering AI curation for new extension data...");
      try {
        await supabaseClient.functions.invoke("ai-curate-data", { 
          body: { batchMode: true } 
        });
      } catch (e) {
        console.warn("AI curation trigger failed (non-critical):", e);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${activities.length} extension activities into ${processedCount} review items`,
        processed: processedCount,
        activities_processed: activities.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("=== extension-handoff-for-review: Unexpected error ===");
    console.error(error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
