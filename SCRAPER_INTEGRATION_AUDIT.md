# DataForEarth Scraper Integration Audit & Deployment Guide

## Overview
The GUI AI Scraper is a Python-based data collection system located in `data-scraper-module/` that gathers institutional-grade environmental signals from multiple sources and normalizes them for the DataForEarth marketplace.

## Current Architecture

### 1. Scraper Module Components

```
data-scraper-module/
├── scraper.py                 # Main orchestrator
├── sites/                     # Individual scrapers
│   ├── carbon_futures.py     # EU ETS, UK ETS, California carbon markets
│   ├── regulatory_violations.py  # EPA & EU compliance data
│   ├── supply_chain_signals.py   # Supply chain sustainability
│   ├── climate_risk.py       # NOAA physical disaster risk
│   ├── esg_litigation.py     # ESG litigation events
│   ├── ev_demand.py          # Electric vehicle demand
│   ├── eco_sentiment.py      # Environmental sentiment analysis
│   └── sustainability_keywords.py # News keyword tracking
├── utils/                    # Processing utilities
│   ├── normalizer.py         # Data standardization
│   ├── feature_engineering.py # ML feature extraction
│   ├── signal_fusion.py      # Multi-signal aggregation
│   ├── rate_limiter.py       # API throttling
│   └── user_agents.py        # Request rotation
└── requirements.txt          # Python dependencies
```

### 2. Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. COLLECTION LAYER                                      │
│    ├── Carbon Futures (hourly)                          │
│    ├── Regulatory Violations (daily)                    │
│    ├── Supply Chain Signals (daily)                     │
│    ├── Climate Risk (daily)                             │
│    └── ESG Litigation (daily)                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. PROCESSING LAYER                                      │
│    ├── Rate Limiting & Error Handling                   │
│    ├── Data Normalization (to schema)                   │
│    ├── Feature Engineering:                             │
│    │   • risk_index                                     │
│    │   • volatility_score                               │
│    │   • momentum_score                                 │
│    │   • forward_pressure_score                         │
│    ├── Signal Fusion (trend-weighted)                   │
│    └── Anomaly Detection                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. STORAGE LAYER                                         │
│    ├── Raw Data → data_submissions table                │
│    ├── Normalized → sensor_data table                   │
│    └── Features → sensor_data.features (JSONB)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. MARKETPLACE LAYER                                     │
│    ├── Auto-publish high-quality datasets              │
│    ├── Dynamic pricing (AI)                             │
│    └── Public API access                                │
└─────────────────────────────────────────────────────────┘
```

### 3. Integration Points

#### A. Database Integration (Supabase)
- **Endpoint**: Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env`
- **Tables Used**:
  - `data_submissions`: Raw scraped data
  - `sensor_data`: Normalized time-series data
  - `datasets`: Published marketplace datasets
  - `data_processing_queue`: Job tracking

#### B. Edge Function Integration
- **Endpoint**: `external-ingest` edge function
- **Authentication**: Uses `INGEST_SECRET` for secure ingestion
- **Rate Limits**: Respects Supabase function limits (100 req/min)

#### C. Website Integration
The website displays scraped data through:
1. **Marketplace Page** (`/marketplace`): Shows published datasets
2. **Impact Dashboard** (`/impact-dashboard`): Visualizes real-time metrics
3. **Admin Panel** (`/admin`): Monitors scraper health and data quality

---

## Ubuntu Server Deployment (24/7 Operation)

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install system dependencies
sudo apt install supervisor nginx -y

# Create dedicated user
sudo useradd -r -s /bin/bash dataforearth
sudo mkdir -p /opt/dataforearth
sudo chown dataforearth:dataforearth /opt/dataforearth
```

### Step 2: Deploy Scraper Module

```bash
# Switch to dataforearth user
sudo su - dataforearth

# Clone/copy scraper module
cd /opt/dataforearth
# (Transfer data-scraper-module folder here)

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
cd data-scraper-module
pip install -r requirements.txt
```

### Step 3: Environment Configuration

Create `/opt/dataforearth/data-scraper-module/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://fszghwwbvxwkmgfvhzrh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
INGEST_SECRET=<your-ingest-secret>

# Scraper Configuration
SCRAPE_INTERVAL_HOURS=6
MAX_RETRIES=3
RATE_LIMIT_DELAY=2

# Feature Flags
ENABLE_CARBON_FUTURES=true
ENABLE_REGULATORY_VIOLATIONS=true
ENABLE_SUPPLY_CHAIN_SIGNALS=true
ENABLE_CLIMATE_RISK=true
ENABLE_ESG_LITIGATION=true

# Logging
LOG_LEVEL=INFO
LOG_FILE=/opt/dataforearth/logs/scraper.log
```

### Step 4: Supervisor Configuration

Create `/etc/supervisor/conf.d/dataforearth-scraper.conf`:

```ini
[program:dataforearth-scraper]
command=/opt/dataforearth/venv/bin/python /opt/dataforearth/data-scraper-module/scraper.py
directory=/opt/dataforearth/data-scraper-module
user=dataforearth
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=60
stopasgroup=true
killasgroup=true
stdout_logfile=/var/log/supervisor/dataforearth-scraper.log
stderr_logfile=/var/log/supervisor/dataforearth-scraper-error.log
environment=PYTHONUNBUFFERED=1
```

Enable and start:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start dataforearth-scraper
sudo supervisorctl status dataforearth-scraper
```

### Step 5: Monitoring & Health Checks

Create `/opt/dataforearth/data-scraper-module/healthcheck.py`:

