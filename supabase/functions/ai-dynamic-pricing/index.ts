import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

/**
 * AI-Powered Dynamic Pricing Engine
 * 
 * Analyzes market data, quality metrics, and competition to set optimal pricing
 * for datasets. Uses Lovable AI to perform competitive analysis.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { datasetInfo, qualityScore, dataType, category, recordCount } = await req.json();

    console.log("[AI-PRICING] Analyzing pricing for:", datasetInfo?.name || "Unknown");

    // Get existing datasets for competitive analysis
    const { data: existingDatasets } = await supabaseClient
      .from("datasets")
      .select("name, description, category, price, size_mb")
      .eq("active", true)
      .limit(20);

    // Get recent purchases to understand market demand
    const { data: recentPurchases } = await supabaseClient
      .from("purchases")
      .select("dataset_id, amount_paid, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(100);

    // Calculate average pricing by category
    const categoryPrices = existingDatasets
      ?.filter(d => d.category === category)
      .map(d => Number(d.price)) || [];
    
    const avgCategoryPrice = categoryPrices.length > 0
      ? categoryPrices.reduce((a, b) => a + b, 0) / categoryPrices.length
      : 50;

    // Prepare context for AI analysis
    const pricingContext = `
Analyze competitive pricing for this dataset:

Dataset Information:
- Name: ${datasetInfo?.name || "Unknown"}
- Description: ${datasetInfo?.description || "N/A"}
- Category: ${category}
- Data Type: ${dataType}
- Quality Score: ${qualityScore}/1.0
- Record Count: ${recordCount}

Market Analysis:
- Average price in ${category} category: $${avgCategoryPrice.toFixed(2)}
- Total active datasets in marketplace: ${existingDatasets?.length || 0}
- Recent purchase volume: ${recentPurchases?.length || 0} in last 100 transactions

Competitor Pricing:
${existingDatasets?.slice(0, 10).map(d => 
  `- ${d.name}: $${d.price} (${d.category}, ${d.size_mb || 'N/A'}MB)`
).join('\n') || 'No competitors found'}

Pricing Strategy Factors:
1. Quality score (higher = premium pricing)
2. Data freshness and uniqueness
3. Market demand for category
4. Competitive landscape
5. Record count and data richness
6. Environmental impact value

Provide optimal pricing that is:
- Competitive but not underpriced
- Reflects quality and value
- Considers market demand
- Accounts for environmental mission (slight premium acceptable)
`;

    // Call Lovable AI for pricing analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a pricing strategist specializing in ethical data marketplaces. Analyze market data and provide optimal pricing recommendations with clear justification."
          },
          {
            role: "user",
            content: pricingContext
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_pricing",
              description: "Recommend optimal pricing for a dataset based on market analysis",
              parameters: {
                type: "object",
                properties: {
                  recommended_price: {
                    type: "number",
                    description: "Recommended price in USD"
                  },
                  price_range: {
                    type: "object",
                    properties: {
                      min: { type: "number" },
                      max: { type: "number" }
                    },
                    required: ["min", "max"]
                  },
                  pricing_strategy: {
                    type: "string",
                    enum: ["value", "competitive", "premium", "penetration"],
                    description: "Pricing strategy category"
                  },
                  justification: {
                    type: "string",
                    description: "Detailed reasoning for the pricing recommendation"
                  },
                  competitive_position: {
                    type: "string",
                    enum: ["below_market", "at_market", "above_market"],
                    description: "Position relative to market average"
                  },
                  confidence_score: {
                    type: "number",
                    description: "Confidence in recommendation (0.0-1.0)"
                  }
                },
                required: ["recommended_price", "price_range", "pricing_strategy", "justification", "competitive_position", "confidence_score"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_pricing" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[AI-PRICING] AI API error:", aiResponse.status, errorText);
      
      // Fallback to rule-based pricing if AI fails
      const fallbackPrice = calculateFallbackPrice(qualityScore, avgCategoryPrice, recordCount);
      
      return new Response(
        JSON.stringify({
          recommended_price: fallbackPrice,
          price_range: { min: fallbackPrice * 0.8, max: fallbackPrice * 1.2 },
          pricing_strategy: "competitive",
          justification: "AI analysis unavailable. Using rule-based pricing based on category average and quality score.",
          competitive_position: "at_market",
          confidence_score: 0.6,
          fallback_used: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const aiResult = await aiResponse.json();
    console.log("[AI-PRICING] AI analysis complete");

    let pricingRecommendation = null;
    if (aiResult.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      pricingRecommendation = JSON.parse(aiResult.choices[0].message.tool_calls[0].function.arguments);
    }

    if (!pricingRecommendation) {
      throw new Error("AI did not return valid pricing recommendation");
    }

    // Log pricing decision to audit
    await supabaseClient
      .from("audit_logs")
      .insert({
        action: "ai_pricing_analysis",
        resource_type: "dataset",
        details: {
          dataset_name: datasetInfo?.name,
          recommended_price: pricingRecommendation.recommended_price,
          strategy: pricingRecommendation.pricing_strategy,
          quality_score: qualityScore,
          market_avg: avgCategoryPrice
        },
        severity: "info"
      });

    return new Response(
      JSON.stringify(pricingRecommendation),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[AI-PRICING] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze pricing";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function calculateFallbackPrice(
  qualityScore: number,
  marketAvg: number,
  recordCount: number
): number {
  // Base price on market average
  let price = marketAvg;
  
  // Adjust for quality (±30%)
  const qualityMultiplier = 0.7 + (qualityScore * 0.6);
  price *= qualityMultiplier;
  
  // Adjust for record count (more records = higher value)
  if (recordCount > 1000) price *= 1.2;
  else if (recordCount > 500) price *= 1.1;
  else if (recordCount < 100) price *= 0.9;
  
  // Round to nearest $5
  return Math.round(price / 5) * 5;
}
