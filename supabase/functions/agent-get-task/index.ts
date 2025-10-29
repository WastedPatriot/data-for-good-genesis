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

    const { agentId } = await req.json();

    console.log("Agent requesting task:", agentId);

    // Get highest priority pending task
    const { data: task, error } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

    if (!task) {
      return new Response(
        JSON.stringify({ success: true, task: null, message: "No tasks available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign task to agent
    const { data: assignedTask, error: assignError } = await supabase
      .from("agent_tasks")
      .update({
        agent_id: agentId,
        status: "assigned",
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .select()
      .single();

    if (assignError) throw assignError;

    console.log("Task assigned:", assignedTask.id, "to agent:", agentId);

    return new Response(
      JSON.stringify({ success: true, task: assignedTask }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error getting task:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get task" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
