# DataForEarth Machine Agent

Desktop automation agent for DataForEarth dataset publishing and management.

## Platform Support

| Platform | Format | Status | Installation Guide |
|----------|--------|--------|-------------------|
| **Linux** | AppImage | ✅ Fully Supported | [UBUNTU_INSTALLATION.md](../UBUNTU_INSTALLATION.md) |
| **Windows** | .exe (NSIS + Portable) | ✅ Fully Supported | [WINDOWS_INSTALLATION.md](./WINDOWS_INSTALLATION.md) |
| **macOS** | .dmg | 🚧 Planned | Coming Soon |

## Features

- 📊 Real-time dashboard with revenue analytics
- 🤖 Automated dataset publishing
- 🌱 Eco project discovery and approval
- 🏆 Badge code generation and management
- 📝 Comprehensive logging
- ⚙️ Easy configuration
- 💻 Cross-platform support (Linux + Windows)

## Quick Downloads

### Windows (10/11)
- **Installer**: `DataForEarth-Agent-Setup-1.0.0.exe` (~150MB)
- **Portable**: `DataForEarth-Agent-1.0.0-portable.exe` (~150MB)
- See [WINDOWS_INSTALLATION.md](./WINDOWS_INSTALLATION.md)

### Linux (Ubuntu/Debian)
- **AppImage**: `DataForEarth-Agent-1.0.0.AppImage` (~180MB)
- See [UBUNTU_INSTALLATION.md](../UBUNTU_INSTALLATION.md)

---

## Installation on Linux (Ubuntu)

### Prerequisites

```bash
sudo apt update
sudo apt install -y nodejs npm
```

### Build the AppImage

```bash
cd machine-agent-gui
npm install
npm run package:linux
```

The AppImage will be created in `dist-package/DataForEarth-Agent-*.AppImage`

### Make it executable

```bash
chmod +x dist-package/DataForEarth-Agent-*.AppImage
```

## Configuration

1. Launch the app: `./dist-package/DataForEarth-Agent-*.AppImage`
2. Go to Settings tab
3. Enter your credentials:
   - **Supabase URL**: `https://fszghwwbvxwkmgfvhzrh.supabase.co`
   - **Ingest Secret**: Your INGEST_SECRET from Supabase
4. Configure dataset defaults
5. Click "Save Configuration"
6. Test connection

## Running as Systemd Service

### Install the service

```bash
# Copy the AppImage to a permanent location
sudo cp dist-package/DataForEarth-Agent-*.AppImage /opt/dataforearth-agent.AppImage

# Copy the service file
sudo cp dataforearth-agent.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start
sudo systemctl enable dataforearth-agent

# Start the service
sudo systemctl start dataforearth-agent

# Check status
sudo systemctl status dataforearth-agent
```

### View logs

```bash
sudo journalctl -u dataforearth-agent -f
```

## Usage

### Start Automation

1. Open the app
2. Go to "Dataset Automation" tab
3. Configure thresholds
4. Click "Start Automation"

### Publish Manually

1. Go to "Dataset Automation"
2. Configure dataset parameters
3. Click "Publish Now"

### Generate Badge Codes

1. Go to "Badge Codes" tab
2. Enter quantity
3. Click "Generate Codes"

### Approve Eco Projects

1. Go to "Eco Projects" tab
2. Click "Scan for Projects"
3. Review projects
4. Click "Approve" on desired projects

## Configuration File Locations

### Linux
- Config: `~/.config/dataforearth-machine-agent/config.json`
- Logs: `~/.config/dataforearth-machine-agent/logs/agent.log`

### Windows
- Config: `%APPDATA%\dataforearth-machine-agent\config.json`
- Logs: `%APPDATA%\dataforearth-machine-agent\logs\agent.log`

## Troubleshooting

### Connection Fails
- Verify Supabase URL is correct
- Check INGEST_SECRET is valid
- Ensure network connectivity

### Badge Codes Low
- Navigate to Badge Codes tab
- Generate more codes immediately
- Set up alerts in Dashboard

### Automation Not Running
- Check Settings → Poll Interval
- Verify minimum records threshold
- Review logs for errors

## Support

For issues, contact DataForEarth support or check the logs in the Logs tab.
