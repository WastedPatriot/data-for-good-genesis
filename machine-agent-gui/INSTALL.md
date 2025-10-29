# Machine Agent GUI - Installation Guide

## Quick Install (Any Platform)

### Prerequisites
- Node.js 18+ and npm
- Git (to clone the repository)

### Step 1: Clone and Navigate
```bash
git clone https://github.com/WastedPatriot/data-for-good-genesis.git
cd data-for-good-genesis/machine-agent-gui
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build the Application

**For Windows:**
```bash
npm run package:win
```

**For Linux:**
```bash
npm run package:linux
```

**For Both (Linux only):**
```bash
npm run package:all
```

### Output Location
Built packages will be in: `machine-agent-gui/dist-package/`

- **Windows**: `DataForEarth Agent Setup X.X.X.exe` (installer) and portable `.exe`
- **Linux**: `DataForEarth-Agent-X.X.X.AppImage`

## Development Mode

To run in development mode with hot-reload:

```bash
npm run dev
```

This will:
1. Start the Vite dev server on port 3001
2. Launch Electron with dev tools open
3. Auto-reload on file changes

## Configuration

On first run, configure the agent via Settings tab:
- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_ANON_KEY**: Your Supabase anon key  
- **INGEST_SECRET**: Secret key for data ingestion

Config is stored at:
- **Windows**: `%APPDATA%/dataforearth-machine-agent/config.json`
- **Linux**: `~/.config/dataforearth-machine-agent/config.json`

## Troubleshooting

### Build Fails
1. Clean install:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear electron cache:
   ```bash
   # Windows
   del /s /q %LOCALAPPDATA%\electron\Cache
   
   # Linux
   rm -rf ~/.cache/electron
   ```

### Module Not Found Errors
Ensure you're in the `machine-agent-gui` directory, not the root project directory.

### Permission Errors (Linux)
```bash
chmod +x dist-package/*.AppImage
```

## System Service (Linux)

To run 24/7 as a systemd service:

1. Copy service file:
   ```bash
   sudo cp dataforearth-agent.service /etc/systemd/system/
   ```

2. Edit paths in service file:
   ```bash
   sudo nano /etc/systemd/system/dataforearth-agent.service
   ```

3. Enable and start:
   ```bash
   sudo systemctl enable dataforearth-agent
   sudo systemctl start dataforearth-agent
   ```

4. Check status:
   ```bash
   sudo systemctl status dataforearth-agent
   ```

## Logs

Application logs are stored at:
- **Windows**: `%APPDATA%/dataforearth-machine-agent/logs/agent.log`
- **Linux**: `~/.config/dataforearth-machine-agent/logs/agent.log`

View logs in real-time:
```bash
# Linux
tail -f ~/.config/dataforearth-machine-agent/logs/agent.log

# Windows PowerShell
Get-Content "$env:APPDATA\dataforearth-machine-agent\logs\agent.log" -Wait
```

## Support

For issues, see the main project documentation or open a GitHub issue.
