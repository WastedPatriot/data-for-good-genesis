# Machine Agent File Manifest

Quick reference for all files in the machine-agent-gui folder.

## 📦 Package & Config (Root Level)

| File | Purpose | Size |
|------|---------|------|
| `package.json` | Dependencies, scripts, electron-builder config | ~1 KB |
| `tsconfig.json` | TypeScript config for renderer (React) | ~500 B |
| `tsconfig.electron.json` | TypeScript config for main process | ~400 B |
| `vite.config.ts` | Vite bundler configuration | ~300 B |
| `.gitignore` | Ignore patterns (node_modules, dist, logs) | ~200 B |
| `.npmrc` | NPM configuration (electron mirror) | ~100 B |

## 🔧 Electron Main Process

| File | Purpose | Lines | Size |
|------|---------|-------|------|
| `electron/main.ts` | Core Electron logic, IPC handlers, automation | 280 | ~12 KB |
| `electron/preload.ts` | IPC bridge (contextBridge API) | 30 | ~1 KB |
| `electron/index.d.ts` | TypeScript definitions for ElectronAPI | 40 | ~1 KB |

**Key Features in main.ts:**
- Config management (load/save JSON)
- HMAC signature generation
- 11 IPC handlers (fetch records, publish, generate codes, etc.)
- Automation interval scheduling
- File system operations
- Logging system

## 🎨 React Renderer

### Entry Points
| File | Purpose | Lines |
|------|---------|-------|
| `renderer/index.html` | HTML template | 11 |
| `renderer/src/main.tsx` | React entry point | 10 |
| `renderer/src/App.tsx` | Main app component, tab routing | 70 |
| `renderer/src/index.css` | Global styles | 120 |
| `renderer/src/App.css` | Component styles | 180 |

### Components (6 Tabs)
| File | Purpose | Lines | Features |
|------|---------|-------|----------|
| `Dashboard.tsx` | Metrics, revenue chart, health | 150 | Chart.js integration, 30s refresh |
| `DatasetAutomation.tsx` | Auto-publish control, pending records | 220 | Manual/auto publish, logs, config |
| `EcoProjects.tsx` | Project scanner, approval | 170 | Mock data, approve workflow |
| `BadgeCodes.tsx` | Badge inventory management | 180 | Generate codes, alerts, stats |
| `Logs.tsx` | Real-time log viewer | 130 | Filter, auto-refresh, stats |
| `Settings.tsx` | Supabase config, automation | 160 | Test connection, save config |

## 📖 Documentation

| File | Purpose | Pages | Key Sections |
|------|---------|-------|--------------|
| `README.md` | Project overview, quick links | 1 | Features, installation, usage |
| `QUICKSTART.md` | 5-minute setup | 2 | Install, configure, first run |
| `INSTALLATION.md` | Detailed install guide | 3 | Prerequisites, build, systemd |
| `BUILD_GUIDE.md` | Complete build instructions | 6 | Dependencies, artifacts, config |
| `USAGE.md` | Tab-by-tab user guide | 8 | Each tab explained, workflows |
| `ARCHITECTURE.md` | Technical documentation | 7 | Stack, IPC, data flow, security |
| `EMAIL_SETUP.md` | Resend + Proton setup | 5 | DNS, verification, troubleshooting |
| `PROJECT_SUMMARY.md` | Complete project overview | 4 | Deliverables, structure, status |
| `CONTRIBUTING.md` | Development guidelines | 3 | Setup, code style, PR process |
| `SCREENSHOTS.md` | UI documentation template | 1 | Screenshot placeholders |
| `MANIFEST.md` | This file - catalog | 2 | File inventory |
| `LICENSE` | MIT License | 1 | Open source license |

## 🚀 System Integration

| File | Purpose | Lines |
|------|---------|-------|
| `dataforearth-agent.service` | Systemd service file | 20 |

## 📁 Generated Directories (Build Time)

```
dist/                           # Intermediate builds
├── electron/
│   ├── main.js                # Compiled main (~50 KB)
│   └── preload.js             # Compiled preload (~5 KB)
└── renderer/                   # React build output
    ├── index.html
    └── assets/
        ├── index-[hash].js    # ~500 KB
        └── index-[hash].css   # ~10 KB

dist-package/                   # Final output
├── DataForEarth-Agent-1.0.0.AppImage  # 🎯 MAIN OUTPUT (~180 MB)
├── linux-unpacked/             # Debug version
├── builder-effective-config.yaml
└── builder-debug.yml

screenshots/                    # UI screenshots (to be added)
└── .gitkeep

logs/                          # Runtime logs (created at runtime)
└── agent.log
```

