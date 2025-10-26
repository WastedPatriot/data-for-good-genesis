import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";

export default function SubmitData() {
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [advertisingConsent, setAdvertisingConsent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    age_range: "",
    location: "",
    interests: [] as string[],
    device_ownership: "",
    ev_ownership: "",
    sustainability: "",
  });

  const interestOptions = [
    "Environmental Technology",
    "Renewable Energy",
    "Sustainable Products",
    "Electric Vehicles",
    "Climate Policy",
    "Green Finance",
    "Eco Travel",
    "Organic Food",
    "Zero Waste",
    "Conservation",
    "Clean Technology",
    "Carbon Markets"
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consent || !advertisingConsent) {
      toast({
        title: "Consent Required",
        description: "Please read and accept both consent statements to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("data_submissions")
        .insert({
          ...formData,
          sensor_data: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            consented_to_advertising: true
          }
        });

      if (error) throw error;

      toast({
        title: "Data Submitted Successfully! 🎉",
        description: "Your contribution helps fund real-world projects. Thank you!",
      });

      navigate("/");
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Contribute Your Data for Good</h1>
          <p className="text-xl text-muted-foreground">
            Turn your information into funding for community-voted causes
          </p>
        </div>

        {/* How It Works */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              How Your Data Creates Real Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">1</div>
              <div>
                <p className="font-semibold">You Submit Anonymized Data</p>
                <p className="text-muted-foreground">Share your demographics, interests, and preferences voluntarily.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">2</div>
              <div>
                <p className="font-semibold">We Package & Sell Insights</p>
                <p className="text-muted-foreground">Your data is aggregated with others and sold to researchers, advertisers, and businesses across ALL industries.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">3</div>
              <div>
                <p className="font-semibold">100% of Profits → Community Projects</p>
                <p className="text-muted-foreground">Every dollar goes to causes you vote on: environment, education, health, housing.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advertising Notice */}
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="ml-2">
            <strong>How Companies Use Your Data:</strong> Organizations purchase datasets to understand consumer behavior, run targeted advertising campaigns, conduct market research, and develop new products. By submitting, you acknowledge that anonymized versions of your data may be used for commercial advertising purposes across ALL industries (not just environmental).
          </AlertDescription>
        </Alert>

        {/* Data Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information (All Optional)</CardTitle>
            <CardDescription>
              Share what you're comfortable with—more data = more funding for good causes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional - for updates only)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Age Range */}
              <div className="space-y-2">
                <Label>Age Range</Label>
                <RadioGroup
                  value={formData.age_range}
                  onValueChange={(value) => setFormData({ ...formData, age_range: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="18-24" id="age1" />
                    <Label htmlFor="age1">18-24</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="25-34" id="age2" />
                    <Label htmlFor="age2">25-34</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="35-44" id="age3" />
                    <Label htmlFor="age3">35-44</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="45-54" id="age4" />
                    <Label htmlFor="age4">45-54</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="55+" id="age5" />
                    <Label htmlFor="age5">55+</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location (City or Region)</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, California"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label>Your Interests (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={() => handleInterestToggle(interest)}
                      />
                      <Label 
                        htmlFor={interest}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Ownership */}
              <div className="space-y-2">
                <Label>Primary Device</Label>
                <RadioGroup
                  value={formData.device_ownership}
                  onValueChange={(value) => setFormData({ ...formData, device_ownership: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="smartphone" id="dev1" />
                    <Label htmlFor="dev1">Smartphone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="laptop" id="dev2" />
                    <Label htmlFor="dev2">Laptop/Desktop</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tablet" id="dev3" />
                    <Label htmlFor="dev3">Tablet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multiple" id="dev4" />
                    <Label htmlFor="dev4">Multiple Devices</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* EV Ownership */}
              <div className="space-y-2">
                <Label>Electric Vehicle Ownership</Label>
                <RadioGroup
                  value={formData.ev_ownership}
                  onValueChange={(value) => setFormData({ ...formData, ev_ownership: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="own" id="ev1" />
                    <Label htmlFor="ev1">I own an EV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="planning" id="ev2" />
                    <Label htmlFor="ev2">Planning to buy within 2 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="interested" id="ev3" />
                    <Label htmlFor="ev3">Interested but no plans yet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_interested" id="ev4" />
                    <Label htmlFor="ev4">Not interested</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Sustainability Commitment */}
              <div className="space-y-2">
                <Label>Sustainability Commitment Level</Label>
                <RadioGroup
                  value={formData.sustainability}
                  onValueChange={(value) => setFormData({ ...formData, sustainability: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="sus1" />
                    <Label htmlFor="sus1">High - I actively seek eco-friendly options</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="sus2" />
                    <Label htmlFor="sus2">Moderate - I try when convenient</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="sus3" />
                    <Label htmlFor="sus3">Low - Not a priority for me</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
                    <strong>I consent to data collection.</strong> I understand my data will be anonymized, aggregated, and sold as part of datasets to organizations for research and commercial purposes. I can request deletion at any time.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="advertising"
                    checked={advertisingConsent}
                    onCheckedChange={(checked) => setAdvertisingConsent(checked as boolean)}
                  />
                  <Label htmlFor="advertising" className="text-sm font-normal leading-relaxed cursor-pointer">
                    <strong>I acknowledge advertising use.</strong> I understand that companies may use anonymized versions of my data to create targeted advertising campaigns across ALL industries (tech, retail, automotive, finance, healthcare, etc.), conduct market research, and develop products. I voluntarily consent to this commercial use knowing 100% of profits fund community-voted causes.
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={loading || !consent || !advertisingConsent}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "✨ Submit Data & Support Good Causes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Value Transparency */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              What Your Data Is Worth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              We believe in full transparency. Here's approximately what different types of data contribute to our marketplace:
            </p>
            <div className="grid gap-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span>Basic Demographics (age, location)</span>
                <span className="font-semibold">$0.50 - $2</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span>Interest & Behavior Data</span>
                <span className="font-semibold">$2 - $5</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span>Purchase Intent (EV, products)</span>
                <span className="font-semibold">$5 - $15</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span>Complete Profile</span>
                <span className="font-semibold text-primary">$10 - $25</span>
              </div>
            </div>
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <strong>100% of revenue</strong> from your data goes to funding community-voted projects. You choose where the money goes through monthly voting.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground space-y-2 pt-4">
          <p>
            Your data is protected by enterprise-grade security. We never sell personally identifiable information.
          </p>
          <p>
            Read our <a href="/privacy" className="underline">Privacy Policy</a> and <a href="/terms" className="underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
