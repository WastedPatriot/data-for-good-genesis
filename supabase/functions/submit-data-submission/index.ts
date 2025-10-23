import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const payload = await req.json();

    // Minimal validation
    if (!payload || !payload.age_range || !payload.device_ownership || !payload.ev_ownership) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data, error } = await supabaseClient
      .from("data_submissions")
      .insert([{
        email: payload.email ?? null,
        location: payload.location ?? null,
        age_range: payload.age_range,
        interests: payload.interests ?? [],
        device_ownership: payload.device_ownership,
        ev_ownership: payload.ev_ownership,
        sustainability: payload.sustainability ?? null,
        sensor_data: payload.sensor_data ?? {},
      }])
      .select()
      .single();

    if (error) {
      console.error("submit-data-submission insert error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Unable to save data submission. Please check your input and try again.",
          code: "INSERT_FAILED"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ submission: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e: any) {
    console.error("submit-data-submission error:", e);
    return new Response(
      JSON.stringify({ 
        error: "Unable to process data submission. Please try again.",
        code: "SUBMISSION_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