## 🔐 Runtime Config (Created by User)

**Location:** `~/.config/dataforearth-machine-agent/`

```
config.json                    # User configuration (~500 B)
logs/
└── agent.log                  # Application logs (grows over time)
```

## 📊 File Statistics

**Total Source Files:** ~35
**Documentation Files:** 12
**Source Code Lines:** ~2,000
**Documentation Lines:** ~3,500
**Total Lines:** ~5,500

**By Category:**
- TypeScript/React: 1,850 lines
- Documentation: 3,500 lines
- Configuration: 150 lines

## 🎯 Critical Files for Review

### Must Read First
1. `PROJECT_SUMMARY.md` - Start here for overview
2. `ARCHITECTURE.md` - Understand the technical design
3. `electron/main.ts` - Core backend logic
4. `BUILD_GUIDE.md` - How to build and deploy

### For Specific Tasks
- **Building:** `BUILD_GUIDE.md`, `package.json`
- **Using:** `QUICKSTART.md`, `USAGE.md`
- **Email Issues:** `EMAIL_SETUP.md`
- **Contributing:** `CONTRIBUTING.md`
- **Understanding Code:** `ARCHITECTURE.md`, component files

### For AI Analysis
1. Read `PROJECT_SUMMARY.md` for context
2. Review `ARCHITECTURE.md` for design patterns
3. Examine `electron/main.ts` for IPC implementation
4. Check component files for React patterns
5. Review `BUILD_GUIDE.md` for deployment

## 🔍 File Relationships

```
package.json
    ↓ dependencies
electron/main.ts
    ↓ spawns
electron/preload.ts
    ↓ exposes API to
renderer/src/App.tsx
    ↓ renders tabs
renderer/src/components/*.tsx
    ↓ call IPC via
electronAPI (from preload)
    ↓ handlers in
electron/main.ts
    ↓ calls
Supabase Edge Functions
    ↓ uses
config.json (runtime)
```

## 📦 Build Output Sizes

| Artifact | Size | Description |
|----------|------|-------------|
| `dist/electron/` | ~60 KB | Compiled main process |
| `dist/renderer/` | ~1 MB | React app bundle |
| `dist-package/*.AppImage` | ~180 MB | Final executable |

**AppImage Contents:**
- Electron runtime: ~150 MB
- Node.js runtime: ~20 MB
- App code + assets: ~10 MB

## 🎨 UI Components Count

- **Tabs:** 6
- **Charts:** 1 (Revenue line chart)
- **Forms:** 2 (Settings, Automation config)
- **Tables:** 4 (Pending records, badges, logs, eco projects)
- **Buttons:** ~25
- **Inputs:** ~10

## 🔄 Data Flow Summary

```
User Action
    ↓
React Component
    ↓
electronAPI.method()
    ↓
IPC Channel
    ↓
Main Process Handler
    ↓
HTTP Request (to Supabase)
    ↓
Edge Function
    ↓
Database/Email
    ↓
Response
    ↓
IPC Result
    ↓
Component Update
    ↓
UI Refresh
```

## 🧪 Test Coverage

**Manual Testing:**
- All 6 tabs functional
- Config save/load works
- Supabase connection tested
- IPC communication verified
- Build process validated
- Systemd service tested

**No Automated Tests Yet**
- Unit tests: 0
- Integration tests: 0
- E2E tests: 0

## 📝 Documentation Coverage

| Area | Coverage | Files |
|------|----------|-------|
| Installation | ✅ Comprehensive | INSTALLATION.md, QUICKSTART.md |
| Build | ✅ Complete | BUILD_GUIDE.md |
| Usage | ✅ Detailed | USAGE.md |
| Architecture | ✅ In-depth | ARCHITECTURE.md |
| Email | ✅ Thorough | EMAIL_SETUP.md |
| Contributing | ✅ Clear | CONTRIBUTING.md |
| Project Overview | ✅ Complete | PROJECT_SUMMARY.md, README.md |

## 🎯 Quick Stats

- **Total Files:** 47 (source + docs + config)
- **Programming Languages:** TypeScript, React, CSS
- **Frameworks:** Electron, React, Chart.js
- **Build System:** Vite + electron-builder
- **Package Manager:** npm
- **Node Version:** 18+
- **Platform:** Linux (Ubuntu)
- **Output Format:** AppImage
- **License:** MIT

---

**For detailed information on any file, see the full documentation in that file or refer to ARCHITECTURE.md**
