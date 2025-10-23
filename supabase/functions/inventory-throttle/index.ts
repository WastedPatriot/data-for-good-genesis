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
    const { channel = "on_site" } = await req.json();

    // Get release policy
    const { data: policy, error: policyError } = await supabaseAdmin
      .from("release_policy")
      .select("*")
      .eq("channel", channel)
      .single();

    if (policyError) {
      throw policyError;
    }

    // Check available curated data
    const { count: curatedCount, error: countError } = await supabaseAdmin
      .from("curated_pool")
      .select("*", { count: "exact", head: true })
      .gte("confidence_score", policy.min_confidence);

    if (countError) {
      throw countError;
    }

    // Check datasets published this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: recentCount, error: recentError } = await supabaseAdmin
      .from("datasets")
      .select("*", { count: "exact", head: true })
      .eq("source_channel", channel)
      .gte("created_at", weekAgo.toISOString());

    if (recentError) {
      throw recentError;
    }

    // Calculate next available publish date
    let nextAvailableDate = new Date();
    if (policy.last_release_at) {
      const lastRelease = new Date(policy.last_release_at);
      nextAvailableDate = new Date(
        lastRelease.getTime() + policy.min_days_between_releases * 24 * 60 * 60 * 1000
      );
    }

    const canPublish = 
      (curatedCount || 0) >= 100 &&
      (recentCount || 0) < policy.max_datasets_per_week &&
      (new Date() >= nextAvailableDate || policy.burst_mode_enabled);

    return new Response(
      JSON.stringify({
        canPublish,
        policy: {
          channel: policy.channel,
          minDaysBetweenReleases: policy.min_days_between_releases,
          maxDatasetsPerWeek: policy.max_datasets_per_week,
          minConfidence: policy.min_confidence,
          minQualityTier: policy.min_quality_tier,
          burstModeEnabled: policy.burst_mode_enabled,
          burstReason: policy.burst_reason,
        },
        inventory: {
          curatedCount: curatedCount || 0,
          recentPublishCount: recentCount || 0,
          nextAvailableDate,
          lastReleaseAt: policy.last_release_at,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("inventory-throttle error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
