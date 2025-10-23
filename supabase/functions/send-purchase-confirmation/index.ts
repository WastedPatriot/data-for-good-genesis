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
    const { purchaseId, userEmail, datasetName, amount } = await req.json();

    console.log("Sending purchase confirmation:", { purchaseId, userEmail, datasetName });

    if (!userEmail || !datasetName) {
      throw new Error("Missing required fields");
    }

    const emailResponse = await resend.emails.send({
      from: "Data for Earth <noreply@dataforearth.org>",
      to: [userEmail],
      subject: `Purchase Confirmation: ${datasetName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Thank You for Your Purchase!</h1>
          <p>Your purchase of <strong>${datasetName}</strong> has been completed successfully.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Purchase Details</h2>
            <p><strong>Dataset:</strong> ${datasetName}</p>
            <p><strong>Amount Paid:</strong> $${amount}</p>
            <p><strong>Purchase ID:</strong> ${purchaseId}</p>
          </div>

          <h3>Next Steps:</h3>
          <ol>
            <li>Log in to your account at <a href="${req.headers.get("origin")}/marketplace">dataforearth.org/marketplace</a></li>
            <li>Navigate to "My Purchases" to access your dataset</li>
            <li>Download and use your data for your projects</li>
          </ol>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Thank you for supporting ethical data practices and environmental initiatives!
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            Questions? Reply to this email or visit our support page.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-purchase-confirmation function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send confirmation email";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
