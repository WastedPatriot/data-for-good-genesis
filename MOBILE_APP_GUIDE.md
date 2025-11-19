# DataForEarth Mobile App - WebView Wrapper

## 🎯 Quick Start

This is a **WebView-based mobile app** that wraps your Lovable website into native Android and iOS apps.

### What's Included

✅ **Android App** (APK + AAB for Google Play)
✅ **iOS App** (IPA for App Store / TestFlight)
✅ **Deep Linking** (/plans, /dashboard, /impact, /account)
✅ **Push Notifications** ready (OneSignal compatible)
✅ **Affiliate Link Support** (Airalo, Nomad, Maya Mobile)
✅ **Payment Integration** (Stripe works in WebView)
✅ **File Upload/Download** enabled
✅ **Splash Screen** with DataForEarth branding

---

## 📲 How to Build & Test

### Option 1: Automatic GitHub Builds (Easiest)

1. **Connect to GitHub** (if not already)
   - Click GitHub button in Lovable
   - Export/push this project

2. **Trigger Builds**
   - Go to GitHub → Actions tab
   - Run "Android Debug APK" workflow
   - Run "iOS Build" workflow (requires macOS runner)

3. **Download Apps**
   - After workflow completes (~10 min)
   - Go to Actions → Select the run → Download artifacts
   - `DataForEarth-Android-Debug.apk` - Install on Android
   - `DataForEarth-iOS-Debug.ipa` - For iOS simulator

### Option 2: Build Locally

#### Prerequisites
- Node.js 18+
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

#### Steps

```bash
# 1. Clone your repo
git clone <your-github-repo-url>
cd <repo-name>

# 2. Install dependencies
npm install

# 3. Build web assets
npm run build

# 4. Add platforms (first time only)
npx cap add android
npx cap add ios

# 5. Sync changes
npx cap sync

# 6A. Open Android Studio
npx cap open android
# Then click "Run" (green play button)

# 6B. Open Xcode (macOS only)
npx cap open ios
# Select simulator → Click "Run" (▶️)
```

---

## 🔧 Configuration Details

### App IDs & Names
- **App ID**: `com.dataforearth.app`
- **App Name**: DataForEarth
- **Display Name**: DataForEarth – Ethical eSIMs

### Deep Links Configured
- `https://dataforearth.com/plans`
- `https://dataforearth.com/dashboard`
- `https://dataforearth.com/impact`
- `https://dataforearth.com/account`
- `dataforearth://` (custom scheme)

### Permissions (Android)
- ✅ Internet
- ✅ Network State
- ✅ Push Notifications
- ✅ Camera (for QR codes)
- ✅ File Access (read/write)

### Permissions (iOS)
- ✅ Camera Usage
- ✅ Photo Library
- ✅ Location (when in use)
- ✅ Background Modes (notifications)

---

## 💰 Affiliate/Commission Tracking

The WebView preserves:
- ✅ Cookies (for referral IDs)
- ✅ localStorage (for session tokens)
- ✅ URL parameters (`?affid=`, `?ref=`)
- ✅ Session data across navigation

**Supported Partners:**
- Airalo affiliate links
- Nomad partner links
- Maya Mobile affiliate tracking
- Any URL-based tracking parameters

---

## 🚀 Publishing to Stores

### Google Play Store (Android)

1. **Generate Release AAB**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   - File: `android/app/build/outputs/bundle/release/app-release.aab`

2. **Sign the AAB**
   - Create keystore: `keytool -genkey -v -keystore dataforearth.keystore -alias dataforearth -keyalg RSA -keysize 2048 -validity 10000`
   - Update `android/app/build.gradle` with signing config
   - Rebuild: `./gradlew bundleRelease`

3. **Upload to Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create app → Upload AAB
   - Fill store listing details (see below)

### App Store (iOS)

1. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app
   - Bundle ID: `com.dataforearth.app`

2. **Archive & Upload**
   ```bash
   npx cap open ios
   ```
   - In Xcode: Product → Archive
   - Distribute App → Upload to App Store

3. **Submit for Review**
   - Add screenshots, descriptions
   - Submit for TestFlight or production

---

## 📝 Store Listing Details

### App Name
**DataForEarth – Ethical eSIMs**

### Subtitle/Short Description
Travel data, rewards, and climate-positive plans.

