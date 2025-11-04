import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Users, Database, FileText, Mail, TrendingUp, Activity, Brain } from "lucide-react";
import { AIMarketingAssistant } from "@/components/admin/AIMarketingAssistant";
import { DataHarvestDashboard } from "@/components/admin/DataHarvestDashboard";

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    submissions: 0,
    processing: 0,
    organizations: 0,
    contacts: 0,
    datasets: 0,
    revenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadDashboardData();
    } catch (error) {
      console.error("Admin check error:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load statistics
      const [submissions, processing, organizations, contacts, datasets, purchases] = await Promise.all([
        supabase.from("data_submissions").select("id", { count: "exact", head: true }),
        supabase.from("data_processing_queue").select("id", { count: "exact", head: true }).eq("processing_status", "processing"),
        supabase.from("organization_profiles").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
        supabase.from("datasets").select("id", { count: "exact", head: true }),
        supabase.from("purchases").select("amount_paid").eq("status", "completed")
      ]);

      const revenue = purchases.data?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;

      setStats({
        submissions: submissions.count || 0,
        processing: processing.count || 0,
        organizations: organizations.count || 0,
        contacts: contacts.count || 0,
        datasets: datasets.count || 0,
        revenue
      });

      // Load recent audit logs
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentActivity(logs || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // Harvester download handling
  const [harvesterUrl, setHarvesterUrl] = useState<string | null>(null);
  const [harvesterName, setHarvesterName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadHarvesterUrl = async () => {
    try {
      const listRes = await supabase.storage.from('harvester').list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

      if (listRes.data && listRes.data.length > 0) {
        const exe = listRes.data.find((f) => f.name.toLowerCase().endsWith('.exe')) || listRes.data[0];
        const { data } = supabase.storage.from('harvester').getPublicUrl(exe.name);
        setHarvesterUrl(data.publicUrl);
        setHarvesterName(exe.name);
      } else {
        setHarvesterUrl(null);
        setHarvesterName(null);
      }
    } catch (error) {
      console.error('Error loading harvester URL:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const filename = `DataForEarth-Harvester-Setup-${Date.now()}.exe`;
      const { error } = await supabase.storage.from('harvester').upload(filename, file, {
        upsert: false,
        contentType: 'application/octet-stream',
      });
      if (error) throw error;
      toast({ title: 'Upload complete', description: 'Harvester build uploaded.' });
      await loadHarvesterUrl();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadHarvesterUrl();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform management & analytics</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Data Submissions</CardTitle>
              <Database className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.submissions}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.processing} processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.organizations}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered companies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.revenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total dataset sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contact Forms</CardTitle>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.contacts}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Datasets</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.datasets}</div>
              <p className="text-xs text-muted-foreground mt-1">Active listings</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Harvester Machine Download Section */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-primary animate-pulse" />
              <div>
                <CardTitle className="text-2xl">Data Harvester Machine</CardTitle>
                <CardDescription className="text-base mt-1">
                  Autonomous 24/7 data scraping, AI curation & dataset publishing for Windows
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  What It Does
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Scrapes environmental, climate, ESG & sensor data from 15+ sources</li>
                  <li>✅ AI-powered data curation and quality scoring</li>
                  <li>✅ Automatic dataset building and marketplace publishing</li>
                  <li>✅ Badge code generation and Stripe integration</li>
                  <li>✅ 24/7 autonomous operation with health monitoring</li>
                  <li>✅ Real-time revenue tracking and analytics</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Requirements
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Windows 10/11 or Windows Server 2019+</li>
                  <li>• 4GB RAM minimum (8GB recommended)</li>
                  <li>• Stable internet connection</li>
                  <li>• Runs on your server - full control</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Latest build: {harvesterName ? <span className="font-medium">{harvesterName}</span> : "No build uploaded yet"}
              </div>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="px-10 py-6 text-lg"
                  onClick={() => {
                    if (harvesterUrl) {
                      window.open(harvesterUrl, '_blank');
                    } else {
                      toast({ title: "No build available", description: "Upload a harvester build first.", variant: "destructive" });
                    }
                  }}
                >
                  <Database className="w-6 h-6 mr-3" />
                  Download Harvester EXE
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".exe"
                  className="hidden"
                  onChange={handleUpload}
                />
                
                <Button
                  variant="outline"
                  size="lg"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading..." : "Upload New Build (admin)"}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded text-center">
              <strong>💡 After Download:</strong> Run the installer, configure your Supabase URL in settings, and start the automation. 
              The machine will operate 24/7, automatically scraping data, curating it with AI, and publishing datasets to your marketplace.
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Tabs defaultValue="pipeline" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pipeline">
              <Brain className="h-4 w-4 mr-2" />
              Unified Pipeline
            </TabsTrigger>
            <TabsTrigger value="harvest">Data Harvest</TabsTrigger>
            <TabsTrigger value="marketing">AI Marketing</TabsTrigger>
            <TabsTrigger value="curation">Manual Curation</TabsTrigger>
            <TabsTrigger value="builder">Dataset Builder</TabsTrigger>
          </TabsList>

          {/* Unified Pipeline Tab - NEW! */}
          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Unified Data Pipeline
                </CardTitle>
                <CardDescription>
                  Complete workflow from data ingestion to dataset publication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/unified-pipeline")} size="lg" className="w-full">
                  Open Unified Pipeline Manager
                </Button>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Single interface for review, AI curation, dataset building, and publishing
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="harvest" className="mt-6">
            <DataHarvestDashboard />
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <AIMarketingAssistant />
          </TabsContent>

          <TabsContent value="curation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Data Curation</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/data-curation")}>Open Curation</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/dataset-builder")}>Open Builder</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Management Links */}
        <div className="grid gap-4 md:grid-cols-4 mt-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Automation Control</CardTitle>
              <CardDescription>24/7 data harvester</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/automation')}>
                Open Control
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Release Policy</CardTitle>
              <CardDescription>Publishing rules</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/release-policy')}>
                Edit Policy
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Website Themes</CardTitle>
              <CardDescription>Holiday scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/themes')}>
                Manage Themes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Accounts & roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/users')}>
                View Users
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Management Sections */}
        <div className="space-y-6">
          {/* Analytics & Insights */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Analytics & Insights
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/analytics")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Live Analytics</CardTitle>
                  <CardDescription>Real-time metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">View Analytics</Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/visitor-insights")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Visitor Insights</CardTitle>
                  <CardDescription>AI-powered analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">View Insights</Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/warm-leads")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Warm Leads</CardTitle>
                  <CardDescription>High-intent visitors</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">View Leads</Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/logs")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">System Logs</CardTitle>
                  <CardDescription>Audit trail</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">View Logs</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Communications & Outreach */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              Communications & Outreach
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/communications")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Communications Center</CardTitle>
                  <CardDescription>Inbox/Outbox + AI scoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">Open Center</Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/email-inbox")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Email Inbox</CardTitle>
                  <CardDescription>All emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">View Inbox</Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/campaigns")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">AI Campaigns</CardTitle>
                  <CardDescription>Automated outreach</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">Open Campaigns</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
