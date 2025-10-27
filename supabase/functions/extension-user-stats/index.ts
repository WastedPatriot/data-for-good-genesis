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

    // Get extension user data
    const { data: extensionUser, error: extensionError } = await supabase
      .from('extension_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (extensionError) {
      console.error('Error fetching extension user:', extensionError);
    }

    // If no extension user exists, create one
    if (!extensionUser) {
      const { data: newUser, error: createError } = await supabase
        .from('extension_users')
        .insert({
          user_id: user.id,
          extension_id: crypto.randomUUID()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating extension user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create extension user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          total_sites_tracked: 0,
          total_co2_awareness: 0,
          badge_tier: 'bronze',
          points: 0,
          challenges_completed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get completed challenges count
    const { count: challengesCompleted } = await supabase
      .from('user_challenge_progress')
      .select('*', { count: 'exact', head: true })
      .eq('extension_user_id', extensionUser.id)
      .eq('completed', true);

    return new Response(
      JSON.stringify({
        total_sites_tracked: extensionUser.total_sites_tracked || 0,
        total_co2_awareness: extensionUser.total_co2_awareness || 0,
        badge_tier: extensionUser.badge_tier || 'bronze',
        points: extensionUser.points || 0,
        challenges_completed: challengesCompleted || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Extension user stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
