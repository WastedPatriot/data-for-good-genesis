# DataForEarth Machine Agent - Production Deployment Guide

## 🎯 Overview
This guide will deploy the Machine Agent GUI on your Ubuntu server for 24/7 automated dataset publishing and management.

## 📋 Prerequisites
- Ubuntu 20.04+ server with root/sudo access
- Node.js 18+ and npm
- Display server (Xvfb for headless operation)
- Your Supabase credentials

## 🚀 Step 1: Prepare Ubuntu Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build dependencies
sudo apt install -y build-essential git

# Install Xvfb for headless display (required for Electron)
sudo apt install -y xvfb libgbm1 libasound2

# Verify installations
node --version  # Should show v20.x
npm --version   # Should show 10.x+
```

## 📦 Step 2: Clone and Build the Agent

```bash
# Navigate to your deployment directory
cd /opt

# Clone the repository (or copy the machine-agent-gui folder)
sudo mkdir -p dataforearth
cd dataforearth

# Copy your machine-agent-gui folder here
# Then install dependencies
cd machine-agent-gui
sudo npm install

# Build the production AppImage
sudo npm run package:linux

# Make it executable
sudo chmod +x dist-package/DataForEarth-Agent-*.AppImage
```

## ⚙️ Step 3: Configure the Agent

```bash
# Create configuration directory
sudo mkdir -p ~/.config/dataforearth-machine-agent

# Create config file with your credentials
sudo nano ~/.config/dataforearth-machine-agent/config.json
```

**Paste this configuration (replace with your values):**

```json
{
  "supabaseUrl": "https://fszghwwbvxwkmgfvhzrh.supabase.co",
  "ingestSecret": "YOUR_INGEST_SECRET_HERE",
  "pollInterval": 300000,
  "minRecordsThreshold": 100,
  "defaultCategory": "environmental",
  "defaultPrice": 99.99,
  "badgeCodeCount": 50,
  "autoPublish": true
}
```

**Get your INGEST_SECRET:**
```bash
# On your local machine, check your Supabase secrets
# Or create a new one specifically for the agent
```

## 🔧 Step 4: Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/dataforearth-agent.service
```

**Paste this service configuration:**

```ini
[Unit]
Description=DataForEarth Machine Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/dataforearth/machine-agent-gui
Environment="DISPLAY=:99"
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1024x768x24 &
ExecStart=/opt/dataforearth/machine-agent-gui/dist-package/DataForEarth-Agent-*.AppImage --no-sandbox
Restart=always
RestartSec=10
StandardOutput=append:/var/log/dataforearth-agent.log
StandardError=append:/var/log/dataforearth-agent-error.log

[Install]
WantedBy=multi-user.target
```

## ▶️ Step 5: Start and Enable the Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable dataforearth-agent

# Start the service
sudo systemctl start dataforearth-agent

# Check status
sudo systemctl status dataforearth-agent

# View logs
sudo journalctl -u dataforearth-agent -f
```

## 📊 Step 6: Verify It's Working

```bash
# Check if the agent is running
ps aux | grep DataForEarth

# Check logs for activity
tail -f /var/log/dataforearth-agent.log

# You should see messages like:
# "Fetching pending records..."
# "Automation tick triggered"
# "Publishing dataset..."
```

## 🔍 Step 7: Monitor the Agent

```bash
# View real-time logs
sudo journalctl -u dataforearth-agent -f

# Check error logs
sudo tail -f /var/log/dataforearth-agent-error.log

# Restart if needed
sudo systemctl restart dataforearth-agent

# Stop the agent
sudo systemctl stop dataforearth-agent
```

## 🛠️ Troubleshooting

### Issue: Agent won't start
```bash
# Check permissions
sudo chmod +x /opt/dataforearth/machine-agent-gui/dist-package/DataForEarth-Agent-*.AppImage

# Check Xvfb is running
ps aux | grep Xvfb

# Manually start Xvfb
Xvfb :99 -screen 0 1024x768x24 &
```

### Issue: Can't connect to Supabase
```bash
# Verify config file
cat ~/.config/dataforearth-machine-agent/config.json

# Test connection
curl https://fszghwwbvxwkmgfvhzrh.supabase.co/rest/v1/
```

### Issue: No datasets being published
```bash
# Check if there are records in the curated pool
# Go to your admin dashboard at /admin/data-pipeline
# Run auto-curation first to populate the curated pool
```

## 🔒 Security Best Practices

1. **Firewall Configuration:**
```bash
# Only allow necessary ports
sudo ufw allow ssh
sudo ufw enable
```

2. **Secure the Config:**
```bash
# Restrict config file permissions
sudo chmod 600 ~/.config/dataforearth-machine-agent/config.json
```

3. **Regular Updates:**
```bash
# Update the agent code
cd /opt/dataforearth/machine-agent-gui
sudo git pull
sudo npm install
sudo npm run package:linux
sudo systemctl restart dataforearth-agent
```

## 📈 Performance Tuning

**Adjust automation frequency in config.json:**
```json
{
  "pollInterval": 300000,  // 5 minutes (300000ms)
  "minRecordsThreshold": 100  // Publish when 100+ records ready
}
```

**For high-volume operation:**
```json
{
  "pollInterval": 60000,   // Check every minute
  "minRecordsThreshold": 50,  // Lower threshold
  "autoPublish": true
}
```

## 🎯 What the Agent Does Automatically

1. **Every 5 minutes** (configurable):
   - Checks curated pool for new data
   - Counts available records
   - Evaluates quality tiers

2. **When threshold is met**:
   - Creates dataset with AI-analyzed data
   - Generates Stripe product/price
   - Creates badge codes
   - Publishes to marketplace
   - Logs all actions

3. **Continuous monitoring**:
   - Tracks badge code inventory
   - Monitors dataset sales
   - Reports system health
   - Auto-recovers from errors

## 🚨 Important Notes

- **First Run**: After starting, go to `/admin/data-pipeline` and run "Auto-Curate" to populate the curated pool
- **Badge Codes**: Ensure you have badge codes generated (the agent will alert if low)
- **Stripe**: Make sure your Stripe API keys are configured in Supabase
- **Testing**: Test with low thresholds first (10-20 records) before production settings

## 📞 Support

If issues persist:
1. Check `/var/log/dataforearth-agent.log`
2. Verify Supabase credentials
3. Ensure curated pool has data
4. Test API endpoints manually

## ✅ Success Checklist

- [ ] Ubuntu server prepared with all dependencies
- [ ] Machine agent built successfully
- [ ] Configuration file created with correct credentials
- [ ] Systemd service created and enabled
- [ ] Agent running without errors
- [ ] Logs showing regular activity
- [ ] First dataset published successfully
- [ ] Monitoring dashboard accessible

---

**Ready for production! The agent will now automatically publish datasets 24/7.**
