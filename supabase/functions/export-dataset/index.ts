import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dataset_id, format } = await req.json();

    if (!dataset_id || !format) {
      return new Response(
        JSON.stringify({ error: "Missing dataset_id or format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate format
    const validFormats = ["csv", "jsonl", "parquet", "sqlite"];
    if (!validFormats.includes(format)) {
      return new Response(
        JSON.stringify({ error: `Invalid format. Must be one of: ${validFormats.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch dataset metadata
    const { data: dataset, error: datasetError } = await supabase
      .from("datasets")
      .select("*")
      .eq("id", dataset_id)
      .single();

    if (datasetError || !dataset) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch curated data for this dataset (assuming sample_data contains references)
    // In production, you would fetch from dataset_files or a join table
    const curatedData = dataset.sample_data || [];

    let exportedContent: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case "csv":
        exportedContent = convertToCSV(curatedData);
        contentType = "text/csv";
        filename = `${dataset.name.replace(/\s+/g, "_")}.csv`;
        break;

      case "jsonl":
        exportedContent = convertToJSONL(curatedData);
        contentType = "application/x-ndjson";
        filename = `${dataset.name.replace(/\s+/g, "_")}.jsonl`;
        break;

      case "parquet":
        // For Parquet, we'd need a Deno-compatible Parquet library or call Python
        // For now, return placeholder message
        return new Response(
          JSON.stringify({ 
            error: "Parquet export requires external tooling. Use Python exporter.",
            guide: "See HARVESTER_AUTOMATION_GUIDE.md for Python export setup"
          }),
          { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "sqlite":
        // SQLite export requires native bindings
        return new Response(
          JSON.stringify({ 
            error: "SQLite export requires external tooling. Use Python exporter.",
            guide: "See HARVESTER_AUTOMATION_GUIDE.md for Python export setup"
          }),
          { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Store export metadata
    const { error: metadataError } = await supabase
      .from("dataset_export_metadata")
      .insert({
        dataset_id,
        format,
        file_size_bytes: new Blob([exportedContent]).size,
        export_metadata: { exported_at: new Date().toISOString(), record_count: curatedData.length }
      });

    if (metadataError) {
      console.error("Failed to store export metadata:", metadataError);
    }

    return new Response(exportedContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

function convertToJSONL(data: any[]): string {
  return data.map(record => JSON.stringify(record)).join('\n');
}
