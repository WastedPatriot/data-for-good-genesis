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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const {
      session_id,
      page_path,
      referrer,
      user_agent,
    } = body;

    if (!session_id || !page_path) {
      return new Response(
        JSON.stringify({ error: "session_id and page_path required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get IP from request headers
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                       req.headers.get("x-real-ip") || "unknown";

    // Parse user agent for device info
    const ua = user_agent || req.headers.get("user-agent") || "";
    const device_type = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";
    const browser = ua.match(/(chrome|firefox|safari|edge|opera)/i)?.[1] || "unknown";
    const os = ua.match(/(windows|mac|linux|android|ios)/i)?.[1] || "unknown";

    // Insert visitor analytics
    const { error } = await supabaseAdmin
      .from("visitor_analytics")
      .insert({
        session_id,
        ip_address,
        page_path,
        referrer: referrer || null,
        user_agent: ua,
        device_type,
        browser,
        os,
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("track-visitor error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});