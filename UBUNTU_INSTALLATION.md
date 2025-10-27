# Complete Ubuntu Installation Guide
## DataForEarth Machine Agent + Extension System

---

## 🎯 What You're Installing

This guide sets up:
1. **Machine Agent GUI** - Desktop app for automated dataset publishing
2. **Browser Extension** - Chrome extension for carbon tracking
3. **Complete data pipeline** - From browsing → datasets → marketplace

---

## 📋 Prerequisites

### System Requirements
- Ubuntu 18.04+ (or any Debian-based Linux)
- 4GB RAM minimum
- 10GB free disk space
- Internet connection
- Sudo access

### Install Node.js 18+

```bash
# Remove old Node.js versions if any
sudo apt remove nodejs npm -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Install System Dependencies

```bash
sudo apt update
sudo apt install -y \
  build-essential \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  libatspi2.0-0 \
  libdrm2 \
  libgbm1 \
  libxcb-dri3-0 \
  git \
  curl \
  ca-certificates
```

---

## 🚀 Part 1: Machine Agent Installation

### Step 1: Clone or Download Project

If you have the project files already:
```bash
cd /path/to/dataforearth-project
cd machine-agent-gui
```

If starting fresh (requires git access):
```bash
git clone YOUR_REPO_URL
cd YOUR_REPO/machine-agent-gui
```

### Step 2: Install Dependencies

```bash
npm install
```

This will take 2-5 minutes. You should see:
- ✓ Packages installed successfully
- No errors in red

### Step 3: Build the AppImage

```bash
npm run package:linux
```

This builds the production AppImage. Takes 3-5 minutes.

**Expected output:**
```
• electron-builder  version=24.x.x
• building        target=AppImage arch=x64
• packaging       platform=linux arch=x64
• building        target AppImage for Linux
• packing files   to dist-package
```

**Success indicator:**
```
✓ AppImage created: dist-package/DataForEarth-Agent-1.0.0.AppImage
```

### Step 4: Make It Executable

```bash
chmod +x dist-package/DataForEarth-Agent-*.AppImage
```

### Step 5: First Launch & Configuration

```bash
./dist-package/DataForEarth-Agent-*.AppImage
```

The app window will open. Navigate to the **Settings** tab:

#### Required Settings:

**1. Supabase URL:**
```
https://fszghwwbvxwkmgfvhzrh.supabase.co
```

**2. Ingest Secret:**
Your `INGEST_SECRET` from Supabase. To find it:
- Go to your Supabase project
- Settings → API → Service role key (this is the INGEST_SECRET)

**3. Dataset Defaults (optional):**
- Default Price: `99.99` (or your preference)
- Min Records: `100` (minimum records before auto-publish)
- Badge Codes per Dataset: `50`

**4. Test Connection:**
Click the "Test Connection" button. You should see:
```
✅ Connection successful!
```

**5. Save Configuration:**
Click "Save Configuration"

### Step 6: Verify Everything Works

#### Test 1: Dashboard
- Click "Dashboard" tab
- Should show: Total datasets, revenue, recent activity
- If you see "Error loading data" → check connection settings

#### Test 2: Dataset Automation
- Click "Dataset Automation" tab
- Set threshold to 5 records (for testing)
- Click "Start Automation"
- Should see logs: "✓ Automation started"

#### Test 3: Badge Code Generation
- Click "Badge Codes" tab
- Generate Quantity: 10
- Click "Generate Codes"
- Should complete in 2-5 seconds with success message

---

## 🌐 Part 2: Browser Extension Installation

### Step 1: Download Extension

In your browser:
1. Go to: `https://YOUR_SITE_URL/extension`
2. Click "Download Extension"
3. Save the ZIP file to Downloads

### Step 2: Extract ZIP

```bash
cd ~/Downloads
unzip dataforearth-extension-*.zip -d dataforearth-extension
```

### Step 3: Install in Chrome/Brave/Edge

1. Open Chrome/Brave/Edge
2. Navigate to: `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `dataforearth-extension` folder
6. Extension should appear with green checkmark

### Step 4: Test Extension

1. Visit any website (e.g., amazon.com)
2. Click the extension icon in toolbar
3. Should show:
   - Company name
   - Annual CO2 emissions
   - Sustainability score
   - "✓ Verified" or "⚠️ Estimated" badge

**If you see "No data yet":**
- Wait 2-3 seconds for API call
- Check internet connection
- Verify extension has correct API URL

---

## 🔧 Part 3: Install as Systemd Service (24/7 Operation)

This makes the machine agent run automatically on boot.

### Step 1: Move AppImage to System Location

```bash
sudo cp dist-package/DataForEarth-Agent-*.AppImage /opt/dataforearth-agent.AppImage
sudo chmod +x /opt/dataforearth-agent.AppImage
```

### Step 2: Create Systemd Service File

```bash
sudo nano /etc/systemd/system/dataforearth-agent.service
```

Paste this content:

```ini
[Unit]
Description=DataForEarth Machine Agent
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
Environment="DISPLAY=:0"
Environment="XAUTHORITY=/home/YOUR_USERNAME/.Xauthority"
ExecStart=/opt/dataforearth-agent.AppImage --no-sandbox
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Replace `YOUR_USERNAME` with your actual username:**
```bash
whoami  # This shows your username
```

### Step 3: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable dataforearth-agent

# Start the service now
sudo systemctl start dataforearth-agent

