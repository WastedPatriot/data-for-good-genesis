# DataForEarth Developer Guide

**Welcome future developer!** 👋

This guide will help you understand the DataForEarth codebase and get up to speed quickly.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Key Technologies](#key-technologies)
3. [Database Schema](#database-schema)
4. [Data Flow](#data-flow)
5. [Security Model](#security-model)
6. [Edge Functions](#edge-functions)
7. [Frontend Structure](#frontend-structure)
8. [Machine Agent GUI](#machine-agent-gui)
9. [Development Workflow](#development-workflow)
10. [Debugging](#debugging)

---

## System Architecture

### High-Level Overview

```
┌─────────────────┐
│  Web Frontend   │ ← React + TypeScript + Tailwind
│  (Vite App)     │
└────────┬────────┘
         │
         ├─► Visitor Tracking
         ├─► Data Submission (gamified)
         ├─► Marketplace (Stripe)
         └─► Admin Dashboard
         │
         ▼
┌─────────────────┐
│   Supabase      │
├─────────────────┤
│ • PostgreSQL    │ ← RLS policies, triggers, functions
│ • Edge Funcs    │ ← Serverless backend logic
│ • Auth          │ ← Email + social login
│ • Storage       │ ← Dataset files
└────────┬────────┘
         │
         ├─► Stripe (payments)
         ├─► Resend (emails)
         └─► Python Scraper (data harvesting)
```

### Core Components

1. **Web App** (`src/`)
   - React SPA with client-side routing
   - Real-time UI updates via Supabase subscriptions
   - Responsive design (mobile-first)

2. **Backend** (`supabase/`)
   - PostgreSQL database with RLS
   - 40+ Edge Functions for business logic
   - Automated data curation pipeline

3. **Machine Agent** (`machine-agent-gui/`)
   - Electron desktop app for Ubuntu
   - Automated dataset publishing
   - External project scanning

4. **Python Scraper** (`data-scraper-module/`)
   - Real-world data harvesting
   - 15+ sources (climate, ESG, policy, markets)
   - Rate limiting + deduplication

---

## Key Technologies

### Frontend Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (fast HMR)
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching/caching

### Backend Stack

- **Supabase** - Backend-as-a-Service
  - PostgreSQL 15 (database)
  - Deno Edge Functions (serverless)
  - GoTrue (authentication)
  - Storage API (file uploads)
- **Stripe** - Payment processing
- **Resend** - Transactional emails

### DevOps

- **Lovable** - Development platform
- **GitHub** - Version control
- **Systemd** - Linux service management (machine agent)

---

## Database Schema

### Core Tables

#### `data_submissions`
**Purpose:** Stores voluntary user data contributions
```sql
- id (uuid, primary key)
- email (text, nullable)
- age_range, location, interests (text[])
- device_ownership, ev_ownership, sustainability (text)
- sensor_data (jsonb) - metadata
- created_at (timestamp)
```

**RLS Policies:**
- INSERT: Anyone (anonymous OK)
- SELECT: Admin only
- No updates/deletes (immutable)

**Value:** Each submission = $0.50 to $25 depending on completeness

---

#### `review_queue`
**Purpose:** AI-analyzed data awaiting admin approval
```sql
- id (uuid, primary key)
- source_type (text) - 'user_submission' | 'scraper' | 'external'
- raw_payload (jsonb) - original data
- normalized_payload (jsonb) - cleaned data
- confidence_score (numeric) - AI quality rating
- quality_tier (text) - 'bronze' | 'silver' | 'gold' | 'platinum'
- status (text) - 'pending' | 'approved' | 'rejected'
- provenance_hash (text) - deduplication key
```

**RLS Policies:**
- SELECT/UPDATE/DELETE: Admin only
- INSERT: System functions only

**Flow:** Raw data → AI analysis → Review queue → Approval → Curated pool

---

#### `curated_pool`
**Purpose:** Approved, high-quality records ready for datasets
```sql
- id (uuid, primary key)
- review_queue_id (uuid, foreign key)
- category (text) - e.g., 'Environmental', 'Climate'
- quality_tier (text)
- confidence_score (numeric)
- curated_payload (jsonb) - finalized data
- domain, region, sector (text) - for filtering
- tags (text[]) - searchable keywords
- batch_number (integer) - release batch tracking
- limited_supply (integer) - scarcity management
- enterprise_grade (boolean) - premium datasets
```

**RLS Policies:**
- SELECT/INSERT/UPDATE/DELETE: Admin only

**Purpose in Pipeline:** Building block for marketplace datasets

---

#### `datasets`
**Purpose:** Marketplace listings (Stripe products)
```sql
- id (uuid, primary key)
- name, description (text)
- category (text)
- domain, region, sector (text) - filters
- price (numeric)
- stripe_product_id, stripe_price_id (text)
- sample_data (jsonb) - preview
- size_mb (integer)
- active (boolean) - visible on marketplace
- featured (boolean) - homepage highlight
- batch_number (integer) - release tracking
- limited_supply (integer, nullable) - scarcity
- enterprise_grade (boolean) - premium tier
- source_channel (text) - 'on_site' | 'external'
```

**RLS Policies:**
- SELECT: Anyone (if active = true)
- INSERT/UPDATE/DELETE: Admin only

**Stripe Integration:** Each dataset = Stripe product with payment link

---

#### `purchases`
**Purpose:** Customer purchase records
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- dataset_id (uuid, foreign key)
- amount_paid (numeric)
- stripe_session_id (text)
- stripe_payment_intent (text)
- status (text) - 'pending' | 'completed' | 'failed'
- download_count (integer)
- last_downloaded_at (timestamp)
```

**RLS Policies:**
- SELECT: User (own purchases) OR Admin
- INSERT: User (own purchases)
- UPDATE: User (own purchases) OR Admin
- DELETE: Admin only

**Post-Purchase:** Triggers badge generation + email confirmation

---

#### `enterprise_badges`
**Purpose:** Tiered certification system for customers
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- badge_tier (text) - 'bronze' | 'silver' | 'gold' | 'platinum'
- badge_code (text, unique) - claim code
- badge_image_url (text) - SVG badge URL
- badge_seed (text) - unique visual pattern
- volume_purchased (numeric) - lifetime spend
- eco_funding_contributed (numeric) - community impact
- verified (boolean)
- expires_at (timestamp, nullable)
```

**Tiers:**
- Bronze: $100 - $499
- Silver: $500 - $1,999
- Gold: $2,000 - $9,999
- Platinum: $10,000+

**Voting Power:**
- Bronze/None: 1x vote weight
- Silver: 2x vote weight
- Gold: 3x vote weight
- Platinum: 5x vote weight

---

#### `projects`
**Purpose:** Community-funded eco/social impact projects
```sql
- id (uuid, primary key)
- title, description, long_description (text)
- category (text) - e.g., 'Environment', 'Education'
- organization_name (text)
- funding_goal (numeric)
- funded_amount (numeric) - current total
- votes_count (integer) - with badge multiplier
- status (project_status) - 'proposed' | 'verified' | 'active' | 'funded' | 'completed'
- region_impact (region_impact) - 'global' | 'palestine' | 'sudan' | 'congo', etc.
- website_url, documentation_url, proof_of_work_url (text)
- verified_by, verified_at (uuid, timestamp)
- active_from, active_until (timestamp) - campaign window
- charity_registration_number (text)
- recommended_funding_sources (jsonb) - suggested allocation
```

**RLS Policies:**
- SELECT: Anyone (if status IN ('verified', 'active', 'funded', 'completed'))
- INSERT: Authenticated users
- UPDATE: Submitter (if status = 'proposed') OR Admin
- DELETE: Admin only

**Voting:** Users vote once per 30 days, with badge multipliers

---

#### `visitor_analytics`
**Purpose:** Anonymous website tracking for datasets
```sql
- id (uuid, primary key)
- session_id (text) - hashed anonymous ID
- ip_address (text) - should be truncated to city-level
- page_path (text)
- referrer (text)
- user_agent (text)
- device_type, browser, os (text)
- country, city (text, nullable)
- visited_at (timestamp)
```

**RLS Policies:**
- INSERT: Anyone (anonymous tracking)
- SELECT: Admin only

**GDPR Compliance:**
- No PII stored
- IP truncated to city-level
- 90-day automatic deletion
- User opt-out via cookies

---

### Supporting Tables

- `audit_logs` - Security event tracking
- `login_attempts` - Rate limiting
- `vote_cooldowns` - 30-day vote restriction
- `user_roles` - Admin access control
- `badge_codes` - Pre-generated claim codes
- `sharecards` - Generated visual badges
- `funding_ledger` - Monthly funding allocation
- `organization_profiles` - Business accounts

---

## Data Flow

### 1. Data Submission Flow

```
User visits /submit-data
  ↓
Fills gamified wizard (4 steps)
  ↓
Submits with explicit consent
  ↓
data_submissions table (INSERT)
  ↓
Edge Function: process-data-submission
  ↓
AI analysis (quality scoring)
  ↓
review_queue table (INSERT)
  ↓
Admin reviews in /admin/review
  ↓
Approved → curated_pool
  ↓
Rejected → archived
```

**Key Files:**
- `src/pages/SubmitData.tsx` - Gamified wizard
- `supabase/functions/process-data-submission/` - AI analysis

---

### 2. Dataset Building Flow

```
Admin navigates to /admin/dataset-builder
  ↓
Selects category/filters
  ↓
Reviews curated records
  ↓
Clicks "Build Dataset"
  ↓
Edge Function: build-dataset-from-curated
  ↓
1. Pulls records from curated_pool
2. Marks records as "used"
3. Creates Stripe product
4. Generates CSV/JSON files
5. Uploads to Storage bucket
6. Inserts dataset record
  ↓
Dataset appears on /marketplace
```

**Key Files:**
- `src/pages/admin/DatasetBuilder.tsx` - UI
- `supabase/functions/build-dataset-from-curated/` - Builder

---

### 3. Purchase Flow

```
Customer browses /marketplace
  ↓
Clicks "Purchase Dataset"
  ↓
Redirected to Stripe Checkout
  ↓
Completes payment
  ↓
Stripe webhook → Supabase
  ↓
Edge Function: verify-purchase
  ↓
1. Updates purchases.status = 'completed'
2. Generates enterprise badge
3. Sends confirmation email
4. Allocates funding to projects
  ↓
Customer views /profile
  ↓
Downloads dataset files
```

**Key Files:**
- `src/pages/Marketplace.tsx` - Product listings
- `supabase/functions/verify-purchase/` - Post-payment
- `supabase/functions/generate-enterprise-badge/` - Badge creation

---

### 4. Machine Agent Automation

```
Ubuntu server runs dataforearth-agent.AppImage
  ↓
Systemd service keeps it running 24/7
  ↓
Agent polls data-harvest-api every 5 minutes
  ↓
Fetches processed records (curated_pool count)
  ↓
If count >= threshold (e.g., 50):
  ↓
  Triggers dataset build API
  ↓
  Publishes to marketplace
  ↓
  Consumes badge codes
  ↓
  Sends email notification
  ↓
Logs to ~/.config/dataforearth-machine-agent/logs/
```

**Key Files:**
- `machine-agent-gui/` - Electron app
- `supabase/functions/data-harvest-api/` - API endpoint
- `machine-agent-gui/dataforearth-agent.service` - Systemd config

---

## Security Model

### Row-Level Security (RLS)

**Critical: ALL tables have RLS enabled.**

#### Common Patterns

1. **Admin-Only Tables**
```sql
-- Example: audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
```

2. **User-Owned Data**
```sql
-- Example: purchases
CREATE POLICY "Users can view their own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);
```

3. **Public Read, Admin Write**
```sql
-- Example: datasets
CREATE POLICY "Anyone can view active datasets" ON datasets
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage datasets" ON datasets
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

4. **Anonymous Insert Only**
```sql
-- Example: visitor_analytics
CREATE POLICY "Anyone can insert visitor analytics" ON visitor_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view visitor analytics" ON visitor_analytics
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

---

### Authentication

**Provider:** Supabase Auth (GoTrue)

**Methods:**
- Email + Password (auto-confirm enabled for dev)
- Magic Link (email-based passwordless)
- OAuth (Google, GitHub - can be configured)

**Session Management:**
- JWT tokens (1 hour expiry)
- Refresh tokens (stored in httpOnly cookie)
- Automatic renewal on page refresh

**Admin Access:**
- Stored in `user_roles` table
- Checked via `has_role()` function
- Protected routes use `<ProtectedRoute>` component

---

### Rate Limiting

**Login Attempts:**
- Max 5 failed attempts per IP/device fingerprint
- 15-minute lockout after threshold
- Tracked in `login_attempts` table

**API Calls:**
- Edge functions: 100 req/min per IP (Supabase default)
- Can be increased with paid plan

---

### Data Protection

**PII Handling:**
- Contact submissions: Admin-only read
- User emails: Encrypted at rest
- IP addresses: Should be truncated (TODO in track-visitor)
- Payment details: Never stored (Stripe handles)

**GDPR Compliance:**
- Explicit consent required for tracking
- Easy opt-out mechanism
- Data export on request
- 90-day retention policy

---

## Edge Functions

### Critical Functions

#### `process-data-submission`
**Trigger:** User submits data via /submit-data
**Actions:**
1. Validates payload structure
2. Calls AI for quality scoring
3. Normalizes data format
4. Generates provenance hash (deduplication)
5. Inserts into review_queue
6. Logs audit trail

**Secrets:** `LOVABLE_API_KEY` (AI gateway)

---

#### `build-dataset-from-curated`
**Trigger:** Admin clicks "Build Dataset" in UI
**Actions:**
1. Queries curated_pool by filters
2. Enforces release policy (max 2/week)
3. Creates Stripe product + price
4. Generates CSV/JSON files
5. Uploads to Storage bucket
6. Inserts dataset record
7. Marks records as "used"

**Secrets:** `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

#### `verify-purchase`
**Trigger:** Stripe webhook after successful payment
**Actions:**
1. Validates Stripe signature
2. Updates purchases.status = 'completed'
3. Calculates badge tier
4. Calls `generate-enterprise-badge`
5. Sends confirmation email via Resend
6. Allocates funding to projects
7. Logs audit trail

**Secrets:** `STRIPE_SECRET_KEY`, `RESEND_API_KEY`

---

#### `track-visitor`
**Trigger:** Frontend on page load (if consented)
**Actions:**
1. Parses user agent
2. Extracts device/browser/OS
3. Gets IP from headers
4. Inserts into visitor_analytics

**GDPR TODO:** Truncate IP to city-level

---

### Deployment

**Automatic:** Edge functions deploy on every `git push` via Lovable.

**Manual Testing:**
```bash
# Using Supabase CLI
supabase functions serve track-visitor --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/track-visitor \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test123","page_path":"/"}'
```

---

## Frontend Structure

### Key Pages

#### `/` (Home.tsx)
- Hero section with 3D Earth background
- Real-time impact counter
- CTA to submit data or browse marketplace

#### `/submit-data` (SubmitData.tsx)
- Gamified 4-step wizard
- Real-time value calculation
- Explicit consent checkboxes
- Animations and progress tracking

#### `/marketplace` (Marketplace.tsx)
- Grid of dataset cards
- Filter by category, domain, price
- Purchase via Stripe Checkout
- Sample data preview

#### `/projects` (Projects.tsx)
- Community-funded projects
- Voting with badge multipliers
- Funding progress bars
- Sharecard generation after vote

#### `/admin` (Admin.tsx)
- Stats overview
- Quick links to management pages
- AI marketing assistant
- Recent activity logs

---

### Reusable Components

#### `<DataImpactCounter>` (DataImpactCounter.tsx)
- Fetches live stats from `v_public_impact` view
- Animated number counters
- Updates every 30 seconds

#### `<Earth3DBackground>` (Earth3DBackground.tsx)
- Three.js rotating Earth
- Particle effects
- Performance optimized

#### `<ProtectedRoute>` (ProtectedRoute.tsx)
- Wraps admin pages
- Checks authentication + admin role
- Redirects to login if unauthorized

---

### Hooks

#### `useVisitorTracking()`
- Tracks page views on mount
- Respects opt-out cookie
- Calls `track-visitor` edge function

#### `useDeviceFingerprint()`
- Generates unique device ID
- Used for rate limiting
- Canvas fingerprint + screen + timezone

---

## Machine Agent GUI

### Purpose
Automate dataset publishing without manual admin intervention.

### Architecture
- **Framework:** Electron (desktop app)
- **OS:** Ubuntu Linux
- **Service:** Systemd for 24/7 uptime
- **Config:** `~/.config/dataforearth-machine-agent/config.json`

### Features
1. **Auto-Publish Datasets**
   - Polls curated_pool count
   - Publishes when threshold reached
   - Uses badge codes for free claims

2. **External Project Scanner**
   - Discovers eco projects via APIs
   - Auto-approves based on criteria

3. **Badge Code Management**
   - Generates codes in bulk
   - Tracks inventory
   - Alerts when low (<50)

4. **Logs & Monitoring**
   - Real-time dashboard
   - Export logs as CSV
   - Error notifications

### Deployment
See `MACHINE_AGENT_DEPLOYMENT.md` for full instructions.

**Quick Start:**
```bash
cd machine-agent-gui
npm install
npm run dev  # Development mode

# Production build
npm run package:linux
sudo cp dist-package/DataForEarth-Agent-*.AppImage /opt/
sudo cp dataforearth-agent.service /etc/systemd/system/
sudo systemctl enable dataforearth-agent
sudo systemctl start dataforearth-agent
```

---

## Development Workflow

### Local Setup

1. **Clone & Install**
```bash
git clone [repo-url]
cd dataforearth
npm install
```

2. **Environment Variables**
Already configured in Lovable (no .env file needed):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

3. **Run Dev Server**
```bash
npm run dev
```

4. **Access Supabase Dashboard**
Via Lovable UI → Database tab

---

### Code Style

- **TypeScript:** Strict mode enabled
- **Components:** Functional components with hooks
- **Naming:** 
  - Components: PascalCase (`DataImpactCounter.tsx`)
  - Hooks: camelCase with `use` prefix (`useVisitorTracking.ts`)
  - Functions: camelCase (`calculateProgress()`)
- **Comments:** Document "why", not "what"

---

### Git Workflow

1. **Branches:**
   - `main` - Production (auto-deploys)
   - `dev` - Development (merge here first)
   - `feature/*` - New features
   - `fix/*` - Bug fixes

2. **Commits:**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
   - Be descriptive: "feat: add gamified data submission wizard"

3. **Pull Requests:**
   - Always review before merge
   - Run tests locally first
   - Update documentation

---

## Debugging

### Frontend Debugging

**Browser DevTools:**
```javascript
// Check console for tagged logs
console.log("[SubmitData] Form submission initiated");

// Network tab shows Edge Function calls
// Look for POST to /functions/v1/track-visitor
```

**React DevTools:**
- Install extension
- Inspect component state/props
- Profile performance

---

### Backend Debugging

**Edge Function Logs:**
```bash
# In Lovable UI → Functions tab → Select function → View Logs
# Or via Supabase dashboard
```

**Database Queries:**
```sql
-- Check recent submissions
SELECT * FROM data_submissions 
ORDER BY created_at DESC 
LIMIT 10;

-- View processing queue status
SELECT status, COUNT(*) 
FROM review_queue 
GROUP BY status;

-- Check dataset sales
SELECT d.name, COUNT(p.id) as purchases
FROM datasets d
LEFT JOIN purchases p ON p.dataset_id = d.id
WHERE p.status = 'completed'
GROUP BY d.id, d.name
ORDER BY purchases DESC;
```

---

### Common Issues

**Issue:** Real-time impact shows 0 contributors
**Fix:** Check if `v_public_impact` view is querying correctly:
```sql
SELECT * FROM v_public_impact;
```

**Issue:** Dataset build fails
**Fix:** Check curated_pool count and release policy:
```sql
SELECT COUNT(*) FROM curated_pool WHERE quality_tier >= 'silver';
SELECT * FROM release_policy WHERE channel = 'on_site';
```

**Issue:** Purchase not completing
**Fix:** Check Stripe webhook logs in Stripe dashboard

---

## Resources

### Documentation
- Lovable Docs: https://docs.lovable.dev/
- Supabase Docs: https://supabase.com/docs
- Stripe API: https://stripe.com/docs/api

### Internal Docs
- `ANTI_HACK_SUMMARY.md` - Security measures
- `FINAL_PRODUCTION_MANIFEST.md` - Feature checklist
- `HARVESTER_AUTOMATION_GUIDE.md` - Python scraper
- `MACHINE_AGENT_DEPLOYMENT.md` - Agent deployment

---

## Need Help?

1. **Check logs** - Frontend console + Edge function logs
2. **Read docs** - This guide + individual markdown files
3. **Ask AI** - Lovable AI assistant knows the codebase
4. **Contact team** - [support email or Slack channel]

---

**Remember:** The code is heavily commented. When in doubt, read the file headers!

Good luck building the future of ethical data! 🌍💚
