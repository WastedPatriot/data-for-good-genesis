# DataForEarth Security Architecture

## Authentication & Authorization

### User Roles
DataForEarth uses a custom role-based access control (RBAC) system with the following roles:

```sql
-- Enum type: app_role
- admin: Full system access
- moderator: Can review and approve content
- user: Standard contributor access
```

### Role Storage
**CRITICAL**: Roles are stored in a separate `user_roles` table, NOT on the user profile or auth.users table. This prevents privilege escalation attacks.

```sql
-- user_roles table structure
{
  id: uuid (PK),
  user_id: uuid (FK to auth.users),
  role: app_role,
  created_at: timestamp
}
```

### Security Definer Function
To avoid recursive RLS policy issues, role checks use a security definer function:

```sql
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

## Row-Level Security (RLS)

### Critical Tables with RLS

#### data_submissions
- **SELECT**: Admins only
- **INSERT**: Public (anyone can contribute)
- **UPDATE**: No one (immutable after creation)
- **DELETE**: Admins only

**Rationale**: Data submissions contain PII and must be protected. Once submitted, data should not be modified to maintain audit trail integrity.

#### datasets
- **SELECT**: Public (active datasets only)
- **INSERT/UPDATE/DELETE**: Admins only

**Rationale**: Only verified, approved datasets should be visible to buyers. Admin control ensures quality.

#### badge_codes
- **SELECT**: Admins only
- **INSERT**: Admins only
- **UPDATE**: Admins only (for claiming)
- **DELETE**: Admins only

**Rationale**: Badge codes are sensitive credentials that should only be accessible to authorized personnel.

#### purchases
- **SELECT**: User can view their own, admins can view all
- **INSERT**: User can create their own
- **UPDATE**: User can update their own (for download tracking)
- **DELETE**: Admins only

**Rationale**: Purchase records contain payment information and should be private per user.

#### audit_logs
- **SELECT**: Admins only
- **INSERT**: System (no user restriction)
- **UPDATE/DELETE**: Admins only

**Rationale**: Audit logs must be tamper-proof and only accessible to administrators.

#### organization_profiles
- **SELECT**: User can view their own, admins can view all
- **INSERT**: User can create their own
- **UPDATE**: User can update their own
- **DELETE**: Admins only

**Rationale**: Organizations should manage their own profiles but not see others.

## HMAC Signature Authentication

### Purpose
HMAC (Hash-based Message Authentication Code) signatures prevent unauthorized API access and ensure message integrity for external data ingestion.

### Implementation

#### Signature Generation (Python)
```python
import hmac
import hashlib
import time
import json

def generate_signature(payload: dict, secret: str) -> tuple[int, str]:
    timestamp = int(time.time())
    message = f"{timestamp}.{json.dumps(payload)}"
    signature = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return timestamp, signature
```

#### Signature Validation (Edge Function)
```typescript
async function validateHMAC(
  payload: any,
  timestamp: number,
  signature: string,
  secret: string
): Promise<boolean> {
  // 1. Check timestamp freshness (5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

  // 2. Compute expected signature
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 3. Compare signatures (constant-time)
  return expectedSignature === signature;
}
```

### Protected Endpoints
- `/functions/v1/ingest-dataset` - Requires HMAC signature
- `/functions/v1/external-ingest` - Requires HMAC signature
- `/functions/v1/create-badge-codes` - Requires HMAC OR admin JWT

### Headers Required
```
X-Ingest-Sign: <hmac_sha256_hex_signature>
Content-Type: application/json

Body must include:
{
  "timestamp": <unix_timestamp>,
  ...payload
}
```

## Rate Limiting

### Implementation
DataForEarth uses in-memory rate limiting (resets on function cold start):

```typescript
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;
  
  const timestamps = rateLimitMap.get(identifier) || [];
  const recentTimestamps = timestamps.filter(t => t > hourAgo);
  
  if (recentTimestamps.length >= MAX_REQUESTS_PER_HOUR) {
    return false; // Rate limit exceeded
  }
  
  recentTimestamps.push(now);
  rateLimitMap.set(identifier, recentTimestamps);
  return true; // OK to proceed
}
```

### Rate Limits
- **ingest-dataset**: 10 requests/hour
- **create-badge-codes**: 10 requests/hour
- **external-ingest**: 10 requests/hour
- **Other endpoints**: No explicit limit (relies on Supabase defaults)

### Bypass Considerations
**DO NOT** implement IP-based rate limiting alone - use authenticated identifiers (user_id, API key hash, etc.) to prevent IP spoofing.

## Secrets Management

### Supabase Secrets
All sensitive keys are stored in Supabase secrets and accessed via `Deno.env.get()`:

| Secret Name | Purpose | Used In |
|-------------|---------|---------|
| `INGEST_SECRET` | HMAC signature validation | ingest-dataset, external-ingest, create-badge-codes |
| `RESEND_API_KEY` | Email sending | ingest-dataset, submit-contact |
| `ADMIN_EMAIL` | Admin notifications | ingest-dataset, submit-contact |
| `STRIPE_SECRET_KEY` | Payment processing | All Stripe edge functions |
| `LOVABLE_API_KEY` | AI analysis | process-data-submission |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypass RLS (admin ops) | All edge functions |
| `SUPABASE_ANON_KEY` | Public client auth | Frontend, edge functions |
| `SUPABASE_URL` | Database connection | All edge functions |

### Secret Rotation
1. Generate new secret value
2. Update Supabase secret via GUI or CLI
3. Update machine-agent config.json
4. Test all affected edge functions
5. Revoke old secret after 24-hour grace period

## CORS Configuration

### Allowed Origins
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // ⚠️ Consider restricting in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ingest-sign',
};
```

