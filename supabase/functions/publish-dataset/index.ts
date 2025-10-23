import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

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
    // Verify admin authentication
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

    // Check if user is admin
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

    const payload = await req.json();
    const { name, description, category, price, size_mb, sample_data, download_url } = payload;

    // Validate required fields
    if (!name || !description || !category || price === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check for duplicate dataset name
    const { data: existingDataset } = await supabaseClient
      .from("datasets")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existingDataset) {
      return new Response(
        JSON.stringify({ error: "Dataset name already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Create Stripe product and price
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const product = await stripe.products.create({
      name,
      description,
    });

    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: "usd",
    });

    // Use service role to insert
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Insert dataset
    const { data: newDataset, error: datasetError } = await supabaseAdmin
      .from("datasets")
      .insert([{
        name,
        description,
        category,
        price,
        size_mb: size_mb || null,
        sample_data: sample_data || null,
        stripe_product_id: product.id,
        stripe_price_id: stripePrice.id,
        active: true,
        featured: false,
      }])
      .select()
      .single();

    if (datasetError) {
      console.error("Dataset insert error:", datasetError);
      return new Response(
        JSON.stringify({ error: datasetError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Insert audit log
    await supabaseAdmin
      .from("audit_logs")
      .insert([{
        action: "dataset_published",
        resource_type: "dataset",
        resource_id: newDataset.id,
        user_id: userData.user.id,
        severity: "info",
        details: {
          name,
          price,
          manual: true,
        },
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        dataset: newDataset,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("publish-dataset error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
