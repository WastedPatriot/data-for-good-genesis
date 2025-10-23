# Quality Tiers & Scoring

## Overview

DataForEarth uses a four-tier quality system to classify data based on completeness, accuracy, provenance, and enterprise-readiness. This enables strategic pricing, targeted marketing, and trust signals for buyers.

## Tier Definitions

### 🥉 Bronze Tier
**Description**: Basic, usable data with minimal verification

**Criteria**:
- Confidence score: 0.50 - 0.69
- Minimal metadata
- Single source verification
- May have missing fields
- Community-contributed
- Self-reported provenance

**Use Cases**:
- Academic research (exploratory)
- Hobbyist projects
- Public good datasets
- Free or low-cost offerings

**Pricing**: $0 - $50 per dataset

---

### 🥈 Silver Tier
**Description**: Verified data with good completeness

**Criteria**:
- Confidence score: 0.70 - 0.84
- Complete required fields
- Cross-referenced with 2+ sources
- Minimal missing data (<10%)
- Admin-reviewed
- Clear provenance chain

**Use Cases**:
- Standard commercial use
- App integrations
- Basic ML training
- Internal analytics

**Pricing**: $50 - $200 per dataset

---

### 🥇 Gold Tier
**Description**: High-quality, enterprise-ready data

**Criteria**:
- Confidence score: 0.85 - 0.94
- All fields complete
- Multi-source validation (3+ sources)
- Expert review conducted
- Strong provenance documentation
- No duplicates
- Structured metadata

**Use Cases**:
- Enterprise applications
- Production ML models
- Regulatory compliance
- Public reporting
- B2B contracts

**Pricing**: $200 - $1000 per dataset

---

### 💎 Platinum Tier
**Description**: Premium, certified data with guarantees

**Criteria**:
- Confidence score: 0.95 - 1.0
- Certified by domain experts
- Real-time or near-real-time
- SLA-backed availability
- Multi-vendor validation (4+ sources)
- Audit trail included
- Legal indemnification
- Enterprise-grade provenance

**Use Cases**:
- Mission-critical systems
- Financial modeling
- Climate risk assessment
- Government contracts
- High-stakes decision-making

**Pricing**: $1000+ per dataset

**Additional Features**:
- Priority support
- Custom data requests
- Early access to updates
- Dedicated account manager

---

## Confidence Score Calculation

Confidence score is a **0-1 numeric value** computed from multiple factors:

### Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| **Completeness** | 30% | % of required fields filled |
| **Cross-validation** | 25% | Number of independent sources confirming data |
| **Provenance** | 20% | Quality of source documentation |
| **Recency** | 15% | Age of data (newer = higher score) |
| **Expert Review** | 10% | Human expert validation |

### Formula

```
confidence = (
  (completeness * 0.30) +
  (cross_validation * 0.25) +
  (provenance_quality * 0.20) +
  (recency_score * 0.15) +
  (expert_review * 0.10)
)
```

**Example Calculation**:
```
Item A:
- Completeness: 95% → 0.95
- Cross-validation: 3 sources → 0.75 (0.25 per source, capped at 1.0)
- Provenance: Strong → 0.90
- Recency: 2 weeks old → 0.95
- Expert Review: Yes → 1.0

confidence = (0.95 * 0.30) + (0.75 * 0.25) + (0.90 * 0.20) + (0.95 * 0.15) + (1.0 * 0.10)
           = 0.285 + 0.1875 + 0.18 + 0.1425 + 0.10
           = 0.895
           → Gold Tier
```

### Automated Scoring

**Function**: Applied during data ingestion

**Edge Functions**:
- `contrib-handoff-for-review`: Scores user submissions
- `scrape-batch-handoff-for-review`: Scores scraped data

**Storage**:
```sql
CREATE TABLE review_queue (
  ...
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  quality_tier text NOT NULL CHECK (quality_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  ...
);
```

### Manual Override

Admins can **adjust** confidence scores and quality tiers during review:

**Use Cases**:
- Expert domain knowledge identifies inaccuracies
- Additional validation completed post-submission
- Tier upgrade for strategic releases

**UI**: `/admin/review` → Edit item → Adjust score → Save

---

## Enterprise Grade Flag

**Special Designation**: `enterprise_grade = true`

**Criteria** (in addition to Gold/Platinum tier):
- ✅ Legal compliance documentation
- ✅ SLA commitments
- ✅ Indemnification clause
- ✅ Priority support
- ✅ Custom licensing options
- ✅ Dedicated account manager

**Pricing Premium**: 2-3x standard tier pricing

**Use Case**: Fortune 500 clients, government agencies, regulated industries

---

## Limited Supply Marking

**Feature**: `limited_supply = integer`

**Purpose**: Create scarcity for high-value datasets

**Example**:
```sql
UPDATE curated_pool
SET limited_supply = 50,
    enterprise_grade = true
WHERE id = :high_value_item_id;
```

**UI Display**:
```
🔥 Limited Edition: Only 50 licenses available
```

**Pricing Strategy**: Dynamic pricing increases as supply depletes

---

## Batch Numbering

**Feature**: `batch_number = integer`

**Purpose**: Track dataset "drops" for collectibility

**Example**:
```sql
INSERT INTO datasets (name, batch_number, ...)
VALUES ('Carbon Offset Projects Q4 2024', 42, ...);
```

**Marketing**:
```
📦 Batch #42 - Limited Edition
Released: October 23, 2025
```

**Use Case**: 
- Conference-timed releases
- Anniversary editions
- Themed collections

---

## Quality Tier Distribution (Target)

For healthy marketplace:

| Tier | % of Datasets |
|------|---------------|
| Bronze | 20% |
| Silver | 45% |
| Gold | 30% |
| Platinum | 5% |

**Why?**:
- Bronze: Onboarding, free datasets, community goodwill
- Silver: Bulk of commercial offerings
- Gold: Premium revenue driver
- Platinum: Anchor clients, reputation builder

---

## Tier Upgrade Path

Items can be **promoted** through tiers:

1. **Bronze → Silver**: Complete missing fields, add 2nd source
2. **Silver → Gold**: Expert review, add 3rd source
3. **Gold → Platinum**: SLA commitment, audit trail

**Trigger**: Admin or automated quality improvement

---

## Display in UI

### Marketplace (`/marketplace`)

**Badges**:
```tsx
<Badge variant={
  tier === 'platinum' ? 'default' :
  tier === 'gold' ? 'secondary' :
  'outline'
}>
  {tier.toUpperCase()}
</Badge>
```

**Colors**:
- Platinum: Gold gradient
- Gold: Yellow
- Silver: Gray
- Bronze: Brown

### Dataset Detail Page

**Quality Score Card**:
```
Quality Score: 0.87 / 1.00 ⭐⭐⭐⭐☆
Tier: Gold 🥇
Confidence: 87%
Sources: 3 independent validators
Last Updated: 2025-10-20
Enterprise Grade: Yes ✓
```

---

**Last Updated**: 2025-10-23
**Maintained by**: DataForEarth Platform Team
