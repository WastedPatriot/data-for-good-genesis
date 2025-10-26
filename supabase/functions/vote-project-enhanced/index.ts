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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { projectId, action } = await req.json();

    // Get user badge for vote multiplier
    const { data: badge } = await supabaseAdmin
      .from("enterprise_badges")
      .select("badge_tier")
      .eq("user_id", userData.user.id)
      .eq("verified", true)
      .single();

    const voteMultiplier = badge
      ? badge.badge_tier === "platinum" ? 5
      : badge.badge_tier === "gold" ? 3
      : badge.badge_tier === "silver" ? 2
      : 1
      : 1;

    if (action === "vote") {
      // Insert vote with weight
      const { error: voteError } = await supabaseAdmin
        .from("project_votes")
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          vote_weight: voteMultiplier,
        });

      if (voteError) throw voteError;

      // Update cooldown
      await supabaseAdmin
        .from("vote_cooldowns")
        .upsert({
          user_id: userData.user.id,
          last_vote_at: new Date().toISOString(),
          vote_count_this_month: 1,
        });

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: userData.user.id,
        action: "project_voted",
        resource_type: "project",
        resource_id: projectId,
        severity: "info",
        details: {
          vote_weight: voteMultiplier,
          badge_tier: badge?.badge_tier || "none",
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Vote recorded",
          voteWeight: voteMultiplier,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Unvote
      const { error: deleteError } = await supabaseAdmin
        .from("project_votes")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Vote removed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Vote error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
