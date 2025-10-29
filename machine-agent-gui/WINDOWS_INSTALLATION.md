# DataForEarth Machine Agent - Windows Installation Guide

## Download

**Windows Installer (Recommended):**
- `DataForEarth-Agent-Setup-1.0.0.exe` (~150MB)
- User-friendly setup wizard
- Creates Start Menu shortcuts
- Auto-updates in future

**Windows Portable:**
- `DataForEarth-Agent-1.0.0-portable.exe` (~150MB)
- No installation required
- Run from any folder
- Great for USB drives

---

## Installation Methods

### Method 1: Installer (Recommended)

1. **Download** `DataForEarth-Agent-Setup-1.0.0.exe`
2. **Double-click** to run the installer
3. **Windows SmartScreen** may appear:
   - Click "More info"
   - Click "Run anyway"
   - (This is normal for unsigned apps)
4. **Follow the wizard:**
   - Choose installation directory (default: `C:\Program Files\DataForEarth Agent\`)
   - Select "Create desktop shortcut" (recommended)
   - Select "Create Start Menu shortcut" (recommended)
5. **Click "Install"**
6. **Launch** from Start Menu or Desktop

**Installation path:**
```
C:\Program Files\DataForEarth Agent\
```

### Method 2: Portable (No Installation)

1. **Download** `DataForEarth-Agent-1.0.0-portable.exe`
2. **Create folder** (e.g., `C:\DataForEarth\`)
3. **Move the .exe** to that folder
4. **Double-click** to run
5. **Pin to taskbar** for easy access (optional)

No installation needed - just run directly!

---

## First-Time Configuration

### Step 1: Launch the Application

- **Via Installer:** Start Menu → DataForEarth Agent
- **Via Portable:** Double-click the .exe file

### Step 2: Configure Settings

1. Click the **Settings** tab
2. Enter your credentials:

**Required Fields:**

**Supabase URL:**
```
https://fszghwwbvxwkmgfvhzrh.supabase.co
```

**Ingest Secret:**
- Your `INGEST_SECRET` from Supabase project
- Found in Supabase → Settings → API → Service role key

**Dataset Defaults (Optional):**
- **Default Price:** `99.99` (or your preference)
- **Category:** `environmental`
- **Minimum Records:** `100` (records before auto-publish)
- **Badge Codes:** `50` (codes per dataset)
- **Poll Interval:** `60` (minutes between checks)

### Step 3: Test Connection

1. Click **"Test Connection"** button
2. Should see: ✅ **"Connection successful!"**
3. If error: verify URL and secret are correct

### Step 4: Save Configuration

1. Click **"Save Configuration"**
2. Settings are saved to: `%APPDATA%\dataforearth-machine-agent\config.json`

---

## Configuration File Locations

**Config File:**
```
%APPDATA%\dataforearth-machine-agent\config.json
```

**Logs:**
```
%APPDATA%\dataforearth-machine-agent\logs\agent.log
```

**To view config folder:**
1. Press `Win + R`
2. Type: `%APPDATA%\dataforearth-machine-agent`
3. Press Enter

---

## Auto-Start on Windows Boot

### Option A: Using Task Scheduler (Built-in)

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click **"Create Task"** (right sidebar)
3. **General tab:**
   - Name: `DataForEarth Agent`
   - Description: `Automated Dataset Publisher`
   - Check: "Run with highest privileges"
4. **Triggers tab:**
   - Click "New"
   - Begin task: **At log on**
   - Specific user: `[Your username]`
5. **Actions tab:**
   - Click "New"
   - Action: **Start a program**
   - Program/script: Browse to your .exe location
     - Installer: `C:\Program Files\DataForEarth Agent\DataForEarth Agent.exe`
     - Portable: `C:\YourFolder\DataForEarth-Agent-1.0.0-portable.exe`
6. **Conditions tab:**
   - **Uncheck** "Start only if on AC power"
7. Click **OK**

### Option B: Using Batch Script (Easy)

**For Installer Version:**

1. Right-click `windows-service-install.bat`
2. Select **"Run as Administrator"**
3. Done! Agent will start on every login

**To uninstall:**
- Run `windows-service-uninstall.bat` as Administrator

**For Portable Version:**

Edit `windows-service-install.bat` and update this line:
```batch
set "AGENT_PATH=C:\YourFolder\DataForEarth-Agent-1.0.0-portable.exe"
```

Then run as Administrator.

---

## Using the Application

### Dashboard Tab
- View total datasets published
- See revenue analytics
- Monitor recent activity
- Track badge code inventory

### Dataset Automation Tab
- Configure auto-publish thresholds
- Start/stop automation
- Manual publish option
- View automation status and logs

### Badge Codes Tab
- Generate bulk badge codes
- View current inventory
- Set low-inventory alerts
- Export codes to CSV

### Eco Projects Tab
- Scan for unverified projects
- Review project details
- Approve projects for marketplace
- Bulk operations

### Settings Tab
- Configure Supabase credentials
- Set dataset defaults
- Adjust automation parameters
- Test connection

### Logs Tab
- Real-time log viewer
- Filter by level (info, warn, error)
- Export logs for debugging
- Clear logs

---

## Troubleshooting

### "Windows protected your PC" Warning

This appears for unsigned executables:

1. Click **"More info"**
2. Click **"Run anyway"**
3. This is safe - the app is just not code-signed

*For production builds, consider purchasing a code signing certificate (~$100-300/year)*

### Cannot Connect to Supabase

**Check these:**
- ✅ Supabase URL is exactly: `https://fszghwwbvxwkmgfvhzrh.supabase.co`
- ✅ INGEST_SECRET is correct (no extra spaces)
- ✅ Internet connection is working
- ✅ Windows Firewall isn't blocking the app
- ✅ Antivirus isn't blocking network access

**Test with curl:**
```cmd
curl https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/dataset-status
```

### Configuration Not Saving

**Check permissions:**
1. Press `Win + R`
2. Type: `%APPDATA%\dataforearth-machine-agent`
3. If folder doesn't exist, the app will create it
4. If "Access Denied" → Run app as Administrator once

**Manual config creation:**
```cmd
mkdir %APPDATA%\dataforearth-machine-agent
notepad %APPDATA%\dataforearth-machine-agent\config.json
```

Paste:
```json
{
  "SUPABASE_URL": "https://fszghwwbvxwkmgfvhzrh.supabase.co",
  "INGEST_SECRET": "YOUR_SECRET_HERE",
  "DATA_PRICE": 99.99,
  "BADGE_CODE_COUNT": 50,
  "CATEGORY": "environmental",
  "MIN_RECORDS_FOR_DATASET": 100,
  "POLL_INTERVAL_MINUTES": 60
}
```

### High CPU Usage

- Check automation poll interval (Settings)
- Increase interval to reduce CPU usage
- Close app when not needed (if not running 24/7)
- Check for stuck processes in Task Manager

### Badge Codes Not Generating

1. Verify Supabase connection
2. Check INGEST_SECRET is correct
3. View logs for error messages
4. Try smaller batch (10 codes instead of 100)

### Automation Not Running

1. Check Settings → Poll Interval
2. Verify minimum records threshold
3. Ensure "Start Automation" was clicked
4. Check logs for errors
5. Manually test with "Publish Now"

---

## Uninstallation

### If Installed via Installer

1. Press `Win + I` (Settings)
2. Go to **Apps** → **Installed apps**
3. Find **"DataForEarth Agent"**
4. Click **⋮** (three dots) → **Uninstall**
5. Follow prompts

### If Using Portable

1. Stop the application
2. Delete the .exe file
3. (Optional) Delete config folder:
   - Press `Win + R`
   - Type: `%APPDATA%\dataforearth-machine-agent`
   - Delete folder

### Remove Auto-Start

**If using Task Scheduler:**
1. Press `Win + R`, type `taskschd.msc`
2. Find "DataForEarth Agent" task
3. Right-click → Delete

**If using batch script:**
- Run `windows-service-uninstall.bat` as Administrator

---

## System Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 10 (64-bit) or Windows 11 |
| **Processor** | Intel/AMD x64 processor |
| **RAM** | 2GB minimum, 4GB recommended |
| **Disk Space** | 500MB free space |
| **Network** | Internet connection required |
| **.NET** | Not required (Electron is bundled) |

---

## Build Instructions (For Developers)

If you want to build from source:

### Prerequisites

1. Install Node.js 18+: https://nodejs.org/
2. Clone repository
3. Navigate to `machine-agent-gui/`

### Build Windows Executable

```cmd
cd machine-agent-gui
npm install
npm run package:win
```

**Output files:**
```
dist-package\DataForEarth-Agent-Setup-1.0.0.exe      (NSIS installer)
dist-package\DataForEarth-Agent-1.0.0-portable.exe   (Portable)
```

### Cross-Compile from Linux

You can build Windows .exe from Linux:

```bash
# Install Wine (optional - for testing)
sudo apt install wine64

# Build
cd machine-agent-gui
npm install
npm run package:win
```

electron-builder will cross-compile automatically!

---

## Advanced Configuration

### Custom Installation Path

**During install:**
- Click "Browse" when choosing directory
- Select your preferred location
- App will use that path

**Portable version:**
- Just move the .exe anywhere
- Config stays in `%APPDATA%` regardless

### Environment Variables

The app respects these (if set):

```cmd
set SUPABASE_URL=https://your-project.supabase.co
set INGEST_SECRET=your-secret
```

But GUI settings override these.

### Logging Levels

Edit config.json to add:
```json
{
  "LOG_LEVEL": "debug"
}
```

Levels: `debug`, `info`, `warn`, `error`

---

## Firewall Configuration

If Windows Firewall blocks the app:

1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Click "Change settings"
4. Click "Allow another app"
5. Browse to DataForEarth Agent.exe
6. Check both "Private" and "Public"
7. Click "Add"

---

## Support & Help

### View Logs

**In the app:**
1. Go to Logs tab
2. Review recent messages
3. Look for red error messages

**In file system:**
```cmd
notepad %APPDATA%\dataforearth-machine-agent\logs\agent.log
```

### Common Log Messages

**✅ Good:**
```
✓ Connection successful
✓ Configuration saved
✓ Automation started
✓ Dataset published: [ID]
```

**⚠️ Warnings:**
```
⚠ Badge codes low (< 50)
⚠ No records to process
```

**❌ Errors:**
```
✗ Failed to connect to Supabase
✗ Invalid INGEST_SECRET
✗ Network error
```

### Contact Support

Include this info when asking for help:
- Windows version (10 or 11)
- Installation method (installer or portable)
- Error messages from logs
- Steps to reproduce the issue

---

## Updates

### Check for Updates

1. Open the app
2. Settings tab
3. Version shown at bottom
4. Check website for newer versions

### Install Updates

**Installer version:**
1. Download new installer
2. Run it (will update existing installation)
3. Keep config (auto-preserved)

**Portable version:**
1. Download new portable .exe
2. Replace old .exe
3. Config is in `%APPDATA%` (preserved)

### Auto-Update (Future Feature)

Planned for v1.1:
- In-app update notifications
- One-click update button
- Background downloads

---

## Security Notes

- Never share your INGEST_SECRET
- Config file is stored in plain text (future: encryption)
- Use Windows Defender/antivirus
- Only download from official sources
- Verify checksums (SHA256) before installing

---

## Known Limitations

- No macOS or Linux support yet (coming soon)
- No code signing (causes SmartScreen warning)
- No auto-update (manual updates required)
- Config not encrypted (use strong INGEST_SECRET)

---

## FAQ

**Q: Why does Windows say "Unknown publisher"?**
A: The app isn't code-signed yet. It's safe to run - just click "More info" → "Run anyway".

**Q: Can I run multiple instances?**
A: Not recommended. Only one instance should run automation.

**Q: Does it work offline?**
A: No, internet connection required to connect to Supabase.

**Q: Where are datasets stored?**
A: In Supabase database, not locally. The app just publishes them.

**Q: Can I use my own Supabase project?**
A: Yes, just change the URL in Settings.

**Q: Is my data secure?**
A: Yes, all communication uses HTTPS. But config file is not encrypted locally.

---

## Next Steps

After installation:

1. ✅ Configure Supabase credentials
2. ✅ Test connection
3. ✅ Generate initial badge codes (100+)
4. ✅ Set automation threshold (100 records)
5. ✅ Start automation
6. ✅ Set up auto-start (optional)
7. ✅ Monitor dashboard for activity

---

**Installation complete!** 🎉

For more details, see:
- [BUILD_GUIDE.md](./BUILD_GUIDE.md) - Build from source
- [README.md](./README.md) - General overview
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
