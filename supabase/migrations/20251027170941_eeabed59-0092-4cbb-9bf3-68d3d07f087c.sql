-- Add subscription tracking to organization_profiles
ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_tier text,
ADD COLUMN IF NOT EXISTS subscription_product_id text,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS monthly_downloads_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_downloads_limit integer,
ADD COLUMN IF NOT EXISTS subscription_renewed_at timestamp with time zone;

-- Add index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_org_profiles_subscription ON organization_profiles(subscription_status, subscription_product_id);

-- Create function to reset monthly download counters (run monthly via cron or automation)
CREATE OR REPLACE FUNCTION reset_monthly_downloads()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE organization_profiles
  SET monthly_downloads_used = 0,
      subscription_renewed_at = now()
  WHERE subscription_status = 'active';
END;
$$;

COMMENT ON COLUMN organization_profiles.subscription_status IS 'Subscription status: none, active, canceled, past_due';
COMMENT ON COLUMN organization_profiles.subscription_tier IS 'Subscription tier: starter, professional, enterprise';
COMMENT ON COLUMN organization_profiles.monthly_downloads_used IS 'Number of datasets downloaded this billing period';
COMMENT ON COLUMN organization_profiles.monthly_downloads_limit IS 'Maximum downloads allowed per month (null = unlimited for enterprise)';
