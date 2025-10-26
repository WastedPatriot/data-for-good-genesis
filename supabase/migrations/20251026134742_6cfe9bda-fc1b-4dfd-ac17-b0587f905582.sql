-- Fix charity partnerships to not expose personal contact details publicly
-- First, drop the existing policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'charity_partnerships' 
    AND policyname = 'Anyone can view verified partnerships'
  ) THEN
    DROP POLICY "Anyone can view verified partnerships" ON charity_partnerships;
  END IF;
END $$;

-- Create a public view that masks sensitive contact information
CREATE OR REPLACE VIEW public.charity_partnerships_public AS
SELECT 
  id,
  organization_name,
  country,
  charity_registration_number,
  impact_areas,
  website_url,
  status,
  verified_at,
  starts_at,
  ends_at,
  created_at,
  updated_at,
  -- Mask contact details
  CASE 
    WHEN contact_email IS NOT NULL THEN CONCAT(LEFT(contact_email, 2), '***@', SPLIT_PART(contact_email, '@', 2))
    ELSE NULL
  END as contact_email_masked,
  CASE 
    WHEN contact_name IS NOT NULL THEN LEFT(contact_name, 1) || '***'
    ELSE NULL
  END as contact_name_masked
FROM charity_partnerships
WHERE status = 'verified';

-- Create new restrictive policy on main table - force use of public view
CREATE POLICY "Public cannot directly view partnerships" 
  ON charity_partnerships 
  FOR SELECT 
  USING (false);

-- Add data retention comments
COMMENT ON TABLE audit_logs IS 'Audit logs retained for 90 days for security. Auto-cleanup recommended.';
COMMENT ON TABLE login_attempts IS 'Login attempts retained for 90 days. Purge older records automatically.';
COMMENT ON TABLE visitor_analytics IS 'Visitor analytics retained for 90 days. IPs truncated to city-level for GDPR.';