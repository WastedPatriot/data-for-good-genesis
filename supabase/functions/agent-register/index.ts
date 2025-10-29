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

    const { 
      agentId, 
      deviceName, 
      deviceFingerprint, 
      organizationId,
      capabilities 
    } = await req.json();

    console.log("Registering agent:", agentId, deviceName);

    // Check if agent already exists
    const { data: existingAgent } = await supabase
      .from("machine_agents")
      .select("*")
      .eq("agent_id", agentId)
      .single();

    if (existingAgent) {
      // Update existing agent
      const { data, error } = await supabase
        .from("machine_agents")
        .update({
          device_name: deviceName,
          device_fingerprint: deviceFingerprint,
          capabilities: capabilities || {},
          status: "online",
          last_heartbeat: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("agent_id", agentId)
        .select()
        .single();

      if (error) throw error;

      console.log("Agent updated:", data);
      return new Response(
        JSON.stringify({ success: true, agent: data, action: "updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Register new agent
    const { data, error } = await supabase
      .from("machine_agents")
      .insert({
        agent_id: agentId,
        device_name: deviceName,
        device_fingerprint: deviceFingerprint,
        organization_id: organizationId || null,
        capabilities: capabilities || {},
        status: "online",
        last_heartbeat: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log("Agent registered:", data);

    return new Response(
      JSON.stringify({ success: true, agent: data, action: "registered" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error registering agent:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Registration failed" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
