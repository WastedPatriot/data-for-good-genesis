-- Fix v_public_impact view to show real contributor count
DROP VIEW IF EXISTS v_public_impact;

CREATE VIEW v_public_impact AS
SELECT 
  (SELECT COUNT(DISTINCT id) FROM data_submissions) AS total_contributors,
  (SELECT COUNT(*) FROM datasets WHERE active = true) AS total_datasets,
  (SELECT COALESCE(SUM(amount_paid), 0) FROM purchases WHERE status = 'completed') AS total_revenue,
  (SELECT COUNT(DISTINCT domain) FROM datasets WHERE active = true) AS active_domains,
  (SELECT COUNT(*) FROM curated_pool WHERE confidence_score >= 0.85) AS high_quality_records;