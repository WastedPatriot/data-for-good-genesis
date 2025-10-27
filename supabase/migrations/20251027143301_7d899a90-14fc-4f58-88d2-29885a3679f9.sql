-- Fix the review_queue source_type constraint to allow new data sources
ALTER TABLE review_queue DROP CONSTRAINT IF EXISTS review_queue_source_type_check;

-- Add updated constraint with all valid source types
ALTER TABLE review_queue ADD CONSTRAINT review_queue_source_type_check 
CHECK (source_type IN (
  'user_contribution',
  'scraper_batch',
  'manual_entry',
  'api_import',
  'browser_extension',
  'visitor_analytics',
  'external_scraper'
));