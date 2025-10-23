import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle, Clock, Mail, Phone, Globe, FileText, LogOut } from "lucide-react";

interface OrganizationProfile {
  id: string;
  organization_name: string;
  organization_type: string;
  country: string;
  website: string | null;
  description: string;
  contact_email: string;
  contact_phone: string | null;
  tax_id: string | null;
  verified: boolean;
  created_at: string;
}

const OrganizationProfile = () => {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("organization_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "No Organization Profile",
          description: "Please complete organization registration first.",
          variant: "destructive",
        });
        navigate("/organization-signup");
        return;
      }

      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load organization profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      research: "Research Institution",
      "non-profit": "Non-Profit",
      government: "Government",
      corporate: "Corporate",
      educational: "Educational",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black mb-2 text-gradient">Organization Profile</h1>
              <p className="text-muted-foreground">Manage your organization details and verification status</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Verification Status Banner */}
          <Card className={`mb-8 ${profile.verified ? "border-primary" : "border-yellow-500"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {profile.verified ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-primary" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary">Verified Organization</h3>
                      <p className="text-muted-foreground">
                        Your organization has been verified. You have full marketplace access.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-12 h-12 text-yellow-500" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-yellow-600">Verification Pending</h3>
                      <p className="text-muted-foreground">
                        Your organization is under review. You can browse and purchase datasets while we verify your information.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <p className="font-bold text-lg">{profile.organization_name}</p>
              </div>
              <div>
                <Label>Type</Label>
                <Badge variant="secondary">{getTypeLabel(profile.organization_type)}</Badge>
              </div>
              <div>
                <Label>Country</Label>
                <p>{profile.country}</p>
              </div>
              {profile.website && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </Label>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              <div>
                <Label>Description</Label>
                <p className="text-muted-foreground text-sm">{profile.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Account Email</Label>
                <p>{user?.email}</p>
              </div>
              <div>
                <Label>Contact Email</Label>
                <p>{profile.contact_email}</p>
              </div>
              {profile.contact_phone && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </Label>
                  <p>{profile.contact_phone}</p>
                </div>
              )}
              {profile.tax_id && (
                <div>
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tax ID
                  </Label>
                  <p className="font-mono">{profile.tax_id}</p>
                </div>
              )}
              <div>
                <Label>Member Since</Label>
                <p>{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access marketplace features and manage your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button onClick={() => navigate("/marketplace")} className="w-full">
                  Browse Datasets
                </Button>
                <Button onClick={() => navigate("/contact")} variant="outline" className="w-full">
                  Contact Support
                </Button>
                <Button onClick={() => navigate("/help")} variant="outline" className="w-full">
                  View Help Center
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground mb-1 ${className || ""}`}>{children}</p>
);

export default OrganizationProfile;
