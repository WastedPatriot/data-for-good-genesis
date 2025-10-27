# DataForEarth Carbon Tracker Extension

Free browser extension that raises awareness about corporate carbon emissions - no sign-up required!

## Features

🌍 **Real-Time Carbon Data**: See company carbon footprints as you browse
📊 **Sustainability Scores**: View environmental ratings for major companies
🔒 **Anonymous & Free**: No account needed, completely free forever
📥 **Data Export**: Download your browsing carbon tracking data anytime
🎯 **Educational**: Learn which companies are leading in sustainability

## Installation (Development)

### Chrome/Edge/Brave

1. Open your browser and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The extension is now installed!

### Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the `browser-extension` folder and select `manifest.json`
4. The extension is now installed!

## How It Works

### Anonymous Data Collection
- No personal information collected
- Tracks domains visited and time spent (stored locally)
- Company carbon data fetched from public database
- All tracking is anonymous and aggregated

### Privacy First
- **No account required**: Use immediately after installation
- **Local storage**: Your browsing history stays on your device
- **Anonymous analytics**: Only domain names are tracked (no URLs or content)
- **Opt-in**: Clear disclaimers about data collection
- **Export anytime**: Download all your data as CSV

### Carbon Database
The extension displays publicly available corporate carbon emission data including:
- Annual CO₂ emissions (in tons)
- Scope 1, 2, and 3 emissions breakdown
- Sustainability scores (0-100)
- Last reporting date

## Features

### 1. Popup Interface
Click the extension icon to see:
- Current site's carbon footprint
- Sustainability score
- Emissions breakdown
- Download button for your tracking data

### 2. On-Page Badge
A floating badge appears on company websites showing:
- Company name
- Annual CO₂ emissions
- Sustainability score
- Draggable and closeable

### 3. Data Export
Download your carbon tracking data:
- CSV format
- Includes all visited domains
- Timestamps and company names
- Use for personal analysis

## Technical Details

### API Endpoints
- `extension-company-data`: Fetch carbon data by domain
- `extension-track-visit`: Record anonymous visits

### Permissions Required
- `activeTab`: Read current tab domain
- `storage`: Store visited domains locally
- `tabs`: Track page visits
- `notifications`: Alert about high-emission companies
- `https://*/*`: Access company carbon API

### Data Structure
```json
{
  "domain": "example.com",
  "timestamp": "2025-01-27T12:00:00Z",
  "company": "Example Corp",
  "duration": 120
}
```

## Browser Compatibility

✅ Chrome 88+
✅ Edge 88+
✅ Brave 1.20+
✅ Firefox 78+
✅ Opera 74+

## Contributing

We welcome contributions! The extension is open source and designed to raise environmental awareness.

### Data Sources
Company carbon data is sourced from:
- Public sustainability reports
- CDP (Carbon Disclosure Project)
- Government regulatory filings
- Company ESG disclosures

### Help Expand the Database
If you find companies without data, you can:
1. Submit carbon data on dataforearth.org
2. Report missing companies
3. Help verify existing data

## Support

- Website: https://dataforearth.org
- Issues: Report bugs via our contact form
- Community: Join our Discord for discussions

## License

Open source - MIT License

## Disclaimer

This extension collects anonymous usage data (domains visited, duration) to help track corporate environmental impact awareness. No personal information, browsing history, or sensitive data is collected. All data is stored locally on your device and can be exported or deleted at any time.

Carbon emissions data is sourced from public disclosures and may not be 100% accurate or up-to-date. Use for educational purposes only.

---

**Made with 🌍 by DataForEarth**

*Free forever • No sign-up • No ads • Open source*
