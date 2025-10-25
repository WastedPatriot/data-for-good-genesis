# Real Impact Metrics - Anonymous Public View

## Purpose
Display real-time impact metrics on the homepage without requiring login, showcasing DataForEarth's contributions to sustainability and climate action.

## Metrics Displayed

### 1. Total Datasets Available
```sql
SELECT COUNT(*) FROM datasets WHERE active = true;
```

### 2. Total Revenue (Funds for Earth Projects)
```sql
SELECT SUM(amount_paid) FROM purchases WHERE status = 'completed';
```

### 3. Contributors (Data Donors)
```sql
SELECT COUNT(DISTINCT user_id) FROM purchases WHERE status = 'completed';
```

### 4. Active Domains
```sql
SELECT COUNT(DISTINCT domain) FROM datasets WHERE active = true AND domain IS NOT NULL;
```

### 5. High-Quality Records
```sql
SELECT COUNT(*) FROM curated_pool WHERE confidence_score >= 0.85;
```

### 6. Datasets by Domain (JSON aggregate)
```sql
SELECT jsonb_object_agg(
  COALESCE(domain, 'unknown'),
  COUNT(*)
) FROM datasets WHERE active = true GROUP BY domain;
```

## Implementation

### View: `v_public_impact`
Created via migration, accessible to `anon` role:

```sql
CREATE OR REPLACE VIEW public.v_public_impact AS
SELECT
  COUNT(DISTINCT ds.id) AS total_datasets,
  COALESCE(SUM(p.amount_paid), 0) AS total_revenue,
  COUNT(DISTINCT p.user_id) AS total_contributors,
  COUNT(DISTINCT ds.domain) AS active_domains,
  jsonb_object_agg(
    COALESCE(ds.domain, 'unknown'),
    COUNT(DISTINCT ds.id)
  ) FILTER (WHERE ds.domain IS NOT NULL) AS datasets_by_domain,
  (SELECT COUNT(*) FROM curated_pool WHERE confidence_score >= 0.85) AS high_quality_records
FROM datasets ds
LEFT JOIN purchases p ON p.dataset_id = ds.id AND p.status = 'completed'
WHERE ds.active = true;

GRANT SELECT ON public.v_public_impact TO anon;
```

### Frontend Component: `DataImpactCounter.tsx`
- Fetches from `v_public_impact` view
- No auth required (uses anon key)
- Updates every 30 seconds
- Displays animated counters

### Homepage Integration
```tsx
<DataImpactCounter />
```

Shows:
- 📊 X Datasets Available
- 💰 $X Revenue Generated
- 🌍 X Contributors
- 🎯 X Active Domains
- ⭐ X High-Quality Records

## Domain Diversification Score

**Green Banner** if `active_domains >= 4`:
```tsx
{impactData.active_domains >= 4 && (
  <Badge variant="success" className="mt-2">
    ✅ Multi-Domain Coverage Active
  </Badge>
)}
```

## Privacy & Security

- No PII exposed
- Aggregated counts only
- RLS enforced (view uses public data)
- No user_id or email visible

## Performance

- View materialized every 5 minutes (optional)
- Cached on frontend for 30s
- Indexed columns: `datasets.active`, `purchases.status`, `curated_pool.confidence_score`
