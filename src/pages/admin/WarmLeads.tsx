import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, RefreshCw, Mail, FileText } from "lucide-react";
import { toast } from "sonner";

interface WarmLead {
  session_id: string;
  score: number;
  page_views: number;
  unique_pages: number;
  session_duration_minutes: number;
  high_intent_pages: string[];
  first_visit: string;
  last_visit: string;
  country: string;
  device_type: string;
  referrer: string;
}

export default function WarmLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<WarmLead[]>([]);
  const [stats, setStats] = useState({ total: 0, averageScore: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

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

      await loadWarmLeadsData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadWarmLeadsData = async () => {
    try {
      // Get latest warm leads from audit logs
      const { data: auditLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "warm_leads_identified")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (auditLogs && auditLogs.details) {
        const leadsData = auditLogs.details as any;
        setLeads(leadsData.top_leads || []);
        setStats({
          total: leadsData.total_leads || 0,
          averageScore: leadsData.average_score || 0,
          conversionRate: 0, // TODO: Calculate actual conversion rate
        });
      }
    } catch (error) {
      console.error("Error loading warm leads:", error);
    }
  };

  const handleProcessLeads = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('identify-warm-leads');
      
      if (error) throw error;

      toast.success(`Identified ${data.warm_leads_count} warm leads`);
      await loadWarmLeadsData();
    } catch (error) {
      console.error("Error processing leads:", error);
      toast.error("Failed to process warm leads");
    } finally {
      setProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p>Loading warm leads...</p>
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
              <h1 className="text-3xl font-bold">Warm Leads</h1>
              <p className="text-muted-foreground">High-intent visitors ready for conversion</p>
            </div>
          </div>
          <Button onClick={handleProcessLeads} disabled={processing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
            {processing ? 'Processing...' : 'Refresh Leads'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Warm Leads</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageScore}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Target: 5%</p>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Top Warm Leads</CardTitle>
            <CardDescription>
              Visitors showing high purchase intent based on behavior analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No warm leads identified yet</p>
                <p className="text-sm">Click "Refresh Leads" to analyze recent visitor data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead, index) => (
                  <Card key={lead.session_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={getScoreBadgeVariant(lead.score)}>
                            Score: {lead.score}
                          </Badge>
                          <Badge variant="outline">
                            {lead.page_views} page views
                          </Badge>
                          <Badge variant="outline">
                            {lead.session_duration_minutes}min session
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Country:</span>
                            <p className="font-medium">{lead.country || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Device:</span>
                            <p className="font-medium capitalize">{lead.device_type || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">First Visit:</span>
                            <p className="font-medium">
                              {new Date(lead.first_visit).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Visit:</span>
                            <p className="font-medium">
                              {new Date(lead.last_visit).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {lead.high_intent_pages.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">High Intent Pages:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lead.high_intent_pages.map((page, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {page}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {lead.referrer && lead.referrer !== 'Direct' && (
                          <p className="text-sm text-muted-foreground">
                            Referrer: {lead.referrer}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Mail className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Scoring Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Scoring Methodology</CardTitle>
            <CardDescription>How we calculate visitor scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">High-Intent Pages</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Marketplace: +20 points</li>
                    <li>• Contribute: +25 points</li>
                    <li>• Dataset views: +25 points</li>
                    <li>• Donate: +30 points</li>
                    <li>• Organization signup: +35 points</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Engagement Metrics</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Page views: +2 per view (max 30)</li>
                    <li>• Time on site: +0.5 per minute (max 25)</li>
                    <li>• Return visits: +10 per visit (max 30)</li>
                    <li>• Desktop device: +10 points</li>
                  </ul>
                </div>
              </div>
              <div className="pt-3 border-t">
                <h3 className="font-semibold mb-2">Thresholds</h3>
                <div className="flex gap-4">
                  <Badge variant="default">80+: Hot Lead</Badge>
                  <Badge variant="secondary">60-79: Warm Lead</Badge>
                  <Badge variant="outline">50-59: Interested</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
