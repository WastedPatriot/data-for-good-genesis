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
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query company carbon data
    const { data: company, error } = await supabase
      .from('company_carbon_data')
      .select('*')
      .eq('domain', domain)
      .maybeSingle();

    if (error) {
      console.error('Error fetching company:', error);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If company data exists, return it
    if (company) {
      return new Response(
        JSON.stringify({ company, estimated: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No data found - use AI to estimate
    console.log(`No data for ${domain}, using AI estimation...`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a carbon emissions estimator. Estimate the annual carbon footprint for companies based on their domain. Consider:
- Industry sector (tech, retail, energy, finance, etc.)
- Typical company size in that sector
- Data centers, offices, logistics
- Similar companies' emissions

Return ONLY a JSON object with:
{
  "company_name": "string",
  "annual_co2_tons": number (realistic estimate in tons),
  "sustainability_score": number (0-100, lower for high-emission industries),
  "scope_1_emissions": number,
  "scope_2_emissions": number,
  "scope_3_emissions": number
}

Be realistic - small sites: 100-10K tons, medium: 10K-1M tons, large: 1M-100M tons.`
          },
          {
            role: 'user',
            content: `Estimate carbon footprint for domain: ${domain}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI estimation failed:', await aiResponse.text());
      // Return minimal fallback data
      return new Response(
        JSON.stringify({
          company: {
            company_name: domain.replace(/\.(com|co\.uk|org|net|io)$/i, ''),
            domain,
            annual_co2_tons: 50000,
            sustainability_score: 50,
            verified: false
          },
          estimated: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    let estimate;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      estimate = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI estimate:', aiContent);
      // Fallback estimate
      estimate = {
        company_name: domain.replace(/\.(com|co\.uk|org|net|io)$/i, ''),
        annual_co2_tons: 50000,
        sustainability_score: 50,
        scope_1_emissions: 10000,
        scope_2_emissions: 15000,
        scope_3_emissions: 25000
      };
    }

    // Add domain and verified flag
    estimate.domain = domain;
    estimate.verified = false;

    return new Response(
      JSON.stringify({
        company: estimate,
        estimated: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Extension company data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
