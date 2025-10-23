import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Heart, Leaf, Droplet, Sun, Wind, Server, Code, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { DonationTierBadge } from "@/components/DonationTierBadge";

const donationSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 1;
  }, "Minimum donation is $1"),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  message: z.string().max(500).optional(),
});

const Donate = () => {
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [donationPurpose, setDonationPurpose] = useState<"platform" | "environment">("platform");
  const [selectedAmount, setSelectedAmount] = useState("25");
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [donationTier, setDonationTier] = useState<"sapling" | "young-tree" | "forest-guardian">("sapling");
  const { toast } = useToast();

  // Check for success/cancel in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");
    const amount = params.get("amount");
    const purpose = params.get("purpose");

    if (success === "true") {
      const amountNum = parseFloat(amount || "0");
      
      // Determine tier
      let tier: "sapling" | "young-tree" | "forest-guardian" = "sapling";
      if (amountNum >= 100) tier = "forest-guardian";
      else if (amountNum >= 20) tier = "young-tree";
      
      setDonationTier(tier);
      setShowBadge(true);
      
      toast({
        title: "Thank You! 💚",
        description: `Your donation of $${amount} for ${purpose === "platform" ? "platform operations" : "environmental projects"} was successful!`,
      });
      // Clean URL
      window.history.replaceState({}, document.title, "/donate");
    } else if (canceled === "true") {
      toast({
        title: "Donation Canceled",
        description: "Your donation was canceled. You can try again anytime.",
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, document.title, "/donate");
    }
  }, [toast]);

  const predefinedAmounts = ["10", "25", "50", "100", "250", "500"];

  const platformImpactMessages: Record<string, { icon: any; text: string }> = {
    "10": { icon: Server, text: "Covers 1 day of hosting" },
    "25": { icon: Code, text: "Supports platform development" },
    "50": { icon: Server, text: "Powers the platform for a week" },
    "100": { icon: Code, text: "Funds new features & improvements" },
    "250": { icon: Server, text: "Covers monthly infrastructure costs" },
    "500": { icon: Code, text: "Enables major platform upgrades" },
  };

  const environmentImpactMessages: Record<string, { icon: any; text: string }> = {
    "10": { icon: Leaf, text: "Plants 5 trees" },
    "25": { icon: Droplet, text: "Cleans 100L of ocean water" },
    "50": { icon: Sun, text: "Powers 10 homes with solar for a day" },
    "100": { icon: Wind, text: "Offsets 1 ton of CO2" },
    "250": { icon: Heart, text: "Funds a community garden" },
    "500": { icon: Leaf, text: "Sponsors a reforestation project" },
  };

  const getImpact = () => {
    const impactMessages = donationPurpose === "platform" ? platformImpactMessages : environmentImpactMessages;
    const amount = customAmount || selectedAmount;
    const numAmount = parseInt(amount);
    if (numAmount >= 500) return impactMessages["500"];
    if (numAmount >= 250) return impactMessages["250"];
    if (numAmount >= 100) return impactMessages["100"];
    if (numAmount >= 50) return impactMessages["50"];
    if (numAmount >= 25) return impactMessages["25"];
    return impactMessages["10"];
  };

  const handleDonate = async () => {
    try {
      setIsProcessing(true);
      const amount = customAmount || selectedAmount;
      
      const result = donationSchema.safeParse({
        amount,
        name,
        email,
        message,
      });

      if (!result.success) {
        const firstError = result.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: "Redirecting to payment...",
        description: "Please wait while we prepare your donation.",
      });

      // Call the edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: {
          amount: parseFloat(amount),
          donationType,
          donationPurpose,
          email: result.data.email || email,
          name: result.data.name || name,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
        setIsProcessing(false);
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const impact = getImpact();
  const ImpactIcon = impact.icon;

  // Show badge modal after successful donation
  if (showBadge) {
    const amountNum = parseFloat(customAmount || selectedAmount);
    return (
      <div className="min-h-screen bg-transparent py-12 px-4 flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <DonationTierBadge tier={donationTier} amount={amountNum} />
          <Button
            onClick={() => setShowBadge(false)}
            variant="outline"
            className="w-full mt-6"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black mb-4 text-gradient">
            Support Our Mission
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Your donation keeps the platform running or directly funds environmental projects. 
            Data sales revenue goes 100% to environmental initiatives — platform donations help us operate.
          </p>
          <div className="inline-block bg-primary/10 border-2 border-primary/30 rounded-xl px-6 py-3">
            <p className="text-sm font-medium">
              💡 <span className="text-primary font-bold">Remember:</span> Data sales fund the environment automatically. 
              Donate here to support our operations or give directly to green projects.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Donation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border-2 border-border rounded-xl p-8 hover-lift"
          >
            <div className="space-y-6">
              {/* Donation Purpose */}
              <div>
                <Label className="text-lg font-bold mb-4 block">What Would You Like to Support?</Label>
                <RadioGroup value={donationPurpose} onValueChange={(value: any) => setDonationPurpose(value)}>
                  <div className="flex items-start space-x-3 p-4 border-2 border-border rounded-lg hover:border-primary transition-colors">
                    <RadioGroupItem value="platform" id="platform" className="mt-1" />
                    <div className="flex-1 cursor-pointer" onClick={() => setDonationPurpose("platform")}>
                      <Label htmlFor="platform" className="cursor-pointer font-bold text-base block mb-1">
                        Platform Operations
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Support creators, hosting, development, and website maintenance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border-2 border-border rounded-lg hover:border-primary transition-colors">
                    <RadioGroupItem value="environment" id="environment" className="mt-1" />
                    <div className="flex-1 cursor-pointer" onClick={() => setDonationPurpose("environment")}>
                      <Label htmlFor="environment" className="cursor-pointer font-bold text-base block mb-1">
                        Environmental Projects
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Directly fund green initiatives and climate action
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Donation Type */}
              <div>
                <Label className="text-lg font-bold mb-4 block">Donation Type</Label>
                <RadioGroup value={donationType} onValueChange={(value: any) => setDonationType(value)}>
                  <div className="flex items-center space-x-2 p-4 border-2 border-border rounded-lg hover:border-primary transition-colors">
                    <RadioGroupItem value="one-time" id="one-time" />
                    <Label htmlFor="one-time" className="cursor-pointer flex-1 font-medium">
                      One-Time Donation
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border-2 border-border rounded-lg hover:border-primary transition-colors">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer flex-1 font-medium">
                      Monthly Donation (Become a Sustainer)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Amount Selection */}
              <div>
                <Label className="text-lg font-bold mb-4 block">Select Amount</Label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {predefinedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className="font-bold border-2 hover-lift"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                  className="text-lg font-bold"
                />
              </div>

              {/* Personal Details */}
              <div>
                <Label className="text-lg font-bold mb-4 block">Your Details</Label>
                <div className="space-y-3">
                  <Input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                  />
                  <Input
                    placeholder="Message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                  />
                </div>
              </div>

              <Button 
                className="w-full text-lg py-6 border-glow hover-lift font-black" 
                size="lg"
                onClick={handleDonate}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : `Donate $${customAmount || selectedAmount}`}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-2">
                Secure payment powered by Stripe
              </p>
            </div>
          </motion.div>

          {/* Impact Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Your Impact */}
            <div className="bg-card border-2 border-primary/50 rounded-xl p-8 hover-lift">
              <h3 className="text-2xl font-black mb-6 text-gradient">Your Impact</h3>
              <motion.div
                key={customAmount || selectedAmount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <ImpactIcon className="w-24 h-24 text-primary relative z-10" />
                  </div>
                </motion.div>
                <p className="text-3xl font-black text-gradient mb-2">
                  ${customAmount || selectedAmount}
                </p>
                <p className="text-xl text-muted-foreground">{impact.text}</p>
              </motion.div>
            </div>

            {/* Why Donate */}
            <div className="bg-card border-2 border-border rounded-xl p-8">
              <h3 className="text-xl font-black mb-4">
                {donationPurpose === "platform" ? "Why Support the Platform?" : "Why Donate to Environment?"}
              </h3>
              {donationPurpose === "platform" ? (
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Keeps the platform free for data contributors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Funds ongoing development and new features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Covers hosting, infrastructure, and security costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Supports the creators building this mission</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>100% goes to verified environmental projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Community votes on which projects get funded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Track your impact with transparent reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Direct action on climate change</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-black text-gradient">$0</div>
                  <div className="text-sm text-muted-foreground">Raised This Month</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gradient">0</div>
                  <div className="text-sm text-muted-foreground">Active Donors</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
