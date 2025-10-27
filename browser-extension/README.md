# DataForEarth Browser Extension

Track company carbon footprints in real-time and see how your data contributions help reduce emissions.

## Features

- 🌍 **Real-time Carbon Tracking**: See CO₂ emissions for companies as you browse
- 📊 **Sustainability Scores**: Instant ratings for corporate environmental impact  
- 🎮 **Gamification**: Earn badges, complete challenges, gain points
- 🔔 **Smart Notifications**: Alerts for high-emission companies
- 📈 **Personal Impact Dashboard**: Track your awareness-raising metrics
- 🤝 **Social Sharing**: Share your climate activism on social media
- 💚 **Floating Badge**: Non-intrusive company data overlay on any website

## Installation

### Development Mode (For Testing)

1. Clone this repository
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `browser-extension` folder
6. Extension is now installed!

### Production (Chrome Web Store)

*Coming soon - extension will be available in Chrome Web Store*

## How It Works

1. **Browse Normally**: Visit any company website
2. **Automatic Detection**: Extension checks if company carbon data exists
3. **See Impact**: Floating badge shows emissions, sustainability score
4. **Track Progress**: Your profile accumulates points and badges
5. **Complete Challenges**: Unlock rewards by tracking different companies
6. **Share**: Spread awareness on social media

## Supported Browsers

- ✅ Google Chrome
- ✅ Microsoft Edge  
- ✅ Brave
- ✅ Arc
- ✅ Any Chromium-based browser

## Privacy

- ✓ Only tracks domains you visit (not full URLs)
- ✓ No personal browsing data collected
- ✓ Optional anonymous analytics
- ✓ Respects Do Not Track settings
- ✓ No third-party trackers

## Gamification System

### Badge Tiers
- 🥉 **Bronze Tracker**: 0-999 points
- 🥈 **Silver Guardian**: 1,000-4,999 points
- 🥇 **Gold Champion**: 5,000-14,999 points  
- 💎 **Platinum Hero**: 15,000+ points

### Challenges
- **Carbon Detective**: Check 10 different companies
- **Sustainability Scholar**: Research 50 companies
- **Data Champion**: Purchase a dataset through extension
- **Climate Activist**: Share carbon data 5 times
- **Awareness Builder**: Track 100M tons of CO₂

## API Endpoints

Extension connects to DataForEarth backend:

- `GET /extension-company-data?domain=` - Get company carbon data
- `GET /extension-user-stats` - Get user statistics
- `POST /extension-track-visit` - Log site visit

## Contributing

Want to add more features? Submit a PR!

Ideas:
- [ ] Firefox version
- [ ] Safari version
- [ ] More gamification mechanics
- [ ] Team challenges
- [ ] Industry comparisons
- [ ] Historical emissions tracking

## License

MIT License - See LICENSE file

## Support

Questions? Email: hello@dataforearth.org
Issues: GitHub Issues

---

**Made with 💚 by DataForEarth**  
*Tracking carbon, one website at a time.*
