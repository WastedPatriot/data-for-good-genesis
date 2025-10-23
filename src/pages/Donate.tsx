import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Heart, Leaf, Droplet, Sun, Wind } from "lucide-react";
import { z } from "zod";

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
  const [selectedAmount, setSelectedAmount] = useState("25");
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const predefinedAmounts = ["10", "25", "50", "100", "250", "500"];

  const impactMessages: Record<string, { icon: any; text: string }> = {
    "10": { icon: Leaf, text: "Plants 5 trees" },
    "25": { icon: Droplet, text: "Cleans 100L of ocean water" },
    "50": { icon: Sun, text: "Powers 10 homes with solar for a day" },
    "100": { icon: Wind, text: "Offsets 1 ton of CO2" },
    "250": { icon: Heart, text: "Funds a community garden" },
    "500": { icon: Leaf, text: "Sponsors a reforestation project" },
  };

  const getImpact = () => {
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
        return;
      }

      // TODO: Integrate with Stripe
      console.log("Donation:", {
        type: donationType,
        amount: parseFloat(amount),
        name,
        email,
        message,
      });

      toast({
        title: "Thank You! 💚",
        description: `Your ${donationType === "monthly" ? "monthly" : ""} donation of $${amount} will make a real impact.`,
      });

      // Reset form
      setCustomAmount("");
      setSelectedAmount("25");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const impact = getImpact();
  const ImpactIcon = impact.icon;

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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your donation directly funds environmental projects chosen by the community. 
            Every dollar makes a measurable impact.
          </p>
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
              >
                Donate ${customAmount || selectedAmount}
              </Button>
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
              <h3 className="text-xl font-black mb-4">Why Donate?</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>100% of funds go to verified environmental projects</span>
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
                  <span>Tax-deductible in most countries</span>
                </li>
              </ul>
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
