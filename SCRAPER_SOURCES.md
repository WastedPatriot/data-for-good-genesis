# DataForEarth Scraper Sources

## Overview
This document lists all approved data sources for the DataForEarth scraping module. Sources are selected based on ethical criteria: publicly available, non-PII, and focused on environmental/sustainability topics.

## Active Scrapers

### 1. Eco Sentiment Scraper
**File**: `data-scraper-module/sites/eco_sentiment.py`
**Purpose**: Aggregate public sentiment about environmental topics from news headlines and social media trends.

**Sources**:
- Google News RSS (environmental category)
- Public Reddit threads (r/environment, r/climate, r/sustainability)
- Twitter trending topics (environmental hashtags)

**Data Collected**:
- Headline/post text
- Sentiment score (positive/negative/neutral)
- Publication timestamp
- Source domain
- Engagement metrics (shares, likes)

**Frequency**: Daily
**Output Schema**:
```json
{
  "age_range": "Unknown",
  "location": "<inferred_from_source>",
  "interests": ["Environment", "Climate", "Sustainability"],
  "device_ownership": null,
  "ev_ownership": null,
  "sustainability": "Positive/Negative/Neutral sentiment",
  "sensor_data": {
    "scraper_source": "eco_sentiment",
    "headline": "<text>",
    "sentiment_score": 0.0-1.0,
    "engagement": 0,
    "url": "<source_url>"
  }
}
```

**Ethical Considerations**:
- ✅ Public data only (no login required)
- ✅ No personal identifiers
- ✅ Respects robots.txt
- ✅ Rate limited to avoid overload

---

### 2. EV Demand Scraper
**File**: `data-scraper-module/sites/ev_demand.py`
**Purpose**: Track public interest and wait times for electric vehicles worldwide.

**Sources**:
- Public EV forums (wait time threads)
- Manufacturer public delivery timelines
- Government EV incentive program data (public portals)
- Google Trends (EV-related search terms)

**Data Collected**:
- Region/country
- Average wait time (weeks)
- Interest score (0-100)
- Popular EV models
- Incentive availability

**Frequency**: Weekly
**Output Schema**:
```json
{
  "age_range": "Unknown",
  "location": "<region/country>",
  "interests": ["Automotive", "Electric Vehicles", "Sustainability"],
  "device_ownership": null,
  "ev_ownership": "Considering",
  "sustainability": "Interest in EV adoption",
  "sensor_data": {
    "scraper_source": "ev_demand",
    "wait_time_weeks": 0,
    "interest_score": 0-100,
    "popular_models": ["<model>"],
    "incentives_available": true/false
  }
}
```

**Ethical Considerations**:
- ✅ Aggregated regional data (no individual tracking)
- ✅ Public forum data only
- ✅ No scraping of private sales/order data
- ✅ Respects manufacturer API terms

---

### 3. Sustainability Keywords Scraper
**File**: `data-scraper-module/sites/sustainability_keywords.py`
**Purpose**: Monitor trending sustainability-related search terms and topics.

**Sources**:
- Google Trends (sustainability keywords)
- Public sustainability blogs (keyword frequency analysis)
- Government environmental reports (keyword extraction)
- Academic open-access journals (topic modeling)

**Data Collected**:
- Keyword phrase
- Search volume trend (rising/falling/stable)
- Related topics
- Geographic distribution
- Time period

**Frequency**: Weekly
**Output Schema**:
```json
{
  "age_range": "Unknown",
  "location": "Global",
  "interests": ["Sustainability", "Environment", "Research"],
  "device_ownership": null,
  "ev_ownership": null,
  "sustainability": "Interest in <keyword>",
  "sensor_data": {
    "scraper_source": "sustainability_keywords",
    "keyword": "<phrase>",
    "trend": "rising/falling/stable",
    "search_volume": 0,
    "related_topics": ["<topic>"],
    "geographic_distribution": {"<country>": "<percentage>"}
  }
}
```

**Ethical Considerations**:
- ✅ Aggregated search data (no individual queries)
- ✅ Open-access publications only
- ✅ No tracking of user behavior
- ✅ Respects API rate limits

---

## Planned Scrapers (Not Yet Implemented)

### 4. Carbon Footprint Data Scraper
**Purpose**: Aggregate publicly available carbon emissions data from companies and industries.
**Sources**: CDP (Carbon Disclosure Project), EPA reports, company sustainability reports.
**Status**: Design phase
**ETA**: Q2 2025

### 5. Renewable Energy Adoption Scraper
**Purpose**: Track renewable energy installations and adoption rates by region.
**Sources**: Government energy departments, public utility data, IRENA databases.
**Status**: Design phase
**ETA**: Q3 2025

