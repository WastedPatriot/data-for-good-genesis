# Complete Build Guide - DataForEarth Machine Agent

## ✅ Dependencies

### System Requirements
- **OS**: Ubuntu 20.04+ (or any Linux with AppImage support)
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **RAM**: 4GB minimum
- **Disk**: 500MB free space

### NPM Dependencies (package.json)

#### Production Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "chart.js": "^4.4.1",
  "react-chartjs-2": "^5.2.0",
  "date-fns": "^3.6.0"
}
```

#### Development Dependencies
```json
{
  "@types/node": "^20.11.0",
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.2.1",
  "concurrently": "^8.2.2",
  "electron": "^28.0.0",
  "electron-builder": "^24.9.1",
  "typescript": "^5.3.3",
  "vite": "^5.0.0"
}
```

### System Libraries (Ubuntu/Debian)
```bash
sudo apt install -y \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  libatspi2.0-0 \
  libdrm2 \
  libgbm1 \
  libxcb-dri3-0
```

---

## ✅ Build Instructions

### Step 1: Navigate to Project
```bash
cd machine-agent-gui
```

### Step 2: Install Dependencies
```bash
npm install
```

**Expected output:**
```
added 423 packages, and audited 424 packages in 45s
```

### Step 3: Build for Production
```bash
npm run package:linux
```

**This command does 3 things:**
1. Builds React app with Vite → `dist/renderer/`
2. Compiles TypeScript main process → `dist/electron/`
3. Packages everything with electron-builder → `dist-package/`

**Expected output:**
```
> dataforearth-machine-agent@1.0.0 package:linux
> npm run build && electron-builder --linux AppImage

  • electron-builder  version=24.9.1 os=5.15.0-91-generic
  • loaded configuration  file=package.json ("build" field)
  • writing effective config  file=dist-package/builder-effective-config.yaml
  • packaging       platform=linux arch=x64 electron=28.0.0 appOutDir=dist-package/linux-unpacked
  • building        target=AppImage arch=x64 file=dist-package/DataForEarth-Agent-1.0.0.AppImage
```

**Build time:** ~3-5 minutes (depending on system)

---

## ✅ Build Artifacts Location

```
machine-agent-gui/
├── dist/                           # Intermediate build files
│   ├── electron/                   # Compiled main process
│   │   ├── main.js                # ~50 KB
│   │   └── preload.js             # ~5 KB
│   └── renderer/                   # Compiled React app
│       ├── index.html             # ~1 KB
│       ├── assets/                # JS/CSS bundles
│       │   ├── index-[hash].js    # ~500 KB
│       │   └── index-[hash].css   # ~10 KB
│       └── ...
│
└── dist-package/                   # FINAL ARTIFACTS ⭐
    ├── DataForEarth-Agent-1.0.0.AppImage  # 🎯 MAIN OUTPUT (~180 MB)
    ├── linux-unpacked/             # Unpacked version (for debugging)
    │   ├── DataForEarth-Agent      # Executable
    │   ├── resources/              # App resources
    │   └── ...
    ├── builder-effective-config.yaml  # Build config used
    └── builder-debug.yml           # Debug info
```

### Main Output File
**Location**: `dist-package/DataForEarth-Agent-1.0.0.AppImage`
**Size**: ~180-200 MB
**Type**: AppImage (single-file executable)
**Permissions**: Needs execute permission (`chmod +x`)

---

## ✅ Install Instructions

### Option 1: Manual Installation (Recommended for Testing)

```bash
# Make the AppImage executable
chmod +x dist-package/DataForEarth-Agent-1.0.0.AppImage

# Run directly
./dist-package/DataForEarth-Agent-1.0.0.AppImage
```

### Option 2: System Installation (Production)

```bash
# Copy to system location
sudo cp dist-package/DataForEarth-Agent-1.0.0.AppImage /opt/dataforearth-agent.AppImage

# Create desktop entry
cat > ~/.local/share/applications/dataforearth-agent.desktop << EOF
[Desktop Entry]
Name=DataForEarth Agent
Comment=Automated Dataset Publisher
Exec=/opt/dataforearth-agent.AppImage
Icon=application-default-icon
Terminal=false
Type=Application
Categories=Utility;Development;
EOF

# Update desktop database
update-desktop-database ~/.local/share/applications/
```

### Option 3: Systemd Service (24/7 Operation)

```bash
# Copy AppImage
sudo cp dist-package/DataForEarth-Agent-1.0.0.AppImage /opt/dataforearth-agent.AppImage

# Copy service file
sudo cp dataforearth-agent.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable dataforearth-agent

# Start service
sudo systemctl start dataforearth-agent

