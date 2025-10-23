import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

/**
 * Project Verification Endpoint
 * 
 * Admins use this to verify projects using AI-assisted fraud detection.
 * AI analyzes project details, checks for red flags, and provides recommendations.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { projectId, action, notes } = await req.json();

    if (!projectId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get project details
    const { data: project } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // If requesting AI analysis
    if (action === "analyze") {
      const analysisContext = `
Analyze this environmental project proposal for legitimacy and fraud risk:

Project Details:
- Title: ${project.title}
- Organization: ${project.organization_name}
- Description: ${project.description}
- Funding Goal: $${project.funding_goal}
- Category: ${project.category}
- Website: ${project.website_url || "Not provided"}
- Documentation: ${project.documentation_url || "Not provided"}
- Charity Registration: ${project.charity_registration_number || "Not provided"}
- Proof of Work: ${project.proof_of_work_url || "Not provided"}

Red Flags to Check:
1. Vague or generic project descriptions
2. Unrealistic funding goals or timelines
3. Missing verifiable documentation
4. No proof of previous work
5. Suspicious organization name or website
6. Lack of specific impact metrics
7. Generic or stock images
8. Missing charity registration (if claiming to be charity)

Provide a fraud risk assessment and verification recommendation.
`;

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
              content: "You are a fraud detection specialist for environmental projects. Analyze project proposals for legitimacy, red flags, and provide actionable recommendations."
            },
            {
              role: "user",
              content: analysisContext
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "assess_project_legitimacy",
                description: "Assess the legitimacy and fraud risk of an environmental project",
                parameters: {
                  type: "object",
                  properties: {
                    fraud_risk_score: {
                      type: "number",
                      description: "Risk score from 0.0 (safe) to 1.0 (high risk)"
                    },
                    recommendation: {
                      type: "string",
                      enum: ["approve", "request_more_info", "reject"],
                      description: "Verification recommendation"
                    },
                    red_flags: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of identified red flags"
                    },
                    positive_signals: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of positive legitimacy signals"
                    },
                    missing_documentation: {
                      type: "array",
                      items: { type: "string" },
                      description: "Critical documentation that is missing"
                    },
                    verification_notes: {
                      type: "string",
                      description: "Detailed notes for admin review"
                    }
                  },
                  required: ["fraud_risk_score", "recommendation", "red_flags", "positive_signals", "missing_documentation", "verification_notes"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "assess_project_legitimacy" } }
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("AI analysis failed");
      }

      const aiResult = await aiResponse.json();
      const analysis = aiResult.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
        ? JSON.parse(aiResult.choices[0].message.tool_calls[0].function.arguments)
        : null;

      return new Response(
        JSON.stringify({ analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update project status
    const updateData: any = {
      verification_notes: notes,
      verified_by: userData.user.id
    };

    if (action === "verify") {
      updateData.status = "verified";
      updateData.verified_at = new Date().toISOString();
    } else if (action === "reject") {
      updateData.status = "rejected";
    } else if (action === "request_info") {
      updateData.status = "under_review";
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to update project status. Please try again.",
          code: "UPDATE_FAILED"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Send email notification to project submitter
    if (project.submitted_by) {
      const { data: submitterData } = await supabaseAdmin.auth.admin.getUserById(project.submitted_by);
      
      if (submitterData?.user?.email) {
        try {
          const emailSubject = action === "verify" 
            ? `✅ Project Verified: ${project.title}`
            : action === "reject"
            ? `❌ Project Not Approved: ${project.title}`
            : `📋 More Information Needed: ${project.title}`;

          const emailBody = action === "verify"
            ? `Your project "${project.title}" has been verified and is now active for community voting!`
            : action === "reject"
            ? `Unfortunately, your project "${project.title}" was not approved. Reason: ${notes || "See verification notes"}`
            : `We need additional information for "${project.title}". ${notes || "Please provide the requested documentation"}`;

          await resend.emails.send({
            from: "Data for Earth <noreply@dataforearth.org>",
            to: [submitterData.user.email],
            subject: emailSubject,
            html: `
              <h2>${emailSubject}</h2>
              <p>${emailBody}</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
              <p><a href="https://dataforearth.org/projects">View Projects</a></p>
            `,
          });
        } catch (emailError) {
          console.error("Email error:", emailError);
        }
      }
    }

    // Log to audit
    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: userData.user.id,
        action: `project_${action}`,
        resource_type: "project",
        resource_id: projectId,
        details: {
          project_title: project.title,
          notes
        },
        severity: "info"
      });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("verify-project error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unable to process verification. Please try again.",
        code: "VERIFICATION_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
