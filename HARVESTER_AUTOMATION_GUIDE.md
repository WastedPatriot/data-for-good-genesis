# DataForEarth Harvester - Complete Automation Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying and operating the DataForEarth data harvester in production. The harvester collects real-world climate, ESG, and policy data from public APIs and feeds it into your curation pipeline.

---

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ (or any Linux with systemd)
- **Python**: 3.9 or higher
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk**: 10GB free space
- **Network**: Stable internet connection

### Required Credentials
| Service | Variable | Required | Get From |
|---------|----------|----------|----------|
| Supabase | `SUPABASE_URL` | ✅ Yes | Your project |
| Supabase | `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Your project |
| Ingest Secret | `INGEST_SECRET` | ✅ Yes | Generate random |
| NOAA CDO | `NOAA_API_TOKEN` | ❌ Optional | https://www.ncdc.noaa.gov/cdo-web/token |
| CDP | `CDP_API_KEY` | ❌ Optional | https://data.cdp.net/ |

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
# Navigate to scraper module
cd data-scraper-module

# Install dependencies
pip3 install -r requirements.txt

# Create .env file
cp .env.example .env
nano .env
```

### 2. Configure Environment

Edit `.env`:

```bash
# Rate Limiting
RATE_LIMIT_SECONDS=2.0
JITTER_SECONDS=0.5

# Output
OUTPUT_DIR=./output

# DataForEarth API (REQUIRED)
DATAFOREARTH_API_URL=https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/scrape-batch-handoff-for-review
INGEST_SECRET=your_secure_random_string_here

# Optional: Enhanced data sources
NOAA_API_TOKEN=your_noaa_token_here
CDP_API_KEY=your_cdp_key_here
```

### 3. Test Run

```bash
# Test single scraper
python3 scraper.py --site real_climate --output ./test_output.json

# Test all real scrapers
python3 scraper.py --site all --output ./output/batch.json
```

---

## 🤖 Automated Scraping

### Daily Cron Job

```bash
# Edit crontab
crontab -e

# Add this line for daily 2 AM run
0 2 * * * cd /path/to/data-scraper-module && /usr/bin/python3 scraper.py --site all --output ./output/daily_$(date +\%Y\%m\%d).json && /usr/bin/python3 ingest.py --file ./output/daily_$(date +\%Y\%m\%d).json >> /var/log/dataforearth-scraper.log 2>&1
```

### Systemd Service (Continuous)

Create `/etc/systemd/system/dataforearth-scraper.service`:

```ini
[Unit]
Description=DataForEarth Data Scraper
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/data-scraper-module
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 /home/ubuntu/data-scraper-module/scheduled_scraper.py
Restart=on-failure
RestartSec=60

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable dataforearth-scraper
sudo systemctl start dataforearth-scraper
sudo systemctl status dataforearth-scraper
```

---

## 📊 Data Ingestion Pipeline

### Ingest Script

Create `ingest.py`:

```python
#!/usr/bin/env python3
"""
Ingest scraped data into DataForEarth platform
"""

import json
import os
import sys
import requests
from pathlib import Path

def ingest_batch(file_path: str):
    """Send scraped data to DataForEarth API"""
    
    # Load environment
    api_url = os.getenv("DATAFOREARTH_API_URL")
    ingest_secret = os.getenv("INGEST_SECRET")
    
    if not api_url or not ingest_secret:
        raise ValueError("DATAFOREARTH_API_URL and INGEST_SECRET must be set")
    
    # Read scraped data
    with open(file_path, "r") as f:
        data = json.load(f)
    
    submissions = data.get("submissions", [])
    if not submissions:
        print("No submissions to ingest")
        return
    
    # Generate batch ID
    batch_id = f"scraper_{data.get('scrape_timestamp', 'unknown')}"
    
    # Send to API
    headers = {
        "Content-Type": "application/json",
        "x-ingest-secret": ingest_secret
    }
    
    payload = {
        "batchId": batch_id,
        "items": submissions
    }
    
    print(f"Ingesting {len(submissions)} records...")
    
    response = requests.post(api_url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    
    result = response.json()
    print(f"✓ Ingested {result.get('inserted', 0)} records successfully")
    
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ingest.py <scraped_file.json>")
        sys.exit(1)
    
    ingest_batch(sys.argv[1])
```

