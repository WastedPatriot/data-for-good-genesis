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

  try {
    const { purchaseId } = await req.json();

    if (!purchaseId) {
      throw new Error("Purchase ID required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("esim_purchases")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (purchaseError || !purchase) {
      throw new Error("Purchase not found");
    }

    // Call Gigs API to activate eSIM
    const gigsApiKey = Deno.env.get("GIGS_API_KEY");
    if (!gigsApiKey) {
      throw new Error("Gigs API key not configured");
    }

    // Gigs API integration - this will create the eSIM profile
    const gigsResponse = await fetch("https://api.gigs.com/v1/esims", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${gigsApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: purchase.plan_id,
        // Add other required Gigs API parameters
      }),
    });

    if (!gigsResponse.ok) {
      throw new Error("Failed to activate eSIM with Gigs");
    }

    const gigsData = await gigsResponse.json();

    // Update purchase with eSIM details
    const { error: updateError } = await supabaseClient
      .from("esim_purchases")
      .update({
        status: "active",
        esim_iccid: gigsData.iccid,
        esim_activation_code: gigsData.activation_code,
        esim_qr_code: gigsData.qr_code,
        activated_at: new Date().toISOString(),
      })
      .eq("id", purchaseId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        iccid: gigsData.iccid,
        activationCode: gigsData.activation_code,
        qrCode: gigsData.qr_code,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error activating eSIM:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
