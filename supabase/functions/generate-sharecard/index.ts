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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { projectId } = await req.json();

    // Get user badge level
    const { data: badge } = await supabaseAdmin
      .from("enterprise_badges")
      .select("badge_tier")
      .eq("user_id", userData.user.id)
      .single();

    const badgeLevel = badge?.badge_tier || "supporter";

    // Get project details
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("title, votes_count, category")
      .eq("id", projectId)
      .single();

    // Generate deterministic seed for unique design
    const seed = `${userData.user.email}-${projectId}-${Date.now()}`;
    const hashCode = seed.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    // Create SVG sharecard with unique design based on hash
    const hue = Math.abs(hashCode % 360);
    const svgContent = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 20%);stop-opacity:1" />
      <stop offset="100%" style="stop-color:hsl(${(hue + 60) % 360}, 60%, 30%);stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Decorative circles -->
  <circle cx="${200 + (hashCode % 200)}" cy="${150 + (hashCode % 100)}" r="150" fill="hsl(${hue}, 80%, 40%)" opacity="0.2"/>
  <circle cx="${900 + (hashCode % 150)}" cy="${400 + (hashCode % 150)}" r="200" fill="hsl(${(hue + 120) % 360}, 80%, 40%)" opacity="0.2"/>
  
  <!-- Content -->
  <text x="600" y="180" font-family="system-ui, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
    🌍 DataForEarth Impact
  </text>
  
  <text x="600" y="280" font-family="system-ui, sans-serif" font-size="36" fill="white" text-anchor="middle" opacity="0.9">
    ${project?.title || "Eco Project"}
  </text>
  
  <text x="600" y="350" font-family="system-ui, sans-serif" font-size="28" fill="hsl(${hue}, 100%, 80%)" text-anchor="middle">
    ${project?.votes_count || 0} Community Votes
  </text>
  
  <rect x="400" y="400" width="400" height="80" rx="40" fill="hsl(${hue}, 80%, 50%)" filter="url(#glow)"/>
  <text x="600" y="450" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">
    ${badgeLevel.toUpperCase()} IMPACT PARTNER
  </text>
  
  <text x="600" y="550" font-family="system-ui, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.7">
    Data mined ethically • Profits reinvested
  </text>
</svg>
    `.trim();

    // Store sharecard
    const { data: sharecard, error: scError } = await supabaseAdmin
      .from("sharecards")
      .insert({
        user_id: userData.user.id,
        project_id: projectId,
        badge_level: badgeLevel,
        seed,
        image_url: `data:image/svg+xml;base64,${btoa(svgContent)}`,
      })
      .select()
      .single();

    if (scError) throw scError;

    return new Response(
      JSON.stringify({
        sharecard,
        svgContent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Sharecard generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
