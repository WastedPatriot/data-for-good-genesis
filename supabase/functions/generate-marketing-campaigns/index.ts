import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

/**
 * Automated Marketing Campaign Generator
 * 
 * Researches companies in target industries and generates personalized outreach campaigns
 * Uses AI to analyze company websites and create tailored email content
 * 
 * Flow:
 * 1. Admin specifies industry/criteria
 * 2. AI researches relevant companies
 * 3. For each company: analyze their work, generate personalized email
 * 4. Save campaigns to marketing_campaigns table for review
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("[CAMPAIGN-GEN] Starting automated campaign generation");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { 
      industry, 
      count = 5,
      keywords = ["sustainability", "ESG", "climate data"]
    } = await req.json();

    console.log(`[CAMPAIGN-GEN] Researching ${count} companies in ${industry}`);

    // Step 1: Research companies using AI
    const researchPrompt = `Research ${count} real companies in the ${industry} industry that would benefit from sustainability and climate data.

For each company, provide:
1. Company name
2. Website domain
3. Best contact email (partnerships@, hello@, contact@, or info@)
4. Specific reason they need climate/sustainability data (reference actual initiatives)
5. Key decision maker role (e.g., "Head of Sustainability")

Return ONLY valid JSON array in this exact format:
[
  {
    "name": "Company Name Inc",
    "website": "https://companyname.com",
    "email": "partnerships@companyname.com",
    "contact_role": "Head of Sustainability",
    "fit_reason": "Specific reason based on their actual work"
  }
]

Focus on companies actively working on: ${keywords.join(", ")}
Prioritize mid-sized to large enterprises with sustainability programs.`;

    const researchResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "You are a B2B research assistant specializing in sustainability and climate tech companies. Return only valid JSON."
          },
          { role: "user", content: researchPrompt }
        ],
      }),
    });

    if (!researchResponse.ok) {
      console.error("[CAMPAIGN-GEN] Research AI failed:", researchResponse.status);
      throw new Error("Failed to research companies");
    }

    const researchData = await researchResponse.json();
    const researchText = researchData.choices[0].message.content;
    
    console.log("[CAMPAIGN-GEN] AI Research complete:", researchText.substring(0, 200));

    // Extract JSON from response
    const jsonMatch = researchText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON");
    }

    const companies = JSON.parse(jsonMatch[0]);
    console.log(`[CAMPAIGN-GEN] Found ${companies.length} companies`);

    // Step 2: Generate personalized email for each company
    const campaignsCreated = [];

    for (const company of companies) {
      console.log(`[CAMPAIGN-GEN] Generating email for ${company.name}`);

      const emailPrompt = `Write a professional B2B outreach email to ${company.name}.

Company Context:
- Website: ${company.website}
- Contact: ${company.contact_role}
- Why they're a fit: ${company.fit_reason}

DataForEarth Value Prop:
- Ethical, curated sustainability & climate data marketplace
- Real-time ESG signals, policy tracking, consumer sentiment
- Helps enterprises make data-driven climate decisions
- Contributor rewards go to environmental projects

Email Requirements:
- 150-250 words MAXIMUM
- Professional, not salesy
- Reference their specific work/initiatives
- Clear value proposition
- Call to action (demo or call)
- Conversational tone
- Subject line included

Format as:
SUBJECT: [subject line]
---
[email body]`;

      const emailResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: "You are a B2B email copywriter. Write concise, personalized emails that reference specific company initiatives. No generic templates."
            },
            { role: "user", content: emailPrompt }
          ],
        }),
      });

      if (!emailResponse.ok) {
        console.error(`[CAMPAIGN-GEN] Email generation failed for ${company.name}`);
        continue;
      }

      const emailData = await emailResponse.json();
      const emailContent = emailData.choices[0].message.content;

      // Parse subject and body
      const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/);
      const subject = subjectMatch ? subjectMatch[1].trim() : "Partnership Opportunity with DataForEarth";
      const body = emailContent.replace(/SUBJECT:.*?\n---\n/, "").trim();

      // Save to database
      const { data: campaign, error: insertError } = await supabaseAdmin
        .from("marketing_campaigns")
        .insert({
          company_name: company.name,
          email: company.email,
          email_content: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  ${body.split('\n').map((para: string) => `<p style="margin-bottom: 16px; line-height: 1.6;">${para}</p>`).join('\n')}
  
  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
    <p style="margin: 0; font-size: 14px; color: #666;">
      Best regards,<br/>
      <strong>DataForEarth Team</strong><br/>
      <a href="https://dataforearth.org" style="color: #2563eb;">dataforearth.org</a>
    </p>
  </div>
</div>
          `.trim(),
          status: "pending_approval",
          created_by: userData.user.id,
          research_data: {
            company,
            ai_generated: true,
            industry,
            source: "automated_generation",
            timestamp: new Date().toISOString(),
            subject
          }
        })
        .select()
        .single();

      if (!insertError && campaign) {
        campaignsCreated.push({
          id: campaign.id,
          company: company.name,
          email: company.email
        });
        console.log(`[CAMPAIGN-GEN] ✓ Campaign created for ${company.name}`);
      } else {
        console.error(`[CAMPAIGN-GEN] ✗ Failed to save campaign for ${company.name}:`, insertError);
      }
    }

    // Log to audit
    await supabaseAdmin.from("audit_logs").insert({
      action: "batch_campaigns_generated",
      resource_type: "marketing_campaign",
      user_id: userData.user.id,
      severity: "info",
      details: {
        industry,
        campaigns_created: campaignsCreated.length,
        requested_count: count,
        keywords
      }
    });

    console.log(`[CAMPAIGN-GEN] Successfully generated ${campaignsCreated.length} campaigns`);

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_created: campaignsCreated.length,
        campaigns: campaignsCreated,
        message: `Generated ${campaignsCreated.length} campaigns ready for review`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("[CAMPAIGN-GEN] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate campaigns",
        code: "GENERATION_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
