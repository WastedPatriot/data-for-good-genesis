import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
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
    // Verify API key for security
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("DATA_HARVEST_API_KEY");
    
    if (!apiKey || apiKey !== expectedKey) {
      console.warn("Unauthorized data harvest API access attempt");
      await supabaseClient
        .from("audit_logs")
        .insert({
          action: "unauthorized_api_access",
          resource_type: "data_harvest_api",
          details: { ip: req.headers.get("x-forwarded-for") },
          severity: "warning"
        });
      
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    console.log("Data harvest API request:", action);

    switch (action) {
      case "get_processed_data": {
        // Return all completed processed data
        const { data, error } = await supabaseClient
          .from("data_processing_queue")
          .select("*")
          .eq("processing_status", "completed")
          .order("processed_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        // Log access
        await supabaseClient
          .from("audit_logs")
          .insert({
            action: "data_harvest_api_access",
            resource_type: "data_harvest_api",
            details: { action, count: data?.length || 0 },
            severity: "info"
          });

        return new Response(
          JSON.stringify({ success: true, data, count: data?.length || 0 }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "get_by_category": {
        const category = url.searchParams.get("category");
        if (!category) {
          throw new Error("Category parameter required");
        }

        const { data, error } = await supabaseClient
          .from("data_processing_queue")
          .select("*")
          .eq("processing_status", "completed")
          .contains("categorization", { category })
          .order("processed_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data, count: data?.length || 0 }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "mark_archived": {
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) {
          throw new Error("Array of IDs required");
        }

        const { error } = await supabaseClient
          .from("data_processing_queue")
          .update({ processing_status: "archived" })
          .in("id", ids);

        if (error) throw error;

        // Log archival
        await supabaseClient
          .from("audit_logs")
          .insert({
            action: "data_archived",
            resource_type: "data_harvest_api",
            details: { count: ids.length },
            severity: "info"
          });

        return new Response(
          JSON.stringify({ success: true, archived: ids.length }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "health": {
        // Health check endpoint
        const { count, error } = await supabaseClient
          .from("data_processing_queue")
          .select("*", { count: "exact", head: true })
          .eq("processing_status", "completed");

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: "healthy",
            pending_data: count || 0,
            timestamp: new Date().toISOString()
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      default: {
        return new Response(
          JSON.stringify({ 
            error: "Invalid action",
            available_actions: ["get_processed_data", "get_by_category", "mark_archived", "health"]
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }
  } catch (error) {
    console.error("Error in data-harvest-api:", error);
    const errorMessage = error instanceof Error ? error.message : "API request failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
