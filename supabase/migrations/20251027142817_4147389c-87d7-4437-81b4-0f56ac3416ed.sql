-- Add processed column to extension_activity table
ALTER TABLE extension_activity ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS idx_extension_activity_processed ON extension_activity(processed) WHERE processed = FALSE;

-- Create a function to periodically process extension data
CREATE OR REPLACE FUNCTION process_extension_data_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to process extension data
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/extension-handoff-for-review',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('automated', true)
  );
END;
$$;