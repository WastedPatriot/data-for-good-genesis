import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { to, from, subject, message, contactName, originalMessage } = await req.json();

    console.log("Sending admin reply:", { to, from, subject });

    if (!to || !message) {
      throw new Error("Missing required fields");
    }

    // Map from addresses - note: these must be verified domains in Resend
    const fromAddress = from || "onboarding@resend.dev";

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

    // Log the action
    await supabaseClient
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "admin_reply_sent",
        resource_type: "contact_submission",
        details: { to, subject },
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
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
