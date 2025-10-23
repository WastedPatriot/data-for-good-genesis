# Data for Earth - Ethical Data Scraper Module

Modular Python scraper for collecting ethical, public data to fund environmental projects.

## Features

- **Modular Architecture**: Easy to add new scraper sites
- **Anti-Bot Measures**: Rotating user agents, rate limiting with jitter
- **Normalized Output**: Automatically converts to `data_submissions` schema
- **Headless Operation**: Runs as a standalone script or cron job

## Installation

```bash
# Python 3.11+ required
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your settings
```

## Usage

### Scrape a Single Site

```bash
python scraper.py --site eco_sentiment --output output/eco_data.json
```

### Scrape All Sites

```bash
python scraper.py --site all --output output/all_data.json
```

### Dry Run (Print Without Saving)

```bash
python scraper.py --site all --dry-run
```

### Custom Rate Limiting

```bash
python scraper.py --site all --rate-limit 3.0 --output output/slow_scrape.json
```

## Available Scrapers

| Scraper Name | Description | Data Source |
|--------------|-------------|-------------|
| `eco_sentiment` | Public eco news headlines + sentiment | News aggregators, RSS feeds |
| `ev_demand` | EV waiting list and demand indicators | Public APIs, government stats |
| `sustainability_keywords` | Sustainability search trends | Search trend APIs |

## Adding a New Scraper

1. **Create scraper file** in `sites/`:

```python
# sites/my_new_scraper.py
class MyNewScraper:
    def __init__(self, user_agent: str):
        self.user_agent = user_agent
    
    def scrape(self) -> List[Dict[str, Any]]:
        # Your scraping logic
        return scraped_data
```

2. **Register in `scraper.py`**:

```python
from sites.my_new_scraper import MyNewScraper

SCRAPERS = {
    # ... existing scrapers
    "my_new_scraper": MyNewScraper,
}
```

3. **Add normalization logic** in `utils/normalizer.py`:

```python
elif source == "my_new_scraper":
    submission["interests"] = ["Your", "Categories"]
    submission["sensor_data"]["custom_field"] = raw_data.get("field")
```

## Output Format

Scraped data is normalized to match `data_submissions` schema:

```json
{
  "scrape_timestamp": "2025-10-23T10:00:00",
  "total_records": 15,
  "sources": ["eco_sentiment", "ev_demand"],
  "submissions": [
    {
      "email": null,
      "location": "North America",
      "age_range": null,
      "interests": ["Automotive", "Technology"],
      "device_ownership": null,
      "ev_ownership": "Interested",
      "sustainability": null,
      "sensor_data": {
        "scraper_source": "ev_demand",
        "scrape_timestamp": 1729682400,
        "ev_interest_score": 87,
        "raw_data": { ... }
      }
    }
  ]
}
```

## Integration with Data for Earth

### Auto-Ingestion via API

Configure `.env` with your API credentials and use the external-ingest endpoint:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/external-ingest \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Signature: HMAC_SIGNATURE" \
  -d @output/scraped_data.json
```

### Manual Review in Agent GUI

1. Run scraper: `python scraper.py --site all --output output/data.json`
2. Open Machine Agent GUI → "External Scraper Feeds" tab
3. Review and approve records before ingestion
4. Click "Approve & Ingest" to process

## Anti-Bot Best Practices

- **Rate Limiting**: 2-3 seconds between requests (configurable)
- **Jitter**: Random variance (±0.5s) to avoid patterns
- **User Agents**: Rotates through common browser UAs
- **Respect robots.txt**: Only scrape public, allowed data
- **Sleep Patterns**: Random delays between batches

## Scheduling (Cron)

Run scraper daily at 2 AM:

```cron
0 2 * * * cd /path/to/data-scraper-module && python scraper.py --site all --output output/daily_$(date +\%Y\%m\%d).json
```

## Monitoring

Check scraper logs:

```bash
tail -f output/scraper.log
```

## Legal & Ethical Guidelines

- ✅ Only scrape **public, non-personal** data
- ✅ Respect `robots.txt` and rate limits
- ✅ Attribute data sources when required
- ❌ Never scrape personal identifiable information (PII)
- ❌ Never circumvent authentication or paywalls
- ❌ Never scrape copyrighted content without permission

## Support

For questions about adding scrapers or integration:
- Email: hello@dataforearth.org
- Docs: https://dataforearth.org/help
