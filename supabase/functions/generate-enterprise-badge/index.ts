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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401
      });
    }

    // Calculate badge tier based on purchase history
    const { data: purchases } = await supabaseClient
      .from("purchases")
      .select("amount_paid")
      .eq("user_id", userData.user.id)
      .eq("status", "completed");

    const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
    const ecoContribution = totalSpent * 0.1;

    let badgeTier = "bronze";
    if (totalSpent >= 10000) badgeTier = "platinum";
    else if (totalSpent >= 5000) badgeTier = "gold";
    else if (totalSpent >= 1000) badgeTier = "silver";

    // Generate unique badge code and seed
    const badgeCode = `DFE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const badgeSeed = `${userData.user.email}-${Date.now()}`;

    // Check if badge already exists
    const { data: existingBadge } = await supabaseClient
      .from("enterprise_badges")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    let badge;
    if (existingBadge) {
      // Update existing badge
      const { data: updated } = await supabaseClient
        .from("enterprise_badges")
        .update({
          badge_tier: badgeTier,
          volume_purchased: totalSpent,
          eco_funding_contributed: ecoContribution
        })
        .eq("id", existingBadge.id)
        .select()
        .single();
      
      badge = updated;
    } else {
      // Create new badge
      const { data: created } = await supabaseClient
        .from("enterprise_badges")
        .insert({
          user_id: userData.user.id,
          badge_tier: badgeTier,
          badge_code: badgeCode,
          badge_seed: badgeSeed,
          volume_purchased: totalSpent,
          eco_funding_contributed: ecoContribution,
          verified: true
        })
        .select()
        .single();
      
      badge = created;
    }

    // Log to audit
    await supabaseClient.from("audit_logs").insert({
      user_id: userData.user.id,
      action: "enterprise_badge_generated",
      resource_type: "enterprise_badge",
      resource_id: badge.id,
      details: {
        tier: badgeTier,
        total_spent: totalSpent
      },
      severity: "info"
    });

    return new Response(JSON.stringify({ badge }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("Error generating badge:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
