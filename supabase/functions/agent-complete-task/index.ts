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

    const { taskId, agentId, success, result, error: taskError } = await req.json();

    console.log("Agent completing task:", taskId, "success:", success);

    const updateData: any = {
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (success) {
      updateData.status = "completed";
      updateData.result = result || {};
    } else {
      updateData.status = "failed";
      updateData.error_message = taskError || "Task failed";
      updateData.retry_count = supabase.raw("retry_count + 1");
    }

    const { data, error } = await supabase
      .from("agent_tasks")
      .update(updateData)
      .eq("id", taskId)
      .eq("agent_id", agentId)
      .select()
      .single();

    if (error) throw error;

    // Record metric
    if (success) {
      await supabase.from("agent_metrics").insert({
        agent_id: agentId,
        metric_type: `task_${data.task_type}_completed`,
        value: 1,
        metadata: { task_id: taskId },
      });
    }

    console.log("Task updated:", data);

    return new Response(
      JSON.stringify({ success: true, task: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error completing task:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to complete task" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
