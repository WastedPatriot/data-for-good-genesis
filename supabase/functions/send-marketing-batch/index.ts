import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * Batch Email Sender
 * 
 * Sends approved marketing campaigns in batches with rate limiting
 * Tracks delivery status and handles failures gracefully
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
    console.log("[BATCH-SEND] Starting batch email send");

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

    const { campaign_ids } = await req.json();

    if (!Array.isArray(campaign_ids) || campaign_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "No campaign IDs provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[BATCH-SEND] Processing ${campaign_ids.length} campaigns`);

    // Fetch campaigns
    const { data: campaigns, error: fetchError } = await supabaseAdmin
      .from("marketing_campaigns")
      .select("*")
      .in("id", campaign_ids)
      .eq("status", "pending_approval");

    if (fetchError || !campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ error: "No approved campaigns found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const results = {
      sent: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    // Get admin email from env
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "hello@dataforearth.org";
    console.log(`[BATCH-SEND] Using sender email: ${adminEmail}`);

    // Send emails with rate limiting (1 per second)
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      
      try {
        console.log(`[BATCH-SEND] Sending email ${i + 1}/${campaigns.length} to ${campaign.company_name}`);

        // Extract subject from research_data or use default
        const subject = campaign.research_data?.subject || "Partnership Opportunity with DataForEarth";

        const emailResult = await resend.emails.send({
          from: `DataForEarth <${adminEmail}>`,
          to: [campaign.email],
          subject,
          html: campaign.email_content,
          replyTo: adminEmail,
        });

        if (emailResult.error) {
          throw emailResult.error;
        }

        // Update campaign status
        await supabaseAdmin
          .from("marketing_campaigns")
          .update({ 
            status: "sent",
            sent_at: new Date().toISOString(),
            approved_by: userData.user.id
          })
          .eq("id", campaign.id);

        results.sent.push(campaign.id);
        console.log(`[BATCH-SEND] ✓ Sent to ${campaign.company_name}`);

      } catch (error: any) {
        console.error(`[BATCH-SEND] ✗ Failed to send to ${campaign.company_name}:`, error);
        
        await supabaseAdmin
          .from("marketing_campaigns")
          .update({ status: "failed" })
          .eq("id", campaign.id);

        results.failed.push({
          id: campaign.id,
          error: error.message || "Unknown error"
        });
      }

      // Rate limiting: wait 1 second between emails
      if (i < campaigns.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log batch send to audit
    await supabaseAdmin.from("audit_logs").insert({
      action: "batch_campaigns_sent",
      resource_type: "marketing_campaign",
      user_id: userData.user.id,
      severity: "info",
      details: {
        total: campaigns.length,
        sent: results.sent.length,
        failed: results.failed.length
      }
    });

    console.log(`[BATCH-SEND] Complete. Sent: ${results.sent.length}, Failed: ${results.failed.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.sent.length,
        failed: results.failed.length,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("[BATCH-SEND] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send campaigns",
        code: "BATCH_SEND_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
