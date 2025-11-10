# DataForEarth eSIM Mobile App - Deployment Guide

## 🚀 Quick Start - See the App NOW

### Option 1: View in Lovable Preview (Web Version)
The app is currently visible in your Lovable preview window at the `/` route.

### Option 2: Build & Run Native Mobile App (iOS/Android)

**Prerequisites:**
- macOS with Xcode (for iOS)
- Android Studio (for Android)
- Node.js & npm installed

**Steps:**

1. **Export to GitHub**
   - Click "Export to GitHub" in Lovable
   - Clone your repository locally

2. **Install Dependencies**
   ```bash
   git clone <your-repo>
   cd <your-repo>
   npm install
   ```

3. **Add Native Platforms**
   ```bash
   npx cap add ios
   npx cap add android
   ```

4. **Build Web Assets**
   ```bash
   npm run build
   ```

5. **Sync to Native**
   ```bash
   npx cap sync
   ```

6. **Open & Run**
   ```bash
   # For iOS (requires Mac + Xcode)
   npx cap open ios
   
   # For Android (requires Android Studio)
   npx cap open android
   ```

---

## 🔑 Required API Keys & Setup

### 1. Gigs eSIM API (CRITICAL - Main functionality)
**Purpose:** Power the entire eSIM marketplace and activation

**Setup:**
1. Sign up at https://www.gigs.com/partners
2. Get your API key from the dashboard
3. Add to Supabase secrets:
   - Go to Lovable Cloud → Database → Secrets
   - Click "Add Secret"
   - Name: `GIGS_API_KEY`
   - Value: Your Gigs API key

**Status:** ✅ Edge functions already created and ready
- `list-esim-plans` - Fetches available eSIM plans
- `purchase-esim` - Handles purchase flow
- `activate-esim` - Activates eSIM after payment

### 2. Stripe (ALREADY CONFIGURED ✅)
**Purpose:** Credit card payments
**Status:** Already set up with your existing Stripe account
- Secret key already in Supabase secrets
- Purchase flow integrated with existing payment system

### 3. Crypto Payments (Optional - Future)
**Purpose:** Accept Bitcoin, Ethereum, etc.
**Options:**
- Coinbase Commerce (easiest)
- BTCPay Server (self-hosted, non-custodial)

**Status:** 🚧 Placeholder in code, not yet implemented
To add later: Sign up for Coinbase Commerce and add API key

---

## 📱 Current App Status

### ✅ COMPLETED & READY
1. **Native App Structure**
   - Capacitor configured for iOS & Android
   - App ID: `app.dataforearth.esim`
   - Server URL: Points to Lovable preview for hot-reload development

2. **Core Pages**
   - Home page with features showcase
   - eSIM Marketplace with search & filters
   - My eSIMs (purchase history)
   - Virtual Location (VPN feature UI)
   - Support page

3. **Payment Integration**
   - Stripe checkout flow (uses existing setup)
   - Crypto payment placeholder
   - Purchase database table with RLS policies

4. **Database**
   - `esim_purchases` table created
   - Row-Level Security enabled
   - User authentication integrated

### 🚧 NEEDS GIGS API TO COMPLETE
1. **Real eSIM Plans**
   - Currently shows mock data
   - Will fetch real plans from Gigs once API key added

2. **eSIM Activation**
   - QR code generation
   - Activation code delivery
   - Device provisioning

---

## 🌐 How It Works

### Purchase Flow:
1. User browses eSIM plans (from Gigs API)
2. User clicks "Buy Now" or "Pay with Crypto"
3. If Stripe: Redirects to Stripe Checkout
4. If Crypto: Shows crypto payment flow (when implemented)
5. On success: Calls `activate-esim` function
6. Gigs API provisions the eSIM
7. User receives QR code & activation instructions
8. User installs eSIM on their device

### Data Flow:
```
User → App → Edge Functions → Gigs API → eSIM Provisioned
                ↓
            Stripe/Crypto Payment
                ↓
            Database Updated
                ↓
            User Sees QR Code
```

---

## 🎨 Design System
- Uses existing DataForEarth theme
- Primary color: Green (climate-focused)
- Accent: Cyan/blue
- Dark mode enabled
- Mobile-first responsive design
- All colors use HSL semantic tokens from `index.css`

---

## 🔒 Security
- Row-Level Security (RLS) on `esim_purchases`
- Users can only see their own purchases
- Payment processing via Stripe (PCI compliant)
- API keys stored securely in Supabase secrets
- No sensitive data in frontend code

---

## 📦 What's Already Set Up

### Environment Variables (Auto-configured)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Supabase Secrets (Backend)
- `STRIPE_SECRET_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `GIGS_API_KEY` ⏳ (needs to be added)

### Edge Functions Deployed
- ✅ `purchase-esim`
- ✅ `activate-esim`
- ✅ `list-esim-plans`

---

## 🚀 Next Steps to Go Live

### Immediate (Get Functional):
1. **Get Gigs API Key**
   - Sign up at https://www.gigs.com/partners
   - Add API key to Supabase secrets
   - Test eSIM purchase flow

2. **Test on Physical Device**
   - Follow "Build & Run Native App" steps above
   - Test full purchase → activation → installation flow
   - Verify eSIM shows in device settings

### Before App Store Submission:
1. **App Store Assets**
   - Screenshots (use iPhone & Android)
   - App icon (1024x1024)
   - Privacy policy URL
   - Terms of service URL

2. **App Store Accounts**
   - Apple Developer Program ($99/year)
   - Google Play Developer ($25 one-time)

3. **Update capacitor.config.ts**
   - Change server URL from Lovable preview to your production domain
   - Or remove server block for production build

4. **Legal Docs**
   - Privacy policy (GDPR compliant)
   - Terms of service
   - Refund policy
   - eSIM usage guidelines

5. **Testing**
   - Test on multiple devices
   - Test in different countries (if possible)
   - Test payment flows
   - Test eSIM installation

---

## 💡 Development Tips

### Hot Reload During Development
Your `capacitor.config.ts` currently points to:
```typescript
server: {
  url: 'https://492e7fd1-6e30-483a-bddd-e3199d936946.lovableproject.com',
  cleartext: true
}
```

This means:
- Changes in Lovable appear immediately in your mobile app
- No need to rebuild after code changes
- Perfect for rapid development

### For Production Build:
Remove the `server` block or point to your production URL.

---

## 📞 Support

### Gigs API Documentation
https://developers.gigs.com/docs

### Capacitor Documentation
https://capacitorjs.com/docs

### Need Help?
- Check Gigs API status
- Verify API keys are correct
- Check Supabase edge function logs
- Test with mock data first (no API key) to verify UI

---

## 🎯 MVP Checklist

- [x] Mobile app structure
- [x] eSIM marketplace UI
- [x] Stripe payment integration
- [x] Database & RLS policies
- [x] Edge functions for Gigs API
- [ ] Add Gigs API key
- [ ] Test real eSIM purchase
- [ ] Virtual Location VPN (Phase 2)
- [ ] AI Support Chat (Phase 2)
- [ ] Environmental impact tracking (Phase 2)
- [ ] Crypto payments (Phase 2)

---

**Current Status:** 🟡 85% Complete
**Blocker:** Need Gigs API key to go from mock data to real eSIMs
**Timeline:** Can deploy to App Store within 1-2 weeks once Gigs API is integrated

