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

    console.log("Starting visitor insights processing...");

    // Get visitor data from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: visitorData, error: fetchError } = await supabase
      .from('visitor_analytics')
      .select('*')
      .gte('created_at', yesterday.toISOString());

    if (fetchError) {
      console.error("Error fetching visitor data:", fetchError);
      throw fetchError;
    }

    console.log(`Processing ${visitorData?.length || 0} visitor records from last 24 hours`);

    // Aggregate insights
    const uniqueSessions = new Set(visitorData?.map(v => v.session_id)).size;
    
    // Geographic analysis
    const countryCounts: { [key: string]: number } = {};
    const cityCounts: { [key: string]: number } = {};
    visitorData?.forEach(v => {
      if (v.country) countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
      if (v.city) cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
    });

    // Page popularity
    const pageCounts: { [key: string]: number } = {};
    visitorData?.forEach(v => {
      pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
    });

    // Device analysis
    const deviceCounts: { [key: string]: number } = {};
    visitorData?.forEach(v => {
      if (v.device_type) deviceCounts[v.device_type] = (deviceCounts[v.device_type] || 0) + 1;
    });

    // Browser analysis
    const browserCounts: { [key: string]: number } = {};
    visitorData?.forEach(v => {
      if (v.browser) browserCounts[v.browser] = (browserCounts[v.browser] || 0) + 1;
    });

    // Traffic sources
    const referrerCounts: { [key: string]: number } = {};
    visitorData?.forEach(v => {
      if (v.referrer) {
        try {
          const hostname = new URL(v.referrer).hostname;
          referrerCounts[hostname] = (referrerCounts[hostname] || 0) + 1;
        } catch (e) {
          referrerCounts['Direct'] = (referrerCounts['Direct'] || 0) + 1;
        }
      } else {
        referrerCounts['Direct'] = (referrerCounts['Direct'] || 0) + 1;
      }
    });

    // Generate AI insights using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const analysisPrompt = `Analyze this website visitor data from the last 24 hours and provide actionable insights:

Unique Sessions: ${uniqueSessions}
Total Page Views: ${visitorData?.length || 0}

Top Countries: ${Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', ')}
Top Pages: ${Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', ')}
Device Breakdown: ${Object.entries(deviceCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}
Top Browsers: ${Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}
Traffic Sources: ${Object.entries(referrerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', ')}

Provide:
1. Key trends (2-3 bullet points)
2. Conversion optimization opportunities (2-3 suggestions)
3. Geographic expansion opportunities (if any)
4. Technical optimization recommendations (if any)
5. Marketing strategy insights (2-3 points)

Keep it concise and actionable.`;

    let aiInsights = "AI analysis unavailable";
    
    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'You are a data analytics expert specializing in web traffic analysis and conversion optimization for environmental and climate tech platforms.' 
              },
              { role: 'user', content: analysisPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.choices?.[0]?.message?.content || "AI analysis failed";
          console.log("AI insights generated successfully");
        } else {
          console.error("AI API error:", aiResponse.status, await aiResponse.text());
        }
      } catch (aiError) {
        console.error("Error calling AI API:", aiError);
      }
    }

    // Store insights in audit logs
    const insightsData = {
      action: 'visitor_insights_processed',
      resource_type: 'visitor_analytics',
      severity: 'info',
      details: {
        period: 'last_24_hours',
        unique_sessions: uniqueSessions,
        total_page_views: visitorData?.length || 0,
        top_countries: Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        top_pages: Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        device_breakdown: deviceCounts,
        browser_breakdown: Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        traffic_sources: Object.entries(referrerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        ai_insights: aiInsights,
        processed_at: new Date().toISOString()
      }
    };

    const { error: logError } = await supabase
      .from('audit_logs')
      .insert(insightsData);

    if (logError) {
      console.error("Error storing insights:", logError);
    } else {
      console.log("Visitor insights successfully stored in audit logs");
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights: insightsData.details,
        message: "Visitor insights processed and stored successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in process-visitor-insights:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
