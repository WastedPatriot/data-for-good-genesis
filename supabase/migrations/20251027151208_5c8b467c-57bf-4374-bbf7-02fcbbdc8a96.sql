-- Disable release throttling to allow flooding the market
UPDATE release_policy 
SET 
  burst_mode_enabled = true,
  min_days_between_releases = 0,
  max_datasets_per_week = 1000,
  min_confidence = 0.1,
  burst_reason = 'Market flooding enabled - unrestricted dataset publishing',
  burst_activated_at = NOW()
WHERE true;

-- If no policies exist, create permissive ones
INSERT INTO release_policy (channel, min_days_between_releases, max_datasets_per_week, min_confidence, min_quality_tier, burst_mode_enabled, burst_reason, burst_activated_at)
VALUES 
  ('on_site', 0, 1000, 0.1, 'bronze', true, 'Market flooding enabled', NOW()),
  ('external', 0, 1000, 0.1, 'bronze', true, 'Market flooding enabled', NOW())
ON CONFLICT (channel) DO UPDATE SET
  min_days_between_releases = 0,
  max_datasets_per_week = 1000,
  min_confidence = 0.1,
  min_quality_tier = 'bronze',
  burst_mode_enabled = true,
  burst_reason = 'Market flooding enabled',
  burst_activated_at = NOW();