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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")!,
        },
      },
    }
  );

  try {
    // Verify admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { itemId, action, notes, publishDecision } = await req.json();

    if (!itemId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!["approve", "reject", "flag"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch the review item
    const { data: reviewItem, error: fetchError } = await supabaseAdmin
      .from("review_queue")
      .select("*")
      .eq("id", itemId)
      .single();

    if (fetchError || !reviewItem) {
      return new Response(
        JSON.stringify({ error: "Review item not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    let newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged";

    // Update review queue item
    const { error: updateError } = await supabaseAdmin
      .from("review_queue")
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
        publish_decision: publishDecision,
      })
      .eq("id", itemId);

    if (updateError) {
      throw updateError;
    }

    // If approved, add to curated pool
    if (action === "approve") {
      const { error: poolError } = await supabaseAdmin
        .from("curated_pool")
        .insert({
          review_queue_id: itemId,
          curated_payload: reviewItem.normalized_payload || reviewItem.raw_payload,
          category: reviewItem.category,
          tags: reviewItem.tags,
          confidence_score: reviewItem.confidence_score,
          quality_tier: reviewItem.quality_tier,
        });

      if (poolError) {
        console.error("Failed to add to curated pool:", poolError);
      }

      // Log event
      await supabaseAdmin.from("agent_events").insert({
        event_type: "review_approved",
        payload: {
          review_queue_id: itemId,
          reviewed_by: user.id,
          publish_decision: publishDecision,
        },
      });
    } else if (action === "reject") {
      await supabaseAdmin.from("agent_events").insert({
        event_type: "review_rejected",
        payload: {
          review_queue_id: itemId,
          reviewed_by: user.id,
          notes,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("review-queue-update error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
