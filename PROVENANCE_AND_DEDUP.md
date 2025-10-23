# Provenance & Deduplication

## Overview

DataForEarth ensures data integrity through cryptographic provenance tracking and intelligent duplicate detection. Every data item has a unique provenance hash that enables deduplication across all sources.

## Provenance Hash Generation

### Algorithm: SHA-256

**Why SHA-256?**
- Cryptographically secure
- Collision-resistant
- Deterministic (same input = same hash)
- Fast computation
- Industry standard

### Hash Input

The provenance hash is generated from a **canonical representation** of the data payload:

```typescript
function generateProvenanceHash(payload: any): string {
  // Normalize payload to canonical JSON (sorted keys, no whitespace)
  const canonical = JSON.stringify(sortKeysDeep(payload));
  
  // Generate SHA-256 hash
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical)
  );
  
  // Convert to hex string
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### Canonical Representation

To ensure consistent hashing:

1. **Key Sorting**: Object keys sorted alphabetically
2. **Whitespace Removal**: No extra spaces or newlines
3. **Type Consistency**: Numbers, strings, booleans normalized
4. **Null Handling**: `null` vs `undefined` treated consistently
5. **Array Order**: Arrays maintain order (order matters for semantics)

**Example**:
```json
// Input (user submission)
{
  "location": "San Francisco",
  "temperature": 72,
  "timestamp": "2025-10-23T10:00:00Z"
}

// Canonical form (for hashing)
{"location":"San Francisco","temperature":72,"timestamp":"2025-10-23T10:00:00Z"}

// Provenance hash (SHA-256)
a3f8b9c1d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

## Duplicate Detection

### Stage 1: Exact Match

**Database Query**:
```sql
SELECT id, duplicate_of, created_at
FROM review_queue
WHERE provenance_hash = :new_hash
AND status != 'rejected'
LIMIT 1;
```

**Outcome**:
- **If found**: Mark new item with `duplicate_of` field pointing to original
- **If not found**: Proceed with ingestion

### Stage 2: Near-Duplicate Detection (Future)

Planned enhancements for fuzzy matching:

**SimHash Algorithm**:
- Convert text content to fixed-size fingerprint
- Compare Hamming distance between fingerprints
- Threshold: 3 bits difference = "similar"

**Use Case**: Detect paraphrased or slightly modified content

**Example**:
```
Item A: "Electric vehicle adoption increased by 25% in Q4 2024"
Item B: "EV adoption rose 25 percent in Q4 2024"
→ Near-duplicate (SimHash distance: 2 bits)
```

## Handling Duplicates

### User Contributions

**Workflow**:
1. User submits data via `/contribute`
2. Edge function generates provenance hash
3. Query `review_queue` for existing hash
4. **If duplicate found**:
   - Still insert into review queue (for audit)
   - Mark with `duplicate_of` field
   - Set `status = 'rejected'` automatically
   - Display warning to user: "This data was already submitted"
   - Do NOT move to `curated_pool`

5. **If unique**:
   - Insert with `status = 'pending'`
   - Queue for human review

### Scraped Data

**Batch Processing**:
1. Machine agent posts batch of 100 items
2. Edge function generates hash for each item
3. Query `review_queue` for all hashes in one query:
   ```sql
   SELECT provenance_hash 
   FROM review_queue 
   WHERE provenance_hash = ANY(:hash_array);
   ```
4. **Duplicates**: Mark and skip
5. **Uniques**: Insert into review queue

**Efficiency**: Batch query reduces DB round-trips

## Provenance Tracking in Review Queue

### Table: `review_queue`

```sql
CREATE TABLE review_queue (
  id uuid PRIMARY KEY,
  source_type text NOT NULL, -- 'user_contribution', 'external_scraper'
  source_reference text NOT NULL, -- User ID, scraper name, etc.
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  provenance_hash text NOT NULL UNIQUE, -- SHA-256 hex string
  duplicate_of uuid REFERENCES review_queue(id),
  similar_items jsonb DEFAULT '[]', -- Array of near-duplicate IDs
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX idx_provenance_hash ON review_queue(provenance_hash);
```

### UI Display

**Admin Review Interface** (`/admin/review`):

- **Provenance Hash**: Displayed as truncated string with hover-to-expand
  ```
  a3f8b9c1...f0a1 [Copy]
  ```

- **Duplicate Warning Banner**: If `duplicate_of` is set
  ```
  ⚠️ This item is a duplicate of [ID: xyz] submitted on 2025-10-20
  ```

- **Similar Items**: If near-duplicates detected
  ```
  ℹ️ Found 2 similar items with 85% match score
  [View Similar] [Merge] [Keep Both]
  ```

## Provenance in Curated Pool

Once approved, provenance hash is carried to `curated_pool`:

```sql
CREATE TABLE curated_pool (
  id uuid PRIMARY KEY,
  review_queue_id uuid REFERENCES review_queue(id),
  curated_payload jsonb NOT NULL,
  -- Provenance hash accessible via JOIN to review_queue
  ...
);
```

**Query provenance**:
```sql
SELECT 
  cp.id,
  rq.provenance_hash,
  rq.source_type,
  rq.created_at as original_submission_date
FROM curated_pool cp
JOIN review_queue rq ON cp.review_queue_id = rq.id
WHERE cp.id = :curated_item_id;
```

## Audit Trail

Every data item has full lineage:

```
User Submission 
→ review_queue (provenance_hash generated)
→ Human Review (approved)
→ curated_pool (references review_queue_id)
→ datasets (references curated_pool items)
→ purchases (user downloads dataset)
```

**Trace back any dataset to original source**:
```sql
WITH dataset_items AS (
  SELECT unnest(sample_data::jsonb) as item_id
  FROM datasets WHERE id = :dataset_id
)
SELECT 
  rq.source_type,
  rq.source_reference,
  rq.provenance_hash,
  rq.created_at as original_submission
FROM dataset_items di
JOIN curated_pool cp ON cp.id = di.item_id::uuid
JOIN review_queue rq ON cp.review_queue_id = rq.id;
```

## Security Considerations

### Hash Immutability
- Provenance hashes are **immutable** once generated
- Any edit to data creates new hash = new item
- Original hash preserved for audit

### Collision Resistance
- SHA-256 collision probability: ~1 in 2^256
- Practically impossible for two different items to have same hash
- If collision detected: Log as critical alert, manual review required

### Tampering Detection
- Any modification to `raw_payload` changes hash
- Mismatched hash = tampering detected
- Validation function to recompute and verify:
  ```sql
  SELECT COUNT(*) FROM review_queue
  WHERE provenance_hash != compute_provenance_hash(raw_payload);
  ```

## Performance Optimization

### Database Indexing
```sql
-- Fast hash lookups
CREATE INDEX idx_provenance_hash ON review_queue(provenance_hash);

-- Fast duplicate queries
CREATE INDEX idx_duplicate_of ON review_queue(duplicate_of) WHERE duplicate_of IS NOT NULL;
```

### Batch Operations
- Hash 1000 items in <1 second (SHA-256 is fast)
- Batch DB lookups reduce network overhead
- Use `WHERE hash = ANY(array)` for bulk checks

---

**Last Updated**: 2025-10-23
**Maintained by**: DataForEarth Platform Team
