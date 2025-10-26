import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, Brain, Sparkles, CheckCircle, 
  Database, TrendingUp, AlertCircle, Loader2 
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReviewQueueItem {
  id: string;
  source_type: string;
  category: string;
  tags: string[];
  confidence_score: number;
  quality_tier: string;
  status: string;
  created_at: string;
}

interface CuratedItem {
  id: string;
  category: string;
  quality_tier: string;
  confidence_score: number;
  enterprise_grade: boolean;
  domain: string;
  sector: string;
  usage_count: number;
  created_at: string;
}

export default function DataCuration() {
  const navigate = useNavigate();
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [curatedPool, setCuratedPool] = useState<CuratedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    curated: 0,
    totalConfidence: 0,
  });

  useEffect(() => {
    checkAuth();
    loadData();
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

  const loadData = async () => {
    try {
      const [queueData, poolData] = await Promise.all([
        supabase
          .from("review_queue")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("curated_pool")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (queueData.data) setReviewQueue(queueData.data);
      if (poolData.data) {
        setCuratedPool(poolData.data);
        const avgConfidence = poolData.data.length > 0
          ? poolData.data.reduce((sum, item) => sum + Number(item.confidence_score), 0) / poolData.data.length
          : 0;
        
        setStats({
          pending: queueData.data?.length || 0,
          curated: poolData.data?.length || 0,
          totalConfidence: avgConfidence,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const curateWithAI = async (itemId?: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-curate-data", {
        body: {
          reviewQueueId: itemId || null,
          batchMode: !itemId,
        },
      });

      if (error) throw error;

      toast.success(data.message || "AI curation completed!");
      await loadData();
    } catch (error: any) {
      console.error("AI curation error:", error);
      toast.error(error.message || "Failed to curate with AI");
    } finally {
      setIsProcessing(false);
    }
  };

  const getQualityColor = (tier: string) => {
    const colors: { [key: string]: string } = {
      platinum: "bg-purple-500/10 text-purple-500 border-purple-500",
      gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
      silver: "bg-gray-500/10 text-gray-500 border-gray-500",
      bronze: "bg-orange-500/10 text-orange-500 border-orange-500",
    };
    return colors[tier] || "bg-gray-500/10 text-gray-500";
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              AI Data Curation
            </h1>
            <p className="text-muted-foreground">
              Automated analysis, categorization, and quality scoring
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting AI curation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Curated Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.curated}</div>
            <p className="text-xs text-muted-foreground">Ready for datasets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalConfidence * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">AI quality score</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Batch Processing */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Batch Processor
          </CardTitle>
          <CardDescription>
            Process all pending items with AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => curateWithAI()}
            disabled={isProcessing || stats.pending === 0}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Curate {stats.pending} Items with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Review Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
          <CardDescription>
            Items pending AI analysis and curation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewQueue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="outline">{item.source_type}</Badge>
                  </TableCell>
                  <TableCell>{item.category || "uncategorized"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(item.tags || []).slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => curateWithAI(item.id)}
                      disabled={isProcessing}
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Curate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reviewQueue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No items in review queue
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Curated Pool */}
      <Card>
        <CardHeader>
          <CardTitle>Curated Data Pool</CardTitle>
          <CardDescription>
            AI-analyzed data ready for dataset building
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Quality Tier</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {curatedPool.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge>{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getQualityColor(item.quality_tier)}>
                      {item.quality_tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {(item.confidence_score * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-sm">{item.domain || "general"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.usage_count}x</Badge>
                  </TableCell>
                  <TableCell>
                    {item.enterprise_grade ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {curatedPool.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No curated data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}