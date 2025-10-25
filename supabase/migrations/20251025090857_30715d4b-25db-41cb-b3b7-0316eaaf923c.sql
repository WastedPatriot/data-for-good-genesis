-- Multi-domain expansion for DataForEarth production system (FIXED)

-- Add domain, region, sector to curated_pool
ALTER TABLE curated_pool
ADD COLUMN IF NOT EXISTS domain text CHECK(domain IN (
  'climate','esg','policy','energy','mobility','consumer','market','housing','agriculture','health','supply_chain','macro'
)),
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS sector text;

-- Add domain to datasets
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS domain text CHECK(domain IN (
  'climate','esg','policy','energy','mobility','consumer','market','housing','agriculture','health','supply_chain','macro'
)),
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS sector text;

-- Update release_policy for per-domain throttling
ALTER TABLE release_policy
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS max_releases_per_week_per_domain integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS max_external_releases_per_month_per_domain integer DEFAULT 2;

-- Create public impact view with domain diversification (FIXED - no nested aggregates)
CREATE OR REPLACE VIEW public.v_public_impact AS
SELECT
  COUNT(DISTINCT ds.id) AS total_datasets,
  COALESCE(SUM(p.amount_paid), 0) AS total_revenue,
  COUNT(DISTINCT p.user_id) AS total_contributors,
  COUNT(DISTINCT ds.domain) AS active_domains,
  (SELECT COUNT(*) FROM curated_pool WHERE confidence_score >= 0.85) AS high_quality_records
FROM datasets ds
LEFT JOIN purchases p ON p.dataset_id = ds.id AND p.status = 'completed'
WHERE ds.active = true;

-- Enable RLS on view (allow anonymous read)
GRANT SELECT ON public.v_public_impact TO anon;

-- Add domain tracking to audit logs
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS domain text;

-- Create dataset export metadata table
CREATE TABLE IF NOT EXISTS dataset_export_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  format text NOT NULL CHECK(format IN ('csv', 'jsonl', 'parquet', 'sqlite')),
  file_size_bytes bigint,
  checksum_sha256 text,
  export_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on export metadata
ALTER TABLE dataset_export_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage export metadata"
  ON dataset_export_metadata
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their purchased dataset exports"
  ON dataset_export_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.dataset_id = dataset_export_metadata.dataset_id
        AND purchases.user_id = auth.uid()
        AND purchases.status = 'completed'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_curated_pool_domain ON curated_pool(domain);
CREATE INDEX IF NOT EXISTS idx_curated_pool_region ON curated_pool(region);
CREATE INDEX IF NOT EXISTS idx_curated_pool_sector ON curated_pool(sector);
CREATE INDEX IF NOT EXISTS idx_datasets_domain ON datasets(domain);
CREATE INDEX IF NOT EXISTS idx_dataset_export_metadata_dataset_id ON dataset_export_metadata(dataset_id);