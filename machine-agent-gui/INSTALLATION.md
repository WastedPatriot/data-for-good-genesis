# Installation Guide

## Step 1: Install Dependencies

```bash
cd machine-agent-gui
npm install
```

## Step 2: Development Mode

Run the app in development mode:

```bash
npm run dev
```

This will:
- Start the React development server on http://localhost:3001
- Launch Electron with hot reload

## Step 3: Build for Production

Build the AppImage for Ubuntu:

```bash
npm run package:linux
```

The AppImage will be created in: `dist-package/DataForEarth-Agent-*.AppImage`

## Step 4: Install AppImage

```bash
# Make executable
chmod +x dist-package/DataForEarth-Agent-*.AppImage

# Move to system location
sudo cp dist-package/DataForEarth-Agent-*.AppImage /opt/dataforearth-agent.AppImage
```

## Step 5: Configure Secrets

1. Launch the app
2. Navigate to Settings tab
3. Enter credentials:
   - **Supabase URL**: https://fszghwwbvxwkmgfvhzrh.supabase.co
   - **Ingest Secret**: [Your INGEST_SECRET from Supabase]
4. Click "Test Connection"
5. Click "Save Configuration"

## Step 6: Setup Systemd Service (Optional)

For automatic startup on boot:

```bash
# Copy service file
sudo cp dataforearth-agent.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable dataforearth-agent

# Start service
sudo systemctl start dataforearth-agent

# Check status
sudo systemctl status dataforearth-agent
```

## Configuration Locations

- **Config File**: `~/.config/dataforearth-machine-agent/config.json`
- **Logs**: `~/.config/dataforearth-machine-agent/logs/agent.log`

## Build Troubleshooting

### Node.js Version
Ensure you're using Node.js 18 or higher:
```bash
node --version
```

### Permission Issues
If you get permission errors:
```bash
sudo chown -R $USER:$USER machine-agent-gui/
```

### Missing Dependencies
Install system dependencies:
```bash
sudo apt install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libxcb-dri3-0
```

## Running Without Building

You can run directly without building:

```bash
npm run dev
```

This is useful for development and testing.
