import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Shield, CheckCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SubmitProject() {
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    organization_name: "",
    category: "reforestation",
    funding_goal: "",
    website_url: "",
    charity_registration_number: "",
    contact_email: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Simple honeypot captcha (in production, use Cloudflare Turnstile or reCAPTCHA)
  const handleCaptchaVerify = () => {
    setCaptchaVerified(true);
    toast({
      title: "Verification Complete",
      description: "You can now submit your project",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete the verification first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Insert project (will be in pending status by default)
      const { error: insertError } = await supabase
        .from("projects")
        .insert([{
          description: formData.description,
          organization_name: formData.organization_name,
          category: formData.category,
          funding_goal: parseFloat(formData.funding_goal),
          website_url: formData.website_url || null,
          charity_registration_number: formData.charity_registration_number || null,
          status: "pending",
          submitted_by: user?.id || null,
          icon: "Leaf",
          votes_count: 0,
          funded_amount: 0,
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Project Submitted Successfully!",
        description: "Your project will be reviewed by our admin team for verification.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        organization_name: "",
        category: "reforestation",
        funding_goal: "",
        website_url: "",
        charity_registration_number: "",
        contact_email: "",
      });
      setCaptchaVerified(false);

      // Navigate to projects page after 2 seconds
      setTimeout(() => navigate("/projects"), 2000);

    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full mb-4">
              <Leaf className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-5xl font-black mb-4 text-gradient">Submit Your Project</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have a verified environmental project that needs funding? Submit it for community voting!
            </p>
          </div>

          {/* Verification Notice */}
          <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle>AI-Assisted Verification Process</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Your project will be analyzed by our AI for fraud detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Admin team will manually verify all details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Once verified, your project goes live for community voting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Top voted projects receive funding from dataset sales revenue</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Submission Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Provide detailed information about your environmental project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Amazon Rainforest Restoration Initiative"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization Name *</Label>
                  <Input
                    id="organization"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    placeholder="Your organization's name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your project, its goals, and expected impact..."
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      required
                    >
                      <option value="reforestation">Reforestation</option>
                      <option value="ocean_cleanup">Ocean Cleanup</option>
                      <option value="renewable_energy">Renewable Energy</option>
                      <option value="wildlife_conservation">Wildlife Conservation</option>
                      <option value="sustainable_agriculture">Sustainable Agriculture</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funding_goal">Funding Goal ($) *</Label>
                    <Input
                      id="funding_goal"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.funding_goal}
                      onChange={(e) => setFormData({ ...formData, funding_goal: e.target.value })}
                      placeholder="50000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://yourproject.org"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charity_reg">Charity Registration Number (Optional)</Label>
                  <Input
                    id="charity_reg"
                    value={formData.charity_registration_number}
                    onChange={(e) => setFormData({ ...formData, charity_registration_number: e.target.value })}
                    placeholder="e.g., 123456-78"
                  />
                  <p className="text-xs text-muted-foreground">
                    Verified charities get a badge and higher trust rating
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@yourorg.org"
                    required
                  />
                </div>

                {/* Simple Verification (Honeypot + Button Click) */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Human Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!captchaVerified ? (
                      <Button
                        type="button"
                        onClick={handleCaptchaVerify}
                        variant="outline"
                        className="w-full"
                      >
                        Click to verify you're human
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  disabled={loading || !captchaVerified}
                  className="w-full border-glow hover-lift font-black"
                  size="lg"
                >
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Submit Project for Review
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={() => navigate("/projects")}>
              ← Back to Projects
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
