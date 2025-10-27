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
    const { domain, company_id, anonymous } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Track anonymous visit in extension_activity
    const { data: activityData, error: activityError } = await supabase
      .from('extension_activity')
      .insert({
        extension_user_id: null, // Anonymous
        visited_domain: domain,
        company_id: company_id || null,
        co2_data_shown: !!company_id,
        duration_seconds: null,
        processed: false // Will be processed by extension-handoff-for-review
      })
      .select()
      .single();

    if (activityError) {
      console.error('Error tracking anonymous activity:', activityError);
    } else {
      console.log(`Anonymous visit tracked: ${domain}, activity_id: ${activityData?.id}`);
      
      // Periodically trigger batch processing (every 10th visit)
      if (Math.random() < 0.1) {
        try {
          await supabase.functions.invoke('extension-handoff-for-review', {
            body: { automated: true }
          });
          console.log('Triggered extension data batch processing');
        } catch (e) {
          console.log('Batch processing trigger failed (non-critical)');
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Extension track visit error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