```python
#!/usr/bin/env python3
import sys
import os
from datetime import datetime, timedelta
import psycopg2

# Check last successful scrape
def check_health():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    cur.execute("""
        SELECT created_at 
        FROM data_submissions 
        WHERE source_type IN ('carbon_futures', 'regulatory_violations')
        ORDER BY created_at DESC 
        LIMIT 1
    """)
    
    last_scrape = cur.fetchone()
    if not last_scrape:
        print("ERROR: No scrapes found")
        sys.exit(1)
    
    age = datetime.now() - last_scrape[0]
    if age > timedelta(hours=12):
        print(f"ERROR: Last scrape {age.total_seconds()/3600:.1f}h ago")
        sys.exit(1)
    
    print(f"OK: Last scrape {age.total_seconds()/60:.0f}m ago")
    sys.exit(0)

if __name__ == "__main__":
    check_health()
```

Add to crontab:

```bash
# Check health every 30 minutes
*/30 * * * * /opt/dataforearth/venv/bin/python /opt/dataforearth/data-scraper-module/healthcheck.py
```

### Step 6: Log Rotation

Create `/etc/logrotate.d/dataforearth`:

```
/var/log/supervisor/dataforearth-scraper*.log
/opt/dataforearth/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 dataforearth dataforearth
    sharedscripts
    postrotate
        supervisorctl restart dataforearth-scraper > /dev/null
    endscript
}
```

---

## Machine Agent GUI Integration

The GUI (`machine-agent-gui/`) provides local desktop monitoring of scrapers:

### 1. GUI Components

- **Dashboard**: Real-time scraper status
- **Institutional Signals**: Live signal visualization
- **External Scraper Feeds**: Monitor remote scraper health
- **Logs**: View scraper output
- **Settings**: Configure scraper parameters

### 2. Electron App Setup

Build the Electron app:

```bash
cd machine-agent-gui
npm install
npm run build

# Generate installers
npm run make  # Creates .AppImage, .deb, .rpm
```

### 3. Deploy Agent on Server

```bash
# Copy built AppImage to server
scp machine-agent-gui/out/make/AppImage/dataforearth-agent.AppImage user@server:/opt/

# Install systemd service
sudo cp machine-agent-gui/dataforearth-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable dataforearth-agent
sudo systemctl start dataforearth-agent
```

The service file enables headless operation with API access.

---

## Data Publication Pipeline

### Automatic Publishing Flow

```python
# In scraper.py - after successful scrape
async def publish_if_ready(submission_id):
    """Auto-publish high-quality datasets"""
    
    # Check data quality
    quality_score = calculate_quality(submission_id)
    
    if quality_score > 0.85:
        # Create dataset
        dataset = {
            'title': f'Institutional Signals - {date}',
            'description': 'Carbon futures, regulatory violations, ESG data',
            'price': calculate_dynamic_price(submission_id),
            'data_type': 'institutional_signals',
            'source_submissions': [submission_id]
        }
        
        # Publish via edge function
        await publish_dataset(dataset)
```

### Dynamic Pricing

The AI pricing engine (`ai-dynamic-pricing` edge function) sets prices based on:
- Data freshness
- Signal quality/accuracy
- Market demand
- Competitive pricing

---

## Monitoring Dashboard

Access scraper metrics:

1. **Admin Panel**: `/admin` → "Scraper Health" tab
2. **Machine GUI**: Desktop app dashboard
3. **Logs**: 
   - Supervisor logs: `/var/log/supervisor/dataforearth-scraper.log`
   - Application logs: `/opt/dataforearth/logs/scraper.log`

### Key Metrics to Monitor

- **Scrape Success Rate**: Should be >95%
- **Data Freshness**: Latest scrape <6 hours old
- **Error Rate**: Should be <5%
- **Signal Quality**: Risk index variance, anomaly detection hits
- **Marketplace Activity**: Datasets published, purchases

---

## Security & Privacy

### PII Protection
- **No PII Collection**: Scrapers collect only public institutional data
- **Anonymization**: All data sources are anonymized in datasets
- **Access Control**: RLS policies enforce buyer access only

### Rate Limiting
- Respects target website robots.txt
- Uses `rate_limiter.py` to prevent IP bans
- Rotates user agents via `user_agents.py`

### API Security
- `INGEST_SECRET` validates all data submissions
- Service role key never exposed to client
- All edge functions use CORS and auth checks

---

## Troubleshooting

### Common Issues

**1. Scraper Not Running**
```bash
sudo supervisorctl status dataforearth-scraper
sudo tail -f /var/log/supervisor/dataforearth-scraper-error.log
```

**2. Data Not Appearing in Marketplace**
- Check `data_processing_queue` for errors
- Verify edge function logs: `/admin` → Functions tab
- Ensure quality score >0.85 for auto-publish

**3. Rate Limiting Errors**
- Increase `RATE_LIMIT_DELAY` in `.env`
- Check target website API quotas
- Review `rate_limiter.py` backoff logic

**4. Signal Quality Issues**
- Review feature engineering parameters
- Check anomaly detection thresholds
- Validate data normalization in `normalizer.py`

---

## Maintenance Schedule

- **Daily**: Check scraper health via cron
- **Weekly**: Review error logs, update dependencies
- **Monthly**: Rotate logs, optimize database queries
- **Quarterly**: Update scraper logic for website changes

---

## Next Steps

1. ✅ Deploy scrapers to Ubuntu server using Supervisor
2. ✅ Configure environment variables and secrets
3. ✅ Set up monitoring and health checks
4. ✅ Test end-to-end pipeline (scrape → normalize → publish)
5. ✅ Install Machine GUI for remote monitoring
6. ✅ Configure auto-publishing thresholds
7. ✅ Set up alerting (email/Slack) for errors

For support: hello@dataforearth.org
