import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Monitor, Smartphone, TrendingUp, Users, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

interface VisitorStats {
  totalVisitors: number;
  uniqueToday: number;
  activeSessions: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  browserBreakdown: Array<{ browser: string; count: number }>;
  trafficSources: Array<{ source: string; count: number }>;
}

export default function VisitorInsights() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    uniqueToday: 0,
    activeSessions: 0,
    avgSessionDuration: 0,
    topPages: [],
    topCountries: [],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    browserBreakdown: [],
    trafficSources: []
  });
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAndLoadData();
    setupRealtimeSubscriptions();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadVisitorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('visitor-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_analytics'
        },
        (payload) => {
          console.log('New visitor detected:', payload);
          loadVisitorData();
          toast.info("New visitor on the platform");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkAdminAndLoadData = async () => {
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

      await loadVisitorData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadVisitorData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total unique visitors (all time)
      const { data: allVisitors } = await supabase
        .from("visitor_analytics")
        .select("session_id");
      
      const uniqueSessions = new Set(allVisitors?.map(v => v.session_id)).size;

      // Unique visitors today
      const { data: todayVisitors } = await supabase
        .from("visitor_analytics")
        .select("session_id")
        .gte("created_at", today.toISOString());
      
      const uniqueToday = new Set(todayVisitors?.map(v => v.session_id)).size;

      // Active sessions (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const { data: activeSessions } = await supabase
        .from("visitor_analytics")
        .select("session_id")
        .gte("visited_at", thirtyMinutesAgo.toISOString());
      
      const activeSessionCount = new Set(activeSessions?.map(v => v.session_id)).size;

      // Top pages
      const { data: pageData } = await supabase
        .from("visitor_analytics")
        .select("page_path")
        .gte("created_at", today.toISOString());
      
      const pageCounts: { [key: string]: number } = {};
      pageData?.forEach(v => {
        pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([page, count]) => ({ page, count }));

      // Top countries
      const { data: countryData } = await supabase
        .from("visitor_analytics")
        .select("country")
        .gte("created_at", today.toISOString());
      
      const countryCounts: { [key: string]: number } = {};
      countryData?.forEach(v => {
        if (v.country) {
          countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
        }
      });
      const topCountries = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));

      // Device breakdown
      const { data: deviceData } = await supabase
        .from("visitor_analytics")
        .select("device_type")
        .gte("created_at", today.toISOString());
      
      const deviceBreakdown = {
        desktop: deviceData?.filter(v => v.device_type === 'desktop').length || 0,
        mobile: deviceData?.filter(v => v.device_type === 'mobile').length || 0,
        tablet: deviceData?.filter(v => v.device_type === 'tablet').length || 0
      };

      // Browser breakdown
      const { data: browserData } = await supabase
        .from("visitor_analytics")
        .select("browser")
        .gte("created_at", today.toISOString());
      
      const browserCounts: { [key: string]: number } = {};
      browserData?.forEach(v => {
        if (v.browser) {
          browserCounts[v.browser] = (browserCounts[v.browser] || 0) + 1;
        }
      });
      const browserBreakdown = Object.entries(browserCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([browser, count]) => ({ browser, count }));

      // Traffic sources
      const { data: referrerData } = await supabase
        .from("visitor_analytics")
        .select("referrer")
        .gte("created_at", today.toISOString());
      
      const sourceCounts: { [key: string]: number } = {};
      referrerData?.forEach(v => {
        const source = v.referrer ? new URL(v.referrer).hostname : 'Direct';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      const trafficSources = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([source, count]) => ({ source, count }));

      // Recent visitors
      const { data: recent } = await supabase
        .from("visitor_analytics")
        .select("*")
        .order("visited_at", { ascending: false })
        .limit(10);

      setStats({
        totalVisitors: uniqueSessions,
        uniqueToday,
        activeSessions: activeSessionCount,
        avgSessionDuration: 0, // TODO: Calculate from session data
        topPages,
        topCountries,
        deviceBreakdown,
        browserBreakdown,
        trafficSources
      });

      setRecentVisitors(recent || []);
    } catch (error) {
      console.error("Error loading visitor data:", error);
      toast.error("Failed to load visitor insights");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p>Loading visitor insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Visitor Insights</h1>
              <p className="text-muted-foreground">AI-powered visitor analytics & behavior tracking</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalVisitors}</div>
              <p className="text-xs text-muted-foreground mt-1">All time unique sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.uniqueToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique visitors today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Devices</CardTitle>
              <Monitor className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.deviceBreakdown.desktop + stats.deviceBreakdown.mobile + stats.deviceBreakdown.tablet}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.deviceBreakdown.desktop}D / {stats.deviceBreakdown.mobile}M / {stats.deviceBreakdown.tablet}T
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages & Countries */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages Today</CardTitle>
              <CardDescription>Most visited pages in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{page.page}</span>
                    <Badge variant="outline">{page.count} views</Badge>
                  </div>
                ))}
                {stats.topPages.length === 0 && (
                  <p className="text-sm text-muted-foreground">No page data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Geographic distribution of visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topCountries.map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{country.country}</span>
                    </div>
                    <Badge variant="outline">{country.count} visits</Badge>
                  </div>
                ))}
                {stats.topCountries.length === 0 && (
                  <p className="text-sm text-muted-foreground">No country data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Browser & Traffic Sources */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Browsers</CardTitle>
              <CardDescription>Browser distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.browserBreakdown.map((browser, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{browser.browser}</span>
                    <Badge variant="outline">{browser.count} users</Badge>
                  </div>
                ))}
                {stats.browserBreakdown.length === 0 && (
                  <p className="text-sm text-muted-foreground">No browser data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{source.source}</span>
                    <Badge variant="outline">{source.count} visits</Badge>
                  </div>
                ))}
                {stats.trafficSources.length === 0 && (
                  <p className="text-sm text-muted-foreground">No referrer data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Visitors */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Visitors</CardTitle>
            <CardDescription>Latest visitor activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentVisitors.map((visitor, index) => (
                <div
                  key={visitor.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {visitor.device_type === 'mobile' ? (
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{visitor.page_path}</p>
                      <p className="text-xs text-muted-foreground">
                        {visitor.country || 'Unknown'} • {visitor.browser || 'Unknown'} • {visitor.os || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {visitor.visited_at ? new Date(visitor.visited_at).toLocaleTimeString() : "Now"}
                    </span>
                  </div>
                </div>
              ))}
              {recentVisitors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent visitors</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
