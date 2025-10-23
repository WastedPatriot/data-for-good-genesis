import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, CheckCircle } from "lucide-react";
import { z } from "zod";

const organizationSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name required").max(200),
  organizationType: z.enum(["research", "non-profit", "government", "corporate", "educational"]),
  country: z.string().min(2, "Country required").max(100),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z.string().min(20, "Minimum 20 characters").max(1000),
  contactEmail: z.string().email("Invalid email").max(255),
  contactPhone: z.string().max(50).optional(),
  taxId: z.string().max(50).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms"),
  privacyAccepted: z.boolean().refine((val) => val === true, "You must accept the privacy policy"),
});

const OrganizationSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const result = organizationSchema.safeParse({
        email,
        password,
        organizationName,
        organizationType,
        country,
        website,
        description,
        contactEmail,
        contactPhone,
        taxId,
        termsAccepted,
        privacyAccepted,
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

      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/marketplace`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // Create organization profile
      const { error: profileError } = await supabase
        .from("organization_profiles")
        .insert({
          user_id: authData.user.id,
          organization_name: organizationName,
          organization_type: organizationType,
          country,
          website: website || null,
          description,
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          tax_id: taxId || null,
          compliance_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      toast({
        title: "Account Created Successfully",
        description: "Your organization profile is pending verification. You can now browse datasets.",
      });

      navigate("/marketplace");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create organization account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate step 1
      if (!email || !password || password.length < 8) {
        toast({
          title: "Validation Error",
          description: "Please provide valid email and password (min 8 characters)",
          variant: "destructive",
        });
        return;
      }
    } else if (step === 2) {
      // Validate step 2
      if (!organizationName || !organizationType || !country) {
        toast({
          title: "Validation Error",
          description: "Please complete all required organization details",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-black mb-2 text-gradient">Organization Registration</h1>
          <p className="text-muted-foreground">Join the ethical data marketplace</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  s === step
                    ? "bg-primary text-primary-foreground scale-110"
                    : s < step
                    ? "bg-primary/30 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 ${s < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Account Credentials"}
              {step === 2 && "Organization Details"}
              {step === 3 && "Compliance & Verification"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Create your account credentials"}
              {step === 2 && "Tell us about your organization"}
              {step === 3 && "Accept terms and complete registration"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Credentials */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@company.com"
                      maxLength={255}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be at least 8 characters long
                    </p>
                  </div>
                  <Button type="button" onClick={nextStep} className="w-full">
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Organization Details */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Acme Corporation"
                      maxLength={200}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgType">Organization Type *</Label>
                    <Select value={organizationType} onValueChange={setOrganizationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="research">Research Institution</SelectItem>
                        <SelectItem value="non-profit">Non-Profit Organization</SelectItem>
                        <SelectItem value="government">Government Agency</SelectItem>
                        <SelectItem value="corporate">Corporate/Enterprise</SelectItem>
                        <SelectItem value="educational">Educational Institution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Organization Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your organization and intended use of data (min 20 characters)"
                      maxLength={1000}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Compliance */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="contactEmail">Primary Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@company.com"
                      maxLength={255}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID / VAT Number (Optional)</Label>
                    <Input
                      id="taxId"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="For invoicing purposes"
                      maxLength={50}
                    />
                  </div>

                  <div className="border-t-2 border-border pt-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm cursor-pointer">
                        I accept the{" "}
                        <a href="/terms" target="_blank" className="text-primary hover:underline">
                          Terms of Service
                        </a>{" "}
                        and understand the data usage policies *
                      </Label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="privacy"
                        checked={privacyAccepted}
                        onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                      />
                      <Label htmlFor="privacy" className="text-sm cursor-pointer">
                        I accept the{" "}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline">
                          Privacy Policy
                        </a>{" "}
                        and data protection regulations (GDPR, CCPA) *
                      </Label>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-bold">Verification Process:</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Your organization will be reviewed within 2-3 business days</li>
                      <li>You'll receive an email once verified</li>
                      <li>Verified organizations get access to premium datasets</li>
                      <li>You can browse and purchase data while pending verification</li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? "Creating Account..." : "Complete Registration"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/login")}>
            Sign in here
          </Button>
        </p>
      </div>
    </div>
  );
};

export default OrganizationSignup;
