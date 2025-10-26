import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { email, ipAddress, fingerprint, success } = await req.json();

    // Log attempt
    await supabaseAdmin.from("login_attempts").insert({
      ip_address: ipAddress,
      fingerprint: fingerprint || null,
      email: email || null,
      success,
      user_agent: req.headers.get("user-agent") || null,
    });

    // Check recent failed attempts
    const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
    const { data: recentAttempts } = await supabaseAdmin
      .from("login_attempts")
      .select("*")
      .eq("ip_address", ipAddress)
      .eq("success", false)
      .gte("attempted_at", cutoff.toISOString());

    const failedCount = recentAttempts?.length || 0;

    if (failedCount >= MAX_ATTEMPTS) {
      // Log audit
      await supabaseAdmin.from("audit_logs").insert({
        action: "login_rate_limit_exceeded",
        resource_type: "auth",
        resource_id: ipAddress,
        severity: "warn",
        ip_address: ipAddress,
        details: {
          failed_attempts: failedCount,
          lockout_until: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
        },
      });

      return new Response(
        JSON.stringify({
          allowed: false,
          lockoutUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
          message: `Too many failed attempts. Locked out for ${LOCKOUT_MINUTES} minutes.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS - failedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Rate limit error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
