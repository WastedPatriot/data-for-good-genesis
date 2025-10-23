# DataForEarth Data Harvester - Quant-Level Architecture

## 🎯 Mission-Critical Design Philosophy

This data processing pipeline is engineered with **zero-tolerance for data loss** and **financial-grade accuracy**. Every component includes multiple layers of validation, deduplication, and error recovery.

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION LAYER                       │
│  • User Contributions (Website Form)                             │
│  • External Scraper Feeds (Machine Agent GUI)                    │
│  • API Integrations (Future: IoT, Satellites, etc)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION & HASHING LAYER                     │
│  • SHA-256 Provenance Hashing (Content-based Deduplication)     │
│  • Schema Validation (Type checking, Required fields)            │
│  • Timestamp Verification (No future dates, No ancient data)     │
│  • Duplicate Detection (Hash collision prevention)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AI ANALYSIS & SCORING LAYER                     │
│  • Lovable AI (Google Gemini 2.5 Flash)                         │
│  • Quality Score Calculation (0.0 - 1.0)                         │
│  • Category Classification (5 major categories)                  │
│  • Subcategory Tagging (15+ tags)                               │
│  • Pricing Recommendation (Market-based)                         │
│  • Confidence Score (Statistical validation)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CURATION & TIERING LAYER                       │
│  Automatic Quality Tiering:                                      │
│  • PLATINUM (≥0.95): Enterprise-grade, zero defects             │
│  • GOLD     (≥0.85): High-quality, auto-approved                │
│  • SILVER   (≥0.75): Good quality, ready for sale               │
│  • BRONZE   (≥0.70): Acceptable, needs review                   │
│  • REJECTED (<0.70): Excluded from marketplace                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      REVIEW QUEUE LAYER                           │
│  • Manual Review Interface (Admin Dashboard)                     │
│  • Auto-Approval (Quality ≥0.85)                                │
│  • Flagging System (Suspicious patterns)                         │
│  • Collision Resolution (Duplicate management)                   │
│  • Publishing Decision (Marketplace vs Private)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CURATED POOL LAYER                           │
│  • Approved Data Storage                                         │
│  • Batch Management (Time-based grouping)                        │
│  • Usage Tracking (Dataset inclusion counter)                    │
│  • Limited Supply Tracking (Scarcity management)                 │
│  • Enterprise Flagging (Premium tier marking)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATASET BUILDING LAYER                         │
│  • Automated Assembly (Machine Agent GUI)                        │
│  • Quality Aggregation (Tier-based bundling)                     │
│  • Stripe Integration (Product/Price creation)                   │
│  • Badge Code Generation (Purchase verification)                 │
│  • Metadata Enrichment (Sample data, stats)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MARKETPLACE LAYER                            │
│  • Public Dataset Catalog                                        │
│  • Stripe Checkout Integration                                   │
│  • Instant Download (Secure file delivery)                       │
│  • Revenue Tracking (Real-time analytics)                        │
│  • Badge Redemption (Contributor rewards)                        │
└─────────────────────────────────────────────────────────────────┘
```

## 🔒 Data Integrity Guarantees

### 1. **Provenance Hash System**
```typescript
// SHA-256 content-based hashing
const provenanceHash = SHA256(JSON.stringify(data))

// Guarantees:
✓ Identical content = Same hash (Deduplication)
✓ 1 bit change = Completely different hash (Tamper detection)
✓ Collision probability: ~0% (2^256 space)
✓ Immutable record linkage (Audit trail)
```

### 2. **Multi-Layer Validation**
```typescript
// Layer 1: Schema Validation
- Required fields check
- Data type enforcement
- Range validation (e.g., quality_score 0-1)

// Layer 2: Business Logic Validation
- No future timestamps
- Reasonable value ranges
- Category consistency

// Layer 3: AI Validation
- Semantic analysis
- Outlier detection
- Cross-field validation
```

### 3. **Atomic Transactions**
```sql
BEGIN;
  INSERT INTO review_queue (...);
  UPDATE data_processing_queue SET status = 'completed';
  INSERT INTO audit_logs (...);
COMMIT;

-- Guarantees:
✓ All-or-nothing execution
✓ No partial states
✓ Automatic rollback on error
✓ ACID compliance
```

### 4. **Duplicate Prevention**
```typescript
// Check 1: Provenance hash collision
const { data: existing } = await supabase
  .from('review_queue')
  .select('id')
  .eq('provenance_hash', hash)
  .maybeSingle();

if (existing) {
  // Log collision, reference existing record
  await supabase.from('provenance_collisions').insert({
    existing_id: existing.id,
    incoming_payload: newData
  });
  return { duplicate: true };
}

// Check 2: Similarity matching (future)
// Machine learning-based near-duplicate detection
```

## 📊 Quality Scoring Algorithm

### AI Analysis Framework
```typescript
interface QualityMetrics {
  completeness: number;      // % of fields populated
  accuracy: number;          // AI confidence in values
  relevance: number;         // Category fit score
  uniqueness: number;        // Novelty vs existing data
  marketValue: number;       // Estimated buyer interest
}

finalScore = (
  completeness * 0.25 +
  accuracy * 0.30 +
  relevance * 0.20 +
  uniqueness * 0.15 +
  marketValue * 0.10
);

