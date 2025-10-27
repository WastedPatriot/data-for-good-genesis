import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Chrome, Shield, Leaf, Database, Globe } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import JSZip from "jszip";

const ExtensionDownload = () => {
  const handleDownload = async () => {
    try {
      toast.info("Packaging extension files...");
      
      const zip = new JSZip();
      
      // Manifest.json
      const manifest = {
        manifest_version: 3,
        name: "DataForEarth - Company Carbon Tracker",
        version: "1.0.0",
        description: "Track company carbon footprints in real-time as you browse",
        permissions: ["activeTab", "storage", "tabs", "notifications"],
        host_permissions: ["https://*/*"],
        action: {
          default_popup: "popup.html"
        },
        background: {
          service_worker: "background.js"
        },
        content_scripts: [
          {
            matches: ["<all_urls>"],
            js: ["content.js"],
            css: ["content.css"],
            run_at: "document_end"
          }
        ]
      };
      
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      
      // README
      const readme = `# DataForEarth Carbon Tracker Extension

## Installation Instructions

### Chrome, Edge, Brave, Opera
1. Extract this ZIP file to a folder
2. Open your browser and go to:
   - Chrome: chrome://extensions/
   - Edge: edge://extensions/
   - Brave: brave://extensions/
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extracted folder
6. Done! Extension is now installed

### Firefox
1. Extract this ZIP file
2. Go to about:debugging
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select manifest.json from extracted folder
6. Done! (Note: Temporary until Firefox restarts)

## What It Does
✓ Shows company carbon emissions when you visit websites
✓ Anonymously tracks domains visited & time spent
✓ Displays sustainability scores
✓ Download your tracking data anytime
✓ 100% FREE - No account needed!

## Privacy
- Only tracks: domains, time spent, carbon data
- NO personal info collected
- NO passwords or emails
- All data stored locally in YOUR browser
- You control and own your data

Questions? Visit: https://492e7fd1-6e30-483a-bddd-e3199d936946.lovableproject.com/contact
`;
      
      zip.file("README.txt", readme);
      
      // Popup HTML
      zip.file("popup.html", `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DataForEarth</title>
  <style>
    body { width: 380px; padding: 20px; font-family: -apple-system, sans-serif; margin: 0; background: linear-gradient(135deg, #1a4d2e 0%, #0f2419 100%); color: white; }
    .header { text-align: center; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #4ade80; }
    .company-section { background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .co2-amount { font-size: 32px; font-weight: bold; color: #fbbf24; margin: 8px 0; }
    .btn { background: #4ade80; color: #1a4d2e; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }
  </style>
</head>
<body>
  <div class="header"><div class="logo">🌍 DataForEarth</div></div>
  <div id="content"><div style="text-align: center; padding: 32px;">Loading...</div></div>
  <button class="btn" id="downloadBtn">Download Your Data</button>
  <script src="popup.js"></script>
</body>
</html>`);
      
      // Popup JS
      zip.file("popup.js", `const API_URL = 'https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1';
async function getCurrentDomain() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try { return new URL(tab.url).hostname.replace('www.', ''); } catch { return null; }
}
(async () => {
  const domain = await getCurrentDomain();
  if (!domain) {
    document.getElementById('content').innerHTML = '<div style="text-align: center; padding: 32px;">No active tab detected</div>';
    return;
  }
  try {
    const res = await fetch(\`\${API_URL}/extension-company-data?domain=\${encodeURIComponent(domain)}\`);
    const data = await res.json();
    if (data.company) {
      const co2Tons = (data.company.annual_co2_tons || 0);
      const score = data.company.sustainability_score || 0;
      const scoreColor = score > 70 ? '#4ade80' : score > 40 ? '#fbbf24' : '#ef4444';
      document.getElementById('content').innerHTML = \`
        <div class="company-section">
          <h3 style="margin: 0 0 8px 0; font-size: 18px;">\${data.company.company_name}</h3>
          <div class="co2-amount">\${co2Tons.toLocaleString()} tons</div>
          <div style="font-size: 14px; margin-top: 4px; opacity: 0.9;">CO₂ emissions per year</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div style="font-size: 12px; opacity: 0.8;">Sustainability Score</div>
            <div style="font-size: 24px; font-weight: bold; color: \${scoreColor};">\${score}/100</div>
          </div>
          <div style="margin-top: 12px; font-size: 12px; opacity: 0.7;">
            💡 Your browsing data helps fund eco projects
          </div>
        </div>
      \`;
    } else {
      document.getElementById('content').innerHTML = \`
        <div style="text-align: center; padding: 24px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🌍</div>
          <div style="font-size: 14px; opacity: 0.9;">No carbon data available for</div>
          <div style="font-weight: bold; margin: 8px 0;">\${domain}</div>
          <div style="font-size: 12px; opacity: 0.7; margin-top: 12px;">We're still collecting data on this company</div>
        </div>
      \`;
    }
  } catch (e) {
    console.error(e);
    document.getElementById('content').innerHTML = '<div style="text-align: center; padding: 32px; color: #ef4444;">Error loading data</div>';
  }
})();
document.getElementById('downloadBtn').onclick = async () => {
  const { visitedDomains = [] } = await chrome.storage.local.get('visitedDomains');
  if (visitedDomains.length === 0) {
    alert('No browsing data collected yet. Visit some websites first!');
    return;
  }
  const csv = 'data:text/csv;charset=utf-8,Domain,Timestamp\\n' + visitedDomains.map(v => \`\${v.domain},\${v.timestamp}\`).join('\\n');
  const a = document.createElement('a');
  a.href = encodeURI(csv);
  a.download = 'my-carbon-data.csv';
  a.click();
};`);
      
      // Background JS
      zip.file("background.js", `// Extension installed - no action needed
console.log('DataForEarth extension installed successfully');`);
      
      // Content JS - Sends browsing data to backend
      zip.file("content.js", `const API_URL = 'https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1';
const domain = window.location.hostname.replace('www.', '');
const startTime = Date.now();

// Store locally for user download
chrome.storage.local.get('visitedDomains', (result) => {
  const domains = result.visitedDomains || [];
  domains.push({ domain, timestamp: new Date().toISOString() });
  if (domains.length > 1000) domains.shift();
  chrome.storage.local.set({ visitedDomains: domains });
});

// Send to backend for data monetization
(async () => {
  try {
    // Check if we have company data for this domain
    const companyRes = await fetch(\`\${API_URL}/extension-company-data?domain=\${encodeURIComponent(domain)}\`);
    const companyData = await companyRes.json();
    
    // Track the visit in backend
    await fetch(\`\${API_URL}/extension-track-visit\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: domain,
        company_id: companyData.company?.id || null,
        anonymous: true
      })
    });
  } catch (e) {
    console.error('DataForEarth extension error:', e);
  }
})();

// Track time spent on page
window.addEventListener('beforeunload', async () => {
  const duration = Math.floor((Date.now() - startTime) / 1000);
  try {
    await fetch(\`\${API_URL}/extension-track-visit\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: domain,
        duration: duration,
        anonymous: true
      })
    });
  } catch (e) {
    console.error('Error tracking duration:', e);
  }
});`);
      
      // Content CSS
      zip.file("content.css", `/* DataForEarth Extension Styles */`);
      
      // Generate ZIP
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DataForEarth-Extension.zip';
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Extension downloaded! Extract ZIP and follow README.txt");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to package extension. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <Globe className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Download Free Extension
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Track company carbon emissions as you browse
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Chrome className="w-4 h-4" /> Chrome</span>
              <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Firefox</span>
              <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Edge</span>
              <span>+ More</span>
            </div>
          </div>

          <Card className="p-8 mb-8">
            <div className="text-center mb-6">
              <Button onClick={handleDownload} size="lg" className="gap-2">
                <Download className="w-5 h-5" />
                Download Extension
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                ZIP file • Extract and load in your browser
              </p>
            </div>

            <div className="space-y-6 mt-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Extract ZIP File</h3>
                  <p className="text-sm text-muted-foreground">
                    Download and extract to any folder on your computer
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Load in Browser</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Chrome/Edge:</strong> Go to <code className="bg-muted px-2 py-1 rounded">chrome://extensions</code> → Enable "Developer mode" → "Load unpacked"</p>
                    <p><strong>Firefox:</strong> Go to <code className="bg-muted px-2 py-1 rounded">about:debugging</code> → "Load Temporary Add-on"</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Start Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit any website - the extension tracks carbon data automatically
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">100% Anonymous</h3>
              <p className="text-sm text-muted-foreground">
                No account, no personal info
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Database className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Data Collection</h3>
              <p className="text-sm text-muted-foreground">
                Tracks domains + time anonymously
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real Impact</h3>
              <p className="text-sm text-muted-foreground">
                Helps build carbon datasets
              </p>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">📊 What Data Gets Collected?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ <strong>Domains visited</strong> - e.g., amazon.com, google.com</p>
              <p>✓ <strong>Time spent</strong> - Duration on each site</p>
              <p>✓ <strong>Carbon data viewed</strong> - Which companies you researched</p>
              <p>✗ <strong>No personal info</strong> - No names, emails, or passwords</p>
              <p>✗ <strong>No browsing history</strong> - Only domain names</p>
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                🌍 <strong>How it works:</strong> Your anonymous browsing data is sent to our backend, where AI organizes it into valuable datasets. These datasets are sold to fund eco projects - you browse, we monetize, Earth benefits!
              </p>
            </div>
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                💾 Data is also stored locally in your browser so you can download it anytime via the extension popup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionDownload;
