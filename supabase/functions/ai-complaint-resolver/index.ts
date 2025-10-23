import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { contact_submission_id } = await req.json();

    if (!contact_submission_id) {
      return new Response(
        JSON.stringify({ error: "contact_submission_id required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch the contact submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("contact_submissions")
      .select("*")
      .eq("id", contact_submission_id)
      .single();

    if (fetchError || !submission) {
      throw new Error("Contact submission not found");
    }

    // AI Analysis
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
            content: `You are DataForEarth's AI Customer Service Assistant. Analyze incoming complaints/issues and:

1. **Categorize** the issue (technical, billing, general inquiry, partnership, data quality, account issue)
2. **Assess urgency** (low, medium, high, critical)
3. **Determine if auto-resolvable**: Can you provide a helpful response immediately, or does it need human review?
4. **Draft a professional response** if auto-resolvable

AUTO-RESOLVE CRITERIA:
- General questions about platform features
- Password reset requests
- Basic data usage inquiries
- Documentation/FAQ requests
- Non-urgent feedback

ESCALATE TO ADMIN:
- Billing disputes
- Data quality complaints requiring investigation
- Legal/compliance issues
- Partnership inquiries from organizations
- Critical bugs/outages
- Requests for refunds

Return JSON format:
{
  "category": "technical|billing|inquiry|partnership|data_quality|account",
  "urgency": "low|medium|high|critical",
  "can_auto_resolve": boolean,
  "confidence": 0.0-1.0,
  "escalation_reason": "string (if can_auto_resolve=false)",
  "ai_response": "Professional response draft (if can_auto_resolve=true)"
}`
          },
          {
            role: "user",
            content: `Analyze this submission:

Name: ${submission.name}
Email: ${submission.email}
Organization: ${submission.organization || "N/A"}
Subject: ${submission.subject}
Message: ${submission.message}
Type: ${submission.submission_type}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Determine resolution status
    const resolution_status = analysis.can_auto_resolve ? "auto_resolved" : "escalated";

    // Insert complaint resolution
    const { data: resolution, error: resolutionError } = await supabaseAdmin
      .from("complaint_resolutions")
      .insert({
        contact_submission_id,
        ai_analysis: analysis,
        resolution_status,
        ai_response: analysis.ai_response || null,
        confidence_score: analysis.confidence,
        escalation_reason: analysis.escalation_reason || null,
        escalated_to_admin: !analysis.can_auto_resolve,
      })
      .select()
      .single();

    if (resolutionError) throw resolutionError;

    // Update contact submission status
    await supabaseAdmin
      .from("contact_submissions")
      .update({
        status: resolution_status === "auto_resolved" ? "resolved" : "pending",
        admin_notes: analysis.can_auto_resolve ? "AI Auto-Resolved" : `Escalated: ${analysis.escalation_reason}`
      })
      .eq("id", contact_submission_id);

    // If auto-resolved, send the response via admin-reply
    if (analysis.can_auto_resolve && analysis.ai_response) {
      await supabaseAdmin.functions.invoke("send-admin-reply", {
        body: {
          submission_id: contact_submission_id,
          reply_message: analysis.ai_response,
          auto_generated: true
        }
      });
    }

    // Log the resolution
    await supabaseAdmin.from("audit_logs").insert({
      action: "complaint_analyzed",
      resource_type: "complaint_resolutions",
      resource_id: resolution.id,
      severity: analysis.urgency === "critical" ? "error" : analysis.urgency === "high" ? "warn" : "info",
      details: {
        category: analysis.category,
        urgency: analysis.urgency,
        auto_resolved: analysis.can_auto_resolve,
        confidence: analysis.confidence
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        resolution,
        analysis
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("ai-complaint-resolver error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});