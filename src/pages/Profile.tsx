import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ContributorValueCard from "@/components/ContributorValueCard";
import { 
  User, 
  Mail, 
  Calendar, 
  Database, 
  Vote, 
  Building2,
  LogOut,
  Shield
} from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationProfile, setOrganizationProfile] = useState<any>(null);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [votesCount, setVotesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      setUser(user);

      // Check if admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!roleData);

      // Check for organization profile
      const { data: orgData } = await supabase
        .from("organization_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setOrganizationProfile(orgData);

      // Get data submission count
      const { count: submissionCount } = await supabase
        .from("data_submissions")
        .select("*", { count: "exact", head: true })
        .eq("email", user.email);
      
      setSubmissionsCount(submissionCount || 0);

      // Get vote count
      const { count: voteCount } = await supabase
        .from("project_votes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      setVotesCount(voteCount || 0);

    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2 text-gradient">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account and view your contributions
            </p>
          </div>

          {/* Account Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-full">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your DataForEarth account details</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                  {organizationProfile && (
                    <Badge variant="default" className="gap-1">
                      <Building2 className="w-3 h-3" />
                      Organization
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {organizationProfile && (
                <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {organizationProfile.organization_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {organizationProfile.organization_type}
                  </p>
                  {organizationProfile.verified && (
                    <Badge variant="default">Verified Organization</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate("/organization-profile")}
                  >
                    View Organization Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contributor Value Card - NEW! */}
          <div className="mb-6">
            <ContributorValueCard userEmail={user?.email || ""} />
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-lg">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{submissionsCount}</CardTitle>
                    <CardDescription>Data Contributions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Thank you for contributing your data to help environmental projects!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/contribute")}
                >
                  Contribute More Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-lg">
                    <Vote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{votesCount}</CardTitle>
                    <CardDescription>Project Votes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your votes help decide which projects receive funding!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/projects")}
                >
                  Vote on Projects
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your account and contributions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!organizationProfile && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/organization-signup")}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Register as Organization
                </Button>
              )}
              
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/projects")}
              >
                <Vote className="w-4 h-4 mr-2" />
                Browse Projects
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/marketplace")}
              >
                <Database className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
