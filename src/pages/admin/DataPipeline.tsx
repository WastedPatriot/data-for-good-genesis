import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, RefreshCw, Database, CheckCircle, Clock } from "lucide-react";

export default function DataPipeline() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    pendingProcessing: 0,
    readyForReview: 0,
    curatedPool: 0,
    activeDatasets: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
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
      toast.error("Admin access required");
      navigate("/");
    }
  };

  const loadStats = async () => {
    try {
      // Get pending processing queue items
      const { count: processingCount } = await supabase
        .from("data_processing_queue")
        .select("*", { count: "exact", head: true })
        .eq("processing_status", "completed")
        .is("published_dataset_id", null);

      // Get items in review queue
      const { count: reviewCount } = await supabase
        .from("review_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get curated pool items
      const { count: curatedCount } = await supabase
        .from("curated_pool")
        .select("*", { count: "exact", head: true });

      // Get active datasets
      const { count: datasetCount } = await supabase
        .from("datasets")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      setStats({
        pendingProcessing: processingCount || 0,
        readyForReview: reviewCount || 0,
        curatedPool: curatedCount || 0,
        activeDatasets: datasetCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load pipeline stats");
    }
  };

  const runAutoCuration = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-curate-approved");

      if (error) throw error;

      if (data.success) {
        toast.success(`Auto-curation complete! Processed ${data.processed} items, curated ${data.curated} items`);
        await loadStats();
      } else {
        toast.error("Auto-curation failed");
      }
    } catch (error: any) {
      console.error("Auto-curation error:", error);
      toast.error(error.message || "Failed to run auto-curation");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Data Pipeline Automation</h1>
            <p className="text-muted-foreground">Monitor and control the data processing pipeline</p>
          </div>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProcessing}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for auto-curation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              In Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyForReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting manual review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-green-500" />
              Curated Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.curatedPool}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for datasets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              Active Datasets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDatasets}</div>
            <p className="text-xs text-muted-foreground mt-1">Published for sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Flow</CardTitle>
          <CardDescription>
            Understand how contributed data flows through the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Badge variant="outline" className="bg-blue-500/10">Step 1</Badge>
            <div className="flex-1">
              <h3 className="font-semibold">User Contribution</h3>
              <p className="text-sm text-muted-foreground">
                Users submit data via website form
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">→</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Badge variant="outline" className="bg-purple-500/10">Step 2</Badge>
            <div className="flex-1">
              <h3 className="font-semibold">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                AI categorizes, scores quality, and recommends pricing
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">→</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg bg-yellow-500/5">
            <Badge variant="outline" className="bg-yellow-500/10">Step 3</Badge>
            <div className="flex-1">
              <h3 className="font-semibold">Auto-Curation (You are here!)</h3>
              <p className="text-sm text-muted-foreground">
                High-quality items (score ≥0.7) automatically move to review queue and curated pool
              </p>
            </div>
            <Button onClick={runAutoCuration} disabled={isProcessing || stats.pendingProcessing === 0}>
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Badge variant="outline" className="bg-green-500/10">Step 4</Badge>
            <div className="flex-1">
              <h3 className="font-semibold">Dataset Building</h3>
              <p className="text-sm text-muted-foreground">
                Curated data is packaged into datasets for sale
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">→</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Badge variant="outline" className="bg-emerald-500/10">Step 5</Badge>
            <div className="flex-1">
              <h3 className="font-semibold">Marketplace</h3>
              <p className="text-sm text-muted-foreground">
                Datasets are published and available for purchase
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Automation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>
            Configure how the pipeline processes data automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Quality Thresholds</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Auto-approve threshold:</span>
                <Badge>≥ 0.85 quality score</Badge>
              </div>
              <div className="flex justify-between">
                <span>Auto-curate threshold:</span>
                <Badge>≥ 0.70 quality score</Badge>
              </div>
              <div className="flex justify-between">
                <span>Platinum tier:</span>
                <Badge variant="secondary">≥ 0.95 quality score</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Database className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Next Steps</h3>
              <p className="text-xs text-muted-foreground">
                Items in the curated pool can be packaged into datasets using the "Build from Curated" 
                function in the Datasets admin page. Or use the Machine Agent GUI for full automation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
