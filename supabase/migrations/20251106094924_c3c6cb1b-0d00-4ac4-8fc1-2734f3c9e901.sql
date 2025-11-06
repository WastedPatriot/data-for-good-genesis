-- Fix Security Definer View: v_public_impact
-- Add security_invoker = true to ensure the view respects the querying user's RLS policies

DROP VIEW IF EXISTS public.v_public_impact CASCADE;

CREATE VIEW public.v_public_impact
WITH (security_invoker = true) AS
SELECT 
  (SELECT COUNT(DISTINCT id) FROM data_submissions) AS total_contributors,
  (SELECT COUNT(*) FROM datasets WHERE active = true) AS total_datasets,
  (SELECT COALESCE(SUM(amount_paid), 0) FROM purchases WHERE status = 'completed') AS total_revenue,
  (SELECT COUNT(DISTINCT domain) FROM datasets WHERE active = true) AS active_domains,
  (SELECT COUNT(*) FROM curated_pool WHERE confidence_score >= 0.85) AS high_quality_records;