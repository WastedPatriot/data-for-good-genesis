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
    const { datasetId } = await req.json();

    console.log("Purchase request received:", { datasetId });

    if (!datasetId) {
      throw new Error("Dataset ID is required");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    const user = userData.user;
    console.log("User authenticated:", user.id);

    // Check if user already purchased this dataset
    const { data: existingPurchase } = await supabaseClient
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("dataset_id", datasetId)
      .eq("status", "completed")
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: "You have already purchased this dataset" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get dataset details
    const { data: dataset, error: datasetError } = await supabaseClient
      .from("datasets")
      .select("*")
      .eq("id", datasetId)
      .eq("active", true)
      .single();

    if (datasetError || !dataset) {
      throw new Error("Dataset not found or inactive");
    }

    console.log("Dataset found:", dataset.name);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      mode: "payment",
      line_items: [
        {
          price: dataset.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/marketplace?success=true&dataset=${encodeURIComponent(dataset.name)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/marketplace?canceled=true`,
      metadata: {
        dataset_id: datasetId,
        user_id: user.id,
        dataset_name: dataset.name,
      },
    });

    console.log("Checkout session created:", session.id);

    // Create pending purchase record
    const { error: purchaseError } = await supabaseClient
      .from("purchases")
      .insert({
        user_id: user.id,
        dataset_id: datasetId,
        stripe_session_id: session.id,
        amount_paid: dataset.price,
        status: "pending",
      });

    if (purchaseError) {
      console.error("Error creating purchase record:", purchaseError);
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create purchase session";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
