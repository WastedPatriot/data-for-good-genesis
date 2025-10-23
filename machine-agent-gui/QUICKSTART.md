# Quick Start Guide

Get the DataForEarth Machine Agent running in 5 minutes.

## Prerequisites

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm

# Verify versions
node --version  # Should be v18+
npm --version   # Should be v9+
```

## Installation (3 Steps)

### 1. Install Dependencies
```bash
cd machine-agent-gui
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```

The app will open automatically.

### 3. Configure
1. Click "⚙️ Settings" tab
2. Enter your credentials:
   ```
   Supabase URL: https://fszghwwbvxwkmgfvhzrh.supabase.co
   Ingest Secret: [Your INGEST_SECRET]
   ```
3. Click "Test Connection"
4. Click "Save Configuration"

✅ **You're ready to go!**

---

## First Time Setup

### Step 1: Generate Badge Codes
1. Go to "🏆 Badge Codes" tab
2. Set count to 100
3. Click "Generate Codes"

### Step 2: Configure Automation
1. Go to "🤖 Dataset Automation" tab
2. Set:
   - Category: Environmental
   - Minimum Records: 50
   - Badge Codes: 25
   - Price: $99.99
3. Click "Start Automation"

### Step 3: Monitor
1. Go to "📊 Dashboard" tab
2. Watch for:
   - New datasets published
   - Revenue updates
   - Badge inventory

---

## Building for Production

### Create AppImage
```bash
npm run package:linux
```

Output: `dist-package/DataForEarth-Agent-*.AppImage`

### Run AppImage
```bash
chmod +x dist-package/DataForEarth-Agent-*.AppImage
./dist-package/DataForEarth-Agent-*.AppImage
```

---

## Running as Background Service

### Install Service
```bash
# Copy AppImage
sudo cp dist-package/DataForEarth-Agent-*.AppImage /opt/dataforearth-agent.AppImage

# Install service
sudo cp dataforearth-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable dataforearth-agent
sudo systemctl start dataforearth-agent
```

### Check Status
```bash
sudo systemctl status dataforearth-agent
```

### View Logs
```bash
sudo journalctl -u dataforearth-agent -f
```

---

## Common Tasks

### Manual Dataset Publish
1. Go to "Dataset Automation" tab
2. Configure parameters
3. Click "Publish Now"

### Scan for Eco Projects
1. Go to "Eco Projects" tab
2. Click "Scan for Projects"
3. Click "Approve" on projects you want

### Check Logs
1. Go to "Logs" tab
2. Filter by level if needed
3. Enable auto-refresh

### Update Configuration
1. Go to "Settings" tab
2. Modify values
3. Click "Save Configuration"

---

## Troubleshooting

### Can't Connect?
- Verify Supabase URL format
- Check INGEST_SECRET is correct
- Test with "Test Connection" button

### No Records Appearing?
- Check data harvest API is running
- Verify processed records exist
- Check logs for errors

### Automation Not Working?
- Confirm automation is started
- Check poll interval setting
- Verify minimum records threshold

### Build Fails?
```bash
# Clean and reinstall
rm -rf node_modules dist dist-package
npm install
npm run package:linux
```

---

## Getting Help

1. Check the **Logs** tab for error messages
2. Review **USAGE.md** for detailed instructions
3. See **ARCHITECTURE.md** for technical details
4. Contact DataForEarth support

---

## What's Next?

- ✅ Monitor dashboard daily
- ✅ Keep badge inventory > 50
- ✅ Review logs for errors
- ✅ Check revenue trends
- ✅ Approve relevant eco projects
- ✅ Adjust automation thresholds as needed

---

**Pro Tip**: Set up the systemd service to run the agent 24/7 in the background for fully automated dataset publishing!
