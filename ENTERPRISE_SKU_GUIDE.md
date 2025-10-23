# Enterprise SKU Guide

## Overview

DataForEarth offers premium Enterprise SKUs for high-value clients requiring enhanced data quality, support, and guarantees. This guide covers enterprise features, pricing, and technical implementation.

## Enterprise Features

### 🏢 Enterprise Grade Datasets

**Designation**: `enterprise_grade = true`

**Criteria**:
- ✅ Gold or Platinum quality tier
- ✅ Multi-source validation (3+ independent sources)
- ✅ Expert domain review
- ✅ Legal compliance documentation
- ✅ SLA-backed availability (99.9% uptime)
- ✅ Indemnification clause
- ✅ Priority support (4-hour response time)
- ✅ Custom licensing options

**Database Schema**:
```sql
ALTER TABLE datasets
ADD COLUMN enterprise_grade boolean DEFAULT false;

ALTER TABLE curated_pool
ADD COLUMN enterprise_grade boolean DEFAULT false;
```

**Pricing Premium**: 2-3x standard tier pricing

---

## SKU Types

### 1. Limited Edition Drops

**Feature**: `limited_supply = integer`

**Description**: Scarcity-driven datasets with finite licenses

**Example**:
```sql
INSERT INTO datasets (
  name,
  batch_number,
  limited_supply,
  enterprise_grade,
  price
) VALUES (
  'Carbon Futures Q4 2024 - Conference Edition',
  42,
  50, -- Only 50 licenses
  true,
  999.99
);
```

**Marketing**:
```
🔥 Limited Edition: Only 50 licenses available
📦 Batch #42 - Conference Edition
💎 Enterprise Grade - SLA Included
🎟️ 37 remaining
```

**Use Case**:
- Conference-timed releases
- Industry event exclusives
- Anchor client onboarding

**Dynamic Pricing**: Price increases as supply depletes
```typescript
const priceMultiplier = 1 + (0.5 * (1 - remainingSupply / totalSupply));
// 50 remaining: 1.0x
// 25 remaining: 1.25x
// 10 remaining: 1.4x
// 1 remaining: 1.5x
```

---

### 2. Batch Collections

**Feature**: `batch_number = integer`

**Description**: Numbered dataset "drops" for collectibility

**Example**:
```sql
INSERT INTO datasets (name, batch_number, category)
VALUES 
  ('EV Adoption Trends - Batch #10', 10, 'ev_adoption'),
  ('Carbon Offset Projects - Batch #42', 42, 'carbon_offsets'),
  ('Renewable Energy Q4 - Batch #100', 100, 'renewable_energy');
```

