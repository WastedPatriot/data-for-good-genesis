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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Validate x-ingest-secret header
    const ingestSecret = req.headers.get("x-ingest-secret");
    if (ingestSecret !== Deno.env.get("INGEST_SECRET")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const payload = await req.json();
    const { id, ...updates } = payload;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Policy ID required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update release policy
    const { data, error } = await supabaseAdmin
      .from("release_policy")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log burst mode changes
    if (updates.burst_mode_enabled !== undefined) {
      await supabaseAdmin.from("audit_logs").insert({
        action: updates.burst_mode_enabled ? "burst_mode_enabled" : "burst_mode_disabled",
        resource_type: "release_policy",
        resource_id: id,
        severity: "info",
        details: {
          channel: data.channel,
          reason: updates.burst_reason || "N/A",
          activated_at: updates.burst_activated_at
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("release-policy-update error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});