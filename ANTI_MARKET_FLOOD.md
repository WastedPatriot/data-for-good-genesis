# Anti-Market Flood - Throttle & Scarcity Strategy

## Purpose
Prevent oversupply of datasets that would:
- Devalue premium data
- Flood external marketplaces
- Reduce perceived scarcity
- Lower average prices

## Throttle Mechanisms

### 1. On-Site Release Limits
**Default**: 2 datasets/week per domain
**Enforcement**: `release_policy.max_datasets_per_week`

```sql
SELECT COUNT(*) FROM datasets
WHERE domain = 'climate'
  AND source_channel = 'on_site'
  AND created_at > now() - interval '7 days';
```

If count >= limit → block new dataset build

### 2. External Marketplace Limits
**Default**: 2 releases/month per domain
**Enforcement**: `release_policy.max_external_releases_per_month_per_domain`

```sql
SELECT COUNT(*) FROM datasets
WHERE domain = 'mobility'
  AND source_channel IN ('huggingface', 'kaggle', 'github', 'dataworld')
  AND created_at > now() - interval '30 days';
```

### 3. Minimum Days Between Releases
**Default**: 7 days
**Enforcement**: `release_policy.min_days_between_releases`

```sql
SELECT MAX(created_at) FROM datasets
WHERE domain = 'esg';
```

If `now() - max_created_at < min_days_between_releases` → block

## Burst Mode

**Override Conditions**:
- Admin manually enables: `burst_mode_enabled = true`
- Justification required: `burst_reason`
- Duration: 1 release cycle (7 days)
- Auto-disable after cycle

**Use Cases**:
- Breaking news (e.g., new climate treaty)
- High-demand spike detected by Trend Engine
- Partner contract requires immediate delivery

**Edge Function**: `/functions/v1/inventory-throttle`
```typescript
if (burstMode && burst_activated_at > now() - interval '7 days') {
  // Allow release despite throttle
  console.log("Burst mode active:", burst_reason);
  return { throttled: false };
}
```

## Limited Supply Flagging

**Criteria**:
- `batch_number` assigned sequentially
- `limited_supply` count (e.g., 50 downloads max)
- UI badge: "Limited Edition - Batch #42"

**Marketplace Copy**:
> "Only 50 copies available. This dataset will not be re-released in this configuration."

## NDA-Grade Enterprise Protection

**Enterprise Tier** datasets:
- `enterprise_grade = true`
- Minimum price: $500
- Private download URLs (presigned S3, 1-hour expiry)
- No external marketplace publish
- Watermarked (buyer_id embedded in metadata)

**RLS Policy**:
```sql
CREATE POLICY "Only purchasers can access enterprise files"
ON dataset_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.dataset_id = dataset_files.dataset_id
      AND purchases.user_id = auth.uid()
      AND purchases.status = 'completed'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
```

## Scarcity Messaging

**UI Warnings**:
- "⚠️ Nearing weekly release limit (1 of 2 used)"
- "🔒 Domain throttled until {next_allowed_date}"
- "🚀 Burst mode active: {burst_reason}"

**Admin Dashboard**:
- `/admin/release-policy` shows:
  - Current week usage by domain
  - Days until next allowed release
  - Burst mode status
  - Recommended actions (wait vs burst)

## Monitoring & Alerts

**Edge Function Logs**:
```
[THROTTLE] Blocked dataset build: domain=market, reason=weekly_limit_reached
[BURST] Allowed dataset build: domain=climate, reason=COP30 treaty announcement
```

**Audit Trail**:
```sql
INSERT INTO audit_logs (action, resource_type, details)
VALUES ('dataset_build_blocked', 'datasets', jsonb_build_object('domain', 'market', 'reason', 'throttle'));
```

## Pricing Ladder

**Dynamic Pricing**:
- Domain with 1 release this month: +10% price
- Domain with 0 releases: +20% price (scarcity premium)
- Domain with >5 releases: -15% price (clearance)

**AI Suggestion**:
> "Climate domain has released only 1 dataset this month. Consider +15% premium pricing to maximize revenue."