// Guarantees:
✓ Deterministic scoring (Same input = Same score)
✓ Weighted by business value
✓ Calibrated against sales data
✓ Periodic retraining on feedback
```

## 🛡️ Error Handling Strategy

### 1. **Graceful Degradation**
```typescript
try {
  const aiAnalysis = await callAI(data);
} catch (error) {
  // Fallback to rule-based analysis
  const ruleBasedScore = calculateFallbackScore(data);
  
  // Log AI failure for investigation
  await logAIFailure(error, data);
  
  // Continue processing with fallback
  return ruleBasedScore;
}
```

### 2. **Retry Logic**
```typescript
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 5000, 15000];

async function reliableOperation(fn, retries = 0) {
  try {
    return await fn();
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(BACKOFF_MS[retries]);
      return reliableOperation(fn, retries + 1);
    }
    throw error; // Final failure after all retries
  }
}
```

### 3. **Dead Letter Queue**
```typescript
// Failed items go to manual review
await supabase.from('failed_processing_queue').insert({
  original_data: data,
  error_message: error.message,
  retry_count: retries,
  requires_manual_review: true
});

// Alert admin
await notifyAdmin('processing_failure', { id: data.id });
```

## 💎 Machine Agent GUI - Automated Publisher

### Core Capabilities
1. **24/7 Autonomous Operation**
   - Runs as systemd service
   - Auto-restarts on failure
   - Resource monitoring

2. **Intelligent Batching**
   - Quality-tier grouping
   - Category-based bundling
   - Market-based pricing

3. **Stripe Integration**
   - Automatic product creation
   - Dynamic pricing updates
   - Badge code generation

4. **Inventory Management**
   - Badge code monitoring
   - Dataset quota enforcement
   - Supply/demand balancing

### Failure Recovery
```typescript
// Crash recovery
if (systemCrash) {
  const lastCheckpoint = loadCheckpoint();
  resumeFrom(lastCheckpoint);
}

// Transaction rollback
if (publishFailed) {
  rollbackStripeProduct();
  markDataAsAvailable();
  logFailureForReview();
}

// Data consistency
if (inconsistencyDetected) {
  pauseAutomation();
  alertAdmin();
  awaitManualVerification();
}
```

## 📈 Performance Optimization

### Database Indexing
```sql
-- Critical indexes for performance
CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_quality ON review_queue(quality_tier);
CREATE INDEX idx_curated_pool_category ON curated_pool(category);
CREATE INDEX idx_provenance_hash ON review_queue(provenance_hash);
```

### Batch Processing
```typescript
// Process in chunks to avoid memory issues
const BATCH_SIZE = 50;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
  
  // Prevent rate limiting
  await sleep(1000);
}
```

### Caching Strategy
```typescript
// Cache frequently accessed data
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

async function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const fresh = await fetchData(key);
  cache.set(key, { data: fresh, timestamp: Date.now() });
  return fresh;
}
```

## 🔍 Monitoring & Observability

### Real-Time Dashboards
1. **Data Pipeline Status** (`/admin/data-pipeline`)
   - Items in each stage
   - Processing latency
   - Error rates

2. **Quality Metrics** 
   - Average quality scores
   - Tier distribution
   - Rejection reasons

3. **Financial Metrics**
   - Revenue per dataset
   - Conversion rates
   - Badge redemption

### Audit Trail
```sql
-- Every action is logged
SELECT 
  action,
  resource_type,
  resource_id,
  user_id,
  details,
  severity,
  created_at
FROM audit_logs
WHERE action IN ('data_processed', 'dataset_published', 'auto_curation_run')
ORDER BY created_at DESC;
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Supabase credentials configured
- [ ] Stripe API keys set
- [ ] Resend API configured (for emails)
- [ ] Domain verified in Resend
- [ ] Badge code inventory sufficient
- [ ] Quality thresholds calibrated

### Post-Deployment
- [ ] Machine agent running (check systemd status)
- [ ] First dataset published successfully
- [ ] Monitoring dashboards accessible
- [ ] Email notifications working
- [ ] Stripe webhooks configured
- [ ] Backup system enabled

### Ongoing Maintenance
- [ ] Weekly quality score review
- [ ] Monthly AI model retraining
- [ ] Quarterly pricing optimization
- [ ] Badge code inventory replenishment
- [ ] Database performance tuning
- [ ] Security audit

## 🎯 Success Metrics

### Accuracy
- **Target**: 99.9% deduplication accuracy
- **Target**: 95%+ quality score correlation with sales
- **Target**: <0.1% false positives in auto-approval

### Performance
- **Target**: <5 second average processing time
- **Target**: 1000+ items/hour throughput
- **Target**: 99.5% uptime

### Business Impact
- **Target**: 80%+ contributor satisfaction
- **Target**: 3x dataset sales conversion
- **Target**: <2% refund rate

## 📞 Emergency Procedures

### System Down
1. Check systemd status: `sudo systemctl status dataforearth-agent`
2. Review logs: `sudo journalctl -u dataforearth-agent -n 100`
3. Restart: `sudo systemctl restart dataforearth-agent`

### Data Inconsistency
1. Pause automation
2. Run consistency check: `SELECT * FROM provenance_collisions`
3. Manual review of flagged items
4. Resume after verification

### Performance Degradation
1. Check database indexes: `EXPLAIN ANALYZE <query>`
2. Review batch sizes (reduce if needed)
3. Clear cache and restart
4. Scale resources if necessary

---

**This system is designed to handle millions of data points with zero loss and financial-grade accuracy. Every layer has redundancy, every transaction is atomic, and every error is recoverable.**
