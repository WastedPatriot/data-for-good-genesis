import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-secret",
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
    const authHeader = req.headers.get("Authorization");
    const ingestHeader = req.headers.get("X-Ingest-Secret");
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "";

    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const { data: userData } = token
      ? await supabaseClient.auth.getUser(token)
      : ({ data: { user: null } } as any);

    const user = userData?.user || null;
    const isAgent = !!ingestHeader && ingestHeader === (Deno.env.get("INGEST_SECRET") ?? "");
    const isAdminEmail = !!(user?.email && adminEmail) && user.email.toLowerCase() === adminEmail.toLowerCase();

    if (!user && !isAgent) {
      return new Response(
        JSON.stringify({ success: false, code: "UNAUTHORIZED", error: "Sign in required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let isAdmin = false;
    if (user) {
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = !!roleData || isAdminEmail;
    } else {
      isAdmin = isAgent;
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, code: "FORBIDDEN", error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const body = await req.json();
    const { to, from, subject, message, contactName, originalMessage, contactSubmissionId } = body;

    console.log("Sending admin reply:", { to, from, subject });

    if (!to || !message) {
      throw new Error("Missing required fields");
    }

    // Always use Resend test domain for sending; set chosen address as reply-to
    const fromAddress = "onboarding@resend.dev";

    const emailResponse = await resend.emails.send({
      from: `DataForEarth <${fromAddress}>`,
      to: [to],
      replyTo: from || "hello@dataforearth.org",
      subject: subject || "Re: Your inquiry",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">DataForEarth</h2>
          
          ${contactName ? `<p>Hi ${contactName},</p>` : ''}
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
          </div>

          ${originalMessage ? `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;"><strong>Your original message:</strong></p>
              <p style="color: #6b7280; font-size: 14px;">${originalMessage}</p>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent from DataForEarth. If you have any questions, please reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log to conversation_threads for inbox/outbox tracking
    try {
      const insertPayload: Record<string, any> = {
        direction: "outbound",
        from_email: fromAddress,
        to_email: to,
        subject: subject || "Re: Your inquiry",
        message: message,
        status: "sent",
      };

      if (contactSubmissionId) {
        insertPayload.contact_submission_id = contactSubmissionId;
      }

      await supabaseClient.from("conversation_threads").insert(insertPayload);

      if (contactSubmissionId) {
        // Update last_response_at on the contact submission
        await supabaseClient
          .from("contact_submissions")
          .update({ last_response_at: new Date().toISOString() })
          .eq("id", contactSubmissionId);
      }
    } catch (logErr) {
      console.error("Failed to log conversation thread:", logErr);
      // Do not fail the entire request if logging fails
    }

    // Log the action
    await supabaseClient
      .from("audit_logs")
      .insert({
        user_id: user ? user.id : null,
        action: "admin_reply_sent",
        resource_type: "contact_submission",
        resource_id: contactSubmissionId || null,
        details: { to, subject, from: fromAddress },
        severity: "info"
      });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-admin-reply function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send reply";
    return new Response(
      JSON.stringify({ success: false, code: "SEND_FAILED", error: errorMessage }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
