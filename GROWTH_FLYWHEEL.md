# Growth Flywheel - DataForEarth Marketing Automation

## Concept
Self-reinforcing growth loop where data quality → sales → revenue → more scrapers → better data → more sales.

## Flywheel Stages

### Stage 1: Acquire High-Quality Data
- Multi-domain scrapers harvest public signals
- AI classifies, deduplicates, scores confidence
- Curated pool grows with platinum/gold tier items

### Stage 2: Package Premium Datasets
- Admin builds datasets with domain/region/sector filters
- Enterprise-grade flagging for high-confidence items
- Limited supply scarcity (batch numbers)

### Stage 3: Market Aggressively
- AI Marketing Assistant drafts campaigns
- Segment by domain interest (hedge funds → macro, NGOs → climate)
- Shareable dataset cards with referral links

### Stage 4: Capture Revenue
- Stripe checkout with dynamic pricing
- Badge code distribution for donors
- External marketplace autopublish (HuggingFace, Kaggle)

### Stage 5: Reinvest in Harvesting
- Revenue funds scraper expansion
- Add specialized targets based on trend signals
- Burst releases for high-demand domains

### Stage 6: Community Growth
- Gamified badge system (Bronze → Platinum donors)
- Public impact metrics (anonymous)
- Partner landing pages for NGOs/enterprises

## Key Metrics

### Input Metrics
- Curated pool growth rate (records/week)
- Domain diversification (# active domains)
- Average confidence score

### Output Metrics
- Dataset sales velocity
- Revenue per domain
- Referral conversion rate
- Badge claim rate

### Flywheel Velocity
```
Velocity = (Sales Growth % + Quality Growth %) / Time
```

Target: 15% monthly velocity increase

## Automation Triggers

### 1. Low Inventory Alert
```sql
SELECT domain FROM curated_pool
GROUP BY domain
HAVING COUNT(*) < 100;
```
→ Trigger scraper for that domain

### 2. High Demand Detection
```sql
SELECT domain FROM datasets d
JOIN purchases p ON p.dataset_id = d.id
WHERE p.created_at > now() - interval '7 days'
GROUP BY domain
HAVING COUNT(*) > 10;
```
→ Suggest burst release + price increase

### 3. Stale Dataset Warning
```sql
SELECT * FROM datasets
WHERE created_at < now() - interval '30 days'
  AND active = true
  AND download_count < 5;
```
→ Send promotional email / reduce price

## Campaign Templates

### Hedge Funds (Macro/Market Domain)
Subject: "Proprietary Climate-Macro Signals Dataset"
Body:
- Highlight confidence scores (0.85+)
- Emphasize limited supply
- Include external marketplace links (social proof)

### NGOs (Climate/ESG Domain)
Subject: "Open Climate Data for Impact Measurement"
Body:
- Emphasize ethical sourcing
- Offer bulk discount for verified NGOs
- Badge partnership program

### EV Startups (Mobility/Energy Domain)
Subject: "EV Charging Infrastructure Trends"
Body:
- Real-time charging station data
- Regional breakdowns
- Competitive intelligence

## Referral System

- Each purchase generates shareable link: `dataforearth.org/r/{purchase_id}`
- 10% discount for referee
- $5 credit for referrer
- Track via `referral_code` in purchases table

## Badge Gamification

**Tiers**:
- Bronze: $1-49 spent
- Silver: $50-199 spent
- Gold: $200-999 spent
- Platinum: $1000+ spent

**Benefits**:
- Early access to new datasets
- Exclusive domain reports
- Partner network invitations

## Partner Program

**Target Partners**:
- Universities (research access)
- NGOs (bulk licensing)
- Enterprises (custom datasets)

**Landing Page**: `/partners`
- Partnership inquiry form
- Case studies
- Tiered pricing (on-demand, subscription, custom)
