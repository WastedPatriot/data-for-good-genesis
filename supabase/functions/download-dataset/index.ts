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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Verify authentication
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

    const url = new URL(req.url);
    const datasetId = url.searchParams.get("dataset_id");

    if (!datasetId) {
      return new Response(
        JSON.stringify({ error: "Missing dataset_id parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify user has purchased this dataset
    const { data: purchase } = await supabaseClient
      .from("purchases")
      .select("id, status")
      .eq("user_id", userData.user.id)
      .eq("dataset_id", datasetId)
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) {
      return new Response(
        JSON.stringify({ error: "Purchase not found or not completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Get dataset info
    const { data: dataset } = await supabaseClient
      .from("datasets")
      .select("name, stripe_product_id")
      .eq("id", datasetId)
      .single();

    if (!dataset) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Update purchase stats
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseAdmin
      .from("purchases")
      .update({
        download_count: (purchase as any).download_count ? (purchase as any).download_count + 1 : 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", purchase.id);

    // In a real implementation, you would generate a presigned URL from Supabase Storage
    // For now, return a placeholder response indicating the download would be available
    return new Response(
      JSON.stringify({
        success: true,
        dataset_name: dataset.name,
        download_url: `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/datasets/${datasetId}/data.csv`,
        message: "Note: Actual file storage integration required. This is a placeholder URL.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("download-dataset error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
