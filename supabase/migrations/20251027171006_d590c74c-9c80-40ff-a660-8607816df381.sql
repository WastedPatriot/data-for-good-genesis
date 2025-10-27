-- Fix search_path for reset_monthly_downloads function
CREATE OR REPLACE FUNCTION reset_monthly_downloads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organization_profiles
  SET monthly_downloads_used = 0,
      subscription_renewed_at = now()
  WHERE subscription_status = 'active';
END;
$$;