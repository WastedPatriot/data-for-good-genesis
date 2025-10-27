import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Database, TrendingUp, Sparkles } from "lucide-react";

export default function DatasetBuilder() {
  const navigate = useNavigate();
  const [isBuilding, setIsBuilding] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [curatedStats, setCuratedStats] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [formData, setFormData] = useState({
    category: "climate",
    domain: "climate",
    region: "",
    sector: "",
    channel: "on_site",
    burstMode: false,
    useAI: true,
    manualName: "",
    manualDescription: "",
    manualPrice: null as number | null,
    filters: {
      minQuality: "silver",
      enterpriseOnly: false,
      limit: 1000,
    },
  });

  useEffect(() => {
    checkAuth();
    loadCuratedStats();
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

  const loadCuratedStats = async () => {
    try {
      const { data: poolData } = await supabase
        .from("curated_pool")
        .select("category, quality_tier, confidence_score");

      if (poolData) {
        const stats: any = {
          total: poolData.length,
          byCategory: {},
          byTier: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
          avgConfidence: 0,
        };

        poolData.forEach((item: any) => {
          stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
          stats.byTier[item.quality_tier] = (stats.byTier[item.quality_tier] || 0) + 1;
          stats.avgConfidence += parseFloat(item.confidence_score);
        });

        stats.avgConfidence = (stats.avgConfidence / poolData.length).toFixed(2);
        setCuratedStats(stats);
      }
    } catch (error) {
      console.error("Error loading curated stats:", error);
    }
  };

  const generateAISuggestions = async () => {
    setIsGeneratingAI(true);
    try {
      toast.info("AI is analyzing curated data and generating suggestions...");
      
      const { data, error } = await supabase.functions.invoke("build-dataset-from-curated", {
        body: {
          ...formData,
          useAI: true,
        },
      });

      if (error) throw error;

      if (data.success) {
        setAiSuggestions({
          name: data.dataset.name,
          description: data.dataset.description,
          price: data.dataset.price,
        });
        toast.success("AI suggestions generated! Review and publish.");
      } else {
        if (data.code === "THROTTLED") {
          toast.error(`Release throttle active. Next slot: ${new Date(data.nextAvailableDate).toLocaleString()}`);
        } else if (data.code === "NO_DATA") {
          toast.error("No curated data matches your filters. Try adjusting filters.");
        } else {
          toast.error(data.error || "Failed to generate suggestions");
        }
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast.error(error.message || "Failed to generate AI suggestions");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleBuild = async () => {
    if (!formData.useAI && (!formData.manualName || !formData.manualDescription)) {
      toast.error("Please fill in all required fields or use AI generation");
      return;
    }

    setIsBuilding(true);
    try {
      const { data, error } = await supabase.functions.invoke("build-dataset-from-curated", {
        body: formData,
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Dataset built successfully! ${data.stats.recordCount} records included with avg confidence ${data.stats.avgConfidence.toFixed(2)}`
        );
        navigate("/admin/datasets");
      } else {
        if (data.code === "THROTTLED") {
          toast.error(`Release throttle active. Next slot: ${new Date(data.nextAvailableDate).toLocaleString()}`);
        } else if (data.code === "NO_DATA") {
          toast.error("No curated data matches your filters. Try lowering min quality or changing category.");
        } else {
          toast.error(data.error || "Failed to build dataset");
        }
      }
    } catch (error: any) {
      console.error("Dataset build error:", error);
      toast.error(error.message || "Failed to build dataset");
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/datasets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Datasets
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Build Dataset from Curated Pool</h1>
          <p className="text-muted-foreground">Package curated data into a sellable dataset</p>
        </div>
      </div>

      {/* Curated Pool Stats */}
      {curatedStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{curatedStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{curatedStats.avgConfidence}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quality Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Platinum:</span>
                <Badge variant="secondary">{curatedStats.byTier.platinum}</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Gold:</span>
                <Badge variant="secondary">{curatedStats.byTier.gold}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(curatedStats.byCategory).slice(0, 3).map(([cat, count]: any) => (
                <div key={cat} className="flex justify-between text-xs">
                  <span className="capitalize">{cat}:</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dataset Builder Form */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Configuration</CardTitle>
          <CardDescription>Define the parameters for your new dataset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">AI-Powered Dataset Generation</p>
                <p className="text-sm text-muted-foreground">
                  Let AI analyze curated data and generate title, description, and optimal pricing
                </p>
              </div>
            </div>
            <Switch
              checked={formData.useAI}
              onCheckedChange={(checked) => setFormData({ ...formData, useAI: checked })}
            />
          </div>

          {!formData.useAI && (
            <>
              <div className="space-y-2">
                <Label htmlFor="manualName">Dataset Name *</Label>
                <Input
                  id="manualName"
                  value={formData.manualName}
                  onChange={(e) => setFormData({ ...formData, manualName: e.target.value })}
                  placeholder="e.g., Climate Risk Signals Q1 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualDescription">Description *</Label>
                <Textarea
                  id="manualDescription"
                  value={formData.manualDescription}
                  onChange={(e) => setFormData({ ...formData, manualDescription: e.target.value })}
                  placeholder="Describe what's included in this dataset..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualPrice">Price ($) *</Label>
                <Input
                  id="manualPrice"
                  type="number"
                  value={formData.manualPrice || ""}
                  onChange={(e) => setFormData({ ...formData, manualPrice: parseFloat(e.target.value) || null })}
                  placeholder="99"
                  min={1}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select value={formData.domain} onValueChange={(v) => setFormData({ ...formData, domain: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="climate">Climate</SelectItem>
                  <SelectItem value="esg">ESG</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                  <SelectItem value="consumer">Consumer</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="supply_chain">Supply Chain</SelectItem>
                  <SelectItem value="macro">Macro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region (optional)</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., US, EU, Global"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector (optional)</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                placeholder="e.g., Transportation, Energy"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minQuality">Min Quality Tier</Label>
            <Select
              value={formData.filters.minQuality}
              onValueChange={(v) => setFormData({ ...formData, filters: { ...formData.filters, minQuality: v } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enterpriseOnly"
              checked={formData.filters.enterpriseOnly}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, filters: { ...formData.filters, enterpriseOnly: checked } })
              }
            />
            <Label htmlFor="enterpriseOnly" className="cursor-pointer">
              Enterprise-grade only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="burstMode"
              checked={formData.burstMode}
              onCheckedChange={(checked) => setFormData({ ...formData, burstMode: checked })}
            />
            <Label htmlFor="burstMode" className="cursor-pointer">
              Burst mode (bypass throttle limits)
            </Label>
          </div>

          <Button 
            onClick={handleBuild} 
            disabled={isBuilding || isGeneratingAI} 
            className="w-full" 
            size="lg"
          >
            {isBuilding ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                {formData.useAI ? "AI Building Dataset..." : "Building Dataset..."}
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                {formData.useAI ? "Build with AI" : "Build Dataset"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
