# DataForEarth Logging Guide

## Overview
DataForEarth uses multiple logging systems across different components. This guide explains what logs mean, where to find them, and how to interpret them.

---

## Log Locations

### 1. Supabase Edge Function Logs
**Where**: Supabase Dashboard → Edge Functions → Select function → Logs tab
**Or**: Call edge function logs API from machine-agent GUI

**Key Functions**:
- `ingest-dataset`
- `external-ingest`
- `process-data-submission`
- `submit-data-submission`
- `create-badge-codes`
- `dataset-status`
- `download-dataset`
- `create-donation`
- `purchase-dataset`

**Log Format**:
```
[TIMESTAMP] [LEVEL] [FUNCTION-NAME] Message
```

**Example**:
```
2025-10-23T14:23:45.123Z INFO ingest-dataset Processing dataset: Urban EV Demand Q1 2025
2025-10-23T14:23:46.789Z INFO ingest-dataset Stripe product created: prod_abc123
2025-10-23T14:23:47.234Z INFO ingest-dataset Badge codes generated: 50
```

---

### 2. Supabase Audit Logs Table
**Where**: Supabase Dashboard → Table Editor → `audit_logs`
**Or**: Query via SQL editor or machine-agent GUI

**Schema**:
```sql
{
  id: uuid,
  created_at: timestamp,
  user_id: uuid | null,
  action: text,
  resource_type: text,
  resource_id: text | null,
  details: jsonb,
  severity: 'info' | 'warn' | 'error',
  ip_address: text | null,
  user_agent: text | null
}
```

**Common Actions**:
- `dataset_published` - New dataset added to marketplace
- `badge_generated` - Badge codes created
- `purchase_completed` - User purchased dataset
- `data_processed` - AI analysis completed
- `data_processing_failed` - AI analysis error
- `project_funded` - Environmental project funded
- `external_ingest` - Scraper data ingested
- `contact_submission` - Contact form submitted

