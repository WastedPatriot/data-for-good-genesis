import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Leaf } from "lucide-react";

const Contribute = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ageRange: "",
    location: "",
    interests: [] as string[],
    deviceOwnership: "",
    evOwnership: "",
    sustainability: "",
    email: "",
  });
  const { toast } = useToast();

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from("data_submissions")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Thank you! 🌱",
        description: "Your data helps fund green projects chosen by the community.",
      });

      setStep(totalSteps + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (step > totalSteps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="inline-block mb-6"
          >
            <Leaf className="w-24 h-24 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your data helps fund green projects chosen by the community.
            Your answers could plant 3 trees! 🌳
          </p>
          <Button onClick={() => window.location.href = "/"}>
            Return Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Contribute Your Data</h1>
          <p className="text-muted-foreground mb-8">
            Choose what you're comfortable sharing. All data is anonymous.
          </p>

          <Progress value={progress} className="mb-8" />

          <div className="bg-card border border-border rounded-lg p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Age Range</h2>
                <RadioGroup
                  value={formData.ageRange}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ageRange: value })
                  }
                >
                  {["18-24", "25-34", "35-44", "45-54", "55+"].map((range) => (
                    <div key={range} className="flex items-center space-x-2">
                      <RadioGroupItem value={range} id={range} />
                      <Label htmlFor={range}>{range}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Location (Optional)</h2>
                <Input
                  placeholder="Enter your region (e.g., London, UK)"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Interests</h2>
                <div className="space-y-4">
                  {["Technology", "Automotive", "Fashion", "Travel", "Health"].map(
                    (interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                interests: [...formData.interests, interest],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                interests: formData.interests.filter(
                                  (i) => i !== interest
                                ),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={interest}>{interest}</Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Device Ownership</h2>
                <RadioGroup
                  value={formData.deviceOwnership}
                  onValueChange={(value) =>
                    setFormData({ ...formData, deviceOwnership: value })
                  }
                >
                  {["iPhone", "Android", "Both", "Neither"].map((device) => (
                    <div key={device} className="flex items-center space-x-2">
                      <RadioGroupItem value={device} id={device} />
                      <Label htmlFor={device}>{device}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">EV Ownership</h2>
                <RadioGroup
                  value={formData.evOwnership}
                  onValueChange={(value) =>
                    setFormData({ ...formData, evOwnership: value })
                  }
                >
                  {["Yes", "No", "Considering"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Email (Optional)</h2>
                <p className="text-muted-foreground">
                  Stay updated on how your data helps fund projects
                </p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  if (step === totalSteps) {
                    handleSubmit();
                  } else {
                    setStep(step + 1);
                  }
                }}
              >
                {step === totalSteps ? "Submit" : "Next"}
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-primary font-semibold">
              🌿 Your answers could plant 3 trees!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contribute;