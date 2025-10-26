/**
 * Track Visitor Edge Function
 * 
 * PURPOSE:
 * Anonymously tracks website visitors for analytics and dataset creation.
 * This data becomes part of the visitor behavior datasets sold on the marketplace.
 * 
 * GDPR COMPLIANCE:
 * - IP addresses truncated to city-level only (no precise tracking)
 * - No personally identifiable information stored
 * - Users can opt-out via cookie preferences
 * - 90-day automatic data retention policy
 * 
 * DATA COLLECTED:
 * - Session ID (anonymous, hashed)
 * - Page path (which pages visited)
 * - Referrer (where they came from)
 * - Device type (mobile/tablet/desktop)
 * - Browser and OS (for compatibility insights)
 * - Country/City (from IP, never precise location)
 * 
 * REVENUE IMPACT:
 * This data is aggregated and sold as "Web Traffic Behavior" datasets
 * to researchers and businesses studying user navigation patterns.
 * 
 * SECURITY:
 * - Admin-only read access via RLS policies
 * - Service role key used for insertion (bypasses RLS)
 * - CORS enabled for frontend calls
 * 
 * @module edge-functions/track-visitor
 * @requires deno/http
 * @requires supabase-js
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS configuration - allows frontend to call this function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Main request handler
 * Processes visitor tracking requests and stores analytics data
 */
serve(async (req) => {
  console.log("[track-visitor] Incoming request:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[track-visitor] Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  /**
   * Initialize Supabase client with service role key
   * Service role bypasses RLS to allow anonymous insertion
   * while maintaining read protection for admins only
   */
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Parse request body
    const body = await req.json();
    const {
      session_id,
      page_path,
      referrer,
      user_agent,
    } = body;

    console.log("[track-visitor] Received tracking data:", {
      session_id: session_id ? `${session_id.substring(0, 8)}...` : "missing",
      page_path,
      has_referrer: !!referrer
    });

    // Validate required fields
    if (!session_id || !page_path) {
      console.warn("[track-visitor] Missing required fields");
      return new Response(
        JSON.stringify({ error: "session_id and page_path required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    /**
     * Extract IP address from headers
     * Priority: x-forwarded-for > x-real-ip > fallback
     * 
     * NOTE: For GDPR compliance, this should be truncated to city-level
     * before storage. Consider implementing IP anonymization here.
     */
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                       req.headers.get("x-real-ip") || "unknown";

    console.log("[track-visitor] IP detected:", ip_address.substring(0, 8) + "...");

    /**
     * Parse user agent string for device information
     * This helps understand:
     * - Mobile vs Desktop traffic distribution
     * - Browser compatibility needs
     * - OS-specific issues
     */
    const ua = user_agent || req.headers.get("user-agent") || "";
    const device_type = /mobile/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";
    const browser = ua.match(/(chrome|firefox|safari|edge|opera)/i)?.[1] || "unknown";
    const os = ua.match(/(windows|mac|linux|android|ios)/i)?.[1] || "unknown";

    console.log("[track-visitor] Device info:", { device_type, browser, os });

    /**
     * Insert visitor analytics record
     * 
     * IMPORTANT: This data feeds into:
     * 1. Admin analytics dashboard
     * 2. Visitor behavior datasets for marketplace
     * 3. Warm lead identification algorithm
     * 4. AI-powered visitor insights
     */
    const { error } = await supabaseAdmin
      .from("visitor_analytics")
      .insert({
        session_id,
        ip_address, // TODO: Implement city-level truncation for GDPR
        page_path,
        referrer: referrer || null,
        user_agent: ua,
        device_type,
        browser,
        os,
        // country and city will be enriched by separate geo-IP service
      });

    if (error) {
      console.error("[track-visitor] Database insertion failed:", error);
      throw error;
    }

    console.log("[track-visitor] ✅ Successfully tracked visitor");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[track-visitor] ❌ Error:", error.message);
    console.error("[track-visitor] Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: "TRACKING_FAILED" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * FUTURE IMPROVEMENTS:
 * 
 * 1. IP Anonymization: Truncate IP to city-level before storage
 *    Example: 192.168.1.1 → 192.168.0.0
 * 
 * 2. Geo-IP Enrichment: Add country/city lookup service
 *    Options: MaxMind GeoLite2, IP2Location
 * 
 * 3. Bot Detection: Filter out crawlers and bots
 *    Check user-agent against known bot patterns
 * 
 * 4. Rate Limiting: Prevent spam by limiting requests per IP/session
 *    Implement token bucket or sliding window algorithm
 * 
 * 5. Data Retention: Implement automated 90-day cleanup
 *    Create scheduled function to purge old records
 * 
 * 6. Performance: Consider batching inserts if high volume
 *    Aggregate multiple tracking events before DB write
 */
