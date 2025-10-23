# Machine Agent Callbacks & Webhooks

## Overview

DataForEarth's Ubuntu machine agent acts as the central orchestrator for dataset curation and publishing. It receives webhook callbacks for all critical events and provides IPC endpoints for UI control.

## Webhook Endpoint

**URL**: `/functions/v1/agent-webhook-handler`  
**Method**: POST  
**Auth**: `x-ingest-secret` header

### Event Types

#### 1. `dataset_published`

**Trigger**: New dataset successfully published to marketplace

**Payload**:
```json
{
  "event": "dataset_published",
  "dataset_id": "uuid",
  "name": "Carbon Offset Projects Q4 2024",
  "source_channel": "on_site",
  "batch_number": 42,
  "category": "carbon_offsets",
  "size_mb": 12,
  "record_count": 150,
  "confidence_avg": 0.87,
  "quality_breakdown": {
    "platinum": 15,
    "gold": 60,
    "silver": 25,
    "bronze": 0
  },
  "enterprise_grade": true,
  "limited_supply": 50,
  "price": 299.99,
  "stripe_product_id": "prod_xxx",
  "released_at": "2025-10-23T14:30:00Z"
}
```

**Agent Actions**:
- Log to system audit trail
- Update dashboard with new dataset stats
- Trigger badge code generation if needed
- Send notification to monitoring channels

---

#### 2. `badge_codes_low`

**Trigger**: Badge code inventory below threshold (e.g., <10 remaining)

**Payload**:
```json
{
  "event": "badge_codes_low",
  "dataset_id": "uuid",
  "dataset_name": "Carbon Offset Projects Q4 2024",
  "codes_remaining": 7,
  "threshold": 10,
  "total_generated": 100,
  "claimed_count": 93,
  "timestamp": "2025-10-23T14:30:00Z"
}
```

**Agent Actions**:
- Alert admin via GUI notification
- Optionally auto-generate more codes
- Log inventory event

---

#### 3. `scraper_health`

**Trigger**: External scraper reports status (hourly, or on error)

**Payload**:
```json
{
  "event": "scraper_health",
  "scraper_name": "carbon_futures_scraper",
  "status": "healthy",
  "last_run": "2025-10-23T14:00:00Z",
  "records_scraped": 45,
  "errors_count": 0,
  "success_rate": 1.0,
  "next_scheduled_run": "2025-10-23T15:00:00Z",
  "message": "All endpoints responding normally"
}
```

**Agent Actions**:
- Update scraper status dashboard
- Log health checks
- Alert if `status !== 'healthy'`

---

#### 4. `alert_anomaly`

**Trigger**: Unusual activity detected (e.g., spike in submissions, duplicate flood)

**Payload**:
```json
{
  "event": "alert_anomaly",
  "anomaly_type": "submission_spike",
  "severity": "warning",
  "details": {
    "normal_rate": "10 per hour",
    "current_rate": "150 per hour",
    "duration_minutes": 15,
    "source_ips": ["192.168.1.1", "192.168.1.2"]
  },
  "suggested_action": "Review for bot activity or DDoS",
  "timestamp": "2025-10-23T14:30:00Z"
}
```

**Agent Actions**:
- Display alert banner in GUI
- Log to security audit trail
- Optionally trigger rate limiting

---

## Event Storage

All webhook events are stored in `agent_events` table:

```sql
CREATE TABLE agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text
);
```

**Agent Processing Loop**:
```typescript
setInterval(async () => {
  const events = await fetchUnprocessedEvents();
  for (const event of events) {
    try {
      await processEvent(event);
      await markEventProcessed(event.id);
    } catch (error) {
      await logEventError(event.id, error.message);
    }
  }
}, 60000); // Every 60 seconds
```

---

## IPC Endpoints (Electron)

Machine agent GUI exposes these IPC endpoints for admin control:

### Review Queue Management

#### `fetchReviewQueue(status, filters)`
**Description**: Load review queue items

**Parameters**:
- `status`: 'pending' | 'approved' | 'rejected' | 'flagged'
- `filters`: `{ category?, tags?, minConfidence?, quality?, source? }`

**Returns**:
```typescript
{
  success: boolean,
  data: {
    items: ReviewItem[],
    total_count: number,
    filters_applied: object
  }
}
```

---

#### `approveReviewItem(id, notes)`
**Description**: Approve an item, move to curated pool

