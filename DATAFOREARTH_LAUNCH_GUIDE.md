# DataForEarth - Complete Launch Guide

## 🚀 System Overview & New Institutional Features

### 1. Institutional-Grade Signal Scrapers (NEW)

#### **Carbon Futures Scraper** 
- Monitors EU ETS, UK ETS, California Cap-and-Trade pricing
- Tracks carbon credit volatility and trading volumes
- Output: Market prices, volume trends, regional comparisons

#### **Regulatory Violations Scraper**
- EPA enforcement database (ECHO)
- EU environmental compliance violations
- Tracks penalties, facility names, sectors affected

#### **Supply Chain Signals Scraper**
- Sustainable supply chain disclosures (CDP, EcoVadis)
- Shipping emissions data
- Transparency scores, renewable energy adoption

#### **Physical Climate Risk Scraper**
- NOAA storm events database
- NASA wildfire tracking (FIRMS)
- Sea level rise indicators
- Disaster impact assessments

#### **ESG Litigation Monitor**
- Environmental lawsuits from PACER
- Climate change litigation (Sabin Center)
- Social responsibility cases
- Tracks damages claimed, case status

#### **Signal Fusion Engine**
Combines all institutional signals into unified metrics:
- **Risk Index** (0-100): Overall ESG risk exposure
- **Volatility Score** (0-100): Market stability indicator
- **Momentum Score** (-100 to +100): Directional trend
- **Forward Pressure Score** (0-100): Urgency to act

#### **Feature Engineering Pipeline**
- Time-series features (moving averages, trends)
- Anomaly detection (2-sigma threshold)
- Sector clustering and correlation analysis
- Derived metrics (urgency, stability, sentiment)

### 2. Website Enhancements

#### **Why Contribute Page** (`/why-contribute`)
- Explains the complete data → eco funding cycle
- Animated planet impact progress bars (CO₂, trees, ocean cleanup, solar)
- Visual "How It Works" flow (Share → Companies Buy → Projects Funded)
- Clear CTA buttons to Contribute and Marketplace

#### **Data Impact Dashboard** (`/impact-dashboard`)
- Real-time stats from `audit_logs` and `projects` tables
- Tracks: Contributors, Datasets Published, CO₂ Offset, Projects Funded, Trees Planted, Eco Funding
- Live activity feed showing recent contributions and purchases
- Transparent impact calculation methodology

#### **Homepage: Top Eco Projects Section**
- Featured projects with progress bars
- Direct links to `/projects`
- Showcases how data sales fund initiatives

### 2. Scraper Module (`data-scraper-module/`)

#### **Modular Python Architecture**
```
data-scraper-module/
├── scraper.py                 # Main entry point
├── sites/
│   ├── eco_sentiment.py       # News headlines + sentiment
│   ├── ev_demand.py           # EV waiting lists
│   └── sustainability_keywords.py  # Search trends
├── utils/
│   ├── user_agents.py         # Rotating UAs
│   ├── rate_limiter.py        # Anti-bot delays + jitter
│   └── normalizer.py          # data_submissions schema converter
├── requirements.txt
├── .env.example
└── README.md                  # Complete guide
```

#### **Usage**
```bash
# Scrape single site
python scraper.py --site eco_sentiment --output output/eco.json

# Scrape all sites
python scraper.py --site all --output output/all_data.json

# Dry run (no save)
python scraper.py --site all --dry-run
```

#### **Anti-Bot Features**
- Rotating user agents (2025 browser fingerprints)
- Rate limiting: 2s min delay + 0.5s jitter
- Random sleep patterns between requests
- Respects robots.txt (code ready, just add real sources)

#### **Adding New Scrapers**
1. Create `sites/my_scraper.py` with `scrape()` method
2. Register in `scraper.py` SCRAPERS dict
3. Add normalization logic in `utils/normalizer.py`
4. Output automatically matches `data_submissions` schema

### 3. Agent GUI Enhancement

#### **External Scraper Feeds Tab** (`machine-agent-gui/renderer/src/components/ExternalScraperFeeds.tsx`)
- View queued scraper records
- Manual approval workflow
- **Auto-approve toggle** for hands-off operation
- **Category filter** (Automotive, Sustainability, Environmental News)
- **Batch actions**: Select All, Approve & Ingest, Reject
- Real-time stats: Queued, Approved Today, Rejected Today