### Production Recommendations
Replace `*` with specific domain:
```typescript
'Access-Control-Allow-Origin': 'https://dataforearth.org'
```

## SQL Injection Prevention

### Rules
1. **NEVER** execute raw SQL in edge functions
2. **ALWAYS** use Supabase client methods
3. **NEVER** concatenate user input into queries

### ✅ Correct
```typescript
await supabase
  .from('datasets')
  .select('*')
  .eq('name', userInput);
```

### ❌ Incorrect
```typescript
await supabase.rpc('execute_sql', { 
  query: `SELECT * FROM datasets WHERE name = '${userInput}'` 
});
```

## PII Protection

### Data Classification
- **PII**: email, location (if precise), geolocation coordinates
- **Quasi-Identifiers**: age_range, device_ownership, interests (in combination)
- **Non-PII**: sensor_data metadata, timestamps, aggregated metrics

### Anonymization Strategy
1. Do NOT log PII in console logs
2. Mask email in audit logs (keep first 3 chars + domain)
3. Round geolocation to city-level precision for public display
4. Aggregate small sample sizes (< 10 users) to prevent re-identification

## Security Checklist

### Before Production Deployment
- [ ] All RLS policies enabled and tested
- [ ] HMAC signatures validated on all external endpoints
- [ ] Rate limiting functional on all ingestion endpoints
- [ ] No service_role key exposed client-side
- [ ] No direct SQL execution in edge functions
- [ ] CORS origins restricted to production domain
- [ ] All secrets rotated from defaults
- [ ] Audit logging enabled for sensitive actions
- [ ] SSL/TLS enforced on all endpoints
- [ ] Database backups scheduled and tested

### Weekly Security Review
- [ ] Review audit logs for anomalies
- [ ] Check for failed authentication attempts
- [ ] Monitor rate limit violations
- [ ] Review RLS policy hit counts
- [ ] Scan for SQL injection patterns in logs
- [ ] Verify no PII leakage in public-facing APIs

### Monthly Security Audit
- [ ] Run Supabase linter (`supabase db lint`)
- [ ] Review and update RLS policies
- [ ] Test privilege escalation scenarios
- [ ] Conduct penetration testing
- [ ] Review third-party dependency vulnerabilities
- [ ] Update security documentation

## Incident Response Plan

### Security Incident Detected
1. **Isolate**: Disable affected endpoint or table
2. **Assess**: Determine scope of breach (data, users, timeline)
3. **Contain**: Rotate compromised secrets immediately
4. **Notify**: Alert users if PII was exposed (GDPR/CCPA compliance)
5. **Remediate**: Fix vulnerability, test patch
6. **Document**: Log incident in audit_logs, update runbook
7. **Review**: Conduct post-mortem, update security policies

### Data Breach Notifications
- **< 10 users affected**: Internal notification only
- **10-100 users**: Email affected users within 72 hours
- **> 100 users**: Public disclosure + regulatory notification

## Compliance

### GDPR (EU General Data Protection Regulation)
- Right to access: Users can request their data via contact form
- Right to erasure: Admins can delete user data via Admin panel
- Data portability: Download functionality for user data
- Lawful basis: Consent (opt-in for sensor data)

### CCPA (California Consumer Privacy Act)
- Similar rights as GDPR
- Do Not Sell: Data is sold to businesses, but contributors are compensated (ethical model)
- Opt-out mechanism: Users can request data deletion

### Data Retention
- **data_submissions**: Retained indefinitely (unless user requests deletion)
- **audit_logs**: Retained 90 days
- **badge_codes**: Retained indefinitely (for verification)
- **purchases**: Retained 7 years (financial records)

## Security Contacts

### Reporting Security Issues
Email: security@dataforearth.org
PGP Key: [Include public key or link]

### Responsible Disclosure
We appreciate responsible disclosure of security vulnerabilities. We commit to:
1. Acknowledge receipt within 24 hours
2. Provide status update within 72 hours
3. Fix critical issues within 7 days
4. Credit researcher if desired (Hall of Fame)

**DO NOT** publicly disclose vulnerabilities before we've had a chance to fix them (90-day grace period).