### 6. Circular Economy Initiatives Scraper
**Purpose**: Monitor companies and cities implementing circular economy practices.
**Sources**: Ellen MacArthur Foundation reports, public case studies, city sustainability plans.
**Status**: Proposal stage
**ETA**: Q4 2025

---

## Adding a New Scraper

### Step 1: Propose the Source
Create a proposal document with:
- **Purpose**: What insights will this data provide?
- **Sources**: List specific URLs/APIs
- **Ethical Review**: Confirm data is public, non-PII, and ethical to scrape
- **Legal Review**: Confirm compliance with robots.txt, ToS, GDPR, CCPA
- **Output Schema**: Define the data structure

### Step 2: Implement the Scraper
1. Create a new Python file in `data-scraper-module/sites/<name>.py`
2. Inherit from base `Scraper` class
3. Implement `scrape()` method
4. Use utilities: `get_random_user_agent()`, `RateLimiter`, `normalize_to_submission_format()`
5. Add tests in `tests/<name>_test.py`

### Step 3: Register the Scraper
Add to `scraper.py`:
```python
from sites.my_new_scraper import MyNewScraper

SCRAPERS = {
    # ... existing scrapers
    "my_new_scraper": MyNewScraper,
}
```

### Step 4: Test and Deploy
1. Run locally: `python scraper.py --site my_new_scraper --output test.json`
2. Verify output format matches schema
3. Test HMAC signature generation
4. Test ingestion via `external-ingest` endpoint
5. Monitor in machine-agent GUI for 24 hours
6. Document in this file

---

## Ethical Scraping Guidelines

### DO:
✅ Respect robots.txt  
✅ Use rate limiting (1-5 seconds between requests)  
✅ Rotate user agents to avoid detection  
✅ Only scrape public, non-authenticated pages  
✅ Aggregate data to remove individual identifiers  
✅ Cache data to minimize redundant requests  
✅ Provide clear attribution of data sources  

### DON'T:
❌ Scrape personal data (names, emails, addresses)  
❌ Bypass login/authentication mechanisms  
❌ Ignore rate limits or overwhelm servers  
❌ Scrape copyrighted content without permission  
❌ Store raw HTML/full articles (fair use excerpts only)  
❌ Scrape data from ToS-restricted sites  
❌ Use scraped data for re-identification  

### Legal Considerations
- **Fair Use**: Only scrape facts, not creative expression
- **CFAA Compliance**: Do not access unauthorized systems
- **GDPR Article 6**: Ensure lawful basis for processing
- **CCPA Section 1798.100**: Respect consumer data rights

---

## Source Approval Process

All new scraper sources must be approved by:
1. **Technical Lead**: Confirms feasibility and schema design
2. **Legal Counsel**: Reviews ToS, copyright, and privacy laws
3. **Ethics Committee**: Ensures alignment with DataForEarth mission
4. **Community**: Public comment period (7 days)

**Approval Criteria**:
- ✅ Publicly accessible (no login required)
- ✅ Non-PII data
- ✅ Environmental/sustainability focus
- ✅ Ethical sourcing (not scraped from vulnerable populations)
- ✅ Legal compliance (robots.txt, ToS, copyright)
- ✅ Technical feasibility (reliable, maintainable)

---

## Source Monitoring

### Health Checks
- **Daily**: Verify scraper runs without errors
- **Weekly**: Spot-check output quality and format
- **Monthly**: Review source website changes (structure, ToS, robots.txt)

### Deprecation Policy
Sources will be deprecated if:
- Website blocks or rate limits our scrapers consistently
- ToS changes prohibit scraping
- Data quality degrades below threshold
- Legal/ethical concerns arise
- Source goes offline or paywalled

**Deprecation Process**:
1. Mark scraper as "deprecated" in code comments
2. Notify machine-agent users via email
3. Stop automated runs
4. Archive historical data
5. Remove scraper after 30-day grace period

---

## Data Quality Metrics

### KPIs
- **Uptime**: % of successful scrapes (target: > 95%)
- **Freshness**: Time since last successful scrape (target: < 48 hours)
- **Coverage**: % of expected data points collected (target: > 90%)
- **Accuracy**: % of data passing validation (target: > 98%)
- **Duplication Rate**: % of duplicate records (target: < 1%)

### Monitoring Tools
- Machine-agent GUI: Real-time status
- Supabase audit logs: Ingestion success/failure
- External monitoring: UptimeRobot (source availability)

---

## Contact

For questions about scraper sources:
- Email: scrapers@dataforearth.org
- GitHub Issues: dataforearth/scrapers/issues
- Discord: #scraper-development

**Propose a new source**: File a GitHub issue with the "new-scraper" label
