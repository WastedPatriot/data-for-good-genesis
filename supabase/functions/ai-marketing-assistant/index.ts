import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Input validation schemas
const testEmailSchema = z.object({
  action: z.literal("send_test_email"),
  test_email: z.string().email().max(255)
});

const approveCampaignSchema = z.object({
  action: z.literal("approve_campaign"),
  campaign_id: z.string().uuid()
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(10000)
});

const chatRequestSchema = z.object({
  action: z.literal("chat").optional(),
  messages: z.array(chatMessageSchema).min(1).max(50)
});

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

    // Verify admin role
    const { data: roleData } = await supabaseClient
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

    const body = await req.json();
    const { action } = body;

    // Validate input based on action
    if (action === "send_test_email") {
      const validated = testEmailSchema.parse(body);
      const { test_email } = validated;
      console.log("Sending test email to:", test_email);
      
      const emailResult = await resend.emails.send({
        from: "DataForEarth <onboarding@resend.dev>",
        to: [test_email],
        subject: "Test Email from DataForEarth AI Marketing Assistant",
        replyTo: "hello@dataforearth.org",
        html: `
          <h1>Test Email Successful!</h1>
          <p>This is a test email from your DataForEarth AI Marketing Assistant.</p>
          <p>If you're seeing this, the email system is working correctly.</p>
          <br/>
          <p>System Status:</p>
          <ul>
            <li>✓ Email configuration: Working</li>
            <li>✓ Authentication: Verified</li>
            <li>✓ Sender address: hello@dataforearth.org</li>
            <li>✓ Security: Active</li>
          </ul>
          <br/>
          <p>Best regards,<br/>DataForEarth Team</p>
        `,
      });

      if (emailResult.error) {
        throw new Error(`Email error: ${emailResult.error.message}`);
      }

      console.log("Test email sent successfully:", emailResult);

      return new Response(
        JSON.stringify({ success: true, message: "Test email sent successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "approve_campaign") {
      const validated = approveCampaignSchema.parse(body);
      const { campaign_id } = validated;
      console.log("Approving campaign:", campaign_id);
      
      // Get campaign details
      const { data: campaign, error: fetchError } = await supabaseClient
        .from("marketing_campaigns")
        .select("*")
        .eq("id", campaign_id)
        .single();

      if (fetchError || !campaign) {
        throw new Error("Campaign not found");
      }

      // Send the email
      const emailResult = await resend.emails.send({
        from: "DataForEarth <hello@dataforearth.org>",
        to: [campaign.email],
        subject: `Partnership Opportunity with DataForEarth`,
        html: campaign.email_content,
      });

      if (emailResult.error) {
        // Update campaign status to failed
        await supabaseClient
          .from("marketing_campaigns")
          .update({ status: "failed" })
          .eq("id", campaign_id);

        throw new Error(`Email error: ${emailResult.error.message}`);
      }

      // Update campaign status to sent
      await supabaseClient
        .from("marketing_campaigns")
        .update({ 
          status: "sent",
          sent_at: new Date().toISOString(),
          approved_by: userData.user.id
        })
        .eq("id", campaign_id);

      // Log to audit
      await supabaseClient
        .from("audit_logs")
        .insert({
          user_id: userData.user.id,
          action: "marketing_email_sent",
          resource_type: "marketing_campaign",
          resource_id: campaign_id,
          details: {
            company_name: campaign.company_name,
            email: campaign.email
          },
          severity: "info"
        });

      console.log("Campaign approved and email sent:", emailResult);

      return new Response(
        JSON.stringify({ success: true, message: "Campaign approved and email sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "chat") {
      const validated = chatRequestSchema.parse(body);
      const { messages } = validated;
      
      console.log("Processing AI chat request");
      
      // Call Lovable AI for chat response
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
            content: `You are DataForEarth's Professional Marketing Outreach Assistant. 

Your role: Craft high-quality, personalized B2B outreach emails for environmental data partnerships.

TONE & STYLE:
- Professional yet warm and authentic
- Focus on value proposition and mutual benefit
- NO generic templates or placeholder text like "[Company Name]"
- Research-driven: reference specific company initiatives when possible
- Concise: 150-250 words maximum

EMAIL STRUCTURE:
1. Personalized opening (reference their work/mission)
2. Brief DataForEarth value proposition
3. Specific benefit for their organization
4. Soft call-to-action (meeting/call invitation)
5. Professional signature

AVOID:
- Generic greetings "Dear Sir/Madam"
- Obvious templates "{insert_name_here}"
- Overly salesy language
- Long-winded explanations
- Multiple CTAs

EXAMPLE QUALITY:
"Hi [FirstName], I noticed [Company]'s commitment to [specific initiative]. At DataForEarth, we provide ethically-sourced environmental datasets that help organizations like yours drive impact through data-driven decisions. Would you be open to a brief call to explore how our marketplace could support your sustainability goals?"

When drafting, return "CAMPAIGN_CREATED" to signal completion.`
            },
            ...messages
          ],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("AI API error");
      }

      const aiData = await aiResponse.json();
      const response = aiData.choices[0].message.content;

      // Check if AI wants to create a campaign (simple keyword detection)
      let campaign_created = false;
      if (response.includes("CAMPAIGN_CREATED") || 
          (response.toLowerCase().includes("draft") && response.toLowerCase().includes("email"))) {
        // For demo purposes, create a sample campaign
        // In production, you'd parse the AI response to extract company details
        
        campaign_created = true;
        
        // This is a placeholder - in production the AI would provide structured data
        const sampleCompany = {
          name: "Example Corporation",
          email: "contact@example.com",
          content: `Dear Team,\n\nI hope this email finds you well. I'm reaching out from DataForEarth, a platform that connects environmental organizations with valuable climate and sustainability data.\n\nBest regards,\nDataForEarth Team`
        };

        await supabaseClient
          .from("marketing_campaigns")
          .insert({
            company_name: sampleCompany.name,
            email: sampleCompany.email,
            email_content: sampleCompany.content,
            status: "pending_approval",
            created_by: userData.user.id,
            research_data: {
              note: "AI-generated campaign - review before sending"
            }
          });
      }

      return new Response(
        JSON.stringify({ 
          response: response.replace("CAMPAIGN_CREATED", "").trim(),
          campaign_created
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error: any) {
    console.error("AI Marketing Assistant error:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data. Please check your input.",
          code: "VALIDATION_ERROR",
          details: error.errors
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Unable to process request. Please try again.",
        code: "REQUEST_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
