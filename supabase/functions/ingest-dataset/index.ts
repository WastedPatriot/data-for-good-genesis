import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-sign",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Rate limiting (in-memory, resets on function cold start)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;
  
  const timestamps = rateLimitMap.get(identifier) || [];
  const recentTimestamps = timestamps.filter(t => t > hourAgo);
  
  if (recentTimestamps.length >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  recentTimestamps.push(now);
  rateLimitMap.set(identifier, recentTimestamps);
  return true;
}

async function validateHMAC(payload: any, timestamp: number, signature: string, secret: string): Promise<boolean> {
  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

  // Compute HMAC using Web Crypto API
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return expectedSignature === signature;
}

function generateBadgeCode(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}${random}`;
}

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
    const payload = await req.json();
    const { timestamp, dataset, badge_codes } = payload;
    const signature = req.headers.get("x-ingest-sign");
    const ingestSecret = Deno.env.get("INGEST_SECRET");

    if (!signature || !ingestSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_SIGNATURE" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Validate HMAC
    if (!(await validateHMAC({ timestamp, dataset, badge_codes }, timestamp, signature, ingestSecret))) {
      console.error("HMAC validation failed");
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_SIGNATURE" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit("ingest-dataset")) {
      return new Response(
        JSON.stringify({ success: false, error: "RATE_LIMIT" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // Validate required fields
    if (!dataset?.name || !dataset?.description || !dataset?.category || dataset?.price === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: "Missing required dataset fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check for duplicate dataset name
    const { data: existingDataset } = await supabaseClient
      .from("datasets")
      .select("id")
      .eq("name", dataset.name)
      .maybeSingle();

    if (existingDataset) {
      return new Response(
        JSON.stringify({ success: false, error: "NAME_EXISTS" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Create Stripe product and price
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let stripeProductId: string;
    let stripePriceId: string;

    try {
      // Check if product already exists
      const existingProducts = await stripe.products.search({
        query: `name:'${dataset.name}'`,
        limit: 1,
      });

      if (existingProducts.data.length > 0) {
        stripeProductId = existingProducts.data[0].id;
        const prices = await stripe.prices.list({ product: stripeProductId, limit: 1 });
        stripePriceId = prices.data[0]?.id || "";
        
        if (!stripePriceId) {
          const newPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: Math.round(dataset.price * 100),
            currency: "usd",
          });
          stripePriceId = newPrice.id;
        }
      } else {
        const product = await stripe.products.create({
          name: dataset.name,
          description: dataset.description,
        });
        stripeProductId = product.id;

        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(dataset.price * 100),
          currency: "usd",
        });
        stripePriceId = price.id;
      }
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError);
      return new Response(
        JSON.stringify({ success: false, error: "STRIPE_ERROR", message: stripeError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Insert dataset
    const { data: newDataset, error: datasetError } = await supabaseClient
      .from("datasets")
      .insert([{
        name: dataset.name,
        description: dataset.description,
        category: dataset.category,
        price: dataset.price,
        size_mb: dataset.size_mb || null,
        sample_data: dataset.sample_data || null,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        active: true,
        featured: false,
      }])
      .select()
      .single();

    if (datasetError) {
      console.error("Dataset insert error:", datasetError);
      return new Response(
        JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: datasetError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Generate badge codes
    let badgeCodesCreated = 0;
    if (badge_codes?.count && badge_codes.count > 0) {
      const prefix = badge_codes.prefix || "ETH-";
      const codes = [];
      
      for (let i = 0; i < badge_codes.count; i++) {
        let code = generateBadgeCode(prefix);
        let attempts = 0;
        
        // Ensure uniqueness
        while (attempts < 10) {
          const { data: existingCode } = await supabaseClient
            .from("badge_codes")
            .select("id")
            .eq("code", code)
            .maybeSingle();
          
          if (!existingCode) break;
          code = generateBadgeCode(prefix);
          attempts++;
        }
        
        codes.push({
          code,
          dataset_id: newDataset.id,
          claimed: false,
        });
      }

      const { error: badgeError } = await supabaseClient
        .from("badge_codes")
        .insert(codes);

      if (!badgeError) {
        badgeCodesCreated = codes.length;
      } else {
        console.error("Badge codes insert error:", badgeError);
      }
    }

    // Insert audit log
    await supabaseClient
      .from("audit_logs")
      .insert([{
        action: "dataset_published",
        resource_type: "dataset",
        resource_id: newDataset.id,
        user_id: null,
        severity: "info",
        details: {
          name: dataset.name,
          price: dataset.price,
          badge_codes_created: badgeCodesCreated,
          automated: true,
        },
      }]);

    // Send admin email
    try {
      await resend.emails.send({
        from: "Data for Earth <noreply@dataforearth.org>",
        to: ["hello@dataforearth.org"],
        subject: `New Dataset Published: ${dataset.name}`,
        html: `
          <h2>New Dataset Published via Machine Agent</h2>
          <p><strong>Name:</strong> ${dataset.name}</p>
          <p><strong>Category:</strong> ${dataset.category}</p>
          <p><strong>Price:</strong> $${dataset.price}</p>
          <p><strong>Size:</strong> ${dataset.size_mb || 'N/A'} MB</p>
          <p><strong>Badge Codes Generated:</strong> ${badgeCodesCreated}</p>
          <p><strong>Timestamp:</strong> ${new Date(timestamp * 1000).toISOString()}</p>
          <p><a href="https://dataforearth.org/marketplace">View Marketplace</a></p>
        `,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        dataset_id: newDataset.id,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        badge_codes_created: badgeCodesCreated,
        marketplace_url: `${req.headers.get("origin") || "https://dataforearth.org"}/marketplace`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("ingest-dataset error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: error?.message || "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
