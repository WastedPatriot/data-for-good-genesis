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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")!,
        },
      },
    }
  );

  try {
    // Verify admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Support both query params and JSON body for filters
    let bodyParams: any = null;
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        bodyParams = await req.json();
      }
    } catch (_) { /* ignore body parse errors */ }

    const url = new URL(req.url);
    const getParam = (key: string, fallback?: string) =>
      (bodyParams && bodyParams[key] !== undefined && bodyParams[key] !== null
        ? String(bodyParams[key])
        : url.searchParams.get(key) ?? fallback);

    const status = getParam("status", "pending");
    const category = getParam("category") || undefined;
    const minConfidence = parseFloat(getParam("minConfidence", "0")!);
    const quality = getParam("quality") || undefined;
    const source = getParam("source") || undefined;
    const limit = parseInt(getParam("limit", "100")!);

    let query = supabaseClient
      .from("review_queue")
      .select("*")
      .eq("status", status)
      .gte("confidence_score", minConfidence)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (quality) query = query.eq("quality_tier", quality);
    if (source) query = query.eq("source_type", source);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ items: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("review-queue-fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
