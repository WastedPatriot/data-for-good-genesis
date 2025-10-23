import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Users, Database, DollarSign, Activity } from "lucide-react";
import { toast } from "sonner";

export default function LiveAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    activeSessions: 0,
    recentPurchases: 0,
    pendingReviews: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoadAnalytics();
    setupRealtimeSubscriptions();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Listen to purchases
    const purchasesChannel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases'
        },
        () => {
          console.log('New purchase detected');
          loadAnalytics();
          toast.success("New purchase received!");
        }
      )
      .subscribe();

    // Listen to review queue
    const reviewChannel = supabase
      .channel('review-queue-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'review_queue'
        },
        () => {
          console.log('New review item');
          loadAnalytics();
          toast.info("New item in review queue");
        }
      )
      .subscribe();

    // Listen to audit logs
    const logsChannel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          setRecentActivity(prev => [payload.new, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(reviewChannel);
      supabase.removeChannel(logsChannel);
    };
  };

  const checkAdminAndLoadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/");
        return;
      }

      await loadAnalytics();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    }
  };

  const loadAnalytics = async () => {
    try {
      // Total revenue
      const { data: allPurchases } = await supabase
        .from("purchases")
        .select("amount_paid")
        .eq("status", "completed");

      const totalRevenue = allPurchases?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;

      // Today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayPurchases } = await supabase
        .from("purchases")
        .select("amount_paid")
        .eq("status", "completed")
        .gte("created_at", today.toISOString());

      const todayRevenue = todayPurchases?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;

      // Recent purchases (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { data: recentPurchases } = await supabase
        .from("purchases")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgo.toISOString());

      // Pending reviews
      const { data: pendingReviews } = await supabase
        .from("review_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Real visitor analytics - unique visitors today
      const { count: uniqueVisitorsCount } = await supabase
        .from("visitor_analytics")
        .select("session_id", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Active sessions (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const { count: activeSessionsCount } = await supabase
        .from("visitor_analytics")
        .select("session_id", { count: "exact", head: true })
        .gte("visited_at", thirtyMinutesAgo.toISOString());

      // Recent activity
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalRevenue,
        todayRevenue,
        activeSessions: activeSessionsCount || 0,
        recentPurchases: recentPurchases?.length || 0,
        pendingReviews: pendingReviews?.length || 0,
        activeUsers: uniqueVisitorsCount || 0
      });

      setRecentActivity(logs || []);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Live Analytics</h1>
              <p className="text-muted-foreground">Real-time platform metrics</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2">
            <Activity className="w-3 h-3 animate-pulse" />
            Live
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${stats.todayRevenue.toFixed(2)} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeSessions} active sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.recentPurchases}</div>
              <p className="text-xs text-muted-foreground mt-1">Purchases last hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Database className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Live Activity Feed</CardTitle>
            <CardDescription>Real-time system events as they happen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      log.severity === "error" ? "destructive" :
                      log.severity === "warning" ? "secondary" : "outline"
                    }>
                      {log.severity || "info"}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.resource_type} {log.resource_id ? `• ${log.resource_id.slice(0, 8)}...` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "Now"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
