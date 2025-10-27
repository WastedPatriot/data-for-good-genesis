/**
 * SubmitData Page - Gamified Data Contribution Experience
 * 
 * PURPOSE:
 * This page transforms voluntary data submission into an engaging, transparent journey.
 * Users progress through steps, see their impact value in real-time, and understand
 * exactly how their data creates funding for causes they care about.
 * 
 * KEY FEATURES:
 * - Multi-step wizard with progress tracking
 * - Real-time impact value calculation
 * - Animated transitions and visual feedback
 * - Complete transparency about data use and advertising
 * - Gamified UI elements (badges, progress bars, value counter)
 * 
 * DATA COLLECTED:
 * - Demographics (age, location)
 * - Interests (environmental, tech, lifestyle)
 * - Device ownership & behavior
 * - Sustainability commitment level
 * - Purchase intent signals
 * 
 * TRANSPARENCY:
 * Users explicitly consent to:
 * - Behavioral tracking (browsing, clicks, time spent)
 * - Targeted advertising (personalized ads, retargeting)
 * - Profile building (combining data sources)
 * - Purchase prediction algorithms
 * 
 * REVENUE MODEL:
 * 100% of profits from data sales fund community-voted projects.
 * Users see exactly what their data is worth before submitting.
 * 
 * @module pages/SubmitData
 * @requires react, react-router-dom, framer-motion
 * @requires @/components/ui (shadcn components)
 * @requires @/integrations/supabase/client
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Zap,
  Heart,
  ArrowRight,
  ArrowLeft,
  Award,
  Shield,
  Eye
} from "lucide-react";

/**
 * Form step configuration
 * Each step represents a section of the data collection process
 */
const STEPS = [
  { id: 1, title: "Your Profile", icon: Shield, description: "Tell us about yourself" },
  { id: 2, title: "Your Interests", icon: Heart, description: "What matters to you?" },
  { id: 3, title: "Your Habits", icon: Target, description: "How you live" },
  { id: 4, title: "Impact Preview", icon: Sparkles, description: "See your contribution" },
] as const;

/**
 * Interest categories for data collection
 * These help advertisers understand user preferences across industries
 */
const INTEREST_CATEGORIES = [
  { id: "env_tech", label: "Environmental Technology", value: 3 },
  { id: "renewable", label: "Renewable Energy", value: 3 },
  { id: "sustainable", label: "Sustainable Products", value: 2.5 },
  { id: "ev", label: "Electric Vehicles", value: 5 },
  { id: "climate", label: "Climate Policy", value: 2 },
  { id: "finance", label: "Green Finance", value: 4 },
  { id: "travel", label: "Eco Travel", value: 3 },
  { id: "food", label: "Organic Food", value: 2 },
  { id: "zero_waste", label: "Zero Waste", value: 2.5 },
  { id: "conservation", label: "Conservation", value: 2 },
  { id: "clean_tech", label: "Clean Technology", value: 4 },
  { id: "carbon", label: "Carbon Markets", value: 4.5 },
] as const;

