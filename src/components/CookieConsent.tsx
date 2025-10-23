import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Show banner after 1 second delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    
    // Stop visitor tracking if declined
    localStorage.setItem('visitor_tracking_disabled', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="max-w-4xl mx-auto border-2 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Cookie className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-lg">Be Part of Something Bigger</CardTitle>
                <CardDescription>
                  Your anonymous data helps fund meaningful causes
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDecline}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              We collect anonymous visitor data to improve our platform and create valuable datasets. 
              <span className="text-primary font-semibold"> Your participation directly funds projects you care about.</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">✓ 100% Anonymous</Badge>
              <Badge variant="outline">✓ You Choose</Badge>
              <Badge variant="outline">✓ Real Impact</Badge>
              <Badge variant="outline">✓ Full Transparency</Badge>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleAccept} className="flex-1">
              ✨ Count Me In
            </Button>
            <Button onClick={handleDecline} variant="outline" className="flex-1">
              No Thanks
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.open('/data-collection', '_blank')}
              className="flex-1"
            >
              Learn More
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            We collect anonymous browsing data to improve our platform and fund causes through ethical data sales. 
            No personal info. <a href="/data-collection" className="underline">Full details</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
