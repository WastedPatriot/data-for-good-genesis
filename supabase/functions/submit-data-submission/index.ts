import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 30;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;
  
  const timestamps = rateLimitMap.get(identifier) || [];
  const recentTimestamps = timestamps.filter(t => t > hourAgo);
  
  if (recentTimestamps.length >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  recentTimestamps.push(now);
  rateLimitMap.set(identifier, recentTimestamps);
  return true;
}

// Input validation schema
const dataSubmissionSchema = z.object({
  email: z.string().email().max(255).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  age_range: z.string().min(1).max(50),
  interests: z.array(z.string().max(100)).max(20).optional().default([]),
  device_ownership: z.string().min(1).max(100),
  ev_ownership: z.string().min(1).max(100),
  sustainability: z.string().max(500).optional().nullable(),
  sensor_data: z.record(z.any()).optional().default({})
});

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
    // Rate limiting by IP
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ 
          error: "Too many submissions. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const rawPayload = await req.json();

    // Validate input with zod
    const payload = dataSubmissionSchema.parse(rawPayload);

    const { data, error } = await supabaseClient
      .from("data_submissions")
      .insert([{
        email: payload.email,
        location: payload.location,
        age_range: payload.age_range,
        interests: payload.interests,
        device_ownership: payload.device_ownership,
        ev_ownership: payload.ev_ownership,
        sustainability: payload.sustainability,
        sensor_data: payload.sensor_data,
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
    
    // Handle validation errors
    if (e instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid submission data. Please check your input.",
          code: "VALIDATION_ERROR",
          details: e.errors
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Unable to process data submission. Please try again.",
        code: "SUBMISSION_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