# Check status
sudo systemctl status dataforearth-agent
```

**View service logs:**
```bash
sudo journalctl -u dataforearth-agent -f
```

---

## ✅ Configuration Files

### Application Config
**Location**: `~/.config/dataforearth-machine-agent/config.json`

**Structure:**
```json
{
  "SUPABASE_URL": "https://fszghwwbvxwkmgfvhzrh.supabase.co",
  "INGEST_SECRET": "your-secret-here",
  "DATA_PRICE": 99.99,
  "BADGE_CODE_COUNT": 50,
  "CATEGORY": "environmental",
  "MIN_RECORDS_FOR_DATASET": 100,
  "POLL_INTERVAL_MINUTES": 60
}
```

**How to set:**
1. Launch the app
2. Go to Settings tab
3. Fill in values
4. Click "Save Configuration"

**Or manually create:**
```bash
mkdir -p ~/.config/dataforearth-machine-agent
cat > ~/.config/dataforearth-machine-agent/config.json << 'EOF'
{
  "SUPABASE_URL": "https://fszghwwbvxwkmgfvhzrh.supabase.co",
  "INGEST_SECRET": "YOUR_INGEST_SECRET_HERE",
  "DATA_PRICE": 99.99,
  "BADGE_CODE_COUNT": 50,
  "CATEGORY": "environmental",
  "MIN_RECORDS_FOR_DATASET": 100,
  "POLL_INTERVAL_MINUTES": 60
}
EOF
```

### Required Secrets
You need to obtain these from your Supabase project:

1. **SUPABASE_URL**: 
   - Already set: `https://fszghwwbvxwkmgfvhzrh.supabase.co`

2. **INGEST_SECRET**:
   - Found in your Supabase secrets
   - Used for authenticating with edge functions

### Logs Location
**Location**: `~/.config/dataforearth-machine-agent/logs/agent.log`

**View logs:**
```bash
tail -f ~/.config/dataforearth-machine-agent/logs/agent.log
```

**Or use the Logs tab in the app**

---

## ✅ Verification Steps

### 1. Verify Build Success
```bash
# Check if AppImage exists
ls -lh dist-package/DataForEarth-Agent-*.AppImage

# Should show: ~180-200 MB file
```

### 2. Test Launch
```bash
./dist-package/DataForEarth-Agent-*.AppImage
```

**Expected**: App window opens with 6 tabs visible

### 3. Test Configuration
1. Go to Settings tab
2. Enter Supabase URL and INGEST_SECRET
3. Click "Test Connection"
4. Should see: ✅ "Connection successful!"

### 4. Test Functionality
- **Dashboard**: Should load without errors
- **Settings**: Config should save successfully
- **Logs**: Should be readable
- **Badge Codes**: Query should work (after config)

---

## 🔧 Troubleshooting

### Build Fails: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Fails: "Permission denied"
```bash
sudo chown -R $USER:$USER machine-agent-gui/
```

### AppImage Won't Run: "Permission denied"
```bash
chmod +x dist-package/DataForEarth-Agent-*.AppImage
```

### AppImage Won't Run: Missing libraries
```bash
sudo apt install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils
```

### Config Not Saving
```bash
# Check permissions
ls -la ~/.config/dataforearth-machine-agent/

# Fix if needed
chmod 755 ~/.config/dataforearth-machine-agent/
chmod 644 ~/.config/dataforearth-machine-agent/config.json
```

### Can't Connect to Supabase
- Verify SUPABASE_URL is correct
- Verify INGEST_SECRET is valid
- Check network connectivity: `ping supabase.co`
- Check firewall settings

---

## 📊 Development vs Production

### Development Mode
```bash
npm run dev
```
- Hot reload enabled
- React dev server on :3001
- Electron DevTools open
- Faster iteration
- Larger memory usage

### Production Build
```bash
npm run package:linux
```
- Optimized bundle
- Minified code
- Single AppImage file
- Smaller memory footprint
- No dev tools

---

## 🚀 Quick Start Commands

```bash
# Full build process
cd machine-agent-gui
npm install
npm run package:linux

# Run the AppImage
chmod +x dist-package/DataForEarth-Agent-*.AppImage
./dist-package/DataForEarth-Agent-*.AppImage

# Configure (in app Settings tab)
# 1. Supabase URL: https://fszghwwbvxwkmgfvhzrh.supabase.co
# 2. Ingest Secret: [from Supabase]
# 3. Save Configuration
# 4. Test Connection

# Install as service (optional)
sudo cp dist-package/DataForEarth-Agent-*.AppImage /opt/dataforearth-agent.AppImage
sudo cp dataforearth-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now dataforearth-agent
```

---

## 📝 Build Checklist

- [x] Node.js 18+ installed
- [x] System libraries installed
- [x] Navigate to `machine-agent-gui/`
- [x] Run `npm install`
- [x] Run `npm run package:linux`
- [x] Verify AppImage created in `dist-package/`
- [x] Make AppImage executable
- [x] Test launch
- [x] Configure Supabase credentials
- [x] Test connection
- [x] Generate initial badge codes
- [x] Test automation

---

## 🎯 Expected File Sizes

```
dist/electron/main.js           ~50 KB
dist/electron/preload.js        ~5 KB
dist/renderer/index.html        ~1 KB
dist/renderer/assets/*.js       ~500 KB (combined)
dist/renderer/assets/*.css      ~10 KB
dist-package/*.AppImage         ~180 MB (main artifact)
```

---

## 💡 Pro Tips

1. **Clean builds**: Run `rm -rf dist dist-package` before rebuilding if you encounter issues

2. **Faster builds**: Use `npm run build` to build without packaging (for testing)

3. **Debug mode**: Run with `./DataForEarth-Agent-*.AppImage --enable-logging` for verbose logs

4. **Update AppImage**: Just replace the file at `/opt/dataforearth-agent.AppImage` and restart service

5. **Backup config**: Copy `~/.config/dataforearth-machine-agent/config.json` before reinstalling

---

**Build Status**: ✅ Ready to build
**Estimated Build Time**: 3-5 minutes
**Output Size**: ~180 MB AppImage
