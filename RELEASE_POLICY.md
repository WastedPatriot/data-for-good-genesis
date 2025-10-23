# Release Policy & Throttling

## Overview

DataForEarth implements strategic release throttling to maintain marketplace quality, prevent market saturation, and enable premium timing for high-value datasets.

## Release Channels

### 1. On-Site Marketplace (`on_site`)
- **Destination**: DataForEarth.com marketplace
- **Visibility**: All authenticated users
- **Use Case**: User-contributed data, general eco datasets
- **Quality**: Minimum silver tier

### 2. External Channels (`external`)
- **Destination**: External data marketplaces, B2B contracts
- **Visibility**: External partners, enterprise clients
- **Use Case**: Scraped/aggregated data, enterprise packs
- **Quality**: Minimum gold tier

## Throttle Configuration

### Table: `release_policy`

Each channel has independent throttle settings:

| Column | Type | Purpose | Default |
|--------|------|---------|---------|
| `channel` | text | `on_site` or `external` | - |
| `min_days_between_releases` | int | Minimum days between dataset releases | 7 |
| `max_datasets_per_week` | int | Maximum releases in rolling 7-day window | 2 |
| `min_confidence` | numeric | Minimum confidence score (0-1) | 0.7 |
| `min_quality_tier` | text | bronze/silver/gold/platinum | silver |
| `last_release_at` | timestamptz | Timestamp of last release | null |

### Throttle Logic

**Function**: `/functions/v1/inventory-throttle`

Checks before allowing dataset publication:

1. **Days Check**: 
   ```
   days_since_last_release >= min_days_between_releases
   ```

2. **Weekly Limit Check**:
   ```sql
   SELECT COUNT(*) FROM datasets 
   WHERE source_channel = :channel 
   AND created_at >= NOW() - INTERVAL '7 days'
   ```
   Result must be < `max_datasets_per_week`

3. **Quality Check**:
   - Average confidence score >= `min_confidence`
   - All items >= `min_quality_tier`

4. **Inventory Check**:
   - Sufficient items in `curated_pool` for requested category/tags
   - Recommended: 50+ items for robust dataset

## Burst Mode

### Purpose
Override throttles for strategic releases:
- **Trending Topics**: Ride viral waves (e.g., climate summit news)
- **Conference Timing**: Release datasets aligned with industry events
- **External Demand Spikes**: Respond to partner requests
- **Competitive Response**: Counter competitor launches

### Activation

**UI**: `/admin/release-policy`

**Process**:
1. Admin enables burst mode for a channel
2. Must provide `burst_reason` (logged for audit)
3. Sets `burst_activated_at` timestamp
4. Next dataset build bypasses throttles
5. Burst mode **auto-disables** after one successful release

**Database Update**:
```sql
UPDATE release_policy
SET burst_mode_enabled = true,
    burst_reason = 'Climate summit trending - release carbon dataset',
    burst_activated_at = NOW()
WHERE channel = 'on_site';
```

### Burst Mode Safeguards

- **Single Use**: Automatically disabled after one publish
- **Audit Trail**: Reason logged in `release_policy` table
- **Admin Only**: Requires admin role to enable
- **Notification**: Webhook sent to machine agent on activation

## Release Cadence Recommendations

### On-Site Marketplace
- **Frequency**: 1-2 datasets per week
- **Timing**: Tuesday/Thursday mornings (peak traffic)
- **Volume**: 50-200 records per dataset
- **Quality**: Minimum silver tier, mix of gold/platinum for variety

### External Channels
- **Frequency**: 1 dataset per 10-14 days
- **Timing**: Align with partner contracts
- **Volume**: 100-500 records per dataset
- **Quality**: Minimum gold tier, focus on enterprise-grade

## Historical Release Tracking

Query recent releases:
```sql
SELECT 
  name,
  source_channel,
  batch_number,
  size_mb,
  created_at,
  enterprise_grade,
  limited_supply
FROM datasets
WHERE source_channel = 'on_site'
ORDER BY created_at DESC
LIMIT 10;
```

View policy history:
```sql
SELECT * FROM release_policy 
ORDER BY updated_at DESC;
```

## Admin Controls

**Dashboard**: `/admin/release-policy`

**Features**:
- Edit throttle parameters per channel
- View last release timestamp
- Enable/disable burst mode with reason
- View historical release cadence chart
- Trending signals indicator (suggests when to burst)

## Webhook Notifications

On every release, webhook sent to machine agent:
```json
{
  "event": "dataset_published",
  "dataset_id": "uuid",
  "channel": "on_site",
  "name": "Carbon Offset Projects Q4 2024",
  "batch_number": 42,
  "confidence_avg": 0.87,
  "quality_breakdown": {
    "platinum": 15,
    "gold": 60,
    "silver": 25
  },
  "released_at": "2025-10-23T14:30:00Z"
}
```

## Future Enhancements

Planned features:
- **Smart Scheduling**: AI-suggested release times based on traffic
- **A/B Testing**: Release variations for pricing optimization
- **Pre-Release Teasers**: Sneak peek for premium subscribers
- **Embargo Dates**: Schedule releases in advance

---

**Last Updated**: 2025-10-23
**Maintained by**: DataForEarth Platform Team
