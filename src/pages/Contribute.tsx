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
import { z } from "zod";

const contributionSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long').optional().or(z.literal('')),
  location: z.string().max(200, 'Location must be under 200 characters').optional(),
  ageRange: z.string().min(1, 'Please select an age range'),
  interests: z.array(z.string()).max(10, 'Too many interests selected'),
  deviceOwnership: z.string().min(1, 'Please select device ownership'),
  evOwnership: z.string().min(1, 'Please select EV ownership status'),
  sustainability: z.string().max(500, 'Response too long').optional(),
  sensorData: z.object({
    geolocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number()
    }).optional(),
    deviceInfo: z.object({
      userAgent: z.string(),
      screenWidth: z.number(),
      screenHeight: z.number(),
      timezone: z.string(),
      language: z.string()
    }).optional(),
    connectionInfo: z.object({
      effectiveType: z.string(),
      downlink: z.number()
    }).optional()
  }).optional()
});

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
    sensorData: {} as any
  });
  const [sensorConsent, setSensorConsent] = useState(false);
  const [collectingSensors, setCollectingSensors] = useState(false);
  const { toast } = useToast();

  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

  const collectSensorData = async () => {
    if (!sensorConsent) return;
    
    setCollectingSensors(true);
    const sensorData: any = {};

    try {
      // Collect device information
      sensorData.deviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };

      // Collect connection information
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        sensorData.connectionInfo = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0
        };
      }

      // Request geolocation if available
      if (navigator.geolocation && sensorConsent) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              sensorData.geolocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              resolve(true);
            },
            (error) => {
              console.log('Geolocation error:', error.message);
              resolve(false);
            },
            { timeout: 5000, enableHighAccuracy: false }
          );
        });
      }

      setFormData(prev => ({ ...prev, sensorData }));
      
      toast({
        title: "Sensor Data Collected",
        description: "Thank you for sharing device information!",
      });
    } catch (error) {
      console.error('Error collecting sensor data:', error);
      toast({
        title: "Partial Data Collected",
        description: "Some sensor data could not be accessed.",
        variant: "destructive"
      });
    } finally {
      setCollectingSensors(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate input before submission
      const result = contributionSchema.safeParse(formData);
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive"
        });
        return;
      }

      // Submit validated data
      const { error } = await supabase
        .from("data_submissions")
        .insert([result.data]);

      if (error) throw error;

      toast({
        title: "Thank you! 🌱",
        description: "Your data helps fund green projects chosen by the community.",
      });

      setStep(totalSteps + 1);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (step > totalSteps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
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
    <div className="min-h-screen bg-transparent py-12 px-4">
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
                  maxLength={200}
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
                  maxLength={255}
                />
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Sensor Data Consent</h2>
                <p className="text-muted-foreground mb-4">
                  Help us gather richer insights by sharing device sensor data. This helps researchers understand real-world usage patterns.
                </p>
                
                <div className="bg-secondary/20 p-4 rounded-lg space-y-3 text-sm">
                  <p className="font-semibold">We may collect:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Approximate location (if you allow)</li>
                    <li>Device type and screen size</li>
                    <li>Internet connection type</li>
                    <li>Browser and timezone information</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3">
                    All data is anonymous and used only for research purposes. You can skip this step.
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox
                    id="sensorConsent"
                    checked={sensorConsent}
                    onCheckedChange={(checked) => {
                      setSensorConsent(checked as boolean);
                      if (checked) {
                        collectSensorData();
                      }
                    }}
                  />
                  <Label htmlFor="sensorConsent" className="cursor-pointer">
                    I consent to sharing sensor data
                  </Label>
                </div>

                {collectingSensors && (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Collecting sensor data...
                  </p>
                )}

                {sensorConsent && !collectingSensors && formData.sensorData?.deviceInfo && (
                  <div className="bg-primary/10 p-3 rounded text-sm">
                    ✓ Sensor data collected successfully
                  </div>
                )}
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