Make executable:

```bash
chmod +x ingest.py
```

---

## 🎛️ Configuration Options

### Scraper Targets

Edit `scraper.py` to enable/disable sources:

```python
SCRAPERS = {
    "real_climate": RealClimateDataScraper,      # NASA, NOAA, Carbon Monitor
    "real_esg": RealESGDataScraper,              # SEC EDGAR, CDP
    "real_policy": RealPolicyTrackerScraper,     # EPA, IEA, Policy Radar
    # Add more as needed
}
```

### Rate Limiting

Adjust in `.env`:

```bash
# Conservative (slow, polite)
RATE_LIMIT_SECONDS=5.0
JITTER_SECONDS=2.0

# Aggressive (faster, risk of blocks)
RATE_LIMIT_SECONDS=1.0
JITTER_SECONDS=0.3
```

---

## 📈 Monitoring & Troubleshooting

### Check Logs

```bash
# Systemd service logs
sudo journalctl -u dataforearth-scraper -f

# Cron job logs
tail -f /var/log/dataforearth-scraper.log
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Wrong `INGEST_SECRET` | Check `.env` and edge function config |
| 429 Rate Limited | Too many requests | Increase `RATE_LIMIT_SECONDS` |
| Timeout | Slow network | Increase `timeout` in requests |
| No data scraped | API down | Check API status, fallback to other sources |

### Health Check

```bash
# Test edge function connectivity
curl -X POST https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/scrape-batch-handoff-for-review \
  -H "x-ingest-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"batchId":"test","items":[]}'
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│ Public APIs     │
│ (NASA, EPA, etc)│
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Python Scrapers │
│ (scraper.py)    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ JSON Output     │
│ (./output/*.json)│
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Ingest Script   │
│ (ingest.py)     │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────┐
│ Edge Function                        │
│ scrape-batch-handoff-for-review     │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────┐
│ Review Queue    │
│ (Supabase DB)   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ AI Analysis     │
│ (Gemini 2.5)    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Curated Pool    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Datasets        │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Marketplace     │
└─────────────────┘
```

---

## 🛡️ Security Best Practices

1. **Never commit `.env` file** - Use `.gitignore`
2. **Rotate `INGEST_SECRET` quarterly**
3. **Use systemd user services** (not root)
4. **Monitor API rate limits**
5. **Set up log rotation**:

```bash
# /etc/logrotate.d/dataforearth-scraper
/var/log/dataforearth-scraper.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

---

## 📞 Support

### Debugging Checklist
- [ ] `.env` file configured correctly
- [ ] `INGEST_SECRET` matches edge function config
- [ ] Python dependencies installed
- [ ] Network connectivity to APIs
- [ ] Supabase edge function deployed
- [ ] `review_queue` table accessible

### Useful Commands

```bash
# Check scraper status
python3 scraper.py --site real_climate --dry-run

# Manually trigger ingestion
python3 ingest.py ./output/latest.json

# View recent review queue items
# (Run in Supabase SQL editor)
SELECT * FROM review_queue ORDER BY created_at DESC LIMIT 10;
```

---

## 🎓 Advanced: Custom Scrapers

### Template for New Scraper

Create `data-scraper-module/sites/my_scraper.py`:

```python
import requests
from typing import List, Dict, Any
import time

class MyCustomScraper:
    def __init__(self, user_agent: str):
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
    
    def scrape(self) -> List[Dict[str, Any]]:
        results = []
        
        try:
            # Your scraping logic here
            response = self.session.get("https://api.example.com/data")
            data = response.json()
            
            for item in data:
                results.append({
                    "source": "MY_CUSTOM_SOURCE",
                    "title": item.get("title"),
                    "value": item.get("value"),
                    "timestamp": time.time(),
                    "data_quality": "high",
                    "category": "climate"
                })
        
        except Exception as e:
            print(f"  ⚠ Failed to scrape: {e}")
        
        return results
```

Register in `scraper.py`:

```python
from sites.my_scraper import MyCustomScraper

SCRAPERS = {
    # ... existing scrapers
    "my_custom": MyCustomScraper,
}
```

---

**Last Updated**: 2025-01-24  
**Version**: 1.0.0  
**Status**: Production-Ready ✅
