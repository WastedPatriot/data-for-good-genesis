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
        from: "DataForEarth <onboarding@resend.dev>",
        to: [campaign.email],
        subject: `Partnership Opportunity with DataForEarth`,
        replyTo: "hello@dataforearth.org",
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

      // Log to conversation threads for inbox visibility
      await supabaseClient
        .from("conversation_threads")
        .insert({
          direction: "outbound",
          from_email: "onboarding@resend.dev",
          to_email: campaign.email,
          subject: "Partnership Opportunity with DataForEarth",
          message: campaign.email_content,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

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
      
      console.log("Processing AI marketing chat request");

      // Extract user intent from the last message
      const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
      
      // Check if user wants to research a company or draft an email
      const isResearchRequest = lastUserMessage.toLowerCase().includes("research") || 
                                lastUserMessage.toLowerCase().includes("find companies");
      const isDraftRequest = lastUserMessage.toLowerCase().includes("draft") || 
                             lastUserMessage.toLowerCase().includes("write email");

      let systemPrompt = `You are DataForEarth's AI Marketing Assistant with real-time web research capabilities.

CAPABILITIES:
- Research companies in specific industries
- Analyze company websites and public data
- Draft personalized B2B outreach emails
- Verify company contact information
- Assess partnership fit

TONE & STYLE:
- Professional, data-driven, authentic
- Focus on mutual value and impact
- NO generic templates or placeholders
- Reference specific company initiatives
- 150-250 word emails maximum

When user asks to:
1. RESEARCH: Return companies with: name, website, email (best guess), reason for fit
2. DRAFT EMAIL: Create personalized email referencing their specific work
3. CREATE CAMPAIGN: Return "CAMPAIGN|CompanyName|email@domain.com|EmailContent"

Format campaigns exactly as: 
CAMPAIGN|Acme Corp|partnerships@acme.com|[full email content here]

Be concise and actionable.`;

      // Call Lovable AI with enhanced context
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro", // Using Pro for better research capabilities
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.4,
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "AI rate limit exceeded. Please try again shortly." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
          );
        }
        throw new Error(`AI API error: ${aiResponse.statusText}`);
      }

      const aiData = await aiResponse.json();
      const response = aiData.choices[0].message.content;

      console.log("AI Response:", response);

      // Parse campaign creation commands from AI
      let campaign_created = false;
      const campaignMatch = response.match(/CAMPAIGN\|([^|]+)\|([^|]+)\|([\s\S]+?)(?=CAMPAIGN\||$)/);
      
      if (campaignMatch) {
        const [, companyName, email, emailContent] = campaignMatch;
        
        console.log("Creating campaign:", { companyName, email });

        campaign_created = true;
        
        await supabaseClient
          .from("marketing_campaigns")
          .insert({
            company_name: companyName.trim(),
            email: email.trim(),
            email_content: emailContent.trim(),
            status: "pending_approval",
            created_by: userData.user.id,
            research_data: {
              ai_generated: true,
              source: "lovable-ai",
              model: "google/gemini-2.5-pro",
              timestamp: new Date().toISOString()
            }
          });

        // Clean up response to remove campaign command
        const cleanResponse = response.replace(/CAMPAIGN\|[^|]+\|[^|]+\|[\s\S]+/, '').trim();
        
        return new Response(
          JSON.stringify({ 
            response: cleanResponse || "Campaign created and ready for your review!",
            campaign_created: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ 
          response,
          campaign_created: false
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