**Parameters**:
- `id`: uuid of review queue item
- `notes`: string (optional review notes)

**Returns**:
```typescript
{
  success: boolean,
  message: string
}
```

---

#### `rejectReviewItem(id, notes)`
**Description**: Reject an item, mark as rejected

**Parameters**:
- `id`: uuid of review queue item
- `notes`: string (required reason for rejection)

**Returns**:
```typescript
{
  success: boolean,
  message: string
}
```

---

### Dataset Building

#### `buildDataset(mode, filters)`
**Description**: Trigger dataset assembly from curated pool

**Parameters**:
- `mode`: 'on_site' | 'external' | 'enterprise'
- `filters`: `{ category?, tags?, minConfidence?, quality?, limitSupply?, burstMode? }`

**Returns**:
```typescript
{
  success: boolean,
  data: {
    dataset_id: uuid,
    name: string,
    record_count: number,
    confidence_avg: number,
    stripe_product_id: string
  }
}
```

---

### Release Policy

#### `getReleasePolicy()`
**Description**: Fetch current throttle settings for all channels

**Returns**:
```typescript
{
  success: boolean,
  data: [
    {
      channel: 'on_site',
      min_days_between_releases: 7,
      max_datasets_per_week: 2,
      min_confidence: 0.7,
      min_quality_tier: 'silver',
      last_release_at: '2025-10-20T10:00:00Z',
      burst_mode_enabled: false
    },
    { ... }
  ]
}
```

---

#### `updateReleasePolicy(payload)`
**Description**: Modify throttle settings

**Parameters**:
```typescript
{
  id: uuid,
  min_days_between_releases?: number,
  max_datasets_per_week?: number,
  min_confidence?: number,
  min_quality_tier?: string
}
```

**Returns**:
```typescript
{
  success: boolean,
  message: string
}
```

---

#### `triggerBurstMode(reason)`
**Description**: Enable burst mode for next release

**Parameters**:
- `reason`: string (required, for audit trail)

**Returns**:
```typescript
{
  success: boolean,
  message: string
}
```

---

#### `getTrendingSignals()`
**Description**: Analyze recent curated data for trending topics

**Returns**:
```typescript
{
  success: boolean,
  data: {
    tags: [
      { tag: 'carbon_offsets', count: 45 },
      { tag: 'ev_adoption', count: 32 },
      ...
    ],
    categories: [
      { category: 'carbon_offsets', count: 120 },
      { category: 'renewable_energy', count: 85 },
      ...
    ]
  }
}
```

**Use Case**: Suggests when to trigger burst mode for trending topics

---

## Retry Logic

**Webhook Delivery Failures**:

Edge function implements exponential backoff:

```typescript
async function sendWebhook(event: any, attempt: number = 1) {
  const maxAttempts = 5;
  const baseDelay = 1000; // 1 second
  
  try {
    const response = await fetch(agentWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ingest-secret': ingestSecret
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok && attempt < maxAttempts) {
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      setTimeout(() => sendWebhook(event, attempt + 1), delay);
    }
  } catch (error) {
    if (attempt < maxAttempts) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      setTimeout(() => sendWebhook(event, attempt + 1), delay);
    } else {
      // Store in failed_webhooks table for manual retry
      await logFailedWebhook(event, error);
    }
  }
}
```

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- Attempt 4: 4 seconds delay
- Attempt 5: 8 seconds delay
- After 5 failures: Log to `failed_webhooks` table for manual intervention

---

## Security

### Authentication

All webhook and IPC calls require:
- **Webhooks**: `x-ingest-secret` header matching `INGEST_SECRET` env var
- **IPC**: Machine agent config loaded with valid credentials

### Rate Limiting

- Webhooks: 100 requests per minute per IP
- IPC: No limit (local electron process)

### Signature Verification (Future)

Planned: HMAC signatures for webhook payloads

```
x-ingest-sign: t=1698765432,v1=sha256_hmac_hex
```

---

## Monitoring

### Webhook Delivery Metrics

Query webhook success rate:
```sql
SELECT 
  event_type,
  COUNT(*) as total,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed,
  SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) as failed,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_sec
FROM agent_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```

### Agent Health Check

Endpoint: `/functions/v1/agent-webhook-handler` (GET)

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "last_event_processed": "2025-10-23T14:29:00Z"
}
```

---

**Last Updated**: 2025-10-23
**Maintained by**: DataForEarth Platform Team
