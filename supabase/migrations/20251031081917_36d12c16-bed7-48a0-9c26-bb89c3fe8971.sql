-- Add contributor tracking and market value calculation
ALTER TABLE review_queue 
  ADD COLUMN IF NOT EXISTS contributor_email text,
  ADD COLUMN IF NOT EXISTS estimated_market_value numeric DEFAULT 0;

ALTER TABLE curated_pool
  ADD COLUMN IF NOT EXISTS estimated_dataset_price numeric DEFAULT 0;

-- Create a view to calculate contributor value
CREATE OR REPLACE VIEW contributor_value_summary AS
SELECT 
  rq.contributor_email,
  COUNT(DISTINCT rq.id) as total_contributions,
  COUNT(DISTINCT CASE WHEN rq.status = 'approved' THEN rq.id END) as approved_contributions,
  COUNT(DISTINCT cp.id) as curated_items,
  SUM(COALESCE(cp.estimated_dataset_price, 0)) as total_estimated_value,
  AVG(COALESCE(rq.confidence_score, 0)) as avg_quality_score,
  MAX(rq.created_at) as last_contribution_date
FROM review_queue rq
LEFT JOIN curated_pool cp ON cp.review_queue_id = rq.id
WHERE rq.contributor_email IS NOT NULL
GROUP BY rq.contributor_email;

COMMENT ON VIEW contributor_value_summary IS 'Shows real-time market value and statistics for each contributor';

-- Grant access to authenticated users to see their own value
GRANT SELECT ON contributor_value_summary TO authenticated;