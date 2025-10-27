-- Fix SECURITY DEFINER views by changing to SECURITY INVOKER
-- This ensures views respect the caller's RLS policies instead of bypassing them

-- Recreate charity_partnerships_public view as SECURITY INVOKER
DROP VIEW IF EXISTS charity_partnerships_public;

CREATE VIEW charity_partnerships_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  organization_name,
  country,
  charity_registration_number,
  website_url,
  impact_areas,
  status,
  verified_at,
  created_at,
  updated_at,
  starts_at,
  ends_at,
  CASE 
    WHEN contact_name IS NOT NULL THEN CONCAT(LEFT(contact_name, 1), '***')
    ELSE NULL 
  END as contact_name_masked,
  CASE 
    WHEN contact_email IS NOT NULL THEN CONCAT(LEFT(SPLIT_PART(contact_email, '@', 1), 2), '***@', SPLIT_PART(contact_email, '@', 2))
    ELSE NULL 
  END as contact_email_masked
FROM charity_partnerships;

-- Add fixed search_path to SECURITY DEFINER functions
-- This prevents search_path hijacking attacks

CREATE OR REPLACE FUNCTION public.trigger_ai_curation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM review_queue
  WHERE status = 'pending'
  LIMIT 1;

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

CREATE OR REPLACE FUNCTION public.trigger_dataset_builder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  curated_count INTEGER;
  last_build TIMESTAMP;
BEGIN
  SELECT COUNT(*) INTO curated_count
  FROM curated_pool
  WHERE usage_count = 0;

  SELECT MAX(created_at) INTO last_build
  FROM datasets;

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

CREATE OR REPLACE FUNCTION public.auto_curate_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM trigger_ai_curation();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_build_on_curated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM trigger_dataset_builder();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_automation_cycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  pending_count INTEGER;
  curated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count FROM review_queue WHERE status = 'pending';
  SELECT COUNT(*) INTO curated_count FROM curated_pool WHERE usage_count = 0;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Automation status',
    'pending_items', pending_count,
    'curated_items', curated_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;