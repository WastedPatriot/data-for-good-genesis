# Admin Account Setup Guide

## Creating Your Admin Account

Since auto-confirm email is now enabled, follow these steps to create and configure your admin account:

### Step 1: Create Account
1. Go to `/login` page
2. Click "Sign Up" tab
3. Enter your email: `askewdominic86@gmail.com` (or any email you prefer)
4. Create a secure password (minimum 6 characters)
5. Click "Sign Up" - account will be created instantly (no email confirmation needed)

### Step 2: Grant Admin Access
After creating your account, you need to manually add the admin role to your user in the database.

**Option A: Use Lovable Cloud Backend UI**
1. Click "View Backend" in Lovable
2. Go to "Database" → "user_roles" table
3. Click "Insert row"
4. Fill in:
   - `user_id`: Copy your user ID from the `auth.users` table
   - `role`: Select "admin"
5. Click "Save"

**Option B: Run SQL Query**
```sql
-- First, get your user ID
SELECT id, email FROM auth.users WHERE email = 'askewdominic86@gmail.com';

-- Then insert admin role (replace YOUR_USER_ID with actual ID)
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

### Step 3: Access Admin Panel
1. Log in with your credentials
2. Navigate to `/admin` page
3. You'll now see the AI Marketing Assistant tab and other admin features

## AI Marketing Assistant Features

Once logged in as admin, you can:

1. **Test Email System**
   - Enter `askewdominic86@gmail.com` in the test email field
   - Click "Send Test Email"
   - Check your inbox for the test message from `hello@dataforearth.org`

2. **Chat with AI Assistant**
   - Ask it to research companies
   - Have it draft outreach emails
   - All campaigns require your approval before sending

3. **Review Campaigns**
   - View pending email drafts
   - Approve or reject before sending
   - Track sent campaigns

## Security Features

✅ **Admin-Only Access**: Only users with 'admin' role can access the AI Marketing Assistant
✅ **Manual Approval**: All AI-generated emails require admin approval before sending
✅ **Audit Logging**: All marketing actions are logged in the audit_logs table
✅ **Email Verification**: Resend API configured with hello@dataforearth.org
✅ **Rate Limiting**: Built-in protection against spam

## Troubleshooting

**Can't see admin features?**
- Verify your user has the 'admin' role in user_roles table
- Log out and log back in
- Clear browser cache

**Test email not sending?**
- Check RESEND_API_KEY is configured in secrets
- Verify hello@dataforearth.org domain is validated in Resend dashboard
- Check edge function logs for errors

**Need to add more admins?**
- Have them create an account through signup
- Add their user_id to user_roles table with role = 'admin'
