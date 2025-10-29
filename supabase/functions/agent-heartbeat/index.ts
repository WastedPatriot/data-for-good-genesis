import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { agentId, stats } = await req.json();

    console.log("Heartbeat from agent:", agentId);

    // Call the heartbeat function
    const { data, error } = await supabase.rpc("agent_heartbeat", {
      p_agent_id: agentId,
      p_stats: stats || {},
    });

    if (error) throw error;

    // Check for pending tasks for this agent
    const { data: pendingTasks } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("agent_id", agentId)
      .in("status", ["assigned", "in_progress"])
      .order("priority", { ascending: false })
      .limit(5);

    // Mark agents as offline if no heartbeat in last 2 minutes
    await supabase
      .from("machine_agents")
      .update({ status: "offline" })
      .lt("last_heartbeat", new Date(Date.now() - 120000).toISOString());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Heartbeat received",
        pendingTasks: pendingTasks || []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing heartbeat:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Heartbeat failed" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
