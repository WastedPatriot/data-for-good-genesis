# DataForEarth Project Index

Complete catalog of all project files and documentation for AI review.

## 📁 Project Structure Overview

```
dataforearth/
├── src/                          # Main website (React/Vite)
├── public/                       # Static assets
├── supabase/                     # Backend (Edge Functions + DB)
└── machine-agent-gui/            # Desktop automation agent (separate app)
```

---

## 🌐 Website Application

### Core Application Files
- `src/App.tsx` - Main app component with routing
- `src/main.tsx` - React entry point
- `src/index.css` - Global styles and design system
- `tailwind.config.ts` - Tailwind configuration with semantic tokens
- `vite.config.ts` - Vite build configuration

### Pages (`src/pages/`)
- `Index.tsx` - Landing page with hero, features
- `Home.tsx` - Main home dashboard
- `About.tsx` - About DataForEarth
- `Projects.tsx` - Environmental projects showcase
- `Marketplace.tsx` - Dataset marketplace
- `Contribute.tsx` - Data contribution page
- `Donate.tsx` - Donation page
- `Contact.tsx` - Contact form
- `Help.tsx` - Help/FAQ page
- `Login.tsx` - Authentication page
- `Admin.tsx` - Admin dashboard
- `ClaimBadge.tsx` - Badge claiming
- `OrganizationSignup.tsx` - Org registration
- `OrganizationProfile.tsx` - Org profile management
- `NotFound.tsx` - 404 page
- `Privacy.tsx` - Privacy policy
- `Terms.tsx` - Terms of service

### Components (`src/components/`)
- `Navigation.tsx` - Main navigation bar
- `EarthBackground.tsx` - Animated Earth background
- `Earth3DBackground.tsx` - 3D Earth with Three.js
- `EarthLogo.tsx` - Animated logo component
- `DoomsdayCountdown.tsx` - Climate countdown timer
- `DataStoryAnimation.tsx` - Data visualization animation
- `PhoneMockup.tsx` - Mobile app mockup
- `ProtectedRoute.tsx` - Auth route wrapper

