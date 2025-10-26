import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Play, Settings, Activity, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AutomationControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    curated: 0,
    datasets: 0,
  });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [pendingRes, curatedRes, datasetsRes] = await Promise.all([
        supabase.from("review_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("curated_pool").select("id", { count: "exact", head: true }).eq("usage_count", 0),
        supabase.from("datasets").select("id", { count: "exact", head: true }).eq("active", true),
      ]);

      setStats({
        pending: pendingRes.count || 0,
        curated: curatedRes.count || 0,
        datasets: datasetsRes.count || 0,
      });
    } catch (err) {
      console.error("Failed to load automation stats:", err);
    }
  };

  const triggerAutomation = async () => {
    setIsRunning(true);
    try {
      // Call the edge function that triggers both AI curation and dataset building
      const { data, error } = await supabase.functions.invoke("run-automation");
      
      if (error) throw error;
      
      toast.success("Automation cycle started! AI is processing...");
      console.log("Automation result:", data);
      
      // Reload stats after a delay
      setTimeout(loadStats, 5000);
    } catch (err: any) {
      console.error("Automation trigger failed:", err);
      toast.error(`Failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Automation Control
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered dataset curation and building
          </p>
        </div>
        <Button 
          onClick={triggerAutomation} 
          disabled={isRunning}
          size="lg"
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Running..." : "Run Automation Now"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Activity className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Items waiting for AI curation
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Curated Pool</p>
              <p className="text-3xl font-bold mt-1">{stats.curated}</p>
            </div>
            <Settings className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ready for dataset building
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Live Datasets</p>
              <p className="text-3xl font-bold mt-1">{stats.datasets}</p>
            </div>
            <Database className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Published on marketplace
          </p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
          <h2 className="text-xl font-semibold">Automation Pipeline</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
            <div>
              <p className="font-semibold">AI Curation</p>
              <p className="text-sm text-muted-foreground">
                Automatically triggered when new items enter review queue. AI analyzes, categorizes, and assigns quality tiers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
            <div>
              <p className="font-semibold">Dataset Building</p>
              <p className="text-sm text-muted-foreground">
                Triggered when curated pool reaches 10+ items. AI generates metadata, pricing, and publishes to marketplace.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
            <div>
              <p className="font-semibold">Auto-Publishing</p>
              <p className="text-sm text-muted-foreground">
                Datasets are automatically created in Stripe and published live. No manual intervention required.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
