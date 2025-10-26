
-- Create automation trigger function that calls edge functions via http
-- This will automatically process review queue items and build datasets

-- First, enable pg_net extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to auto-curate pending review items using AI
CREATE OR REPLACE FUNCTION trigger_ai_curation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  -- Count pending items
  SELECT COUNT(*) INTO pending_count
  FROM review_queue
  WHERE status = 'pending'
  LIMIT 1;

  -- If we have pending items, trigger AI curation via edge function
  IF pending_count > 0 THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/ai-curate-data',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('batchMode', true)
    );
  END IF;
END;
$$;

-- Function to auto-build datasets from curated pool
CREATE OR REPLACE FUNCTION trigger_dataset_builder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  curated_count INTEGER;
  last_build TIMESTAMP;
BEGIN
  -- Count available curated items
  SELECT COUNT(*) INTO curated_count
  FROM curated_pool
  WHERE usage_count = 0;

  -- Get last dataset creation time
  SELECT MAX(created_at) INTO last_build
  FROM datasets;

  -- Build dataset if: 
  -- 1. We have at least 10 curated items
  -- 2. No dataset built in last 2 hours (or never built)
  IF curated_count >= 10 AND (last_build IS NULL OR last_build < NOW() - INTERVAL '2 hours') THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/build-dataset-from-curated',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'category', 'sustainability',
        'useAI', true,
        'burstMode', false
      )
    );
  END IF;
END;
$$;

-- Create automation config table to store settings
CREATE TABLE IF NOT EXISTS automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE automation_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage automation config
CREATE POLICY "Admins can manage automation config"
ON automation_config
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert default automation settings
INSERT INTO automation_config (key, value) VALUES
  ('ai_curation_enabled', 'true'::jsonb),
  ('dataset_builder_enabled', 'true'::jsonb),
  ('min_curated_for_dataset', '10'::jsonb),
  ('dataset_build_interval_hours', '2'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Trigger on review_queue inserts to start AI curation
CREATE OR REPLACE FUNCTION auto_curate_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Asynchronously trigger AI curation for pending items
  IF NEW.status = 'pending' THEN
    PERFORM trigger_ai_curation();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS review_queue_auto_curate ON review_queue;
CREATE TRIGGER review_queue_auto_curate
AFTER INSERT ON review_queue
FOR EACH ROW
EXECUTE FUNCTION auto_curate_on_insert();

-- Trigger on curated_pool inserts to check if we should build dataset
CREATE OR REPLACE FUNCTION auto_build_on_curated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if we should build a dataset
  PERFORM trigger_dataset_builder();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS curated_pool_auto_build ON curated_pool;
CREATE TRIGGER curated_pool_auto_build
AFTER INSERT ON curated_pool
FOR EACH STATEMENT
EXECUTE FUNCTION auto_build_on_curated();
