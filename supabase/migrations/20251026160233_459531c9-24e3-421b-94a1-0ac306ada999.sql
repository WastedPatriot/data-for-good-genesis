
-- Simpler automation: create an RPC function that triggers both processes
CREATE OR REPLACE FUNCTION run_automation_cycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  pending_count INTEGER;
  curated_count INTEGER;
BEGIN
  -- Count items
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION run_automation_cycle() TO authenticated;
