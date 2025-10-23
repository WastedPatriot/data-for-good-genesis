import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-signature",
};

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 50;

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

// Validation schema
const submissionSchema = z.object({
  email: z.string().email().max(255).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  age_range: z.string().max(50).optional(),
  interests: z.array(z.string().max(100)).max(20).optional(),
  device_ownership: z.string().max(100).optional().nullable(),
  ev_ownership: z.string().max(100).optional().nullable(),
  sustainability: z.string().max(500).optional().nullable(),
  sensor_data: z.record(z.any()).optional()
});

/**
 * External Ingest Endpoint
 * 
 * Accepts arrays of normalized scraper payloads and inserts into data_submissions.
 * Requires HMAC signature authentication (same rules as /ingest-dataset).
 * Immediately triggers AI processing for each submission.
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
    console.log("[EXTERNAL-INGEST] Request received");

    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Verify HMAC signature
    const ingestSecret = Deno.env.get("INGEST_SECRET");
    if (!ingestSecret) {
      throw new Error("INGEST_SECRET not configured");
    }

    const signature = req.headers.get("X-Ingest-Signature");
    if (!signature) {
      throw new Error("Missing X-Ingest-Signature header");
    }

    const body = await req.text();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ingestSecret);
    const messageData = encoder.encode(body);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSignature) {
      console.error("[EXTERNAL-INGEST] Invalid signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    console.log("[EXTERNAL-INGEST] Signature verified");

    // Parse payload
    const payload = JSON.parse(body);
    const submissions = payload.submissions || [];

    if (!Array.isArray(submissions) || submissions.length === 0) {
      throw new Error("Invalid or empty submissions array");
    }

    console.log(`[EXTERNAL-INGEST] Processing ${submissions.length} submissions`);

    // Insert into data_submissions
    const insertResults = [];
    const processingPromises = [];

    for (const submission of submissions) {
      // Validate with zod
      let validatedSubmission;
      try {
        validatedSubmission = submissionSchema.parse(submission);
      } catch (validationError) {
        console.warn("[EXTERNAL-INGEST] Skipping invalid submission:", validationError);
        insertResults.push({ success: false, error: "VALIDATION_FAILED" });
        continue;
      }

      // Additional check for scraper data
      if (!validatedSubmission.age_range && !validatedSubmission.sensor_data?.scraper_source) {
        console.warn("[EXTERNAL-INGEST] Skipping submission (missing required fields)");
        insertResults.push({ success: false, error: "MISSING_REQUIRED_FIELDS" });
        continue;
      }

      // Insert into data_submissions
      const { data: insertedData, error: insertError } = await supabaseClient
        .from("data_submissions")
        .insert({
          email: validatedSubmission.email,
          location: validatedSubmission.location,
          age_range: validatedSubmission.age_range || "Unknown",
          interests: validatedSubmission.interests || [],
          device_ownership: validatedSubmission.device_ownership,
          ev_ownership: validatedSubmission.ev_ownership,
          sustainability: validatedSubmission.sustainability,
          sensor_data: validatedSubmission.sensor_data || {},
        })
        .select()
        .single();

      if (insertError) {
        console.error("[EXTERNAL-INGEST] Insert error:", insertError);
        insertResults.push({ success: false, error: "INSERT_FAILED" });
        continue;
      }

      console.log(`[EXTERNAL-INGEST] Inserted submission: ${insertedData.id}`);
      insertResults.push({ success: true, id: insertedData.id });

      // Trigger AI processing (non-blocking)
      const processingPromise = supabaseClient.functions.invoke("process-data-submission", {
        body: { submissionId: insertedData.id }
      }).then(({ error: processError }) => {
        if (processError) {
          console.error(`[EXTERNAL-INGEST] AI processing error for ${insertedData.id}:`, processError);
        } else {
          console.log(`[EXTERNAL-INGEST] AI processing started for ${insertedData.id}`);
        }
      }).catch((err) => {
        console.error(`[EXTERNAL-INGEST] Failed to trigger AI processing for ${insertedData.id}:`, err);
      });

      processingPromises.push(processingPromise);
    }

    // Wait for all AI processing triggers (non-critical)
    await Promise.allSettled(processingPromises);

    // Log audit
    await supabaseClient
      .from("audit_logs")
      .insert({
        action: "external_ingest",
        resource_type: "data_submission",
        details: {
          total_submissions: submissions.length,
          successful: insertResults.filter(r => r.success).length,
          failed: insertResults.filter(r => !r.success).length,
          sources: payload.sources || [],
        },
        severity: "info"
      });

    const successCount = insertResults.filter(r => r.success).length;
    const failedCount = insertResults.filter(r => !r.success).length;

    console.log(`[EXTERNAL-INGEST] Completed: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: successCount,
        failed: failedCount,
        results: insertResults
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[EXTERNAL-INGEST] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to ingest data. Please verify your request and try again.",
        code: "INGEST_FAILED"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
