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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    const id = url.searchParams.get("id");

    if (!name && !id) {
      return new Response(
        JSON.stringify({ error: "Missing 'name' or 'id' parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get dataset
    let query = supabaseClient.from("datasets").select("id, name, active, created_at");
    
    if (id) {
      query = query.eq("id", id);
    } else if (name) {
      query = query.eq("name", name);
    }

    const { data: dataset, error: datasetError } = await query.maybeSingle();

    if (datasetError || !dataset) {
      return new Response(
        JSON.stringify({
          exists: false,
          active: false,
          last_purchase: null,
          badge_remaining: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get last purchase
    const { data: lastPurchase } = await supabaseClient
      .from("purchases")
      .select("created_at")
      .eq("dataset_id", dataset.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Count remaining badge codes
    const { count: badgeCount } = await supabaseClient
      .from("badge_codes")
      .select("*", { count: "exact", head: true })
      .eq("dataset_id", dataset.id)
      .eq("claimed", false);

    return new Response(
      JSON.stringify({
        exists: true,
        active: dataset.active,
        last_purchase: lastPurchase?.created_at || null,
        badge_remaining: badgeCount || 0,
        dataset_id: dataset.id,
        dataset_name: dataset.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("dataset-status error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