### UI Components (`src/components/ui/`)
Complete shadcn/ui component library:
- Form elements: `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
- Layout: `card`, `dialog`, `sheet`, `tabs`, `accordion`, `collapsible`, `separator`
- Navigation: `navigation-menu`, `menubar`, `breadcrumb`, `pagination`
- Feedback: `alert`, `toast`, `progress`, `skeleton`
- Data display: `table`, `badge`, `avatar`, `calendar`, `chart`
- Overlays: `popover`, `tooltip`, `hover-card`, `context-menu`, `dropdown-menu`

### Utilities
- `src/lib/utils.ts` - Utility functions (cn, etc.)
- `src/hooks/use-mobile.tsx` - Mobile detection hook
- `src/hooks/use-toast.ts` - Toast notifications

### Integration
- `src/integrations/supabase/client.ts` - Supabase client (auto-generated)
- `src/integrations/supabase/types.ts` - Database types (auto-generated)

---

## 🗄️ Backend (Supabase)

### Configuration
- `supabase/config.toml` - Edge function settings, JWT verification rules

### Database Schema (`supabase/migrations/`)
**Tables:**
- `datasets` - Published datasets with pricing
- `purchases` - User purchases and downloads
- `badge_codes` - Claimable badge codes
- `data_submissions` - Raw user data submissions
- `data_processing_queue` - Data processing pipeline
- `contact_submissions` - Contact form entries
- `organization_profiles` - Org accounts
- `user_roles` - Role-based access control (admin/user)
- `audit_logs` - System audit trail

**Functions:**
- `update_updated_at_column()` - Timestamp trigger
- `has_role()` - Security definer role check

**RLS Policies:** Comprehensive row-level security on all tables

### Edge Functions (`supabase/functions/`)

#### Data Management
- `submit-data-submission/` - Accept user data contributions
- `process-data-submission/` - Process submitted data
- `data-harvest-api/` - Fetch processed records for publishing
- `ingest-dataset/` - Publish new datasets (HMAC secured)
- `publish-dataset/` - Dataset publishing workflow
- `dataset-status/` - Query dataset information
- `download-dataset/` - Secure dataset downloads

#### Badge & Purchase
- `create-badge-codes/` - Generate badge codes
- `verify-badge/` - Validate badge claims
- `purchase-dataset/` - Stripe checkout session
- `verify-purchase/` - Verify Stripe payments
- `send-purchase-confirmation/` - Email confirmations

#### Communication
- `submit-contact/` - Contact form handler (emails to hello@dataforearth.org)
- `create-donation/` - Donation processing

**All functions send emails via Resend API using `noreply@dataforearth.org`**

---

## 🖥️ Machine Agent Desktop App

**Location:** `machine-agent-gui/`

Complete Electron desktop application for automated dataset publishing on Ubuntu Linux.

### Core Application
- `electron/main.ts` - Electron main process (15+ IPC handlers)
- `electron/preload.ts` - IPC bridge
- `electron/index.d.ts` - TypeScript definitions
- `renderer/src/App.tsx` - React main app
- `renderer/src/main.tsx` - React entry point
- `renderer/index.html` - HTML template

### Components (`renderer/src/components/`)
**6 Functional Tabs:**
1. `Dashboard.tsx` - Metrics, revenue charts, health monitoring
2. `DatasetAutomation.tsx` - Auto-publish configuration, pending records
3. `EcoProjects.tsx` - Project scanner, approval workflow
4. `BadgeCodes.tsx` - Badge inventory management
5. `Logs.tsx` - Real-time log viewer with filtering
6. `Settings.tsx` - Supabase connection, automation config

### Configuration Files
- `package.json` - Dependencies (Electron, React, Chart.js)
- `tsconfig.json` - TypeScript config (renderer)
- `tsconfig.electron.json` - TypeScript config (main)
- `vite.config.ts` - Vite bundler config
- `.gitignore` - Ignore node_modules, builds, logs

### System Integration
- `dataforearth-agent.service` - Systemd service file for 24/7 operation

### Documentation

#### Setup & Installation
- `README.md` - Overview and quick start
- `QUICKSTART.md` - 5-minute setup guide
- `INSTALLATION.md` - Detailed installation steps
- `BUILD_GUIDE.md` - **Complete build instructions with:**
  - Full dependency list (NPM + system libraries)
  - Step-by-step build commands
  - Build artifacts location
  - 3 installation options
  - Configuration file structure
  - Troubleshooting guide

#### Usage & Architecture
- `USAGE.md` - Tab-by-tab user guide
- `ARCHITECTURE.md` - Technical documentation:
  - Tech stack
  - Process architecture
  - IPC channels
  - Data flow diagrams
  - HMAC signature implementation
  - Security considerations
- `PROJECT_SUMMARY.md` - Complete project overview

#### Email & Collaboration
- `EMAIL_SETUP.md` - **Resend + Proton integration guide:**
  - DNS configuration (SPF, DKIM, MX)
  - Domain verification steps
  - Proton mailbox setup
  - Email flow diagrams
  - Troubleshooting delivery issues
- `CONTRIBUTING.md` - Development guidelines
- `SCREENSHOTS.md` - UI documentation template

#### Legal
- `LICENSE` - MIT License

### Build Artifacts (Generated)
- `dist/` - Intermediate build files
  - `electron/` - Compiled main process
  - `renderer/` - Compiled React app
- `dist-package/` - **Final output:**
  - `DataForEarth-Agent-*.AppImage` (~180 MB) - **Main deliverable**
- `logs/` - Application logs (runtime)
- `screenshots/` - UI screenshots (to be added)

### Key Features
- HMAC SHA-256 authentication for edge functions
- Background automation with configurable intervals
- Revenue analytics with Chart.js
- Badge code inventory alerts
- Real-time dashboard (30s refresh)
- Comprehensive logging system
- Systemd integration for production

### Configuration Files (Runtime)
**Location:** `~/.config/dataforearth-machine-agent/`
- `config.json` - User configuration:
  ```json
  {
    "SUPABASE_URL": "https://fszghwwbvxwkmgfvhzrh.supabase.co",
    "INGEST_SECRET": "user-provided-secret",
    "DATA_PRICE": 99.99,
    "BADGE_CODE_COUNT": 50,
    "CATEGORY": "environmental",
    "MIN_RECORDS_FOR_DATASET": 100,
    "POLL_INTERVAL_MINUTES": 60
  }
  ```
- `logs/agent.log` - Application logs

---

## 🎨 Design System

### Colors (HSL-based semantic tokens)
Defined in `src/index.css`:
- Primary/secondary/accent colors
- Background/foreground variants
- Destructive/muted/border colors
- Dark mode support

### Typography
- Font families
- Size scale
- Line heights
- Font weights

### Components
- Consistent spacing
- Border radius
- Shadows
- Animations

**Configuration:** `tailwind.config.ts` extends semantic tokens

---

## 🔐 Security

### Authentication
- Supabase Auth with email/password
- Auto-confirm enabled for development
- Protected routes with `ProtectedRoute` component

### Row-Level Security (RLS)
All tables have comprehensive policies:
- Admin role via `has_role()` function
- User-specific data isolation
- Public read where appropriate
- Audit logging on sensitive operations

### Edge Function Security
- JWT verification (configurable per function)
- HMAC signatures on ingest endpoints
- Secret-based authentication
- CORS headers properly configured

### Machine Agent Security
- HMAC SHA-256 for API requests
- Timestamp validation (5-minute window)
- No hardcoded credentials
- Config stored in OS user data directory

---

## 📧 Email Configuration

**Provider:** Resend (https://resend.com)
**Sending Address:** `noreply@dataforearth.org`
**Admin Address:** `hello@dataforearth.org`

### DNS Requirements
- SPF: `v=spf1 include:_spf.resend.com include:_spf.protonmail.ch ~all`
- DKIM: `resend._domainkey` (value from Resend)
- MX to Proton: `mail.protonmail.ch` (10), `mailsec.protonmail.ch` (20)

### Email Functions
1. Contact form → `hello@dataforearth.org`
2. Purchase confirmations → Users
3. Dataset published alerts → `hello@dataforearth.org`

**Detailed setup:** `machine-agent-gui/EMAIL_SETUP.md`

---

## 🚀 Deployment

### Website
- **Platform:** Lovable Cloud (production) or custom hosting
- **Build:** `npm run build` → `dist/`
- **Custom domain:** Configure via Lovable dashboard

### Backend (Supabase)
- **Project ID:** `fszghwwbvxwkmgfvhzrh`
- **URL:** `https://fszghwwbvxwkmgfvhzrh.supabase.co`
- **Edge functions:** Auto-deployed via Lovable Cloud
- **Database:** Managed Postgres

