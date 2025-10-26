# DataForEarth Production Smoke Tests

Comprehensive testing checklist for production readiness.

## Prerequisites

- Admin access to DataForEarth platform
- Test user account (non-admin)
- Test payment method (Stripe test mode)
- Machine agent running

## Test Scenarios

### 1. Anonymous Public Access ✅

**Test: Impact metrics visible without login**

1. Open browser in incognito mode
2. Navigate to homepage
3. Verify "Real-Time Impact" section displays:
   - Contributors count
   - Active datasets count
   - Total revenue
   - Active domains count
   - High-quality records count

**Expected Result:**
- All metrics load without authentication
- Numbers update every 30 seconds
- No authentication errors in console

**SQL Verification:**
```sql
SELECT * FROM v_public_impact;
```

---

### 2. Data Harvesting Pipeline ✅

**Test: Machine agent ingests data → review queue**

**Step 1: Run scraper**
```bash
cd data-scraper-module
python scraper.py
```

**Step 2: Verify ingestion**
```sql
SELECT * FROM review_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- New items appear in review_queue
- Each item has:
  - provenance_hash (unique)
  - normalized_payload
  - confidence_score
  - domain, category, tags
- No duplicate hashes

---

### 3. Curation & Approval ✅

**Test: Approve items → moves to curated_pool**

1. Login as admin
2. Navigate to `/admin/review`
3. Select high-confidence items (> 0.85)
4. Click "Approve" button
5. Verify toast notification

**SQL Verification:**
```sql
-- Items should move from review_queue to curated_pool
SELECT 
  (SELECT COUNT(*) FROM review_queue WHERE status = 'approved') as approved_items,
  (SELECT COUNT(*) FROM curated_pool WHERE created_at > NOW() - INTERVAL '1 hour') as curated_items;
```

**Expected Result:**
- Items disappear from review queue
- Items appear in curated_pool
- quality_tier assigned (bronze/silver/gold/platinum)
- domain and sector populated

---

### 4. Dataset Builder ✅

**Test: Build dataset from curated pool**

1. Navigate to `/admin/dataset-builder`
2. Select filters:
   - Domain: climate
   - Quality tier: silver or higher
   - Min records: 100
3. Set dataset details:
   - Name: "Climate Data Q1 2025"
   - Price: $99.99
   - Description: Test dataset
4. Click "Build Dataset"

**Expected Result:**
- Success toast appears
- New dataset created in `datasets` table
- Stripe product & price created
- Badge codes generated
- Dataset marked as active

**SQL Verification:**
```sql
SELECT * FROM datasets
WHERE name = 'Climate Data Q1 2025';

SELECT COUNT(*) FROM badge_codes
WHERE dataset_id = (SELECT id FROM datasets WHERE name = 'Climate Data Q1 2025');
```

---

### 5. Badge Code Generation ✅

**Test: Badge codes created for dataset**

**SQL Check:**
```sql
SELECT 
  d.name as dataset_name,
  COUNT(bc.id) as badge_count,
  COUNT(CASE WHEN bc.claimed THEN 1 END) as claimed_count
FROM datasets d
LEFT JOIN badge_codes bc ON bc.dataset_id = d.id
WHERE d.name = 'Climate Data Q1 2025'
GROUP BY d.id, d.name;
```

**Expected Result:**
- 50 badge codes created (or configured amount)
- All codes unique
- No codes claimed initially

---

### 6. Stripe Checkout & Purchase ✅

**Test: Complete dataset purchase**

1. Logout from admin
2. Login as test user
3. Navigate to `/marketplace`
4. Find "Climate Data Q1 2025"
5. Click "Purchase"
6. Complete Stripe checkout (use test card: 4242 4242 4242 4242)
7. Return to site after payment

**Expected Result:**
- Redirect to Stripe checkout
- Payment processes successfully
- Redirected back to success page
- Purchase record created with status='completed'
- Revenue increments in public impact

**SQL Verification:**
```sql
SELECT * FROM purchases
WHERE dataset_id = (SELECT id FROM datasets WHERE name = 'Climate Data Q1 2025')
ORDER BY created_at DESC;
```

---

### 7. Export File Links ✅

**Test: Dataset formats displayed**

1. Navigate to dataset detail page
2. Verify format badges shown:
   - CSV ✅
   - JSONL ✅
   - Parquet 🔒 (pending)
   - SQLite 🔒 (pending)

**Expected Result:**
- CSV and JSONL available for download
- Parquet and SQLite show "pending" tooltip
- No broken links

---

### 8. Eco-Project Voting ✅

**Test: Vote increments project funding**

1. Navigate to `/projects`
2. Select a project
3. Click "Vote" button
4. Verify vote count increments

**SQL Verification:**
```sql
SELECT 
  p.title,
  p.votes_count,
  COUNT(pv.id) as actual_votes
