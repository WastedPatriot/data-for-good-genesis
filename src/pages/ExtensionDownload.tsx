import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Chrome, Shield, Leaf, Database } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";

const ExtensionDownload = () => {
  const handleDownload = async () => {
    try {
      toast.info("Preparing extension files...");
      
      // Note: In production, you'd fetch these from your server/GitHub
      // For now, we'll create a download link to the extension folder
      const instructions = `DataForEarth Carbon Tracker Extension
      
INSTALLATION STEPS:

1. Download the extension folder from your project at: browser-extension/

2. Open Chrome and navigate to: chrome://extensions/

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked" button

5. Select the downloaded browser-extension folder

6. Extension is now installed! Visit any company website to see it in action.

WHAT IT DOES:
✓ Shows company carbon emissions in real-time
✓ Tracks your browsing anonymously (domains + time spent)
✓ Displays sustainability scores
✓ Helps build datasets to reduce global emissions
✓ 100% free forever, no account needed

DATA COLLECTED (Anonymous):
- Domain names you visit
- Time spent on each site  
- Carbon data viewed
- All stored locally, downloadable anytime

PRIVACY:
- No personal information collected
- No tracking cookies
- No email/name required
- You control your data

Need help? Visit: ${window.location.origin}/contact

File locations in your project:
- browser-extension/manifest.json
- browser-extension/popup.html
- browser-extension/popup.js
- browser-extension/background.js
- browser-extension/content.js
- browser-extension/content.css
- browser-extension/icons/ (add your icons here)
`;
      
      const blob = new Blob([instructions], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DataForEarth-Extension-Install-Guide.txt';
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Installation guide downloaded! Check your Downloads folder.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <Chrome className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Download Free Extension
            </h1>
            <p className="text-xl text-muted-foreground">
              Track company carbon emissions as you browse
            </p>
          </div>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">How to Install</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Get the Extension Files</h3>
                  <p className="text-muted-foreground mb-3">
                    Download the extension files from your project's browser-extension folder
                  </p>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Installation Guide
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Load in Chrome</h3>
                  <p className="text-muted-foreground">
                    Open <code className="bg-muted px-2 py-1 rounded">chrome://extensions/</code>
                  </p>
                  <p className="text-muted-foreground">
                    Enable "Developer mode" → Click "Load unpacked" → Select the browser-extension folder
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Start Tracking</h3>
                  <p className="text-muted-foreground">
                    Visit any company website to see their carbon footprint instantly
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
                No account, no personal info collected
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Database className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Data Collection</h3>
              <p className="text-sm text-muted-foreground">
                Tracks domains + time spent anonymously
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real Impact</h3>
              <p className="text-sm text-muted-foreground">
                Your data helps build carbon datasets
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
              <p>✗ <strong>No browsing history</strong> - Only domain names, not full URLs</p>
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                💾 All data stored locally in your browser. Download anytime via the extension popup!
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 mt-6">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              The extension files are in your project's <code className="bg-background px-2 py-1 rounded">browser-extension</code> folder. Copy that folder to load in Chrome.
            </p>
            <p className="text-sm text-muted-foreground">
              For Chrome Web Store publication, package the extension and submit through the Chrome Developer Dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionDownload;
