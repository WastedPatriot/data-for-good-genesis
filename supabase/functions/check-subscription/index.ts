import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Subscription tier configuration
const SUBSCRIPTION_TIERS = {
  'prod_TJWySoLNur9eil': { tier: 'starter', limit: 5 },
  'prod_TJWyDLnZzxIaVy': { tier: 'professional', limit: 20 },
  'prod_TJWyOJdaoHELPe': { tier: 'enterprise', limit: null }, // unlimited
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's organization profile
    const { data: orgProfile, error: orgError } = await supabaseClient
      .from("organization_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (orgError || !orgProfile) {
      logStep("No organization profile found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        hasOrganization: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Organization profile found", { orgId: orgProfile.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        hasOrganization: true,
        organizationId: orgProfile.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let tier = null;
    let downloadLimit = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      const tierConfig = SUBSCRIPTION_TIERS[productId as keyof typeof SUBSCRIPTION_TIERS];
      
      if (tierConfig) {
        tier = tierConfig.tier;
        downloadLimit = tierConfig.limit;
        logStep("Determined subscription tier", { productId, tier, downloadLimit });

        // Update organization profile with subscription data
        await supabaseClient
          .from("organization_profiles")
          .update({
            subscription_status: 'active',
            subscription_tier: tier,
            subscription_product_id: productId,
            subscription_end_date: subscriptionEnd,
            monthly_downloads_limit: downloadLimit,
          })
          .eq("id", orgProfile.id);

        logStep("Updated organization profile with subscription data");
      }
    } else {
      logStep("No active subscription found");
      
      // Update organization to reflect no active subscription
      await supabaseClient
        .from("organization_profiles")
        .update({
          subscription_status: 'none',
          subscription_tier: null,
          subscription_product_id: null,
          subscription_end_date: null,
          monthly_downloads_limit: null,
        })
        .eq("id", orgProfile.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      hasOrganization: true,
      organizationId: orgProfile.id,
      subscription: hasActiveSub ? {
        product_id: productId,
        tier: tier,
        subscription_end: subscriptionEnd,
        downloads_used: orgProfile.monthly_downloads_used || 0,
        downloads_limit: downloadLimit,
      } : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
