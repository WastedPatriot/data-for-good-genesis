# 🌍 DataForEarth Harvester - Setup Instructions

## What This Does

This harvester automatically:
1. ✅ Scrapes climate, ESG, air quality, and energy data every 30 minutes
2. ✅ Uploads to your DataForEarth platform via the `external-ingest` endpoint
3. ✅ AI automatically curates and scores the data
4. ✅ Datasets are built and published to marketplace with Stripe integration
5. ✅ Runs 24/7 in the background generating revenue

---

## Quick Start (3 Steps)

### Step 1: Get Your Ingest Secret

1. Go to your **Admin Dashboard**
2. You need the `INGEST_SECRET` from your Supabase secrets
3. **To find it**: Check your backend secrets in Lovable Cloud
   - It's already set as: `INGEST_SECRET` (hidden value)
   - You'll need to reference this value below

### Step 2: Download & Configure

1. **Download** `harvester.js` from Admin Dashboard
2. **Edit line 12** and replace `YOUR_INGEST_SECRET_HERE` with your actual secret
3. Save the file

### Step 3: Run It

**Windows (PowerShell):**
```powershell
node harvester.js
```

**Linux/Mac:**
```bash
node harvester.js
```

**Run as background service (Windows):**
```powershell
Start-Process node -ArgumentList "harvester.js" -WindowStyle Hidden
```

---

## What You'll See

```
╔═══════════════════════════════════════════════════════════╗
║        🌍 DataForEarth Auto Harvester v1.0 🌍            ║
║  Autonomous climate, ESG & sensor data collector         ║
╚═══════════════════════════════════════════════════════════╝

📋 Configuration:
   • Interval: 30 minutes
   • Batch Size: 50 records

🚀 Starting harvester...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 DataForEarth Harvester - 1/4/2025, 3:45 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ Scraping: EPA Air Quality Sensor...
✅ Ingested 10 records

⚡ Scraping: Climate Temperature Trends...
✅ Ingested 15 records

⚡ Scraping: ESG Corporate Emissions...
✅ Ingested 5 records

⚡ Scraping: Renewable Energy Production...
✅ Ingested 12 records

📊 Harvest Complete: 42 total records ingested
⏰ Next harvest in 30 minutes...
```

---

## Environment Variables (Optional)

Instead of editing the file, set these:

**Windows (PowerShell):**
```powershell
$env:SUPABASE_URL="https://fszghwwbvxwkmgfvhzrh.supabase.co"
$env:INGEST_SECRET="your_secret_here"
$env:INTERVAL_MINUTES="30"
node harvester.js
```

**Linux/Mac:**
```bash
export SUPABASE_URL="https://fszghwwbvxwkmgfvhzrh.supabase.co"
export INGEST_SECRET="your_secret_here"
export INTERVAL_MINUTES="30"
node harvester.js
```

---

## Data Sources Included

1. **EPA Air Quality Sensors** - PM2.5, PM10, NO₂, O₃ readings
2. **Climate Temperature Trends** - Global temperature anomalies
3. **ESG Corporate Emissions** - Scope 1/2/3 corporate carbon data
4. **Renewable Energy Production** - Solar/Wind/Hydro generation stats
5. **Carbon Intensity API** - Real-time grid carbon intensity
6. **OpenWeatherMap Climate** - Weather and climate data

---

## What Happens Next?

1. **Harvester uploads** → `external-ingest` edge function
2. **Data enters** → `review_queue` table
3. **AI analyzes** → `ai-curate-data` edge function (quality scores, categorization)
4. **Approved data** → `curated_pool` table
5. **Dataset builder** → `build-dataset-from-curated` creates marketplace listings
6. **Stripe integration** → Datasets published with payment links & badge codes
7. **Revenue flows** → Automated 24/7 income

---

## Troubleshooting

**"Ingest failed: HTTP 403"**
→ Check your `INGEST_SECRET` is correct

**"ENOTFOUND" or connection errors**
→ Check internet connection and firewall settings

**No data appearing in admin**
→ Check Admin → Unified Pipeline → Review Queue for pending items

**Want more data sources?**
→ Edit `harvester.js` and add to `CUSTOM_SCRAPERS` array

---

## Running 24/7 (Production)

**Windows Service:**
```powershell
# Install Node.js Windows Service wrapper
npm install -g node-windows

# Create service (run as admin)
node-windows install harvester.js --name "DataForEarth-Harvester"
```

**Linux Systemd:**
```bash
sudo nano /etc/systemd/system/dataforearth-harvester.service
```

Paste:
```ini
[Unit]
Description=DataForEarth Harvester
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/harvester
Environment="INGEST_SECRET=your_secret"
ExecStart=/usr/bin/node harvester.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable dataforearth-harvester
sudo systemctl start dataforearth-harvester
sudo systemctl status dataforearth-harvester
```

---

## Need Help?

- **Admin Dashboard** → Check Review Queue, Curated Pool, Datasets
- **Check Logs** → Edge function logs show AI curation results
- **Test Ingest** → Run harvester once and watch Admin pipeline

**The harvester is production-ready and will start generating datasets immediately.**