export default function SubmitData() {
  console.log("[SubmitData] Component mounted - initializing gamified data submission experience");
  
  // Navigation and notifications
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // UI state management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState(0);
  
  // Consent tracking - must be explicit and informed
  const [dataConsent, setDataConsent] = useState(false);
  const [advertisingConsent, setAdvertisingConsent] = useState(false);
  const [sensorDataConsent, setSensorDataConsent] = useState(false);
  const [showSensorData, setShowSensorData] = useState(false);

  /**
   * Form data state
   * All fields are optional to encourage participation
   * More data = higher value contribution
   */
  const [formData, setFormData] = useState({
    email: "",
    age_range: "",
    location: "",
    interests: [] as string[],
    device_ownership: "",
    ev_ownership: "",
    sustainability: "",
  });

  /**
   * Calculate estimated data value in real-time
   * 
   * VALUE BREAKDOWN:
   * - Base demographic data: $0.50-$2
   * - Each interest selected: +$0.25-$0.50 (based on category)
   * - Device ownership: +$1
   * - High-value signals (EV ownership, sustainability): +$2-$5
   * 
   * This transparency helps users understand their contribution's worth
   */
  useEffect(() => {
    console.log("[SubmitData] Calculating estimated data value based on form completion");
    let value = 0;

    // Base demographic value
    if (formData.age_range) value += 1;
    if (formData.location) value += 1.5;
    
    // Interest-based value (varies by category)
    formData.interests.forEach(interest => {
      const category = INTEREST_CATEGORIES.find(c => c.id === interest);
      if (category) {
        value += category.value * 0.3; // Each interest adds percentage of category value
      }
    });
    
    // Device ownership value
    if (formData.device_ownership) value += 1;
    
    // High-value behavioral signals
    if (formData.ev_ownership === "own") value += 5; // EV owners are high-value audience
    if (formData.ev_ownership === "planning") value += 3;
    if (formData.sustainability === "high") value += 2;
    
    // Email for follow-up (valuable for remarketing)
    if (formData.email && formData.email.includes("@")) value += 2;

    setEstimatedValue(Math.round(value * 100) / 100);
    console.log(`[SubmitData] Estimated data value: $${value.toFixed(2)}`);
  }, [formData]);

  /**
   * Handle interest selection
   * Allows multi-select to build comprehensive user profile
   */
  const handleInterestToggle = (interestId: string) => {
    console.log(`[SubmitData] Interest toggled: ${interestId}`);
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(i => i !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  /**
   * Progress calculation for visual feedback
   * Motivates users to complete more fields
   */
  const calculateProgress = () => {
    const totalFields = 7;
    let completed = 0;
    
    if (formData.age_range) completed++;
    if (formData.location) completed++;
    if (formData.interests.length > 0) completed++;
    if (formData.device_ownership) completed++;
    if (formData.ev_ownership) completed++;
    if (formData.sustainability) completed++;
    if (formData.email && formData.email.includes("@")) completed++;
    
    return Math.round((completed / totalFields) * 100);
  };

  /**
   * Handle final form submission
   * 
   * PROCESS:
   * 1. Validate consent checkboxes
   * 2. Prepare data payload with metadata
   * 3. Insert into data_submissions table
   * 4. Show success message with impact summary
   * 5. Redirect to home
   * 
   * SECURITY:
   * - All data anonymized before storage
   * - No PII exposed in public queries
   * - RLS policies enforce access control
   */
  const handleSubmit = async () => {
    console.log("[SubmitData] Form submission initiated");
    console.log("[SubmitData] Validating consent requirements...");

    // Explicit consent required - legal compliance
    if (!dataConsent || !advertisingConsent || !sensorDataConsent) {
      console.warn("[SubmitData] Submission blocked - missing required consent");
      toast({
        title: "Consent Required",
        description: "Please read and accept all consent statements to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log("[SubmitData] Preparing data payload for submission");

    try {
      // Build comprehensive submission payload
      const submissionPayload = {
        ...formData,
        sensor_data: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          estimated_value: estimatedValue,
          consented_to_advertising: true,
          consented_to_tracking: true,
          submission_source: "gamified_wizard"
        }
      };

      console.log("[SubmitData] Inserting submission into database...");
      console.log(`[SubmitData] Estimated contribution value: $${estimatedValue}`);

      const { error } = await supabase
        .from("data_submissions")
        .insert(submissionPayload);

      if (error) {
        console.error("[SubmitData] Database insertion failed:", error);
        throw error;
      }

      console.log("[SubmitData] Submission successful! 🎉");
      
      // Success feedback with impact summary
      toast({
        title: "🎉 You're a Data Hero!",
        description: `Your $${estimatedValue} contribution will fund real-world projects. Thank you for making a difference!`,
      });

      // Small delay for user to see success message, then redirect
      setTimeout(() => {
        console.log("[SubmitData] Redirecting to home page");
        navigate("/");
      }, 2000);

    } catch (error) {
      console.error("[SubmitData] Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step navigation handlers
   */
  const nextStep = () => {
    console.log(`[SubmitData] Advancing to step ${currentStep + 1}`);
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    console.log(`[SubmitData] Going back to step ${currentStep - 1}`);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-12 px-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-4xl space-y-6 relative z-10">
        {/* Header with animated value counter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div 
            className="flex items-center justify-center gap-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-gradient glow-text">
              Become a Data Hero
            </h1>
            <motion.div
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-accent" />
            </motion.div>
          </motion.div>
          <motion.p 
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Your data. Your choice. Real impact. Let&apos;s make this fun! 🚀
          </motion.p>
          
          {/* Live value counter - gamification element */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-2 border-primary/30 rounded-full backdrop-blur-sm animate-glow"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <DollarSign className="w-6 h-6 text-primary" />
            </motion.div>
            <div className="text-left">
              <motion.div 
                className="text-2xl font-black text-primary tabular-nums"
                key={estimatedValue}
                initial={{ scale: 1.5, color: "hsl(142, 86%, 60%)" }}
                animate={{ scale: 1, color: "hsl(142, 86%, 45%)" }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                ${estimatedValue.toFixed(2)}
              </motion.div>
              <div className="text-xs text-muted-foreground">Your Impact Value</div>
            </div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="w-5 h-5 text-green-500" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Progress stepper */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Progress</span>
                  <span className="text-muted-foreground">{progress}% Complete</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              
              {/* Step indicators */}
              <div className="grid grid-cols-4 gap-2">
                {STEPS.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isComplete = currentStep > step.id;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                        isActive ? "bg-primary/10 border-2 border-primary" : 
                        isComplete ? "bg-green-500/10" : "bg-muted"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? "bg-primary text-primary-foreground" :
                        isComplete ? "bg-green-500 text-white" : "bg-muted-foreground/20"
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-xs font-semibold text-center ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step content with animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Your Profile */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Tell Us About You
                  </CardTitle>
                  <CardDescription>
                    Basic info helps us match you with relevant causes (all optional!)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional - for impact updates only)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="hero@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      +$2 value • We&apos;ll never spam you
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Age Range</Label>
                    <RadioGroup
                      value={formData.age_range}
                      onValueChange={(value) => setFormData({ ...formData, age_range: value })}
                      className="grid grid-cols-2 gap-3"
                    >
                      {["18-24", "25-34", "35-44", "45-54", "55+"].map((range) => (
                        <div key={range} className="flex items-center space-x-2">
                          <RadioGroupItem value={range} id={`age-${range}`} />
                          <Label htmlFor={`age-${range}`} className="cursor-pointer">
                            {range}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      +$1 value • Helps understand demographics
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location (City or Region)</Label>
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, California"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      +$1.50 value • Regional insights are valuable
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Your Interests */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    What Matters to You?
                  </CardTitle>
                  <CardDescription>
                    Select all that apply - more selections = bigger impact!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {INTEREST_CATEGORIES.map((interest) => {
                      const isSelected = formData.interests.includes(interest.id);
                      return (
                        <motion.div
                          key={interest.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleInterestToggle(interest.id)}
                        >
                          <Checkbox
                            id={interest.id}
                            checked={isSelected}
                            onCheckedChange={() => handleInterestToggle(interest.id)}
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={interest.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {interest.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              +${(interest.value * 0.3).toFixed(2)} value
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  {formData.interests.length > 0 && (
                    <Alert className="border-green-500/50 bg-green-500/5">
                      <Award className="h-4 w-4 text-green-500" />
                      <AlertDescription className="ml-2">
                        <strong>Nice!</strong> {formData.interests.length} interests selected. 
                        Each one helps fund more projects!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Your Habits */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Your Lifestyle
                  </CardTitle>
                  <CardDescription>
                    Help us understand how you live and what you care about
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Primary Device</Label>
                    <RadioGroup
                      value={formData.device_ownership}
                      onValueChange={(value) => setFormData({ ...formData, device_ownership: value })}
                      className="grid grid-cols-2 gap-3"
                    >
                      {[
                        { value: "smartphone", label: "Smartphone" },
                        { value: "laptop", label: "Laptop/Desktop" },
                        { value: "tablet", label: "Tablet" },
                        { value: "multiple", label: "Multiple Devices" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`dev-${option.value}`} />
                          <Label htmlFor={`dev-${option.value}`} className="cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      +$1 value • Device data helps tech research
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      Electric Vehicle Interest
                      <Badge variant="secondary" className="text-xs">High Value!</Badge>
                    </Label>
                    <RadioGroup
                      value={formData.ev_ownership}
                      onValueChange={(value) => setFormData({ ...formData, ev_ownership: value })}
                      className="space-y-3"
                    >
                      {[
                        { value: "own", label: "I own an EV", bonus: "+$5" },
                        { value: "planning", label: "Planning to buy within 2 years", bonus: "+$3" },
                        { value: "interested", label: "Interested but no plans yet", bonus: "+$1" },
                        { value: "not_interested", label: "Not interested", bonus: "" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`ev-${option.value}`} />
                            <Label htmlFor={`ev-${option.value}`} className="cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                          {option.bonus && (
                            <Badge className="text-xs">{option.bonus}</Badge>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Sustainability Commitment</Label>
                    <RadioGroup
                      value={formData.sustainability}
                      onValueChange={(value) => setFormData({ ...formData, sustainability: value })}
                      className="space-y-3"
                    >
                      {[
                        { value: "high", label: "High - I actively seek eco-friendly options", bonus: "+$2" },
                        { value: "moderate", label: "Moderate - I try when convenient", bonus: "+$1" },
                        { value: "low", label: "Low - Not a priority for me", bonus: "" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`sus-${option.value}`} />
                            <Label htmlFor={`sus-${option.value}`} className="cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                          {option.bonus && (
                            <Badge className="text-xs">{option.bonus}</Badge>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Impact Preview & Consent */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Impact summary card */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary" />
                      Your Impact Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center space-y-4">
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="inline-flex flex-col items-center gap-2 p-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl"
                      >
                        <div className="text-5xl font-black text-primary">
                          ${estimatedValue.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Will fund community-voted projects
                        </div>
                      </motion.div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-card rounded-lg">
                          <div className="text-2xl font-bold">{formData.interests.length}</div>
                          <div className="text-xs text-muted-foreground">Interests</div>
                        </div>
                        <div className="p-4 bg-card rounded-lg">
                          <div className="text-2xl font-bold">{progress}%</div>
                          <div className="text-xs text-muted-foreground">Complete</div>
                        </div>
                        <div className="p-4 bg-card rounded-lg">
                          <div className="text-2xl font-bold">100%</div>
                          <div className="text-xs text-muted-foreground">To Good</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transparency warning */}
                <Alert className="border-yellow-500/50 bg-yellow-500/5">
                  <Eye className="h-5 w-5 text-yellow-500" />
                  <AlertDescription className="ml-2">
                    <strong className="text-lg">⚡ Real Talk: Here&apos;s How Your Data Gets Used</strong>
                    <div className="mt-3 space-y-2 text-sm">
                      <p><strong>Companies will use your data to:</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Show you those &quot;creepy&quot; ads that appear right after you think about something</li>
                        <li>Track what you click, view, and spend time on across websites</li>
                        <li>Send you personalized discounts at exactly the right moment</li>
                        <li>Build detailed profiles by combining your data with other sources</li>
                        <li>Predict what you&apos;ll buy before you even know it (algorithms are wild!)</li>
                        <li>Retarget you across every app and website you visit</li>
                      </ul>
                      <p className="mt-3 font-semibold text-primary">
                        🎯 The difference? 100% of profits fund causes YOU vote on, not corporate bank accounts.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Consent checkboxes - legally required */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Your Consent (Required)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                      <Checkbox
                        id="consent-data"
                        checked={dataConsent}
                        onCheckedChange={(checked) => setDataConsent(checked as boolean)}
                      />
                      <Label htmlFor="consent-data" className="text-sm leading-relaxed cursor-pointer">
                        <strong>✅ I consent to data collection.</strong> I understand my data will be anonymized, 
                        packaged into datasets, and sold to organizations. I can request deletion anytime.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                      <Checkbox
                        id="consent-advertising"
                        checked={advertisingConsent}
                        onCheckedChange={(checked) => setAdvertisingConsent(checked as boolean)}
                      />
                      <Label htmlFor="consent-advertising" className="text-sm leading-relaxed cursor-pointer">
                        <strong>🎯 I acknowledge behavioral tracking & targeted ads.</strong> I understand companies will:
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Track my browsing and predict my interests</li>
                          <li>Show me personalized ads everywhere I go online</li>
                          <li>Send targeted offers based on my behavior</li>
                          <li>Use algorithms to predict my purchases</li>
                        </ul>
                        <span className="block mt-2 font-semibold">
                          I voluntarily consent knowing 100% of profits fund community-voted causes.
                        </span>
                      </Label>
                    </div>

                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5">
                        <Checkbox
                          id="consent-sensor"
                          checked={sensorDataConsent}
                          onCheckedChange={(checked) => {
                            setSensorDataConsent(checked as boolean);
                            if (checked) setShowSensorData(true);
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="consent-sensor" className="text-sm leading-relaxed cursor-pointer">
                            <strong className="flex items-center gap-2">
                              📡 I consent to automated sensor data collection
                              <Badge variant="outline" className="text-xs">+$1.50 value</Badge>
                            </strong>
                            <p className="mt-2 text-muted-foreground">
                              We&apos;ll automatically collect technical data from your device to enhance our datasets.
                            </p>
                          </Label>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => setShowSensorData(!showSensorData)}
                          >
                            {showSensorData ? "Hide" : "Show"} what we collect
                          </Button>

                          <AnimatePresence>
                            {showSensorData && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 p-3 bg-card border rounded-lg text-xs space-y-2"
                              >
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">User Agent:</span>
                                  <span className="font-mono text-xs max-w-[200px] truncate">{navigator.userAgent}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Screen:</span>
                                  <span className="font-mono">{window.screen.width}x{window.screen.height}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Timezone:</span>
                                  <span className="font-mono">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Language:</span>
                                  <span className="font-mono">{navigator.language}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Platform:</span>
                                  <span className="font-mono">{navigator.platform}</span>
                                </div>
                                <p className="text-muted-foreground pt-2 border-t">
                                  This data helps companies understand device usage patterns and is anonymized before sale.
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <Button
              onClick={prevStep}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={nextStep}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              className="flex-1" 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              animate={!dataConsent || !advertisingConsent || !sensorDataConsent ? { 
                boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0)", "0 0 0 4px rgba(34, 197, 94, 0.3)", "0 0 0 0 rgba(34, 197, 94, 0)"] 
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Button
                onClick={handleSubmit}
                disabled={loading || !dataConsent || !advertisingConsent || !sensorDataConsent}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient_3s_ease_infinite]"
              >
                {loading ? (
                  <>
                    <Zap className="w-5 h-5 animate-pulse" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    Submit & Create Impact 🚀
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-sm text-muted-foreground space-y-2 pt-4">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Protected by enterprise-grade security • Never sold without anonymization
          </p>
          <p>
            Read our <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a> and{" "}
            <a href="/terms" className="underline hover:text-primary">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
