import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Project Voting Endpoint
 * 
 * Allows authenticated users to vote for community projects.
 * Vote weight can be based on user contribution history.
 */

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

    const { projectId, action } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Missing project ID" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify project exists and is active
    const { data: project } = await supabaseClient
      .from("projects")
      .select("id, status, title")
      .eq("id", projectId)
      .single();

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (project.status !== 'active') {
      return new Response(
        JSON.stringify({ error: "Project is not accepting votes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Calculate vote weight based on user contribution
    const { count: contributionCount } = await supabaseClient
      .from("data_submissions")
      .select("*", { count: "exact", head: true })
      .eq("email", userData.user.email);

    const voteWeight = Math.min(Math.floor((contributionCount || 0) / 10) + 1, 5);

    if (action === "unvote") {
      // Remove vote
      const { error: deleteError } = await supabaseClient
        .from("project_votes")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userData.user.id);

      if (deleteError) {
        console.error("Delete vote error:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to remove vote" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: "unvoted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Add/update vote
    const { error: voteError } = await supabaseClient
      .from("project_votes")
      .upsert({
        project_id: projectId,
        user_id: userData.user.id,
        vote_weight: voteWeight
      });

    if (voteError) {
      console.error("Vote error:", voteError);
      return new Response(
        JSON.stringify({ error: "Failed to record vote" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log to audit
    await supabaseClient
      .from("audit_logs")
      .insert({
        user_id: userData.user.id,
        action: "project_voted",
        resource_type: "project",
        resource_id: projectId,
        details: {
          project_title: project.title,
          vote_weight: voteWeight
        },
        severity: "info"
      });

    return new Response(
      JSON.stringify({
        success: true,
        vote_weight: voteWeight,
        contribution_count: contributionCount || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("vote-project error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
