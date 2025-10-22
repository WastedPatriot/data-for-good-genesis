import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    console.log('Badge verification request received for code:', code ? 'PROVIDED' : 'MISSING');

    // Validate input
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      console.log('Validation failed: Invalid code format');
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid code format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (code.length > 100) {
      console.log('Validation failed: Code too long');
      return new Response(
        JSON.stringify({ valid: false, error: 'Code too long' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if code exists and is valid
    const { data, error } = await supabase
      .from('badge_codes')
      .select('*')
      .eq('code', code.trim())
      .maybeSingle();

    if (error) {
      console.error('Database error during verification:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Verification failed' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data) {
      console.log('Code not found in database');
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid code' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Mark as claimed if not already claimed
    if (!data.claimed) {
      console.log('Marking code as claimed');
      const { error: updateError } = await supabase
        .from('badge_codes')
        .update({ 
          claimed: true, 
          claimed_at: new Date().toISOString() 
        })
        .eq('id', data.id);

      if (updateError) {
        console.error('Error marking code as claimed:', updateError);
      }
    } else {
      console.log('Code was already claimed at:', data.claimed_at);
    }

    console.log('Verification successful');
    return new Response(
      JSON.stringify({ 
        valid: true, 
        badge_data: {
          code: data.code,
          claimed_at: data.claimed_at,
          created_at: data.created_at
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in verify-badge function:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
