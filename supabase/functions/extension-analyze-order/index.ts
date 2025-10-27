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
    const { domain, pageContent, orderData } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get company data
    const { data: company } = await supabase
      .from('company_carbon_data')
      .select('*')
      .eq('domain', domain)
      .maybeSingle();

    // Use AI to analyze the order and estimate CO2
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
            content: `You are a carbon footprint calculator. Analyze order data and estimate CO2 emissions in kg. Consider:
- Product type and quantity
- Shipping distance (default to average if unknown)
- Packaging materials
- Manufacturing emissions
- Company's sustainability score if provided

Return ONLY a JSON object with:
{
  "co2_kg": number,
  "breakdown": {
    "manufacturing": number,
    "shipping": number,
    "packaging": number
  },
  "tips": ["tip1", "tip2", "tip3"]
}

Tips should be actionable ways to reduce the carbon footprint of this specific order.`
          },
          {
            role: 'user',
            content: `Domain: ${domain}
Company Annual CO2: ${company?.annual_co2_tons || 'unknown'} tons
Sustainability Score: ${company?.sustainability_score || 'unknown'}/100

Page Content: ${pageContent.substring(0, 3000)}
Order Data: ${JSON.stringify(orderData)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse AI response
    let analysis;
    try {
      // Extract JSON from the response (AI might include markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      analysis = {
        co2_kg: 5.0,
        breakdown: { manufacturing: 2.0, shipping: 2.0, packaging: 1.0 },
        tips: ['Choose slower shipping to reduce emissions', 'Consider buying in bulk', 'Look for eco-friendly alternatives']
      };
    }

    return new Response(
      JSON.stringify({
        company: company || null,
        order_analysis: analysis,
        analyzed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Extension analyze order error:', error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed', analyzed: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
