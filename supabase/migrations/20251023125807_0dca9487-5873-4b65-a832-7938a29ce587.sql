-- =====================================================
-- MODERATION + PUBLISHING PIPELINE DATABASE SCHEMA
-- =====================================================

-- Table: review_queue
-- Stores all data submissions awaiting curation
CREATE TABLE IF NOT EXISTS public.review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Source tracking
  source_type text NOT NULL CHECK (source_type IN ('user_contribution', 'external_scraper', 'aggregated')),
  source_reference text NOT NULL, -- submission_id or scraper_batch_id
  
  -- Content
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  
  -- Metadata
  category text,
  tags text[],
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  quality_tier text CHECK (quality_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Provenance & deduplication
  provenance_hash text UNIQUE NOT NULL,
  duplicate_of uuid REFERENCES public.review_queue(id),
  similar_items jsonb DEFAULT '[]'::jsonb,
  
  -- Review status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  
  -- Publishing
  published_to text[] DEFAULT '{}',
  publish_decision text CHECK (publish_decision IN (NULL, 'on_site_only', 'external_only', 'both', 'never'))
);

CREATE INDEX idx_review_queue_status ON public.review_queue(status);
CREATE INDEX idx_review_queue_source ON public.review_queue(source_type);
CREATE INDEX idx_review_queue_quality ON public.review_queue(quality_tier);
CREATE INDEX idx_review_queue_confidence ON public.review_queue(confidence_score DESC);
CREATE INDEX idx_review_queue_provenance ON public.review_queue(provenance_hash);

-- Table: curated_pool
-- Approved data ready for dataset building
CREATE TABLE IF NOT EXISTS public.curated_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_queue_id uuid NOT NULL REFERENCES public.review_queue(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Content
  curated_payload jsonb NOT NULL,
  
  -- Metadata
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  confidence_score numeric NOT NULL,
  quality_tier text NOT NULL,
  
  -- Usage tracking
  used_in_datasets uuid[] DEFAULT '{}',
  usage_count int NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  
  -- Enterprise flags
  enterprise_grade boolean DEFAULT false,
  limited_supply int,
  batch_number int
);

CREATE INDEX idx_curated_pool_category ON public.curated_pool(category);
CREATE INDEX idx_curated_pool_quality ON public.curated_pool(quality_tier);
CREATE INDEX idx_curated_pool_unused ON public.curated_pool(usage_count) WHERE usage_count = 0;
CREATE INDEX idx_curated_pool_enterprise ON public.curated_pool(enterprise_grade) WHERE enterprise_grade = true;

-- Table: release_policy
-- Controls throttling and burst mode
CREATE TABLE IF NOT EXISTS public.release_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Channel
  channel text NOT NULL CHECK (channel IN ('on_site', 'external')),
  
  -- Throttling rules
  min_days_between_releases int NOT NULL DEFAULT 7,
  max_datasets_per_week int NOT NULL DEFAULT 2,
  min_confidence numeric NOT NULL DEFAULT 0.7,
  min_quality_tier text NOT NULL DEFAULT 'silver',
  
  -- Burst mode
  burst_mode_enabled boolean DEFAULT false,
  burst_reason text,
  burst_activated_at timestamptz,
  
  -- Tracking
  last_release_at timestamptz,
  
  UNIQUE(channel)
);

-- Insert default policies
INSERT INTO public.release_policy (channel, min_days_between_releases, max_datasets_per_week, min_confidence, min_quality_tier)
VALUES 
  ('on_site', 7, 2, 0.7, 'silver'),
  ('external', 14, 1, 0.85, 'gold')
ON CONFLICT (channel) DO NOTHING;

-- Table: agent_events
-- Webhook callbacks from machine agent
CREATE TABLE IF NOT EXISTS public.agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  event_type text NOT NULL CHECK (event_type IN ('dataset_published', 'badge_codes_low', 'scraper_health', 'alert_anomaly', 'review_approved', 'review_rejected')),
  payload jsonb NOT NULL,
  
  -- Processing
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text
);

CREATE INDEX idx_agent_events_type ON public.agent_events(event_type);
CREATE INDEX idx_agent_events_unprocessed ON public.agent_events(processed) WHERE processed = false;

-- Table: dataset_files
-- Multi-format export tracking
CREATE TABLE IF NOT EXISTS public.dataset_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  format text NOT NULL CHECK (format IN ('csv', 'jsonl', 'parquet', 'avro', 'sqlite')),
  file_path text NOT NULL,
  file_size_bytes bigint,
  download_url text,
  presigned_url_expires_at timestamptz,
  
  checksum_sha256 text
);

CREATE INDEX idx_dataset_files_dataset ON public.dataset_files(dataset_id);
CREATE INDEX idx_dataset_files_format ON public.dataset_files(format);

-- Add columns to datasets table
ALTER TABLE public.datasets 
  ADD COLUMN IF NOT EXISTS enterprise_grade boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS limited_supply int,
  ADD COLUMN IF NOT EXISTS batch_number int,
  ADD COLUMN IF NOT EXISTS source_channel text DEFAULT 'on_site';

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_review_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_queue_updated_at
  BEFORE UPDATE ON public.review_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_review_queue_updated_at();

CREATE TRIGGER release_policy_updated_at
  BEFORE UPDATE ON public.release_policy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_files ENABLE ROW LEVEL SECURITY;

-- review_queue policies
CREATE POLICY "Admins can view review queue"
  ON public.review_queue FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage review queue"
  ON public.review_queue FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- curated_pool policies
CREATE POLICY "Admins can view curated pool"
  ON public.curated_pool FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage curated pool"
  ON public.curated_pool FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- release_policy policies
CREATE POLICY "Admins can view release policies"
  ON public.release_policy FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage release policies"
  ON public.release_policy FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- agent_events policies
CREATE POLICY "Admins can view agent events"
  ON public.agent_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert agent events"
  ON public.agent_events FOR INSERT
  WITH CHECK (true);

-- dataset_files policies
CREATE POLICY "Anyone can view active dataset files"
  ON public.dataset_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.datasets 
    WHERE datasets.id = dataset_files.dataset_id 
    AND datasets.active = true
  ));

CREATE POLICY "Admins can manage dataset files"
  ON public.dataset_files FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));