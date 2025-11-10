import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { planId, country, dataAmount, duration, price, paymentMethod } = await req.json();

    if (!planId || !price || !paymentMethod) {
      throw new Error("Missing required fields");
    }

    // Store pending purchase
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("esim_purchases")
      .insert({
        user_id: user.id,
        plan_id: planId,
        country,
        data_amount: dataAmount,
        duration,
        price,
        status: "pending",
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    if (paymentMethod === "crypto") {
      // Return crypto payment details - implement Coinbase Commerce or BTCPay
      // For now, return a placeholder
      return new Response(
        JSON.stringify({
          purchaseId: purchase.id,
          paymentMethod: "crypto",
          message: "Crypto payment coming soon",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stripe payment
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: `eSIM - ${country} ${dataAmount}GB`,
              description: `${duration} days data plan`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/esim/my-esims?success=true&purchase_id=${purchase.id}`,
      cancel_url: `${req.headers.get("origin")}/esim/marketplace?canceled=true`,
      metadata: {
        purchase_id: purchase.id,
        plan_id: planId,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, purchaseId: purchase.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
