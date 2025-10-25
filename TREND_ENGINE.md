# Trend Engine - DataForEarth Multi-Domain Analytics

## Purpose
The Trend Engine analyzes visitor behavior, dataset performance, and domain demand to optimize:
- Release timing
- Pricing strategies
- Scraper targeting
- Marketing campaigns

## Data Sources

### 1. Visitor Analytics
- `visitor_analytics` table tracks page views, referrers, device types
- High-traffic dataset pages indicate demand
- Geographic distribution guides region targeting

### 2. Dataset Performance
- `purchases` table tracks sales velocity
- `download_count` and `last_downloaded_at` measure engagement
- Domain-level revenue aggregation

### 3. Curated Pool Quality
- `curated_pool` confidence scores by domain
- Quality tier distribution
- Freshness (created_at timestamps)

### 4. Tag Trends
- Frequency analysis of tags across curated items
- Category acceleration (growth rate)

## Trend Signals Generated

### Domain Acceleration Score
```sql
SELECT
  domain,
  COUNT(*) AS total_records,
  SUM(CASE WHEN created_at > now() - interval '7 days' THEN 1 ELSE 0 END) AS recent_records,
  (SUM(CASE WHEN created_at > now() - interval '7 days' THEN 1 ELSE 0 END)::float / COUNT(*)) AS acceleration
FROM curated_pool
WHERE domain IS NOT NULL
GROUP BY domain
ORDER BY acceleration DESC;
```

### High-Demand Domains
```sql
SELECT
  d.domain,
  COUNT(p.id) AS purchase_count,
  SUM(p.amount_paid) AS total_revenue
FROM datasets d
JOIN purchases p ON p.dataset_id = d.id
WHERE p.status = 'completed'
  AND p.created_at > now() - interval '30 days'
GROUP BY d.domain
ORDER BY total_revenue DESC
LIMIT 5;
```

### Tag Velocity
```sql
SELECT
  unnest(tags) AS tag,
  COUNT(*) AS frequency,
  AVG(confidence_score) AS avg_confidence
FROM curated_pool
WHERE created_at > now() - interval '14 days'
GROUP BY tag
ORDER BY frequency DESC
LIMIT 20;
```

## Automated Actions

### 1. Burst Mode Recommendations
- If domain acceleration > 2.0 AND curated_pool count > 500:
  → Suggest burst release for that domain

### 2. Scraper Focus
- If curated_pool(domain X) < 100 records:
  → Trigger scraper for domain X
- If tag velocity spikes (e.g., "renewable_energy" +300%):
  → Add specialized scraper

### 3. Pricing Adjustments
- High-demand domains (top 3 by revenue):
  → Suggest 15-20% price increase
- Low-demand domains (bottom 3):
  → Suggest promotional pricing

### 4. Marketing Targeting
- Domain with highest purchase_count but lowest avg_confidence:
  → Target enterprise customers (explain "rough diamond" opportunity)
- Domain with highest confidence but low sales:
  → Target academic/research institutions

## UI Integration

### Admin Dashboard Widgets
- `/admin/trending` page showing:
  - Domain acceleration chart
  - Tag cloud (sized by velocity)
  - Revenue by domain (last 30 days)
  - Recommended actions (burst releases, scraper targets)

### Dataset Builder
- Pre-fill suggestions based on trends:
  - "Climate domain accelerating +250% this week"
  - "Market domain has high enterprise demand"

## Implementation Notes
- Trends computed via edge function: `/functions/v1/compute-trends`
- Cached for 1 hour in `trends_cache` table
- UI fetches cached trends on admin page load