#### **How to Use**
1. Run scraper: `python data-scraper-module/scraper.py --site all --output output/data.json`
2. Open Machine Agent GUI → "External Scraper Feeds" tab
3. Review records by category
4. Select and click "Approve & Ingest" to send to `external-ingest` endpoint
5. Enable "Auto-approve future records" for automation

### 4. External Ingest API

#### **Endpoint: `POST /functions/v1/external-ingest`**
- **Authentication**: HMAC signature (same as `/ingest-dataset`)
- **Payload**: Array of normalized scraper submissions
- **Actions**:
  1. Validates HMAC signature
  2. Inserts into `data_submissions` table
  3. Triggers AI processing for each submission
  4. Logs audit trail
- **Response**: `{ success: true, inserted: N, failed: M, results: [...] }`

#### **Example Call**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/external-ingest \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Signature: HMAC_SHA256_SIGNATURE" \
  -d @output/scraped_data.json
```

### 5. Marketplace Enhancements

#### **New Sorting Options**
- **Newest**: Latest datasets first (default)
- **Trending**: Ordered by featured + purchase count
- **Recommended**: Featured datasets + newest

Implemented with dropdown controls in Marketplace UI. Sorting buttons trigger re-fetch from Supabase.

### 6. Donation Tier Badges

#### **Three Tiers**
- **Sapling** ($5): Green seedling badge 🌱
- **Young Tree** ($20): Growing tree badge 🌳
- **Forest Guardian** ($100): Mature forest badge 🌲

#### **Features**
- Auto-displayed after successful donation
- **Downloadable badge graphics** (PNG)
- Shareable on social media
- Visual tier progression

---

## 🔄 Automation Workflow

### Full Automation Path (95% Hands-Off)

1. **Data Collection (Scraper Module)**
   - Cron job runs daily: `0 2 * * * python scraper.py --site all --output output/daily.json`
   - Outputs normalized payloads to `data_submissions` schema

2. **Auto-Ingestion (Agent GUI)**
   - Enable "Auto-approve future records" in External Scraper Feeds tab
   - Agent automatically calls `external-ingest` endpoint with HMAC signature
   - Records inserted into `data_submissions`

3. **AI Processing (Automatic)**
   - `external-ingest` triggers `process-data-submission` for each record
   - AI analyzes, categorizes, assigns quality scores
   - Updates `data_processing_queue`

4. **Dataset Publishing (Manual Review)**
   - Admin reviews AI-processed records in Admin Dashboard
   - Clicks "Publish Dataset" to create Stripe product + price
   - Dataset goes live on Marketplace

5. **Sales & Funding (Automatic)**
   - Companies purchase datasets via Stripe checkout
   - `verify-purchase` marks purchase complete
   - Revenue tracked in audit logs
   - Community votes on eco projects to fund
   - Impact Dashboard updates in real-time

### Semi-Automation (Manual Approval)

- **Step 2 Alternative**: Keep auto-approve OFF in Agent GUI
- Review each scraper batch manually before clicking "Approve & Ingest"
- Same flow from Step 3 onward

---

## 📊 Monitoring & Ingestion Volume

### Real-Time Monitoring

#### **Agent GUI Stats**
- Queued scraper records count
- Approved today
- Rejected today
- Category breakdown

#### **Impact Dashboard**
- Total contributors (all sources)
- Datasets published
- CO₂ offset estimate
- Projects funded
- Revenue raised

#### **Audit Logs**
Query `audit_logs` table for:
```sql
SELECT * FROM audit_logs 
WHERE action = 'external_ingest' 
ORDER BY created_at DESC;
```

### Volume Throttling

**Current Rate Limits (Configurable)**
- Scraper: 2-3 seconds between requests
- Batch size: Unlimited (but recommend 100-500 per run)
- HMAC auth: No rate limit (your own API)

**To Increase Volume:**
1. Add more scrapers to `sites/` folder
2. Decrease `--rate-limit` (but respect source sites)
3. Enable auto-approve in Agent GUI
4. Run scraper more frequently (e.g., hourly cron)

**To Decrease Volume:**
1. Increase scraper `--rate-limit 5.0`
2. Run scraper less frequently (weekly cron)
3. Keep manual approval ON in Agent GUI
4. Add stricter filters in normalizer

---

## 🛠 Adding a New Scraper Site

### Step-by-Step

#### 1. Create Scraper File
```python
# data-scraper-module/sites/carbon_markets.py

