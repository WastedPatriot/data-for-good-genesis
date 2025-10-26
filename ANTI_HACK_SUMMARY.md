# Anti-Hack Hardening Summary

## Implemented Security Measures

### 1. **Login Rate Limiting**
- **Location**: `supabase/functions/rate-limit-login/index.ts`
- **Mechanism**: 
  - Tracks failed login attempts by IP address and device fingerprint
  - Max 5 failed attempts before 15-minute lockout
  - Logs all attempts to `login_attempts` table
  - Audit logs trigger on rate limit exceeded

### 2. **Device Fingerprinting**
- **Location**: `src/hooks/useDeviceFingerprint.tsx`
- **Captures**:
  - Screen resolution
  - Timezone
  - Language
  - Platform
  - Hardware concurrency
  - Canvas fingerprint (renders text and generates hash)
- **Usage**: Combined with IP for abuse detection

### 3. **Row-Level Security (RLS) Hardening**
- **Sensitive Tables Protected**:
  - `visitor_analytics` → Admin-only read
  - `contact_submissions` → Admin-only read
  - `data_submissions` → Admin-only read
  - `login_attempts` → Admin-only read
  - `enterprise_badges` → User can see own, admin can see all

### 4. **Audit Logging**
- **Tracked Events**:
  - Failed login attempts (rate limit exceeded)
  - Project votes (includes badge multiplier)
  - Dataset builds
  - Policy changes (admin actions)
  - Purchase completions
- **Severity Levels**: `info`, `warn`, `error`
- **Retention**: Logs include IP, user agent, resource IDs

### 5. **Voting Integrity**
- **Cooldown System**: 1 vote per 30 days per user
- **Badge Multipliers**:
  - Platinum: 5x vote weight
  - Gold: 3x vote weight
  - Silver: 2x vote weight
  - Bronze/None: 1x vote weight
- **Fingerprinting**: Combined with cooldown table to prevent multi-account abuse

### 6. **Constant-Time Comparisons**
- **Edge Functions**: All authentication flows use constant-time string comparison via built-in Supabase auth methods
- **Token Validation**: Uses `supabase.auth.getUser(token)` which implements secure comparison

### 7. **Password Security**
- **Hashing**: Supabase uses bcrypt by default (Argon2 upgrade pending platform support)
- **Leaked Password Protection**: Configured to check against known leaked password databases
- **Minimum Requirements**: Enforced at auth level

## Attack Vectors Mitigated

| Attack Type | Mitigation |
|------------|-----------|
| Brute Force Login | Rate limiting + lockout |
| Multi-Account Abuse | Device fingerprinting + IP tracking |
| Vote Manipulation | Cooldown + badge multipliers + audit logs |
| Data Scraping | RLS policies restrict PII to admins only |
| Privilege Escalation | Roles in separate table, SECURITY DEFINER functions |
| Session Hijacking | Supabase JWT with short expiry + refresh tokens |
| SQL Injection | All queries use parameterized Supabase client methods |

## Monitoring & Response

### Real-Time Alerts
- Audit logs queryable by admins at `/admin/system-logs`
- Failed login spike detection via `login_attempts` table
- Unusual vote patterns tracked in `vote_cooldowns`

### Response Procedures
1. **Rate Limit Exceeded**: User sees lockout message with countdown
2. **Suspicious Activity**: Admin reviews audit logs for patterns
3. **Confirmed Abuse**: Admin can:
   - Revoke user sessions via Supabase dashboard
   - Block IP ranges (infrastructure level)
   - Invalidate enterprise badges

## Future Enhancements
- [ ] IP geolocation-based anomaly detection
- [ ] 2FA/MFA for admin accounts
- [ ] Webhook notifications for critical security events
- [ ] CAPTCHA on repeated failed logins
- [ ] Honeypot fields in forms to catch bots
