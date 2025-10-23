import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-sign",
};

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
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

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
    const { dataset_id, count, prefix, timestamp } = payload;
    const signature = req.headers.get("x-ingest-sign");
    const authHeader = req.headers.get("Authorization");
    const ingestSecret = Deno.env.get("INGEST_SECRET");

    let isAdmin = false;
    let isValidHMAC = false;

    // Check HMAC authentication
    if (signature && ingestSecret && timestamp) {
      isValidHMAC = await validateHMAC({ dataset_id, count, prefix }, timestamp, signature, ingestSecret);
      
      if (isValidHMAC) {
        // Rate limiting for HMAC requests
        if (!checkRateLimit("create-badge-codes")) {
          return new Response(
            JSON.stringify({ success: false, error: "RATE_LIMIT" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
          );
        }
      }
    }

    // Check admin JWT authentication
    if (!isValidHMAC && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAnon = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      
      const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
      
      if (!userError && userData.user) {
        const { data: roleData } = await supabaseAnon
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();

        isAdmin = !!roleData;
      }
    }

    // Must be authenticated via HMAC or admin JWT
    if (!isValidHMAC && !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_SIGNATURE" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Validate required fields
    if (!dataset_id || !count || count < 1) {
      return new Response(
        JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: "Missing or invalid fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify dataset exists
    const { data: dataset } = await supabaseClient
      .from("datasets")
      .select("id")
      .eq("id", dataset_id)
      .maybeSingle();

    if (!dataset) {
      return new Response(
        JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: "Dataset not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Generate badge codes
    const badgePrefix = prefix || "ETH-";
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      let code = generateBadgeCode(badgePrefix);
      let attempts = 0;
      
      // Ensure uniqueness
      while (attempts < 10) {
        const { data: existingCode } = await supabaseClient
          .from("badge_codes")
          .select("id")
          .eq("code", code)
          .maybeSingle();
        
        if (!existingCode) break;
        code = generateBadgeCode(badgePrefix);
        attempts++;
      }
      
      codes.push({
        code,
        dataset_id,
        claimed: false,
      });
    }

    const { error: badgeError } = await supabaseClient
      .from("badge_codes")
      .insert(codes);

    if (badgeError) {
      console.error("Badge codes insert error:", badgeError);
      return new Response(
        JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: badgeError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Insert audit log
    await supabaseClient
      .from("audit_logs")
      .insert([{
        action: "badge_generated",
        resource_type: "badge_codes",
        resource_id: dataset_id,
        user_id: null,
        severity: "info",
        details: {
          count,
          prefix: badgePrefix,
          automated: isValidHMAC,
        },
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        codes_created: codes.length,
        dataset_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("create-badge-codes error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "VALIDATION_ERROR", message: error?.message || "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
