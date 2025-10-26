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
    // Parse incoming email webhook from Resend
    const payload = await req.json();
    console.log("Inbound email received:", payload);

    const { from, to, subject, body_text, body_html } = payload;

    // Extract sender email
    const senderEmail = from.match(/<(.+)>/)?.[1] || from;

    // Find matching lead
    const { data: lead } = await supabaseClient
      .from("leads")
      .select("*")
      .eq("email", senderEmail)
      .single();

    if (!lead) {
      console.log("No matching lead found for:", senderEmail);
      return new Response(JSON.stringify({ success: true, message: "No matching lead" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // Find most recent campaign email to this lead
    const { data: campaignEmail } = await supabaseClient
      .from("campaign_emails")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (campaignEmail) {
      // Update campaign with reply
      await supabaseClient
        .from("campaign_emails")
        .update({
          status: "replied",
          reply_body: body_text || body_html,
          replied_at: new Date().toISOString()
        })
        .eq("id", campaignEmail.id);

      // Update lead status
      await supabaseClient
        .from("leads")
        .update({
          status: "interested",
          last_reply_at: new Date().toISOString(),
          transcript: [
            ...(lead.transcript || []),
            {
              type: "inbound",
              from: senderEmail,
              subject,
              body: body_text || body_html,
              timestamp: new Date().toISOString()
            }
          ]
        })
        .eq("id", lead.id);

      console.log("Reply processed for lead:", lead.company);
    }

    // Log to audit trail
    await supabaseClient.from("audit_logs").insert({
      action: "inbound_email_processed",
      resource_type: "campaign_email",
      resource_id: campaignEmail?.id,
      details: {
        from: senderEmail,
        lead_company: lead.company,
        subject
      },
      severity: "info"
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("Error processing inbound email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