**Collectibility**:
- Milestone batches (e.g., Batch #100) priced higher
- Anniversary editions
- First-of-kind releases

**Marketing**:
```
📦 Batch #100 - Centennial Edition
🎉 Released: October 23, 2025
💎 Collector's Item
```

---

### 3. Enterprise Contracts

**Description**: Custom multi-dataset bundles for Fortune 500 clients

**Pricing**: Starting at $50,000/year

**Includes**:
- Unlimited access to all Gold+ datasets
- Priority data requests (custom scraping)
- Dedicated account manager
- Monthly briefings on new releases
- White-label options
- API quota: 10,000 requests/day
- SLA: 99.9% uptime, 4-hour support response

**Contract Terms**:
- Minimum 1-year commitment
- Auto-renewal with 90-day notice to cancel
- Indemnification up to $1M
- NDA and MSA included

**Target Clients**:
- Climate risk modeling firms
- ESG rating agencies
- Government environmental agencies
- Fortune 500 sustainability teams

---

## Pricing Strategy

### Tier-Based Pricing

| Quality Tier | Standard | Enterprise | Limited Edition |
|--------------|----------|------------|-----------------|
| Bronze | $0-$50 | N/A | N/A |
| Silver | $50-$200 | $100-$400 | $150-$600 |
| Gold | $200-$1000 | $500-$2500 | $750-$3500 |
| Platinum | $1000+ | $2500+ | $5000+ |

**Enterprise Multiplier**: 2-3x standard pricing  
**Limited Edition Multiplier**: 1.5-2x enterprise pricing

---

### Dynamic Pricing (Limited Supply)

```typescript
function calculateDynamicPrice(
  basePrice: number,
  limitedSupply: number,
  purchasedCount: number
): number {
  const remaining = limitedSupply - purchasedCount;
  const scarcityMultiplier = 1 + (0.5 * (1 - remaining / limitedSupply));
  return basePrice * scarcityMultiplier;
}

// Example:
// Base price: $1000
// Limited supply: 50
// Purchased: 40 (10 remaining)
// Price: $1000 * (1 + 0.5 * (1 - 10/50)) = $1000 * 1.4 = $1400
```

**Implementation**:
- Price recalculated on every checkout
- Display "Price increases as supply depletes" warning
- Update price in Stripe dynamically

---

## SLA Commitments

### Uptime Guarantee

**99.9% availability** (8.76 hours downtime per year)

**Monitoring**:
- Pingdom external checks
- Internal health checks every 60 seconds
- Automated failover to backup infrastructure

**Penalties**:
- <99.9%: 10% credit
- <99.0%: 25% credit
- <95.0%: 50% credit

---

### Support Response Times

| Severity | Enterprise | Standard |
|----------|------------|----------|
| Critical | 1 hour | 24 hours |
| High | 4 hours | 72 hours |
| Medium | 1 business day | 1 week |
| Low | 3 business days | Best effort |

**Critical**: Dataset unavailable, API down  
**High**: Data quality issue, incorrect pricing  
**Medium**: Feature request, minor bug  
**Low**: General inquiry, documentation update

---

## Legal Protections

### Indemnification Clause

**Coverage**: Up to $1,000,000 per incident

**Protects Against**:
- Data inaccuracies leading to financial loss
- Licensing disputes
- Third-party IP claims

**Exclusions**:
- Willful misuse of data
- Breach of license terms
- Force majeure events

---

### Data Licensing

**Standard License**:
- Single organization use
- No redistribution
- No derivative sales
- Attribution required

**Enterprise License**:
- Multi-subsidiary use
- Internal redistribution allowed
- White-label options available
- Attribution waived (optional)

**Perpetual License** (add-on):
- +50% one-time fee
- Access to dataset even if removed from marketplace
- No subscription required

---

## Technical Implementation

### Flagging Enterprise Datasets

**Admin UI** (`/admin/review`):

Checkbox to mark items as enterprise-grade:
```tsx
<Checkbox
  checked={item.enterprise_grade}
  onCheckedChange={(checked) => 
    updateItem(item.id, { enterprise_grade: checked })
  }
/>
```

**Build Dataset Function**:
```typescript
const enterpriseItems = await supabase
  .from('curated_pool')
  .select('*')
  .eq('enterprise_grade', true)
  .gte('confidence_score', 0.85);
```

---

### Limited Supply Tracking

**Decrement on Purchase**:
```sql
UPDATE datasets
SET limited_supply = limited_supply - 1
WHERE id = :dataset_id
AND limited_supply > 0;
```

**Sold Out Check**:
```sql
SELECT * FROM datasets
WHERE id = :dataset_id
AND (limited_supply IS NULL OR limited_supply > 0);
```

**UI Display**:
```tsx
{dataset.limited_supply && (
  <Badge variant="destructive">
    🔥 {dataset.limited_supply} remaining
  </Badge>
)}
```

---

### Batch Numbering

**Auto-increment**:
```sql
-- Get next batch number for category
SELECT COALESCE(MAX(batch_number), 0) + 1 as next_batch
FROM datasets
WHERE category = :category;
```

**Insert with batch number**:
```sql
INSERT INTO datasets (name, batch_number, category, ...)
VALUES (
  'Carbon Offset Projects Q4 2024',
  42,
  'carbon_offsets',
  ...
);
```

---

## Marketing Assets

### Email Template (Enterprise Sale)

```
Subject: 🎉 Welcome to DataForEarth Enterprise

Dear [Client Name],

Thank you for your purchase of:

📦 Carbon Futures Q4 2024 - Batch #42
💎 Enterprise Grade Dataset
🔥 Limited Edition (1 of 50)

Your dataset includes:
✅ 150 high-confidence records
✅ Multi-source validation (4 independent sources)
✅ 99.9% uptime SLA
✅ Priority support (4-hour response)
✅ Full legal indemnification

Download: [Link]
Documentation: [Link]
Support: support@dataforearth.com

---
DataForEarth Team
```

---

### Product Page Banner

```tsx
{dataset.enterprise_grade && (
  <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 rounded-lg mb-6">
    <h3 className="text-2xl font-bold text-white mb-2">
      💎 Enterprise Grade Dataset
    </h3>
    <ul className="text-white space-y-1">
      <li>✅ 99.9% Uptime SLA</li>
      <li>✅ Multi-Source Validation</li>
      <li>✅ Priority Support</li>
      <li>✅ Legal Indemnification</li>
    </ul>
  </div>
)}
```

---

## Analytics & Reporting

### Enterprise Dashboard

Query enterprise dataset performance:
```sql
SELECT 
  d.name,
  d.batch_number,
  d.limited_supply,
  COUNT(p.id) as purchases,
  SUM(p.amount_paid) as revenue,
  AVG(d.confidence_score) as avg_confidence
FROM datasets d
LEFT JOIN purchases p ON d.id = p.dataset_id
WHERE d.enterprise_grade = true
GROUP BY d.id
ORDER BY revenue DESC;
```

### Limited Edition Tracking

```sql
SELECT 
  name,
  batch_number,
  limited_supply,
  limited_supply - COUNT(p.id) as remaining,
  (COUNT(p.id)::float / limited_supply) * 100 as percent_sold
FROM datasets d
LEFT JOIN purchases p ON d.id = p.dataset_id
WHERE limited_supply IS NOT NULL
GROUP BY d.id;
```

---

**Last Updated**: 2025-10-23
**Maintained by**: DataForEarth Platform Team
