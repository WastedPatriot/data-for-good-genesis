# Email Setup Guide - Resend + Proton Integration

## Current Email Configuration

The app is configured to send emails from: `noreply@dataforearth.org`
Admin notifications go to: `hello@dataforearth.org`

## ✅ Step-by-Step Email Setup

### Step 1: Verify Domain in Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `dataforearth.org`
4. Resend will show DNS records you need to add

**Required DNS Records (for sending):**

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com include:_spf.protonmail.ch ~all

Type: TXT
Name: resend._domainkey
Value: [Resend DKIM value exactly as shown in Resend dashboard]
```

⚠️ Important: Do NOT change MX to Resend. Keep MX pointed to Proton to receive mail:
```
Type: MX   Name: @   Priority: 10   Value: mail.protonmail.ch
Type: MX   Name: @   Priority: 20   Value: mailsec.protonmail.ch
```

### Step 2: Add DNS Records

**Where to add these:**
- In your domain registrar (where you bought dataforearth.org)
- Or in your DNS provider (Cloudflare, etc.)

**How to add:**
1. Log into your domain control panel
2. Find "DNS Management" or "DNS Settings"
3. Add each record exactly as shown
4. Save changes

**Wait time:** DNS propagation takes 15 minutes to 24 hours

### Step 3: Verify in Resend

1. Return to https://resend.com/domains
2. Click "Verify" next to dataforearth.org
3. Wait for green checkmark ✅

**Verification checks:**
- SPF record
- DKIM record
- MX record (optional)

### Step 4: Test Email Sending

Once verified in Resend, test by submitting the contact form:

1. Go to your DataForEarth website
2. Navigate to `/contact`
3. Fill out and submit the form
4. Check your Proton inbox at `hello@dataforearth.org`

---

## Proton Mail Setup

### Create Email Addresses in Proton

1. Log into Proton Mail
2. Go to Settings → Addresses
3. Create these addresses:
   - `hello@dataforearth.org` (primary, receives admin emails)
   - `noreply@dataforearth.org` (alias, for sending only)
   - `partnerships@dataforearth.org` (optional)

**Important:** These are just aliases in Proton. All emails arrive in your main inbox.

### Configure Forwarding (Optional)

If you want emails from these addresses to appear separately:

1. Create folders in Proton
2. Set up filters:
   - If "To" contains "hello@" → Move to "Support" folder
   - If "To" contains "partnerships@" → Move to "Partnerships" folder

---

## How It Works

```
User submits contact form
        ↓
Edge Function (submit-contact)
        ↓
Resend API sends email
        ↓
FROM: noreply@dataforearth.org (via Resend)
TO: hello@dataforearth.org (arrives in Proton)
```

### Email Flow

1. **User submits form** → Edge function triggered
2. **Edge function calls Resend** → Email sent with `from: noreply@dataforearth.org`
3. **Resend delivers email** → To `hello@dataforearth.org`
4. **Proton receives email** → Shows in your inbox

**Key Point:** Resend is the *sender*, Proton is the *receiver*. They work together.

---

## Verifying Setup

### Check 1: Domain Verified
```bash
# Should show "verified" status
curl -X GET https://api.resend.com/domains \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY"
```

### Check 2: DNS Records
```bash
# Check SPF
dig TXT dataforearth.org | grep spf

# Check DKIM  
dig TXT resend._domainkey.dataforearth.org

# Should return Resend's values
```

### Check 3: Send Test Email

Use the contact form or trigger any edge function that sends email.

---

## Current Email Edge Functions

### 1. submit-contact
- **Sends to user**: Confirmation email
- **Sends to admin**: `hello@dataforearth.org` (notification)
- **From**: `Data for Earth <noreply@dataforearth.org>`

### 2. send-purchase-confirmation
- **Sends to user**: Purchase confirmation
- **From**: `Data for Earth <noreply@dataforearth.org>`

### 3. ingest-dataset
- **Sends to admin**: `hello@dataforearth.org` (new dataset alert)
- **From**: `Data for Earth <noreply@dataforearth.org>`

---

## Troubleshooting

### Email Not Arriving

**Check 1: Domain Verified?**
- Go to https://resend.com/domains
- Ensure green checkmark next to domain

**Check 2: DNS Correct?**
```bash
dig TXT dataforearth.org
dig TXT resend._domainkey.dataforearth.org
```

**Check 3: Spam Folder**
- Check Proton spam folder
- Mark as "Not Spam" if found

**Check 4: Resend API Key Valid?**
- Verify in Supabase secrets: `RESEND_API_KEY`
- Test at https://resend.com/api-keys

**Check 5: Check Logs**
```bash
# In your app, check Logs tab
# Or via edge function logs
```

### Domain Shows "Pending"

**Wait:** DNS can take up to 24 hours to propagate

**Check propagation:**
- https://dnschecker.org
- Enter: `dataforearth.org` (TXT records)
- Should show Resend's SPF/DKIM records globally

### Emails Go to Spam

**Solutions:**
1. Ask recipients to whitelist `noreply@dataforearth.org`
2. Enable DMARC (additional DNS record):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:hello@dataforearth.org
   ```
3. Warm up the domain by sending gradually increasing email volume

---

## Machine Agent Email Configuration

The machine agent will send emails via the same Resend setup:

**Configuration needed:**
1. Ensure `RESEND_API_KEY` is in Supabase secrets
2. No changes needed in agent - uses existing edge functions

**Emails sent by agent:**
- Dataset published notifications → `hello@dataforearth.org`
- Badge codes low warnings → `hello@dataforearth.org`
- Error alerts → `hello@dataforearth.org`

---

## Testing Checklist

- [ ] Domain verified in Resend (green checkmark)
- [ ] DNS records added and propagated
- [ ] `hello@dataforearth.org` created in Proton
- [ ] `noreply@dataforearth.org` alias created in Proton
- [ ] Test contact form submission
- [ ] Email received in Proton inbox
- [ ] Check spam folder if not in inbox
- [ ] Reply-to works correctly
- [ ] Admin notifications arriving

---

## Quick Test Command

After setup, test with curl:

```bash
curl -X POST https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/submit-contact \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Email",
    "message": "Testing email delivery",
    "submissionType": "general"
  }'
```

Check `hello@dataforearth.org` inbox in Proton for the notification.

---

## Summary

**Resend's Job:**
- Sends emails *from* your domain
- Handles delivery, bounce tracking, SPF/DKIM
- Requires domain verification

**Proton's Job:**
- Receives emails *to* your domain
- Your email client/inbox
- Where you read and reply to emails

**They work together:**
- Resend = Outgoing email service (SMTP)
- Proton = Incoming email service (IMAP/inbox)

**Once set up:**
1. Your app sends emails via Resend API
2. Recipients see emails from `noreply@dataforearth.org`
3. Admin emails arrive at `hello@dataforearth.org` in Proton
4. You read/reply in Proton Mail

---

## Support Links

- Resend Dashboard: https://resend.com/domains
- Resend Docs: https://resend.com/docs
- Proton Mail: https://mail.proton.me
- DNS Checker: https://dnschecker.org
- MX Toolbox: https://mxtoolbox.com/SuperTool.aspx?action=spf:dataforearth.org
