import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Chrome, Shield, Leaf } from "lucide-react";
import Navigation from "@/components/Navigation";

const ExtensionDownload = () => {
  const handleDownload = () => {
    // Create a text file with GitHub instructions
    const instructions = `DataForEarth Browser Extension - Installation Instructions

STEP 1: Download Extension Files
Visit: https://github.com/your-repo/browser-extension
Or download the files directly from your project

STEP 2: Install in Chrome/Edge
1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the browser-extension folder
5. Extension is now installed!

STEP 3: Test It Out
Visit any company website (e.g., amazon.com, google.com)
The extension will show carbon data automatically

Questions? Contact us at support@dataforearth.com
`;
    
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extension-installation-guide.txt';
    a.click();
    URL.revokeObjectURL(url);
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
                No account required, no tracking
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real Impact</h3>
              <p className="text-sm text-muted-foreground">
                See how your data helps reduce emissions
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Download className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Always Free</h3>
              <p className="text-sm text-muted-foreground">
                No hidden costs, forever
              </p>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Having trouble installing? The extension files are located in your project's <code className="bg-background px-2 py-1 rounded">browser-extension</code> folder.
            </p>
            <p className="text-sm text-muted-foreground">
              For Chrome Store publication, you'll need to package the extension and submit it through the Chrome Developer Dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionDownload;