### Machine Agent
- **Platform:** Ubuntu Linux (AppImage)
- **Build:** `npm run package:linux`
- **Output:** `dist-package/DataForEarth-Agent-*.AppImage`
- **Installation:** Copy to `/opt/` or run directly
- **Service:** Systemd integration for 24/7 operation

---

## 📦 Dependencies

### Website (package.json)
**Core:**
- React 18.3.1
- TypeScript 5.3.3
- Vite 5.0.0
- TanStack Query 5.83.0

**UI:**
- Radix UI components (~30 packages)
- Tailwind CSS 3.x
- Framer Motion 12.23.24
- Lucide React (icons) 0.462.0

**Backend:**
- @supabase/supabase-js 2.76.1

**3D:**
- Three.js 0.180.0

### Machine Agent (machine-agent-gui/package.json)
**Core:**
- Electron 28.0.0
- React 18.3.1
- TypeScript 5.3.3

**UI:**
- Chart.js 4.4.1
- react-chartjs-2 5.2.0
- date-fns 3.6.0

**Build:**
- Vite 5.0.0
- electron-builder 24.9.1

---

## 🧪 Testing

### Manual Testing
- Contact form submission
- Purchase flow (Stripe test mode)
- Data submission
- Badge claiming
- Authentication flows
- Admin dashboard

### Machine Agent Testing
- Configuration save/load
- Supabase connection
- Dataset publishing
- Badge code generation
- Automation start/stop
- Log viewing

