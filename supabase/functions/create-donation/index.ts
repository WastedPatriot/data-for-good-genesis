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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { amount, donationType, donationPurpose, email, name } = await req.json();

    console.log("Donation request received:", { amount, donationType, donationPurpose, email, name });

    if (!amount || amount < 1) {
      throw new Error("Invalid donation amount");
    }

    if (!donationType || !["one-time", "monthly"].includes(donationType)) {
      throw new Error("Invalid donation type");
    }

    if (!donationPurpose || !["platform", "environment"].includes(donationPurpose)) {
      throw new Error("Invalid donation purpose");
    }

    // Try to get authenticated user (optional for donations)
    let userEmail = email;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        if (data.user?.email) {
          userEmail = data.user.email;
        }
      } catch (error) {
        console.log("No authenticated user, using provided email");
      }
    }

    if (!userEmail) {
      throw new Error("Email is required for donations");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    }

    const productName = donationPurpose === "platform" 
      ? "Platform Operations Donation" 
      : "Environmental Projects Donation";

    const productDescription = donationPurpose === "platform"
      ? "Support dataforearth.org hosting, development, and maintenance"
      : "Direct funding for verified environmental and climate action projects";

    // Create checkout session with custom amount
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      mode: donationType === "monthly" ? "subscription" : "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100), // Convert to cents
            product_data: {
              name: productName,
              description: productDescription,
            },
            ...(donationType === "monthly" && {
              recurring: {
                interval: "month",
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/donate?success=true&amount=${amount}&purpose=${donationPurpose}`,
      cancel_url: `${req.headers.get("origin")}/donate?canceled=true`,
      metadata: {
        donation_purpose: donationPurpose,
        donation_type: donationType,
        donor_name: name || "Anonymous",
      },
    };

    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create donation session";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