FROM projects p
LEFT JOIN project_votes pv ON pv.project_id = p.id
GROUP BY p.id, p.title, p.votes_count;
```

**Expected Result:**
- votes_count column matches actual vote records
- User can only vote once per project
- Badge holders get multiplier (if implemented)

---

### 9. Impact Transparency Ledger ✅

**Test: Revenue allocation displayed publicly**

1. Navigate to `/impact-dashboard` (or transparency page)
2. Verify displays:
   - Monthly funding breakdown
   - Projects funded
   - Revenue sources
   - Geographic distribution

**Expected Result:**
- Charts load without errors
- Data matches `impact_allocation_history` table
- Anonymous users can view

---

### 10. Campaign Email UI ✅

**Test: Marketing campaigns work**

1. Navigate to `/admin/campaigns`
2. Create new lead:
   - Company: "Test Corp"
   - Email: test@example.com
   - Industry: Climate Tech
3. Compose email
4. Generate AI draft (click "🤖 AI Generate")
5. Save as draft
6. Approve and send

**Expected Result:**
- Lead created in `leads` table
- Campaign email saved with status='draft'
- AI generates personalized content
- After approval, status changes to 'sent'
- Email sent via Resend

**SQL Verification:**
```sql
SELECT * FROM campaign_emails
WHERE lead_id IN (SELECT id FROM leads WHERE email = 'test@example.com')
ORDER BY created_at DESC;
```

---

### 11. Enterprise Dashboard ✅

**Test: Buyer dashboard shows metrics**

1. Login as user who made purchase
2. Navigate to `/enterprise/dashboard`
3. Verify displays:
   - Total spend
   - Datasets owned
   - Eco contribution (10% of spend)
   - Badge tier
4. Download badge embed code
5. Download ESG JSON-LD

**Expected Result:**
- All metrics accurate
- Badge embed HTML downloads
- JSON-LD file contains schema.org markup
- Badge verification link works

---

### 12. Storage Bucket Access ✅

**Test: Dataset files accessible after purchase**

1. Purchase a dataset (repeat test #6)
2. Navigate to dataset detail page
3. Click "Download CSV"

**Expected Result:**
- File downloads successfully
- File contains valid data
- Unauthorized users get 403 error
- Purchase users can download

**SQL Verification:**
```sql
-- Check dataset_files table
SELECT * FROM dataset_files
WHERE dataset_id = (SELECT id FROM datasets WHERE name = 'Climate Data Q1 2025');

-- Check storage bucket
SELECT name, bucket_id, created_at
FROM storage.objects
WHERE bucket_id = 'dataset-files'
ORDER BY created_at DESC
LIMIT 10;
```

---

### 13. Anti-Market Flood Throttling ✅

**Test: Release policy enforced**

1. Navigate to `/admin/release-policy`
2. Verify current limits:
   - On-site: 2 releases/week per domain
   - External: 2 releases/month per domain
3. Try building 3 datasets in same week
4. Verify 3rd dataset fails with throttle error

**SQL Verification:**
```sql
SELECT * FROM release_policy
WHERE channel = 'on_site';

-- Check recent releases
SELECT 
  domain,
  COUNT(*) as releases_this_week
FROM datasets
WHERE created_at > NOW() - INTERVAL '7 days'
  AND active = true
GROUP BY domain;
```

**Expected Result:**
- 3rd dataset blocked
- Error message: "Weekly release limit reached"
- Burst mode can override (admin only)

---

### 14. Provenance Collision Detection ✅

**Test: Duplicate data rejected**

1. Run scraper twice on same source
2. Verify 2nd run creates collision records

**SQL Verification:**
```sql
SELECT * FROM provenance_collisions
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- Duplicates not inserted into review_queue
- Collisions logged to `provenance_collisions` table
- Incoming payload stored for audit

---

### 15. Audit Logs & Security ✅

**Test: All admin actions logged**

1. Perform various admin actions:
   - Approve dataset
   - Send campaign email
   - Update release policy
   - Generate badge codes
