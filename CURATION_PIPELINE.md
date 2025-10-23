# Data Curation Pipeline

## Overview

DataForEarth implements a comprehensive curation pipeline that ensures all data—whether user-contributed or scraped—goes through proper review before publication. This pipeline maintains data quality, prevents duplicates, and enables strategic release timing.

## Pipeline Flow

```
┌─────────────────────┐
│   Data Sources      │
│ • User Contrib      │
│ • External Scrapers │
│ • Aggregated Data   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Review Queue       │
│ • Normalization     │
│ • Deduplication     │
│ • Quality Scoring   │
│ • Categorization    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Human Review       │
│ • Admin Approval    │
│ • Notes & Tags      │
│ • Publish Decision  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Curated Pool       │
│ • Ready for Publish │
│ • Quality Tiers     │
│ • Usage Tracking    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Dataset Builder    │
│ • Throttle Check    │
│ • Batch Assembly    │
│ • Multi-Format      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Publication        │
│ • On-Site Marketplace│
│ • External Channels │
│ • Webhook Callbacks │
└─────────────────────┘
```

## Data Ingestion

### User Contributions
- **Endpoint**: `/functions/v1/contrib-handoff-for-review`
- **Source Type**: `user_contribution`
- **Process**: 
  1. User submits via `/contribute` page
  2. Edge function generates provenance hash (SHA-256)
  3. Checks for duplicates in review queue
  4. Normalizes payload structure
  5. Assigns confidence score and quality tier
  6. Inserts into `review_queue` with `pending` status

### Scraped/Aggregated Data
- **Endpoint**: `/functions/v1/scrape-batch-handoff-for-review`
- **Source Type**: `external_scraper`
- **Process**:
  1. Machine agent or external scraper posts batch
  2. Requires `x-ingest-secret` authentication
  3. Each item gets provenance hash
  4. Duplicate detection across batch
  5. Bulk insert into `review_queue`

## Review Queue

### Table: `review_queue`

Key columns:
- `source_type`: Origin of the data
- `raw_payload`: Original submission
- `normalized_payload`: Cleaned and structured version
- `provenance_hash`: SHA-256 of content for deduplication
- `confidence_score`: 0-1 quality metric
- `quality_tier`: bronze/silver/gold/platinum
- `status`: pending/approved/rejected/flagged
- `duplicate_of`: Reference to original if duplicate detected
- `publish_decision`: on_site_only/external_only/both/never

### Admin Review Interface

**Location**: `/admin/review`

**Features**:
- Filter by status, category, confidence, quality tier, source
- Bulk approve/reject operations
- Notes field for review comments
- Provenance hash display for tracking
- Duplicate detection warnings
- Similarity analysis for near-matches

**Actions**:
- **Approve**: Moves item to `curated_pool`, marks as `approved`
- **Reject**: Changes status to `rejected`, does not move to pool
- **Flag**: Marks for further investigation

## Curated Pool

### Table: `curated_pool`

Items approved from review queue that are ready for dataset assembly.

Key features:
- References original `review_queue_id`
- Tracks `usage_count` (how many datasets include this item)
- Maintains `used_in_datasets[]` array of dataset IDs
- Records `last_used_at` timestamp
- Supports `enterprise_grade` marking
- Optional `limited_supply` count for scarcity

**Usage Rules**:
- Items can be reused across multiple datasets
- Usage tracking prevents over-exposure
- High-quality items marked for enterprise contracts
- Limited supply items tracked for scarcity marketing

## Dataset Building

### Endpoint: `/functions/v1/build-dataset-from-curated`

**Modes**:
- `on_site`: Build for DataForEarth marketplace
- `external`: Build for external distribution
- `enterprise`: Build high-confidence enterprise pack

**Process**:
1. Admin specifies filters (category, tags, quality tier, etc.)
2. Function queries `curated_pool` based on filters
3. Checks `release_policy` throttles (unless burst mode)
4. Assembles records into dataset
5. Creates Stripe product and pricing
6. Generates multi-format exports (CSV, JSONL, Parquet, Avro, SQLite)
7. Uploads files to storage with presigned URLs
8. Inserts into `datasets` table
9. Updates `curated_pool` usage tracking
10. Triggers webhook to machine agent

**Throttling**: See RELEASE_POLICY.md

## Machine Agent Integration

### Webhook Endpoint: `/functions/v1/agent-webhook-handler`

Receives events:
- `dataset_published`: New dataset released
- `badge_codes_low`: Inventory alert
- `scraper_health`: External scraper status
- `alert_anomaly`: Unusual activity detected

All events stored in `agent_events` table for agent processing.

### Agent IPC Endpoints

Machine agent provides GUI for:
- `fetchReviewQueue()`: Load pending items
- `approveReviewItem()`: Approve with notes
- `rejectReviewItem()`: Reject with notes
- `buildDataset()`: Trigger dataset assembly
- `getReleasePolicy()`: View throttle settings
- `updateReleasePolicy()`: Modify throttles
- `triggerBurstMode()`: Override throttles
- `getTrendingSignals()`: Analyze trending tags/categories

## Quality Tiers

See QUALITY_TIERS.md for detailed scoring criteria.

## Provenance & Deduplication

See PROVENANCE_AND_DEDUP.md for hashing and duplicate detection logic.

## Enterprise SKUs

See ENTERPRISE_SKU_GUIDE.md for premium contract features.

---

**Last Updated**: 2025-10-23
**Maintained by**: DataForEarth Platform Team