---

## 📝 Key Files for AI Review

### Critical Configuration
1. `supabase/config.toml` - Edge function JWT settings
2. `src/index.css` - Design system tokens
3. `tailwind.config.ts` - Tailwind configuration
4. `.env` - Environment variables (auto-generated)

### Main Entry Points
1. `src/main.tsx` - Website entry
2. `src/App.tsx` - Website routing
3. `machine-agent-gui/electron/main.ts` - Agent backend
4. `machine-agent-gui/renderer/src/App.tsx` - Agent UI

### Documentation Hub
1. `PROJECT_INDEX.md` (this file) - Complete project catalog
2. `machine-agent-gui/PROJECT_SUMMARY.md` - Agent overview
3. `machine-agent-gui/BUILD_GUIDE.md` - Build instructions
4. `machine-agent-gui/ARCHITECTURE.md` - Technical details
5. `machine-agent-gui/EMAIL_SETUP.md` - Email configuration

---

## 🔗 External Services

### Supabase (Backend)
- Database: Postgres with RLS
- Auth: Email/password
- Storage: (not currently used)
- Edge Functions: Deno-based serverless

### Resend (Email)
- Transactional email API
- Domain: dataforearth.org
- Requires DNS verification

### Stripe (Payments)
- Dataset purchases
- Webhook integration
- Test mode enabled

### Proton Mail (Receiving)
- Admin inbox: hello@dataforearth.org
- Email aliases: noreply@, partnerships@

---

## 🎯 Project Goals

1. **Website:** Showcase ethical data practices, sell datasets
2. **Machine Agent:** Automate dataset publishing from processed data
3. **Integration:** Seamless workflow from submission → processing → publishing → purchase
4. **Transparency:** Open source, community-driven
5. **Sustainability:** Support environmental initiatives

---

## 📊 Current Status

**Website:**
- ✅ Full React SPA with routing
- ✅ Supabase backend integration
- ✅ Stripe payment flow
- ✅ Contact form with email
- ✅ Admin dashboard
- ✅ Authentication system

**Machine Agent:**
- ✅ Complete Electron app
- ✅ 6 functional tabs
- ✅ HMAC authentication
- ✅ Background automation
- ✅ Systemd integration
- ✅ Comprehensive documentation

**Backend:**
- ✅ 12 edge functions deployed
- ✅ 8 database tables with RLS
- ✅ Email sending configured
- ⚠️ Email receiving needs DNS fix (MX to Proton)

---

## 🐛 Known Issues

1. **Email Delivery:** Emails sent but not received in Proton
   - **Cause:** MX records likely pointing to wrong server
   - **Solution:** Set MX to mail.protonmail.ch, mailsec.protonmail.ch
   - **See:** `machine-agent-gui/EMAIL_SETUP.md`

2. **Eco Projects:** Currently uses mock data
   - **Future:** Implement real web scraping

---

## 🔄 Repository Structure

**Two separate repositories recommended:**
1. **dataforearth-website** - Main Lovable project (this repo)
2. **dataforearth-machine-agent** - Desktop app (`machine-agent-gui/` folder)

**To split:**
```bash
git subtree split --prefix=machine-agent-gui -b agent-split
git push https://github.com/ORG/dataforearth-machine-agent.git agent-split:main
```

---

## 📚 Documentation Priority

**For AI Chat Review:**
1. Start with this file (`PROJECT_INDEX.md`)
2. Read `machine-agent-gui/PROJECT_SUMMARY.md`
3. Review `machine-agent-gui/ARCHITECTURE.md` for technical details
4. Check `machine-agent-gui/BUILD_GUIDE.md` for build process
5. See `machine-agent-gui/EMAIL_SETUP.md` for email troubleshooting

**For New Developers:**
1. `README.md` - Project overview
2. `machine-agent-gui/QUICKSTART.md` - Quick start
3. `machine-agent-gui/USAGE.md` - How to use
4. `machine-agent-gui/CONTRIBUTING.md` - How to contribute

---

**Last Updated:** 2025-10-23
**Project Version:** 1.0.0
**Status:** Ready for deployment