2. Check audit logs

**SQL Verification:**
```sql
SELECT 
  action,
  resource_type,
  severity,
  created_at
FROM audit_logs
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
ORDER BY created_at DESC
LIMIT 20;
```

**Expected Result:**
- Every admin action logged
- IP address captured
- User agent captured
- Severity appropriate (info/warn/error)

---

### 16. Loading Screen ✅

**Test: Beautiful loading animation**

1. Clear browser cache
2. Navigate to homepage
3. Observe loading animation

**Expected Result:**
- Animated data network visualization
- "Data mined ethically, profits reinvested" tagline
- Smooth transition to main content
- No flash of unstyled content

---

### 17. RLS Policy Verification ✅

**Test: Data access properly restricted**

**Anonymous users:**
```sql
SET ROLE anon;
SELECT * FROM datasets WHERE active = false;  -- Should return 0 rows
SELECT * FROM user_roles;                      -- Should fail
SELECT * FROM curated_pool;                    -- Should fail
```

**Authenticated users:**
```sql
SET ROLE authenticated;
SELECT * FROM datasets WHERE active = true;    -- Should succeed
SELECT * FROM purchases WHERE user_id = auth.uid();  -- Own purchases only
```

**Admin users:**
```sql
-- Via has_role() function
SELECT * FROM curated_pool;   -- Should succeed if admin
SELECT * FROM review_queue;   -- Should succeed if admin
```

---

### 18. System Health Check ✅

**Test: All systems operational**

1. Navigate to admin dashboard
2. Verify "System OK" banner shows green if:
   - 0 edge function errors in last 24h
   - Webhook success rate ≥ 95%
   - ≥ 4 active domains with datasets
   - Database connections healthy

**SQL Verification:**
```sql
-- Check edge function errors
SELECT COUNT(*) FROM audit_logs
WHERE severity = 'error'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Check active domains
SELECT COUNT(DISTINCT domain) FROM datasets WHERE active = true;
```

---

## Performance Benchmarks

| Operation | Target | Measured | Status |
|-----------|--------|----------|--------|
| Homepage load | < 2s | _____ | ⏱️ |
| Dataset search | < 500ms | _____ | ⏱️ |
| Stripe checkout | < 3s | _____ | ⏱️ |
| Scraper run | < 5min | _____ | ⏱️ |
| AI email gen | < 10s | _____ | ⏱️ |
| Export CSV | < 10s | _____ | ⏱️ |

---

## Production Readiness Checklist

### Infrastructure ✅
- [ ] Storage bucket `dataset-files` created
- [ ] Public impact view accessible anonymously
- [ ] All edge functions deployed
- [ ] Systemd service configured
- [ ] NTP time sync enabled
- [ ] Log rotation configured
- [ ] Backup strategy documented

### Data Pipeline ✅
- [ ] Scrapers harvest real data (not placeholders)
- [ ] Provenance hashing prevents duplicates
- [ ] AI curation assigns quality tiers
- [ ] Release policy enforced
- [ ] Burst mode works
- [ ] Export formats generated (CSV, JSONL)

### E-Commerce ✅
- [ ] Stripe checkout works
- [ ] Badge codes generated
- [ ] Purchase records created
- [ ] Revenue tracked accurately
- [ ] Download links secured
- [ ] Refunds processed (if needed)

### Marketing ✅
- [ ] Campaign emails send
- [ ] Inbound replies processed
- [ ] Lead status tracking works
- [ ] AI assistant generates quality copy
- [ ] A/B testing infrastructure ready

### Security ✅
- [ ] RLS policies enforced
- [ ] Admin checks all functions
- [ ] HMAC signatures validated
- [ ] Rate limiting active
- [ ] Audit logs comprehensive
- [ ] No secrets in client code
- [ ] IP throttling on auth endpoints

### UX ✅
- [ ] Loading animation displays
- [ ] Public impact loads logged-out
- [ ] Enterprise dashboard functional
- [ ] Badge system working
- [ ] Project voting works
- [ ] Impact transparency visible
- [ ] All routes wired correctly

---

## Sign-Off

**Tested by:** _______________________  
**Date:** _______________________  
**Environment:** [ ] Staging [ ] Production  
**Status:** [ ] PASS [ ] FAIL  

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Production Deployment Approved:** [ ] YES [ ] NO

**Signatures:**
- Engineering Lead: _______________________
- Security Review: _______________________
- Product Owner: _______________________
