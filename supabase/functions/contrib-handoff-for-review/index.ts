import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== contrib-handoff-for-review: Request received ===");
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { submissionId } = requestBody;

    if (!submissionId) {
      console.error("Missing submissionId in request");
      return new Response(
        JSON.stringify({ error: "Missing submissionId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processing submission ID:", submissionId);

    // Fetch submission with detailed error handling
    const { data: submission, error: fetchError } = await supabaseClient
      .from("data_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchError) {
      console.error("Database fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database error fetching submission", details: fetchError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!submission) {
      console.error("Submission not found for ID:", submissionId);
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("Submission fetched successfully:", submission.id);

    // Generate provenance hash for duplicate detection
    let provenanceHash: string;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(submission));
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      provenanceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      console.log("Generated provenance hash:", provenanceHash);
    } catch (hashError) {
      console.error("Failed to generate provenance hash:", hashError);
      return new Response(
        JSON.stringify({ error: "Failed to generate provenance hash" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Check for duplicates in review queue
    const { data: existingItem, error: dupCheckError } = await supabaseClient
      .from("review_queue")
      .select("id")
      .eq("provenance_hash", provenanceHash)
      .maybeSingle();

    if (dupCheckError) {
      console.error("Error checking for duplicates:", dupCheckError);
      // Continue anyway - duplicate check is not critical
    }

    if (existingItem) {
      console.log("Duplicate detected, existing item ID:", existingItem.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Duplicate detected",
          existingItemId: existingItem.id,
          provenanceHash 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Create review queue item with comprehensive data
    console.log("Creating review queue item...");
    const queueItemData = {
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
    };

    const { data: queueItem, error: insertError } = await supabaseClient
      .from("review_queue")
      .insert(queueItemData)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert into review_queue:", insertError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create review queue item", 
          details: insertError.message,
          code: insertError.code 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Successfully created review queue item:", queueItem.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        queueItem,
        message: "Submission successfully added to review queue" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("=== contrib-handoff-for-review: Unexpected error ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message,
        type: error.name 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
