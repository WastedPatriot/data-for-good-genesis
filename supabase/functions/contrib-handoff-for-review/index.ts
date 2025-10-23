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
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing submissionId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch submission
    const { data: submission, error: fetchError } = await supabaseClient
      .from("data_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Generate provenance hash
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(submission));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const provenanceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check for duplicates
    const { data: existingItem } = await supabaseClient
      .from("review_queue")
      .select("id")
      .eq("provenance_hash", provenanceHash)
      .maybeSingle();

    if (existingItem) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Duplicate detected",
          existingItemId: existingItem.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Create review queue item
    const { data: queueItem, error: insertError } = await supabaseClient
      .from("review_queue")
      .insert({
        source_type: "user_contribution",
        source_reference: submissionId,
        raw_payload: submission,
        normalized_payload: submission,
        category: submission.interests?.[0] || "general",
        tags: submission.interests || [],
        confidence_score: 0.8,
        quality_tier: "silver",
        provenance_hash: provenanceHash,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, queueItem }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("contrib-handoff error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
