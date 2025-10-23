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

    const { tier = 'bronze', daysBack = 7 } = await req.json();

    console.log(`Building visitor dataset - Tier: ${tier}, Days back: ${daysBack}`);

    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch visitor data
    const { data: visitorData, error: fetchError } = await supabase
      .from('visitor_analytics')
      .select('*')
      .gte('created_at', cutoffDate.toISOString());

    if (fetchError) throw fetchError;

    if (!visitorData || visitorData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Insufficient visitor data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Anonymize data based on tier
    const anonymizedData = visitorData.map(v => {
      const base = {
        session_id: hashString(v.session_id), // Hash session IDs
        page_path: v.page_path,
        device_type: v.device_type,
        browser: v.browser,
        os: v.os,
        visited_hour: new Date(v.visited_at).getHours(),
        visited_day: new Date(v.visited_at).getDay(),
      };

      if (tier === 'silver' || tier === 'gold' || tier === 'enterprise') {
        return {
          ...base,
          country: v.country,
          city: tier === 'gold' || tier === 'enterprise' ? v.city : null,
          referrer: v.referrer ? new URL(v.referrer).hostname : 'Direct',
        };
      }

      return {
        ...base,
        country: v.country,
      };
    });

    // Calculate aggregate metrics
    const uniqueSessions = new Set(anonymizedData.map(d => d.session_id)).size;
    const pageViews = anonymizedData.length;
    
    const countryCounts: { [key: string]: number } = {};
    anonymizedData.forEach(d => {
      if (d.country) countryCounts[d.country] = (countryCounts[d.country] || 0) + 1;
    });

    const pageCounts: { [key: string]: number } = {};
    anonymizedData.forEach(d => {
      pageCounts[d.page_path] = (pageCounts[d.page_path] || 0) + 1;
    });

    const deviceCounts: { [key: string]: number } = {};
    anonymizedData.forEach(d => {
      if (d.device_type) deviceCounts[d.device_type] = (deviceCounts[d.device_type] || 0) + 1;
    });

    // Build dataset payload
    const datasetPayload = {
      metadata: {
        tier,
        period_days: daysBack,
        generated_at: new Date().toISOString(),
        unique_sessions: uniqueSessions,
        total_page_views: pageViews,
        anonymization_level: tier === 'bronze' ? 'high' : tier === 'silver' ? 'medium' : 'low',
      },
      aggregates: {
        top_countries: Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
        top_pages: Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 20),
        device_breakdown: deviceCounts,
      },
      raw_data: tier === 'enterprise' ? anonymizedData : null,
      sample_data: anonymizedData.slice(0, 100), // Always include sample
    };

    // Insert into review queue
    const { data: reviewItem, error: insertError } = await supabase
      .from('review_queue')
      .insert({
        source_type: 'visitor_analytics',
        source_reference: `visitor_dataset_${tier}_${Date.now()}`,
        raw_payload: datasetPayload,
        normalized_payload: datasetPayload,
        provenance_hash: hashString(JSON.stringify(datasetPayload)),
        category: 'visitor_behavior',
        tags: ['visitor_analytics', 'web_traffic', tier, 'climate_tech'],
        quality_tier: tier === 'bronze' ? 'bronze' : tier === 'silver' ? 'silver' : 'gold',
        confidence_score: 0.95,
        status: 'approved', // Auto-approve visitor datasets
        publish_decision: 'on_site',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`Visitor dataset created in review queue: ${reviewItem.id}`);

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'visitor_dataset_built',
      resource_type: 'datasets',
      resource_id: reviewItem.id,
      severity: 'info',
      details: {
        tier,
        days_back: daysBack,
        unique_sessions: uniqueSessions,
        page_views: pageViews,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        review_queue_id: reviewItem.id,
        metrics: datasetPayload.metadata,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Error in build-visitor-dataset:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Simple hash function for anonymization
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
