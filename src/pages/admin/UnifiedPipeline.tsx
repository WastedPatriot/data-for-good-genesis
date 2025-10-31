import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, Database, TrendingUp, Sparkles, CheckCircle, 
  XCircle, AlertCircle, Brain, Package, DollarSign, Loader2
} from "lucide-react";

interface ReviewQueueItem {
  id: string;
  source_type: string;
  category: string;
  tags: string[];
  confidence_score: number;
  status: string;
  created_at: string;
}

interface CuratedItem {
  id: string;
  category: string;
  quality_tier: string;
  confidence_score: number;
  usage_count: number;
  estimated_dataset_price: number;
}

interface Dataset {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  created_at: string;
}

export default function UnifiedPipeline() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("review");
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [curatedPool, setCuratedPool] = useState<CuratedItem[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    curated: 0,
    published: 25, // You have 25 datasets live
    avgPrice: 64.62,
    totalValue: 0
  });

  // Dataset builder form
  const [buildForm, setBuildForm] = useState({
    category: "climate",
    useAI: true,
    manualName: "",
    manualDescription: "",
    manualPrice: 0,
    minQuality: "silver",
    limit: 1000
  });

  useEffect(() => {
    checkAuth();
    loadAllData();
    const interval = setInterval(loadAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
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

  const loadAllData = async () => {
    try {
      const [queueData, poolData, datasetData] = await Promise.all([
        supabase
          .from("review_queue")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("curated_pool")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("datasets")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (queueData.data) setReviewQueue(queueData.data);
      if (poolData.data) {
        setCuratedPool(poolData.data);
        const totalValue = poolData.data.reduce((sum, item) => sum + (item.estimated_dataset_price || 0), 0);
        setStats(prev => ({
          ...prev,
          pending: queueData.data?.length || 0,
          curated: poolData.data?.length || 0,
          totalValue
        }));
      }
      if (datasetData.data) setDatasets(datasetData.data);
    } catch (error) {
      console.error("Error loading pipeline data:", error);
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
      await loadAllData();
      setActiveTab("curated"); // Switch to curated tab
    } catch (error: any) {
      console.error("AI curation error:", error);
      toast.error(error.message || "Failed to curate with AI");
    } finally {
      setIsProcessing(false);
    }
  };

  const buildDataset = async () => {
    if (!buildForm.useAI && (!buildForm.manualName || !buildForm.manualDescription || !buildForm.manualPrice)) {
      toast.error("Please fill in all required fields or use AI generation");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("build-dataset-from-curated", {
        body: {
          ...buildForm,
          filters: {
            minQuality: buildForm.minQuality,
            limit: buildForm.limit
          }
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Dataset built! ${data.stats.recordCount} records included, avg confidence ${(data.stats.avgConfidence * 100).toFixed(1)}%`);
        await loadAllData();
        setActiveTab("datasets"); // Switch to datasets tab
      } else {
        toast.error(data.error || "Failed to build dataset");
      }
    } catch (error: any) {
      console.error("Dataset build error:", error);
      toast.error(error.message || "Failed to build dataset");
    } finally {
      setIsProcessing(false);
    }
  };

  const approveItem = async (id: string) => {
    try {
      await supabase
        .from("review_queue")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      toast.success("Item approved");
      await loadAllData();
    } catch (error) {
      toast.error("Failed to approve item");
    }
  };

  const rejectItem = async (id: string) => {
    try {
      await supabase
        .from("review_queue")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      toast.success("Item rejected");
      await loadAllData();
    } catch (error) {
      toast.error("Failed to reject item");
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
              <Database className="h-8 w-8 text-primary" />
              Unified Data Pipeline
            </h1>
            <p className="text-muted-foreground">
              Complete workflow: Review → AI Curate → Build Dataset → Publish
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Curated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.curated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Avg Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgPrice}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Pool Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Pipeline Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="review">
            <AlertCircle className="h-4 w-4 mr-2" />
            Review Queue
          </TabsTrigger>
          <TabsTrigger value="curated">
            <CheckCircle className="h-4 w-4 mr-2" />
            Curated Pool
          </TabsTrigger>
          <TabsTrigger value="build">
            <Sparkles className="h-4 w-4 mr-2" />
            Build Dataset
          </TabsTrigger>
          <TabsTrigger value="datasets">
            <Package className="h-4 w-4 mr-2" />
            Published
          </TabsTrigger>
        </TabsList>

        {/* Review Queue Tab */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Review Queue</CardTitle>
                  <CardDescription>Items awaiting AI curation</CardDescription>
                </div>
                <Button
                  onClick={() => curateWithAI()}
                  disabled={isProcessing || stats.pending === 0}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Curate All {stats.pending} Items
                    </>
                  )}
                </Button>
              </div>
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
                      <TableCell><Badge variant="outline">{item.source_type}</Badge></TableCell>
                      <TableCell>{item.category || "uncategorized"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(item.tags || []).slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => curateWithAI(item.id)} disabled={isProcessing}>
                            <Brain className="h-3 w-3 mr-1" />
                            AI Curate
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => approveItem(item.id)}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => rejectItem(item.id)}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reviewQueue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No items in queue
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Curated Pool Tab */}
        <TabsContent value="curated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Curated Data Pool</CardTitle>
              <CardDescription>High-quality data ready for dataset building</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Est. Value</TableHead>
                    <TableHead>Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {curatedPool.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Badge>{item.category}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getQualityColor(item.quality_tier)}>
                          {item.quality_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{(item.confidence_score * 100).toFixed(0)}%</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${(item.estimated_dataset_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{item.usage_count}x</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Build Dataset Tab */}
        <TabsContent value="build" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build New Dataset</CardTitle>
              <CardDescription>Package curated data into a sellable dataset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">AI-Powered Dataset Generation</p>
                    <p className="text-sm text-muted-foreground">Let AI create title, description, and pricing</p>
                  </div>
                </div>
                <Switch
                  checked={buildForm.useAI}
                  onCheckedChange={(checked) => setBuildForm({ ...buildForm, useAI: checked })}
                />
              </div>

              {!buildForm.useAI && (
                <div className="space-y-4">
                  <div>
                    <Label>Dataset Name</Label>
                    <Input value={buildForm.manualName} onChange={(e) => setBuildForm({ ...buildForm, manualName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={buildForm.manualDescription} onChange={(e) => setBuildForm({ ...buildForm, manualDescription: e.target.value })} />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input type="number" value={buildForm.manualPrice} onChange={(e) => setBuildForm({ ...buildForm, manualPrice: parseFloat(e.target.value) })} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={buildForm.category} onValueChange={(v) => setBuildForm({ ...buildForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="climate">Climate</SelectItem>
                      <SelectItem value="esg">ESG</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min Quality</Label>
                  <Select value={buildForm.minQuality} onValueChange={(v) => setBuildForm({ ...buildForm, minQuality: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={buildDataset} disabled={isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building...</>
                ) : (
                  <><Package className="h-4 w-4 mr-2" />{buildForm.useAI ? "Build with AI" : "Build Dataset"}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datasets Tab */}
        <TabsContent value="datasets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Published Datasets</CardTitle>
              <CardDescription>Live on marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((ds) => (
                    <TableRow key={ds.id}>
                      <TableCell className="font-medium">{ds.name}</TableCell>
                      <TableCell><Badge>{ds.category}</Badge></TableCell>
                      <TableCell className="font-bold">${ds.price}</TableCell>
                      <TableCell>
                        <Badge variant={ds.active ? "default" : "secondary"}>
                          {ds.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(ds.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
