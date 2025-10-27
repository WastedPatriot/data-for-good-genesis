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
    const { domain, company_id, duration } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get extension user
    const { data: extensionUser } = await supabase
      .from('extension_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!extensionUser) {
      return new Response(
        JSON.stringify({ error: 'Extension user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track the visit
    const { error: activityError } = await supabase
      .from('extension_activity')
      .insert({
        extension_user_id: extensionUser.id,
        visited_domain: domain,
        company_id: company_id || null,
        co2_data_shown: !!company_id,
        duration_seconds: duration || null
      });

    if (activityError) {
      console.error('Error tracking activity:', activityError);
    }

    // Get company CO2 data if available
    let co2Tons = 0;
    if (company_id) {
      const { data: company } = await supabase
        .from('company_carbon_data')
        .select('annual_co2_tons')
        .eq('id', company_id)
        .single();
      
      if (company) {
        co2Tons = company.annual_co2_tons || 0;
      }
    }

    // Update user stats - fetch first then update
    const { data: currentUser } = await supabase
      .from('extension_users')
      .select('total_sites_tracked, total_co2_awareness, points')
      .eq('id', extensionUser.id)
      .single();

    if (currentUser) {
      const { error: updateError } = await supabase
        .from('extension_users')
        .update({
          total_sites_tracked: currentUser.total_sites_tracked + 1,
          total_co2_awareness: Number(currentUser.total_co2_awareness) + Number(co2Tons),
          points: currentUser.points + 10,
          last_active: new Date().toISOString()
        })
        .eq('id', extensionUser.id);

      if (updateError) {
        console.error('Error updating user stats:', updateError);
      }
    }

    if (updateError) {
      console.error('Error updating user stats:', updateError);
    }

    // Check for badge tier upgrade
    const { data: updatedUser } = await supabase
      .from('extension_users')
      .select('points, badge_tier')
      .eq('id', extensionUser.id)
      .single();

    if (updatedUser) {
      let newTier = updatedUser.badge_tier;
      if (updatedUser.points >= 15000) newTier = 'platinum';
      else if (updatedUser.points >= 5000) newTier = 'gold';
      else if (updatedUser.points >= 1000) newTier = 'silver';
      else newTier = 'bronze';

      if (newTier !== updatedUser.badge_tier) {
        await supabase
          .from('extension_users')
          .update({ badge_tier: newTier })
          .eq('id', extensionUser.id);
      }
    }

    // Update challenge progress
    const { data: challenges } = await supabase
      .from('extension_challenges')
      .select('*')
      .eq('active', true);

    if (challenges) {
      for (const challenge of challenges) {
        if (challenge.challenge_type === 'visit_count') {
          const { data: progress } = await supabase
            .from('user_challenge_progress')
            .select('*')
            .eq('extension_user_id', extensionUser.id)
            .eq('challenge_id', challenge.id)
            .maybeSingle();

          if (!progress) {
            await supabase
              .from('user_challenge_progress')
              .insert({
                extension_user_id: extensionUser.id,
                challenge_id: challenge.id,
                current_value: 1,
                completed: 1 >= challenge.target_value
              });
          } else if (!progress.completed) {
            const newValue = progress.current_value + 1;
            await supabase
              .from('user_challenge_progress')
              .update({
                current_value: newValue,
                completed: newValue >= challenge.target_value,
                completed_at: newValue >= challenge.target_value ? new Date().toISOString() : null
              })
              .eq('id', progress.id);

            // Award points if completed
            if (newValue >= challenge.target_value && currentUser) {
              await supabase
                .from('extension_users')
                .update({
                  points: currentUser.points + challenge.reward_points
                })
                .eq('id', extensionUser.id);
            }
          }
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
