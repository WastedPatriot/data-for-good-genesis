import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DOWNLOAD-DATASET-SUBSCRIPTION] ${step}${detailsStr}`);
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

    logStep("User authenticated", { userId: userData.user.id });

    const { datasetId } = await req.json();

    if (!datasetId) {
      return new Response(
        JSON.stringify({ error: "Missing dataset_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get user's organization profile with subscription data
    const { data: orgProfile, error: orgError } = await supabaseClient
      .from("organization_profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    if (orgError || !orgProfile) {
      logStep("No organization profile found");
      return new Response(
        JSON.stringify({ 
          error: "You must have an organization profile to download datasets",
          requiresOrganization: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    logStep("Organization profile found", { 
      orgId: orgProfile.id, 
      subscriptionStatus: orgProfile.subscription_status 
    });

    // Check if organization has active subscription
    if (orgProfile.subscription_status !== 'active') {
      return new Response(
        JSON.stringify({ 
          error: "Active subscription required to download datasets",
          requiresSubscription: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Check download limits (null means unlimited for enterprise)
    if (orgProfile.monthly_downloads_limit !== null) {
      const downloadsUsed = orgProfile.monthly_downloads_used || 0;
      const downloadsLimit = orgProfile.monthly_downloads_limit;

      logStep("Checking download limits", { 
        used: downloadsUsed, 
        limit: downloadsLimit 
      });

      if (downloadsUsed >= downloadsLimit) {
        return new Response(
          JSON.stringify({ 
            error: `Monthly download limit reached (${downloadsLimit}/${downloadsLimit}). Upgrade your plan for more downloads.`,
            limitReached: true,
            downloadsUsed,
            downloadsLimit,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    } else {
      logStep("Unlimited downloads (enterprise tier)");
    }

    // Get dataset info
    const { data: dataset, error: datasetError } = await supabaseClient
      .from("datasets")
      .select("*")
      .eq("id", datasetId)
      .single();

    if (datasetError || !dataset) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    logStep("Dataset found", { datasetId, name: dataset.name });

    // Increment download counter
    const newDownloadsUsed = (orgProfile.monthly_downloads_used || 0) + 1;
    
    const { error: updateError } = await supabaseClient
      .from("organization_profiles")
      .update({ 
        monthly_downloads_used: newDownloadsUsed 
      })
      .eq("id", orgProfile.id);

    if (updateError) {
      logStep("ERROR updating download count", { error: updateError });
      throw updateError;
    }

    logStep("Download count incremented", { newCount: newDownloadsUsed });

    // Log the download in audit trail
    await supabaseClient
      .from("audit_logs")
      .insert({
        user_id: userData.user.id,
        resource_type: "dataset",
        resource_id: datasetId,
        action: "download",
        details: {
          dataset_name: dataset.name,
          organization_id: orgProfile.id,
          subscription_tier: orgProfile.subscription_tier,
          downloads_remaining: orgProfile.monthly_downloads_limit 
            ? (orgProfile.monthly_downloads_limit - newDownloadsUsed)
            : null,
        },
        severity: "info",
        domain: "subscription",
      });

    // Get dataset files
    const { data: datasetFiles, error: filesError } = await supabaseClient
      .from("dataset_files")
      .select("*")
      .eq("dataset_id", datasetId);

    if (filesError) {
      logStep("ERROR fetching dataset files", { error: filesError });
      throw filesError;
    }

    logStep("Dataset download successful", { 
      filesCount: datasetFiles?.length || 0,
      downloadsRemaining: orgProfile.monthly_downloads_limit 
        ? (orgProfile.monthly_downloads_limit - newDownloadsUsed)
        : "unlimited"
    });

    return new Response(
      JSON.stringify({
        success: true,
        dataset: {
          id: dataset.id,
          name: dataset.name,
          description: dataset.description,
          size_mb: dataset.size_mb,
          category: dataset.category,
        },
        files: datasetFiles || [],
        subscription: {
          tier: orgProfile.subscription_tier,
          downloads_used: newDownloadsUsed,
          downloads_limit: orgProfile.monthly_downloads_limit,
          downloads_remaining: orgProfile.monthly_downloads_limit 
            ? (orgProfile.monthly_downloads_limit - newDownloadsUsed)
            : null,
        },
        message: `Dataset downloaded successfully. ${
          orgProfile.monthly_downloads_limit 
            ? `${orgProfile.monthly_downloads_limit - newDownloadsUsed} downloads remaining this month.`
            : "Unlimited downloads available."
        }`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in download-dataset-subscription", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
