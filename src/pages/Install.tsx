import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import PhoneMockup from "@/components/PhoneMockup";

const Install = () => {
  const appUrl = useMemo(() => `${window.location.origin}/esim`, []);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-16 pb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Install DataForEarth eSIM App
        </h1>
        <p className="mt-2 text-muted-foreground">
          Scan the QR code or open on your phone to preview the native app experience
        </p>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <Card className="p-6 flex flex-col items-center justify-center">
            <div className="mb-4 text-sm text-muted-foreground">Scan to open on your phone</div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <QRCodeCanvas value={appUrl} size={256} includeMargin aria-label="QR code to open the DataForEarth app" />
            </div>
            <a href={appUrl} className="mt-6" target="_blank" rel="noreferrer">
              <Button variant="default">Open App Link</Button>
            </a>
            <p className="mt-2 text-xs text-muted-foreground break-all">{appUrl}</p>
          </Card>
          <Card className="p-6 flex items-center justify-center">
            <PhoneMockup>
              <iframe src="/esim" title="App preview" className="w-full h-full border-0" />
            </PhoneMockup>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-medium text-foreground">How to test on your phone</h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Scan the QR code with your phone’s camera</li>
              <li>Tap the link to open the app experience</li>
              <li>Browse plans, "Buy" will use live payments (Stripe), and crypto is optional</li>
            </ol>

            <div className="mt-6 rounded-lg border p-4">
              <h3 className="font-medium text-foreground">Tips</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                {isIOS && (
                  <li>
                    iPhone: After opening, use the Share menu → Add to Home Screen for an app-like icon
                  </li>
                )}
                {isAndroid && (
                  <li>
                    Android: Use browser menu → Install App / Add to Home Screen
                  </li>
                )}
                {!isMobile && (
                  <li>
                    You’re on desktop. Scan the QR with your phone to try the app UI now
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-6">
              <a href="/esim">
                <Button variant="secondary">Preview on this device</Button>
              </a>
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="p-6">
            <h2 className="text-xl font-medium text-foreground">Ready for App Store builds</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              For TestFlight / Play internal testing, export the project to GitHub, then build with Capacitor
              on macOS (iOS) or Android Studio (Android). See MOBILE_APP_DEPLOYMENT.md for exact steps.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Install;
