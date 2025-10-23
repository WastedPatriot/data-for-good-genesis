import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const ingestSecret = req.headers.get("x-ingest-secret");
    if (ingestSecret !== Deno.env.get("INGEST_SECRET")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const payload = await req.json();
    const { event_type, data } = payload;

    if (!event_type || !data) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const validEvents = ["dataset_published", "badge_codes_low", "scraper_health", "alert_anomaly"];
    if (!validEvents.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid event type" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Store event
    const { data: event, error: eventError } = await supabaseAdmin
      .from("agent_events")
      .insert({
        event_type,
        payload: data,
      })
      .select()
      .single();

    if (eventError) {
      throw eventError;
    }

    // Handle specific events
    if (event_type === "dataset_published") {
      console.log(`Dataset published: ${data.dataset_id}`);
      
      // Update dataset with agent metadata if needed
      if (data.dataset_id) {
        await supabaseAdmin
          .from("datasets")
          .update({ 
            updated_at: new Date().toISOString() 
          })
          .eq("id", data.dataset_id);
      }
    } else if (event_type === "badge_codes_low") {
      console.log(`Badge codes low alert: ${data.dataset_id}, remaining: ${data.remaining}`);
      
      // Could trigger auto-generation here
    } else if (event_type === "scraper_health") {
      console.log(`Scraper health: ${data.scraper_name}, status: ${data.status}`);
    } else if (event_type === "alert_anomaly") {
      console.log(`Anomaly detected: ${data.description}`);
      
      // Insert audit log for anomalies
      await supabaseAdmin.from("audit_logs").insert({
        action: "anomaly_detected",
        resource_type: "system",
        resource_id: data.source || "unknown",
        severity: "warn",
        details: data,
      });
    }

    return new Response(
      JSON.stringify({ 
        status: "received",
        timestamp: new Date().toISOString(),
        event_id: event.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("agent-webhook-handler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