# Check status
sudo systemctl status dataforearth-agent
```

**Expected output:**
```
● dataforearth-agent.service - DataForEarth Machine Agent
   Loaded: loaded (/etc/systemd/system/dataforearth-agent.service; enabled)
   Active: active (running) since [timestamp]
```

### Step 4: View Service Logs

```bash
# Real-time logs
sudo journalctl -u dataforearth-agent -f

# Last 100 lines
sudo journalctl -u dataforearth-agent -n 100
```

---

## 📊 Part 4: Verify Complete Data Flow

### 1. Generate Test Data (2 minutes)

With browser extension installed:
```bash
# Visit these sites (wait 5 seconds on each)
- amazon.com
- netflix.com
- google.com
- github.com
- youtube.com
```

### 2. Trigger Batch Processing (1 minute)

Visit one more site - this should trigger automatic batch processing (10% chance per visit).

Or manually trigger:
```bash
# Using curl
curl -X POST https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/extension-handoff-for-review \
  -H "Content-Type: application/json" \
  -d '{"automated": true}'
```

### 3. Check Admin Review Page (30 seconds)

1. Go to: `https://YOUR_SITE_URL/admin/review`
2. Should see items in "Review Queue"
3. Click "Curate with AI" to process them

### 4. Wait for Auto-Publishing (5-10 minutes)

The machine agent will:
1. Monitor curated pool
2. When threshold reached (5-10 records)
3. Automatically publish dataset
4. Generate badge codes
5. Create Stripe product

**Check in Dashboard tab:**
- Should see new dataset listed
- Revenue updated
- Badge codes generated

---

## 🎉 Success Checklist

You're fully operational when you see:

- ✅ Machine agent GUI opens and connects to Supabase
- ✅ Browser extension shows carbon data for websites
- ✅ Admin review page shows items in queue
- ✅ AI curation processes data successfully
- ✅ Datasets auto-publish when threshold met
- ✅ Systemd service running (if installed)

---

## 🐛 Troubleshooting

### Machine Agent Won't Start

**Error: "Cannot find module"**
```bash
cd machine-agent-gui
rm -rf node_modules package-lock.json
npm install
npm run package:linux
```

**Error: "Permission denied"**
```bash
chmod +x dist-package/DataForEarth-Agent-*.AppImage
```

**Error: "Connection failed"**
- Verify Supabase URL is correct
- Check INGEST_SECRET matches Supabase
- Test internet connection

### Extension Not Showing Data

**"No data available for this website"**
- This is normal for unknown sites
- AI will estimate carbon footprint
- Look for "⚠️ Estimated" badge

**Extension not loading**
- Check: `chrome://extensions/`
- Ensure "Developer mode" is enabled
- Click "Reload" icon on extension

### Review Queue Still Empty

**After following all steps:**
```bash
# Manually trigger batch processing
curl -X POST https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/extension-handoff-for-review \
  -H "Content-Type: application/json" \
  -d '{"automated": true}'

# Check logs
sudo journalctl -u dataforearth-agent -n 50
```

### Systemd Service Not Starting

**Check service status:**
```bash
sudo systemctl status dataforearth-agent
```

**View detailed errors:**
```bash
sudo journalctl -u dataforearth-agent -n 50 --no-pager
```

**Common fixes:**
```bash
# Wrong username in service file
sudo nano /etc/systemd/system/dataforearth-agent.service
# Change YOUR_USERNAME to your actual username

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart dataforearth-agent
```

---

## 📁 File Locations

### Machine Agent Files
- **AppImage**: `/opt/dataforearth-agent.AppImage`
- **Config**: `~/.config/dataforearth-machine-agent/config.json`
- **Logs**: `~/.config/dataforearth-machine-agent/logs/agent.log`

### Extension Files
- **Unpacked folder**: `~/Downloads/dataforearth-extension/`
- **Local storage**: Chrome's internal storage (managed by browser)

### Service Files
- **Service definition**: `/etc/systemd/system/dataforearth-agent.service`
- **Service logs**: `journalctl -u dataforearth-agent`

---

## 🔄 Updating the Agent

When new versions are released:

```bash
cd machine-agent-gui
git pull  # If using git
npm install
npm run package:linux

# Update system installation
sudo cp dist-package/DataForEarth-Agent-*.AppImage /opt/dataforearth-agent.AppImage

# Restart service
sudo systemctl restart dataforearth-agent
```

---

## 📞 Support & Next Steps

### If Something Doesn't Work:

1. **Check logs first:**
   ```bash
   # Machine agent logs
   cat ~/.config/dataforearth-machine-agent/logs/agent.log
   
   # Systemd service logs
   sudo journalctl -u dataforearth-agent -n 100
   ```

2. **Test components individually:**
   - Run machine agent manually (not as service)
   - Test extension on multiple websites
   - Check admin panel review queue

3. **Verify network connectivity:**
   ```bash
   curl https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/extension-company-data?domain=amazon.com
   ```

### Success Metrics

Within 30 minutes of installation, you should see:
- ✅ Extension tracking 5+ website visits
- ✅ Data appearing in review queue
- ✅ AI successfully curating data
- ✅ First dataset auto-published (if threshold met)

---

## 🎯 What's Next?

1. **Browse websites** with the extension for 10-15 minutes
2. **Check admin panel** → Data Curation → should see items
3. **Lower threshold** in machine agent to 5 records (for testing)
4. **Watch automation** auto-publish your first dataset
5. **Check Stripe** dashboard for product creation
6. **Test purchase flow** on your marketplace

**Congratulations! You're now running a fully automated data marketplace! 🌍**
