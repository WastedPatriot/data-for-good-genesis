import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Analyze Contact Severity Edge Function
 * 
 * Uses Lovable AI to analyze contact submissions and assign:
 * - Severity score (0-1)
 * - Priority level (low, medium, high, urgent)
 * - AI analysis with key insights
 * 
 * This helps admins prioritize responses and automate triage.
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== analyze-contact-severity: Request received ===");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { contactId, name, email, subject, message, submission_type, organization } = await req.json();

    if (!contactId || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing contactId or message" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Analyzing contact submission:", contactId);

    // Use Lovable AI (Gemini) for severity analysis
    const analysisPrompt = `You are an AI assistant analyzing customer contact submissions for a data marketplace platform called DataForEarth.

Analyze this contact submission and provide:
1. A severity score from 0.0 to 1.0 (where 1.0 is most urgent/severe)
2. Key insights about the submission
3. Recommended response priority
4. Any red flags or concerns

Contact details:
- Type: ${submission_type || "general"}
- Name: ${name}
- Email: ${email}
- Organization: ${organization || "Not provided"}
- Subject: ${subject}
- Message: ${message}

Consider these factors:
- Complaints and issues should have higher severity
- Partnership inquiries from organizations should be prioritized
- Data inquiry requests should be medium priority
- Legal threats or regulatory concerns should be urgent
- Time-sensitive requests should be prioritized
- Emotional tone and urgency in language

Respond in JSON format:
{
  "severity_score": 0.0-1.0,
  "priority_level": "low" | "medium" | "high" | "urgent",
  "key_insights": "Brief summary of main points",
  "sentiment": "positive" | "neutral" | "negative" | "angry",
  "requires_immediate_attention": boolean,
  "suggested_response_time": "within X hours/days",
  "red_flags": ["list of any concerns"],
  "category_confidence": 0.0-1.0
}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://api.lovable.app/v1/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log("AI Analysis completed:", {
      severity: analysis.severity_score,
      priority: analysis.priority_level,
    });

    // Calculate response time in minutes based on priority
    const responseTimeMap: { [key: string]: number } = {
      urgent: 60, // 1 hour
      high: 240, // 4 hours
      medium: 1440, // 24 hours
      low: 4320, // 3 days
    };

    // Update the contact submission with AI analysis
    const { error: updateError } = await supabaseClient
      .from("contact_submissions")
      .update({
        severity_score: analysis.severity_score,
        priority_level: analysis.priority_level,
        ai_analysis: analysis,
        response_time_minutes: responseTimeMap[analysis.priority_level] || 1440,
      })
      .eq("id", contactId);

    if (updateError) {
      console.error("Failed to update contact submission:", updateError);
      throw updateError;
    }

    console.log("Successfully updated contact with AI analysis");

    // Log to audit trail
    await supabaseClient.from("audit_logs").insert({
      action: "ai_contact_analysis",
      resource_type: "contact_submission",
      resource_id: contactId,
      severity: analysis.requires_immediate_attention ? "warn" : "info",
      details: {
        severity_score: analysis.severity_score,
        priority_level: analysis.priority_level,
        sentiment: analysis.sentiment,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        message: "Contact severity analyzed successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("=== analyze-contact-severity: Error ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        error: "Failed to analyze contact severity",
        message: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});