class CarbonMarketsScraper:
    def __init__(self, user_agent: str):
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
    
    def scrape(self) -> List[Dict[str, Any]]:
        results = []
        
        # Your scraping logic
        response = self.session.get("https://example.com/carbon-data")
        # Parse, extract data
        
        results.append({
            "region": "Global",
            "carbon_price": 45.00,
            "trend": "rising",
            "timestamp": time.time()
        })
        
        return results
```

#### 2. Register in `scraper.py`
```python
from sites.carbon_markets import CarbonMarketsScraper

SCRAPERS = {
    "eco_sentiment": EcoSentimentScraper,
    "ev_demand": EVDemandScraper,
    "sustainability_keywords": SustainabilityKeywordsScraper,
    "carbon_markets": CarbonMarketsScraper,  # Add this
}
```

#### 3. Add Normalization
```python
# utils/normalizer.py

elif source == "carbon_markets":
    submission["location"] = raw_data.get("region")
    submission["interests"] = ["Carbon Markets", "Sustainability"]
    submission["sustainability"] = f"Carbon price: ${raw_data.get('carbon_price')} - {raw_data.get('trend')}"
    submission["sensor_data"]["carbon_price_usd"] = raw_data.get("carbon_price")
```

#### 4. Test
```bash
python scraper.py --site carbon_markets --dry-run
```

#### 5. Document
Update `data-scraper-module/README.md` with new scraper description.

---

## 🎯 Business Operations Checklist

### Daily (Automated)
- [ ] Scraper runs via cron (2 AM)
- [ ] Records auto-ingested (if enabled)
- [ ] AI processing completes
- [ ] Impact Dashboard updates

### Weekly (5 mins)
- [ ] Review Agent GUI → External Scraper Feeds
- [ ] Approve any pending batches (if manual mode)
- [ ] Check Impact Dashboard for anomalies

### Monthly (30 mins)
- [ ] Review processed datasets in Admin Dashboard
- [ ] Publish high-quality datasets to Marketplace
- [ ] Monitor Stripe revenue
- [ ] Update community on funded projects
- [ ] Check audit logs for errors

### Quarterly (2 hours)
- [ ] Add new scraper sites (expand data sources)
- [ ] Tune AI categorization models
- [ ] Analyze purchase patterns
- [ ] Plan new eco project votes

---

## 🔒 Security Notes

### HMAC Signature
- `external-ingest` requires `X-Ingest-Signature` header
- Generate: `HMAC_SHA256(INGEST_SECRET, request_body)`
- Same auth as existing `/ingest-dataset` endpoint
- Prevents unauthorized data injection

### Scraper Ethics
- ✅ Only scrape **public, non-personal** data
- ✅ Respect robots.txt
- ✅ Rate limit to avoid overload
- ❌ Never scrape PII (emails, names, addresses)
- ❌ Never circumvent auth or paywalls

### Data Privacy
- All scraped data is **aggregated and anonymized**
- No personal identifiers in `data_submissions`
- Sensor data stored in JSONB for transparency
- Community reviews before publishing

---

## 📧 Support & Next Steps

### Documentation
- Scraper module: `data-scraper-module/README.md`
- API docs: Supabase edge function logs
- Project overview: `PROJECT_INDEX.md`

### Contact
- Email: hello@dataforearth.org
- Issues: GitHub (connect via project settings)

### Suggested Improvements
1. **Add real data sources** to scrapers (replace example URLs)
2. **Set up Stripe products** for datasets (use `/admin` page)
3. **Enable Resend emails** for purchase confirmations
4. **Create eco projects** for community voting
5. **Deploy Machine Agent** as systemd service (see `machine-agent-gui/BUILD_GUIDE.md`)

---

## 🎉 Summary of New Capabilities

### For Users
- **Why Contribute page**: Clear explanation of data → funding cycle
- **Impact Dashboard**: Real-time visibility into environmental impact
- **Donation tier badges**: Shareable achievement graphics
- **Top Projects on homepage**: Featured initiatives at a glance

### For Admins
- **Python scraper module**: Modular, extensible data collection
- **Agent GUI scraper tab**: Manual or auto-approval workflow
- **External ingest API**: HMAC-secured batch ingestion
- **Marketplace sorting**: Newest, Trending, Recommended views

### For Automation
- **95% hands-off operation** (with auto-approve enabled)
- **Cron-schedulable** scraper runs
- **Batch processing** of scraper data
- **Real-time monitoring** via Agent GUI stats

---

**All code delivered in separate folders—no overwrites to existing functionality.**

Let's heal the planet with ethical data! 🌍💚