### Full Description
```
A simple, fast, and ethical way to buy global eSIM plans and support planet-positive projects. 

✨ Features:
• Instant eSIM activation for 200+ countries
• Earn rewards with every purchase
• Support climate and environmental initiatives
• Transparent affiliate partnerships (Airalo, Nomad, Maya Mobile)
• Flexible payment options (Stripe, crypto coming soon)
• Track your environmental impact

🌍 Why DataForEarth?
Every eSIM purchase helps fund verified eco-projects. Travel smarter, support the planet.

Perfect for digital nomads, travelers, and conscious consumers.
```

### Keywords (Google Play / App Store)
```
eSIM, Airalo, Nomad, travel data, mobile data, eco, rewards, climate, digital nomad, ethical tech, green tech, sustainable travel, international data, global SIM
```

### Category
- **Primary**: Travel
- **Secondary**: Utilities / Productivity

### Content Rating
- Everyone (no age restrictions)

---

## 🎨 Assets Needed

### App Icons
- **Android**: 512x512px (Google Play), 48/72/96/144/192px (various densities)
- **iOS**: 1024x1024px (App Store), various sizes for devices

**Recommended Design:**
- Earth globe + circuit/data visualization
- Green (#10b981) and blue gradient
- "DataForEarth" text or just icon

### Splash Screen
- Already configured (green background, spinner)
- Shows for 2 seconds on launch

### Screenshots (Required for Stores)
- 📱 Phone: 5-8 screenshots (1242x2688px iPhone, 1080x1920px Android)
- 📱 Tablet: 2-4 screenshots (iPad, Android tablet)

**Screenshot Ideas:**
1. Homepage with eSIM plans grid
2. Plan details with pricing
3. Purchase/checkout flow
4. User dashboard with active plans
5. Impact tracking page
6. Rewards/affiliate earnings

---

## 🔔 Push Notifications (Optional)

To enable push notifications:

1. **Sign up for OneSignal** (free tier available)
   - [https://onesignal.com](https://onesignal.com)

2. **Add OneSignal to your Lovable site**
   ```html
   <!-- Add to index.html -->
   <script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async=""></script>
   <script>
     window.OneSignal = window.OneSignal || [];
     OneSignal.push(function() {
       OneSignal.init({
         appId: "YOUR_ONESIGNAL_APP_ID",
       });
     });
   </script>
   ```

3. **Notifications will work in WebView automatically**

---

## ❓ FAQ

### Can I customize the app icon?
Yes! Replace files in:
- `android/app/src/main/res/mipmap-*` (Android)
- `ios/App/App/Assets.xcassets/AppIcon.appiconset` (iOS)

### How do I change the splash screen?
Edit `capacitor.config.ts` → `SplashScreen` plugin settings.

### The app shows blank screen?
Check:
1. Is your Lovable site published and accessible?
2. Is the URL in `capacitor.config.ts` correct?
3. Check browser console for errors (in Android Studio Logcat or Xcode Console)

### How do I debug the WebView?
- **Android**: Chrome DevTools → `chrome://inspect`
- **iOS**: Safari → Develop → [Device] → [App]

### Can I use this with my custom domain?
Yes! Update the `server.url` in `capacitor.config.ts` to your domain.

---

## 📦 Files Created

```
capacitor.config.ts          # Main app config (WebView URL, plugins)
android/                     # Android native project
ios/                        # iOS native project
.github/workflows/          # Auto-build workflows
  ├── android-debug-apk.yml
  └── ios-build.yml
```

---

## 🎯 Next Steps

1. ✅ Push to GitHub
2. ✅ Run GitHub Actions to build APK/IPA
3. ✅ Test APK on Android device
4. ✅ Test IPA in iOS simulator
5. 🎨 Create app icons & screenshots
6. 📝 Prepare store listings
7. 🚀 Submit to Google Play & App Store

---

## 💡 Pro Tips

- **Test on real devices** before submitting to stores
- **Enable app signing** for release builds (Google Play handles this automatically for AAB)
- **Use TestFlight** (iOS) for beta testing before App Store release
- **Monitor WebView console** for JavaScript errors
- **Test affiliate links** thoroughly (use different tracking IDs)
- **Cache WebView content** for faster load times (already enabled)

---

## 🆘 Support

If you encounter issues:
1. Check GitHub Actions logs for build errors
2. Verify your Lovable site loads in a regular browser
3. Test deep links using `adb` (Android) or `xcrun simctl openurl` (iOS)

**Need help?** Open an issue on GitHub or reach out to [support@dataforearth.com]

---

**Your DataForEarth mobile app is ready! 🚀🌍**
