import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Validate x-ingest-secret header
    const ingestSecret = req.headers.get("x-ingest-secret");
    if (ingestSecret !== Deno.env.get("INGEST_SECRET")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const formData = await req.formData();
    const dataset_id = formData.get("dataset_id") as string;
    const filename = formData.get("filename") as string;
    const format = formData.get("format") as string;
    const file = formData.get("file") as File;

    if (!dataset_id || !filename || !format || !file) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Upload to Supabase Storage
    const storagePath = `datasets/${dataset_id}/${filename}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from("dataset-files")
      .upload(storagePath, file, {
        contentType: format === "csv" ? "text/csv" : 
                     format === "jsonl" ? "application/jsonl" :
                     format === "parquet" ? "application/parquet" :
                     format === "sqlite" ? "application/x-sqlite3" : "application/octet-stream",
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from("dataset-files")
      .getPublicUrl(storagePath);

    // Insert record to dataset_files table
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from("dataset_files")
      .insert({
        dataset_id,
        file_path: storagePath,
        format,
        file_size_bytes: file.size,
        download_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Log the upload
    await supabaseAdmin.from("audit_logs").insert({
      action: "dataset_file_uploaded",
      resource_type: "dataset_files",
      resource_id: fileRecord.id,
      severity: "info",
      details: {
        dataset_id,
        filename,
        format,
        size_bytes: file.size
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        file: fileRecord,
        download_url: urlData.publicUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("upload-dataset-file error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});