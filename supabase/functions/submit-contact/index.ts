import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Rate limiting (in-memory, resets on function cold start)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 20;

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
const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  submissionType: z.enum(['general', 'partnership', 'support', 'data', 'organization']),
  organization: z.string().max(200).optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    const rawData = await req.json();

    console.log("Contact submission received:", { 
      email: rawData.email, 
      submissionType: rawData.submissionType 
    });

    // Validate input with zod
    const validated = contactSchema.parse(rawData);
    const { name, email, organization, subject, message, submissionType } = validated;

    // Store in database
    const { data, error: dbError } = await supabaseClient
      .from("contact_submissions")
      .insert({
        name,
        email,
        organization,
        subject,
        message,
        submission_type: submissionType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Contact submission saved:", data.id);

    // Send confirmation email to user
    try {
      await resend.emails.send({
        from: "Data for Earth <noreply@dataforearth.org>",
        to: [email],
        subject: "We received your message - Data for Earth",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Thank You for Contacting Us!</h1>
            <p>Hi ${name},</p>
            <p>We've received your message and will get back to you as soon as possible.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Your Message Details</h2>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Type:</strong> ${submissionType}</p>
              ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ''}
            </div>

            <p>Our team typically responds within 24-48 hours.</p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              The Data for Earth Team
            </p>
          </div>
        `,
      });

      console.log("Confirmation email sent to:", email);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "hello@dataforearth.org";
    try {
      await resend.emails.send({
        from: "Data for Earth <noreply@dataforearth.org>",
        to: [adminEmail],
        replyTo: [email],
        subject: `New ${submissionType} inquiry from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">New Contact Form Submission</h1>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Contact Details</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ''}
              <p><strong>Type:</strong> ${submissionType}</p>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Message</h2>
              <p><strong>Subject:</strong> ${subject}</p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>

            <p><strong>Submission ID:</strong> ${data.id}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Reply directly to this email to respond to ${name}
            </p>
          </div>
        `,
      });

      console.log("Admin notification sent to:", adminEmail);
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
      // Don't fail the request if admin email fails
    }

    // Log audit
    await supabaseClient
      .from("audit_logs")
      .insert({
        action: "contact_submission",
        resource_type: "contact",
        resource_id: data.id,
        details: {
          submission_type: submissionType,
          has_organization: !!organization
        },
        severity: "info"
      });

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in submit-contact:", error);
    
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data. Please check your submission.",
          code: "VALIDATION_ERROR",
          details: error.errors
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Unable to process your submission. Please try again later.",
        code: "SUBMISSION_FAILED"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
