import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    console.log("Processing data submission:", submissionId);

    if (!submissionId) {
      throw new Error("Submission ID is required");
    }

    // Fetch the submission data
    const { data: submission, error: fetchError } = await supabaseClient
      .from("data_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      throw new Error("Submission not found");
    }

    // Create processing queue entry
    const { data: queueEntry, error: queueError } = await supabaseClient
      .from("data_processing_queue")
      .insert({
        submission_id: submissionId,
        processing_status: "processing",
      })
      .select()
      .single();

    if (queueError) {
      console.error("Error creating queue entry:", queueError);
      throw queueError;
    }

    console.log("Queue entry created:", queueEntry.id);

    // Prepare data for AI analysis
    const dataContext = `
Analyze this data submission and provide structured categorization:

Age Range: ${submission.age_range || "Not provided"}
Location: ${submission.location || "Not provided"}
Interests: ${submission.interests?.join(", ") || "Not provided"}
Device Ownership: ${submission.device_ownership || "Not provided"}
EV Ownership: ${submission.ev_ownership || "Not provided"}
Sustainability Interest: ${submission.sustainability || "Not provided"}
Sensor Data: ${JSON.stringify(submission.sensor_data || {})}

Provide analysis in this exact JSON structure:
{
  "category": "one of: demographics, technology, sustainability, environmental, behavioral",
  "subcategories": ["array", "of", "relevant", "tags"],
  "quality_score": 0.0-1.0,
  "data_type": "consumer_behavior|environmental_data|demographic_info|technology_usage",
  "potential_use_cases": ["array of use cases"],
  "processing_notes": "brief summary",
  "recommended_price": "suggested price in USD"
}`;

    // Call Lovable AI for analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a data analyst specializing in categorizing and evaluating user-submitted data for ethical data marketplaces. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: dataContext
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_data",
              description: "Categorize and analyze the submitted data",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["demographics", "technology", "sustainability", "environmental", "behavioral"]
                  },
                  subcategories: {
                    type: "array",
                    items: { type: "string" }
                  },
                  quality_score: {
                    type: "number",
                    minimum: 0,
                    maximum: 1
                  },
                  data_type: {
                    type: "string",
                    enum: ["consumer_behavior", "environmental_data", "demographic_info", "technology_usage"]
                  },
                  potential_use_cases: {
                    type: "array",
                    items: { type: "string" }
                  },
                  processing_notes: {
                    type: "string"
                  },
                  recommended_price: {
                    type: "string"
                  }
                },
                required: ["category", "subcategories", "quality_score", "data_type", "potential_use_cases", "processing_notes", "recommended_price"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "categorize_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    console.log("AI analysis complete");

    let analysis = null;
    if (aiResult.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      analysis = JSON.parse(aiResult.choices[0].message.tool_calls[0].function.arguments);
    }

    if (!analysis) {
      throw new Error("AI did not return valid analysis");
    }

    // Update processing queue with AI analysis
    const { error: updateError } = await supabaseClient
      .from("data_processing_queue")
      .update({
        processing_status: "completed",
        ai_analysis: analysis,
        categorization: {
          category: analysis.category,
          subcategories: analysis.subcategories,
          data_type: analysis.data_type
        },
        quality_score: analysis.quality_score,
        processed_data: {
          original: submission,
          analysis: analysis,
          timestamp: new Date().toISOString()
        },
        processed_at: new Date().toISOString(),
        backup_location: `backup/${submissionId}/${Date.now()}.json`
      })
      .eq("id", queueEntry.id);

    if (updateError) {
      console.error("Error updating queue:", updateError);
      throw updateError;
    }

    // Log audit trail
    await supabaseClient
      .from("audit_logs")
      .insert({
        action: "data_processed",
        resource_type: "data_submission",
        resource_id: submissionId,
        details: {
          queue_id: queueEntry.id,
          quality_score: analysis.quality_score,
          category: analysis.category
        },
        severity: "info"
      });

    console.log("Processing complete for submission:", submissionId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        queueId: queueEntry.id,
        analysis: analysis
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing submission:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process submission";
    
    // Log error to audit
    try {
      await supabaseClient
        .from("audit_logs")
        .insert({
          action: "data_processing_failed",
          resource_type: "data_submission",
          details: { error: errorMessage },
          severity: "error"
        });
    } catch (auditError) {
      console.error("Failed to log audit:", auditError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
