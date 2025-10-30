-- Fix security definer view issue detected by linter
-- Ensure charity_partnerships_public view uses security_invoker = true
-- This makes the view respect the querying user's RLS policies, not the view creator's

-- Drop existing view if it exists (in any form)
DROP VIEW IF EXISTS public.charity_partnerships_public CASCADE;

-- Recreate with explicit security_invoker = true
-- This ensures the view runs with the permissions of the user querying it
CREATE VIEW public.charity_partnerships_public
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
  -- Mask sensitive PII fields
  CASE 
    WHEN contact_name IS NOT NULL THEN 
      CONCAT(LEFT(contact_name, 1), REPEAT('*', GREATEST(LENGTH(contact_name) - 1, 3)))
    ELSE NULL 
  END as contact_name_masked,
  CASE 
    WHEN contact_email IS NOT NULL THEN 
      CONCAT(
        LEFT(SPLIT_PART(contact_email, '@', 1), 2), 
        '***@', 
        SPLIT_PART(contact_email, '@', 2)
      )
    ELSE NULL 
  END as contact_email_masked
FROM public.charity_partnerships
WHERE status = 'verified';

-- Add comment explaining security model
COMMENT ON VIEW public.charity_partnerships_public IS 'Public view of verified charity partnerships with masked contact information. Uses security_invoker=true to respect viewer RLS policies, not view creator permissions. Only shows verified partnerships with PII fields masked for privacy.';

-- Grant appropriate permissions
GRANT SELECT ON public.charity_partnerships_public TO anon, authenticated;