import { useEffect, useState } from "react";
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
import { Shield, Users, Database, FileText, Mail, TrendingUp, Activity } from "lucide-react";

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

        {/* Main Content Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="submissions">Data Submissions</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="contacts">Contact Forms</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and audit logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.resource_type}</TableCell>
                        <TableCell>
                          <Badge variant={
                            log.severity === "error" ? "destructive" :
                            log.severity === "warning" ? "secondary" : "default"
                          }>
                            {log.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Data Submissions Management</CardTitle>
                <CardDescription>Review and manage user data contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/submissions")}>
                  View All Submissions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <CardTitle>Organization Management</CardTitle>
                <CardDescription>Verify and manage organization accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/organizations")}>
                  View All Organizations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contact Form Submissions</CardTitle>
                <CardDescription>Respond to user inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/contacts")}>
                  View All Contacts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
