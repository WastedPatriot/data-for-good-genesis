# Harvester Targets - DataForEarth Multi-Domain Scrapers

## Overview
This document lists all active scraper targets, their data domains, update frequencies, and integration status.

## Active Scrapers

### Climate Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| NASA POWER | climate-api.nasa.gov | Daily | ✅ Active | 0.95 |
| NOAA Climate | noaa.gov | Daily | ✅ Active | 0.95 |
| Carbon Monitor | carbonmonitor.org | Weekly | ✅ Active | 0.90 |

### ESG Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| SEC EDGAR | sec.gov/cgi-bin/browse-edgar | Daily | ✅ Active | 0.90 |
| CDP Disclosure | cdp.net | Monthly | ✅ Active | 0.85 |

### Policy Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| EPA Regulations | epa.gov/rss | Daily | ✅ Active | 0.90 |
| IEA Policy DB | iea.org | Weekly | ✅ Active | 0.85 |
| Climate Policy Radar | climatepolicyradar.org | Weekly | ✅ Active | 0.85 |

### Consumer Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| Google Trends RSS | trends.google.com/trends/trendingsearches/daily/rss | Daily | ✅ Active | 0.75 |
| US Census Retail | api.census.gov/data/timeseries/eits/marts | Monthly | ✅ Active | 0.85 |

### Market Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| Yahoo Finance | query1.finance.yahoo.com/v8/finance/chart | Daily | ✅ Active | 0.80 |
| Trading Economics | tradingeconomics.com/rss/calendar.aspx | Daily | ✅ Active | 0.75 |

### Mobility Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| OpenChargeMap | api.openchargemap.io/v3/poi | Daily | ✅ Active | 0.85 |
| AFDC NREL | developer.nrel.gov/api/alt-fuel-stations/v1 | Weekly | ✅ Active | 0.90 |

### Agriculture Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| USDA RSS | usda.gov/rss/latest-releases.xml | Daily | ✅ Active | 0.80 |
| FAO STAT | fao.org/faostat/api/v1 | Monthly | ✅ Active | 0.85 |

### Housing Domain
| Target | Source | Update Freq | Status | Confidence |
|--------|--------|-------------|--------|------------|
| US Census Building Permits | api.census.gov/data/timeseries/eits/bps | Monthly | ✅ Active | 0.90 |
| Zillow Research | zillow.com/research/feed | Weekly | ✅ Active | 0.75 |

## Scraper Integration Flow

```
1. Scraper runs (Python script)
   ↓
2. Raw data extracted with domain/region/sector tags
   ↓
3. Provenance hash generated (SHA-256)
   ↓
4. POST to /functions/v1/scrape-batch-handoff-for-review
   ↓
5. Edge function deduplicates
   ↓
6. Insert into review_queue
   ↓
7. AI analysis (auto-curate-approved)
   ↓
8. High-confidence items → curated_pool
   ↓
9. Admin builds datasets via /admin/dataset-builder
```

## Rate Limiting Policy

- **Polite scraping**: 2 second minimum delay between requests
- **Jitter**: ±0.5s random offset
- **User-Agent rotation**: Random selection from pool
- **Retry logic**: Exponential backoff on 429/503

## Adding New Targets

1. Create scraper in `data-scraper-module/sites/<domain>_<name>.py`
2. Implement `scrape()` method returning list of dicts
3. Include: `domain`, `region`, `sector`, `source`, `timestamp`, `confidence_score`
4. Add to `SCRAPERS` registry in `scraper.py`
5. Test with: `python scraper.py --site <name> --dry-run`
6. Deploy to Ubuntu server (see `HARVESTER_AUTOMATION_GUIDE.md`)

## Monitoring

- Check `/admin/data-pipeline` for review queue stats
- Check `/admin/datasets` for curated pool by domain
- Logs: `/var/log/dataforearth/scraper.log` on Ubuntu server