**Example Query**:
```sql
-- Get all dataset publications in last 7 days
SELECT created_at, details->'name' as dataset_name, details->'price' as price
FROM audit_logs
WHERE action = 'dataset_published'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

### 3. Supabase Postgres Logs
**Where**: Supabase Dashboard → Logs → Postgres Logs
**Use**: Debug database queries, RLS policy hits, connection issues

**Key Patterns**:
- `ERROR: permission denied for table` → RLS policy blocking query
- `ERROR: duplicate key value` → Unique constraint violation
- `LOG: statement: SELECT * FROM ...` → Slow query logging

---

### 4. Machine Agent GUI Logs
**Where**: Machine-agent GUI → "Logs" tab
**Real-time**: Displays last 100 log entries

**Log Sources**:
- Automation loop status
- Badge code generation attempts
- Dataset publication triggers
- External scraper feed approvals
- Configuration changes

**Example**:
```
[2025-10-23 14:30:00] INFO: Automation loop started
[2025-10-23 14:30:05] INFO: Checking processing queue...
[2025-10-23 14:30:06] INFO: Found 12 completed records
[2025-10-23 14:30:07] INFO: Threshold reached (MIN_RECORDS_FOR_DATASET: 10)
[2025-10-23 14:30:08] INFO: Triggering dataset publication...
[2025-10-23 14:30:15] SUCCESS: Dataset published - ID: abc123
[2025-10-23 14:30:16] INFO: Generating 50 badge codes...
[2025-10-23 14:30:18] SUCCESS: Badge codes created
```

---

### 5. Scraper Module Logs
**Where**: `data-scraper-module/logs/scraper.log` (if configured)
**Or**: Console output when running `python scraper.py`

**Format**:
```
[TIMESTAMP] [LEVEL] [SCRAPER] Message
```

**Example**:
```
[2025-10-23 10:15:00] INFO [eco_sentiment] Starting scrape...
[2025-10-23 10:15:05] INFO [eco_sentiment] Fetched 15 headlines
[2025-10-23 10:15:10] INFO [eco_sentiment] Normalized 15 submissions
[2025-10-23 10:15:12] INFO [eco_sentiment] Scrape complete - Output: output/eco_sentiment_20251023.json
```

---

## Log Levels

### INFO
**Use**: Normal operation, routine events
**Examples**:
- Function started
- User logged in
- Dataset created
- Badge code claimed

**Action**: None required, informational only

---

### WARN
**Use**: Unusual but handled situations
**Examples**:
- Low badge code inventory (< 50)
- Rate limit approaching (80% of quota)
- Slow query detected (> 1s)
- Email delivery delayed

**Action**: Monitor, may require attention soon

---

### ERROR
**Use**: Operation failed, needs attention
**Examples**:
- Stripe API error
- AI processing timeout
- HMAC signature invalid
- Email sending failed

**Action**: Investigate immediately, may impact users

---

### CRITICAL (Custom)
**Use**: System-wide failure
**Examples**:
- Database connection lost
- Service role key invalid
- All edge functions down

**Action**: Emergency response required

---

## Common Log Patterns

### Successful Dataset Publication
```
INFO ingest-dataset Processing dataset: Test Dataset
INFO ingest-dataset Stripe product created: prod_123
INFO ingest-dataset Dataset inserted: ds_456
INFO ingest-dataset Badge codes generated: 50
INFO ingest-dataset Audit log created
INFO ingest-dataset Email sent to admin
```

**Interpretation**: All steps completed successfully. Dataset is now live in marketplace.

---

### Failed Dataset Publication (Stripe Error)
```
INFO ingest-dataset Processing dataset: Test Dataset
ERROR ingest-dataset Stripe error: Rate limit exceeded
ERROR ingest-dataset Dataset publication failed
```

**Interpretation**: Stripe API rate limit hit. Retry after backoff period (see Stripe docs).
**Action**: Check Stripe dashboard, adjust rate limiting or upgrade plan.

---

### HMAC Signature Failure
```
INFO external-ingest Request received
ERROR external-ingest HMAC validation failed
ERROR external-ingest Signature: abc123, Expected: def456
```

**Interpretation**: Incoming request has invalid or expired signature.
**Possible Causes**:
1. Wrong `INGEST_SECRET` on client side
2. Clock skew (timestamp > 5 minutes old)
3. Payload modified in transit
4. Signature algorithm mismatch

**Action**: Verify `INGEST_SECRET` matches, check system clocks, test with known-good payload.

---

### Rate Limit Hit
```
INFO ingest-dataset Processing dataset: Test Dataset
ERROR ingest-dataset Rate limit exceeded
```

**Interpretation**: More than 10 requests per hour to this endpoint.
**Action**: Wait for rate limit window to reset, or adjust limits in code if legitimate traffic.

---

### AI Processing Failure
```
INFO process-data-submission Processing data submission: sub_123
INFO process-data-submission Queue entry created: queue_456
ERROR process-data-submission AI analysis failed: 401 Unauthorized
ERROR process-data-submission Failed to trigger AI processing for sub_123
```

**Interpretation**: Lovable AI API key invalid or quota exceeded.
**Action**: Check `LOVABLE_API_KEY` secret, verify quota in Lovable dashboard.

---

### Badge Code Shortage
```
WARN ingest-dataset Low badge code inventory: 12 remaining
WARN ingest-dataset Threshold: 50
```

**Interpretation**: Badge codes running low for a dataset.
**Action**: Generate more codes via machine-agent GUI or manually call `create-badge-codes`.

---

### RLS Policy Denial
```
ERROR purchase-dataset Permission denied for table purchases
ERROR purchase-dataset User ID: user_123, Action: INSERT
```

**Interpretation**: User trying to insert into `purchases` table but RLS policy denied.
**Possible Causes**:
1. User not authenticated
2. RLS policy misconfigured
3. User trying to create purchase for different user_id

**Action**: Check authentication token, review RLS policies, verify user_id matches.

---

## Debugging Workflows

### Scenario 1: User Reports "Can't See Their Purchases"
**Steps**:
1. Check `purchases` table for user's entries:
   ```sql
   SELECT * FROM purchases WHERE user_id = '<user_id>';
   ```
2. If empty, check `audit_logs` for `purchase_completed` action:
   ```sql
   SELECT * FROM audit_logs WHERE action = 'purchase_completed' AND details->>'user_id' = '<user_id>';
   ```
3. If present in audit but not purchases, check RLS policies on `purchases` table
4. Test RLS manually:
   ```sql
   SET LOCAL "request.jwt.claims" TO '{"sub": "<user_id>"}';
   SELECT * FROM purchases WHERE user_id = '<user_id>';
   ```

---

### Scenario 2: Dataset Not Appearing in Marketplace
**Steps**:
1. Check `datasets` table:
   ```sql
   SELECT * FROM datasets WHERE name = '<dataset_name>';
   ```
2. Verify `active = true` and Stripe IDs present
3. Check edge function logs for `ingest-dataset` errors
4. Test Stripe product exists:
   ```bash
   curl https://api.stripe.com/v1/products/<product_id> \
     -u <STRIPE_SECRET_KEY>:
   ```
5. Check frontend RLS: user should see active datasets without auth

---

### Scenario 3: Scraper Data Not Ingesting
**Steps**:
1. Check scraper output file:
   ```bash
   cat data-scraper-module/output/<file>.json
   ```
2. Verify JSON format matches `data_submissions` schema
3. Test HMAC signature generation:
   ```python
   python data-scraper-module/test_hmac.py
   ```
4. Check `external-ingest` logs for signature errors
5. Verify `INGEST_SECRET` matches in both scraper config and Supabase secrets

---

### Scenario 4: Badge Codes Not Generated
**Steps**:
1. Check `audit_logs` for `badge_generated` action:
   ```sql
   SELECT * FROM audit_logs WHERE action = 'badge_generated' ORDER BY created_at DESC LIMIT 10;
   ```
2. Check `badge_codes` table count:
   ```sql
   SELECT dataset_id, COUNT(*) as total, SUM(CASE WHEN claimed THEN 1 ELSE 0 END) as claimed
   FROM badge_codes
   GROUP BY dataset_id;
   ```
3. Check `create-badge-codes` edge function logs for errors
4. Verify dataset_id exists in `datasets` table

---

## Log Retention

### Edge Function Logs
- **Retention**: 7 days (Supabase default)
- **Export**: Via Supabase CLI or API (for longer retention)

### Audit Logs Table
- **Retention**: 90 days (automatic cleanup via cron job)
- **Archival**: Export to S3 or long-term storage before deletion

### Postgres Logs
- **Retention**: 24 hours (Supabase default)
- **Export**: Via Supabase Dashboard → Logs → Export

---

## Log Analysis Tips

### Identify Patterns
```sql
-- Most common errors in last 24 hours
SELECT action, COUNT(*) as error_count
FROM audit_logs
WHERE severity = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY error_count DESC;
```

### Track User Activity
```sql
-- User action timeline
SELECT created_at, action, resource_type, details
FROM audit_logs
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 50;
```

### Monitor Performance
```sql
-- Slow processing submissions
SELECT s.id, s.created_at, q.processing_status, q.processed_at,
       EXTRACT(EPOCH FROM (q.processed_at - s.created_at)) as processing_time_seconds
FROM data_submissions s
JOIN data_processing_queue q ON q.submission_id = s.id
WHERE q.processing_status = 'completed'
  AND EXTRACT(EPOCH FROM (q.processed_at - s.created_at)) > 60
ORDER BY processing_time_seconds DESC;
```

---

## Alerting Setup (Recommended)

### Critical Alerts
- RLS policy denial spikes (> 10/hour)
- Edge function error rate (> 5% of requests)
- Badge code inventory < 10
- Stripe API errors
- AI processing failure rate (> 10%)

### Warning Alerts
- Rate limit hits (> 5/day)
- Slow queries (> 2s execution time)
- Badge code inventory < 50
- Email delivery delays (> 5 minutes)

### Implementation
Use Supabase webhooks + external monitoring (e.g., PagerDuty, Sentry):
```typescript
// Supabase Edge Function: alert-monitor
// Triggered by database changes or scheduled cron
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  // Check critical metrics
  // If threshold exceeded, send alert to PagerDuty/Slack
});
```

---

## Contact

For questions about logging:
- Email: logs@dataforearth.org
- GitHub Issues: dataforearth/backend/issues
- Discord: #backend-support
