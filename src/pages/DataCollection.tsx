import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Database, DollarSign, Users, TrendingUp, Lock, Eye, EyeOff } from "lucide-react";

export default function DataCollection() {
  const handleOptOut = () => {
    localStorage.setItem('visitor_tracking_disabled', 'true');
    localStorage.setItem('cookie_consent', 'declined');
    window.location.reload();
  };

  const handleOptIn = () => {
    localStorage.removeItem('visitor_tracking_disabled');
    localStorage.setItem('cookie_consent', 'accepted');
    window.location.reload();
  };

  const currentStatus = localStorage.getItem('visitor_tracking_disabled') === 'true' ? 'opted-out' : 'opted-in';

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Data Collection & Privacy</h1>
          <p className="text-xl text-muted-foreground">
            Transparent data practices that fund environmental action
          </p>
        </div>

        {/* Current Status */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStatus === 'opted-out' ? (
                <>
                  <EyeOff className="w-5 h-5" />
                  Tracking Disabled
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Tracking Enabled
                </>
              )}
            </CardTitle>
            <CardDescription>
              Your current data collection preference
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={currentStatus === 'opted-out' ? 'secondary' : 'default'} className="mb-2">
                  {currentStatus === 'opted-out' ? 'Opted Out' : 'Opted In'}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {currentStatus === 'opted-out' 
                    ? 'We are not collecting any visitor data from your browsing session.'
                    : 'We are collecting anonymized visitor data to improve our platform and create datasets.'}
                </p>
              </div>
              <Button 
                onClick={currentStatus === 'opted-out' ? handleOptIn : handleOptOut}
                variant={currentStatus === 'opted-out' ? 'default' : 'outline'}
              >
                {currentStatus === 'opted-out' ? 'Opt In' : 'Opt Out'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* What We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              What Data We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">✅ We Collect</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Pages visited</li>
                  <li>• Time spent on site</li>
                  <li>• Device type (desktop/mobile)</li>
                  <li>• Browser type</li>
                  <li>• Operating system</li>
                  <li>• Country (from IP address)</li>
                  <li>• Referrer source</li>
                  <li>• Anonymous session ID</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">❌ We Never Collect</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Personal information</li>
                  <li>• Email addresses (from tracking)</li>
                  <li>• Names or identities</li>
                  <li>• Full IP addresses</li>
                  <li>• Precise location (city-level max)</li>
                  <li>• Browsing history outside our site</li>
                  <li>• Device fingerprints</li>
                  <li>• Third-party cookies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How We Use It */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              How We Use Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Users className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Platform Improvement</h3>
                  <p className="text-sm text-muted-foreground">
                    Understanding user behavior helps us improve navigation, content, and features to better serve the climate tech community.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Database className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Dataset Creation</h3>
                  <p className="text-sm text-muted-foreground">
                    Anonymized visitor data is packaged into datasets that provide insights into climate tech web traffic patterns, helping researchers and businesses.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <DollarSign className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Revenue Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Visitor datasets are sold to organizations interested in climate tech market insights. 100% of profits fund environmental projects and research.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Privacy Protections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-sm">Anonymization</h3>
                  <p className="text-sm text-muted-foreground">
                    All data is anonymized before storage. Session IDs are hashed, IP addresses truncated, and no PII is retained.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Database className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-sm">Data Retention</h3>
                  <p className="text-sm text-muted-foreground">
                    Raw visitor data is automatically deleted after 90 days. Only aggregated, anonymized statistics are retained.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-sm">No Third Parties</h3>
                  <p className="text-sm text-muted-foreground">
                    We never share raw visitor data with third parties. Only anonymized datasets are sold, and buyers cannot identify individuals.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Eye className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-sm">Easy Opt-Out</h3>
                  <p className="text-sm text-muted-foreground">
                    You can opt out at any time. We also respect Do Not Track (DNT) browser settings automatically.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GDPR Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Your Rights (GDPR Compliant)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>✅ <strong>Right to Access:</strong> Request a copy of any data we have collected about you</p>
            <p>✅ <strong>Right to Deletion:</strong> Request deletion of your visitor data (contact us)</p>
            <p>✅ <strong>Right to Object:</strong> Opt out of data collection at any time using the button above</p>
            <p>✅ <strong>Right to Portability:</strong> Export your data in a machine-readable format</p>
            <p>✅ <strong>Right to Information:</strong> Full transparency about what we collect and why</p>
            <p className="pt-2">
              For data access requests or questions: <a href="/contact" className="underline">contact us</a>
            </p>
          </CardContent>
        </Card>

        {/* Revenue Model */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              How This Funds Climate Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We believe in radical transparency about our business model:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>1. Data Collection:</strong> Anonymous visitor behavior is tracked (with your consent)</p>
              <p><strong>2. Dataset Creation:</strong> Data is aggregated, anonymized, and packaged into tiered datasets</p>
              <p><strong>3. Marketplace Sales:</strong> Organizations purchase datasets for climate tech market insights</p>
              <p><strong>4. Impact Funding:</strong> 100% of dataset profits fund verified environmental projects</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg mt-4">
              <p className="text-sm font-semibold">Revenue Allocation:</p>
              <ul className="text-sm space-y-1 mt-2">
                <li>• 60% → Direct funding of environmental projects</li>
                <li>• 25% → Platform development & maintenance</li>
                <li>• 15% → Data infrastructure & security</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Questions about our data practices? We're happy to help.
          </p>
          <Button onClick={() => window.location.href = '/contact'}>
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
