import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Identifying warm leads from visitor analytics...");

    // Get visitor data from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: visitorData, error: fetchError } = await supabase
      .from('visitor_analytics')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (fetchError) throw fetchError;

    // Group by session to calculate lead scores
    const sessionMap: { [key: string]: any[] } = {};
    visitorData?.forEach(v => {
      if (!sessionMap[v.session_id]) {
        sessionMap[v.session_id] = [];
      }
      sessionMap[v.session_id].push(v);
    });

    const warmLeads: any[] = [];

    // Calculate lead score for each session
    for (const [sessionId, visits] of Object.entries(sessionMap)) {
      let score = 0;
      const uniquePages = new Set(visits.map(v => v.page_path));
      const firstVisit = new Date(visits[0].created_at);
      const lastVisit = new Date(visits[visits.length - 1].visited_at);
      const sessionDuration = (lastVisit.getTime() - firstVisit.getTime()) / 1000 / 60; // minutes

      // Scoring logic
      // High-intent pages
      if (uniquePages.has('/marketplace')) score += 20;
      if (uniquePages.has('/contribute')) score += 25;
      if (Array.from(uniquePages).some(p => p.includes('/dataset'))) score += 25;
      if (uniquePages.has('/donate')) score += 30;
      if (uniquePages.has('/organization-signup')) score += 35;
      if (uniquePages.has('/login')) score += 15;

      // Engagement metrics
      score += Math.min(visits.length * 2, 30); // Page views (max 30)
      score += Math.min(sessionDuration * 0.5, 25); // Time on site (max 25)
      score += Math.min((visits.length - 1) * 10, 30); // Return visits (max 30)

      // Device type (desktop users more likely to convert)
      if (visits[0].device_type === 'desktop') score += 10;

      // Cap at 100
      score = Math.min(score, 100);

      // Warm lead threshold: score >= 50
      if (score >= 50) {
        warmLeads.push({
          session_id: sessionId,
          score: Math.round(score),
          page_views: visits.length,
          unique_pages: uniquePages.size,
          session_duration_minutes: Math.round(sessionDuration),
          high_intent_pages: Array.from(uniquePages).filter(p => 
            p.includes('marketplace') || 
            p.includes('contribute') || 
            p.includes('donate') || 
            p.includes('organization')
          ),
          first_visit: firstVisit.toISOString(),
          last_visit: lastVisit.toISOString(),
          country: visits[0].country,
          device_type: visits[0].device_type,
          referrer: visits[0].referrer,
        });
      }
    }

    // Sort by score descending
    warmLeads.sort((a, b) => b.score - a.score);

    console.log(`Identified ${warmLeads.length} warm leads`);

    // Store top leads in audit logs for admin review
    if (warmLeads.length > 0) {
      const topLeads = warmLeads.slice(0, 20); // Top 20
      
      await supabase.from('audit_logs').insert({
        action: 'warm_leads_identified',
        resource_type: 'visitor_analytics',
        severity: 'info',
        details: {
          total_leads: warmLeads.length,
          top_leads: topLeads,
          analyzed_sessions: Object.keys(sessionMap).length,
          date_range: {
            from: sevenDaysAgo.toISOString(),
            to: new Date().toISOString(),
          },
          average_score: Math.round(warmLeads.reduce((sum, l) => sum + l.score, 0) / warmLeads.length),
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        warm_leads_count: warmLeads.length,
        top_leads: warmLeads.slice(0, 10),
        stats: {
          total_sessions_analyzed: Object.keys(sessionMap).length,
          conversion_rate: ((warmLeads.length / Object.keys(sessionMap).length) * 100).toFixed(2) + '%',
          average_lead_score: warmLeads.length > 0 
            ? Math.round(warmLeads.reduce((sum, l) => sum + l.score, 0) / warmLeads.length)
            : 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Error in identify-warm-leads:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
