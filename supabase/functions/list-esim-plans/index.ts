import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gigsApiKey = Deno.env.get("GIGS_API_KEY");
    
    if (!gigsApiKey) {
      // Return mock data if API key not set
      const mockPlans = [
        {
          id: "plan_us_5gb",
          country: "United States",
          countryCode: "US",
          dataAmount: "5GB",
          duration: 30,
          price: 15.99,
          coverage: ["United States"],
          networkType: "4G/5G",
        },
        {
          id: "plan_uk_3gb",
          country: "United Kingdom",
          countryCode: "GB",
          dataAmount: "3GB",
          duration: 14,
          price: 12.99,
          coverage: ["United Kingdom"],
          networkType: "4G/5G",
        },
        {
          id: "plan_eu_10gb",
          country: "Europe",
          countryCode: "EU",
          dataAmount: "10GB",
          duration: 30,
          price: 29.99,
          coverage: ["30+ European countries"],
          networkType: "4G/5G",
        },
        {
          id: "plan_asia_7gb",
          country: "Asia",
          countryCode: "AS",
          dataAmount: "7GB",
          duration: 30,
          price: 24.99,
          coverage: ["15+ Asian countries"],
          networkType: "4G/5G",
        },
      ];

      return new Response(
        JSON.stringify({ plans: mockPlans, source: "mock" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from Gigs API
    const response = await fetch("https://api.gigs.com/v1/plans", {
      headers: {
        "Authorization": `Bearer ${gigsApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch plans from Gigs");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ plans: data, source: "gigs" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching plans:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
