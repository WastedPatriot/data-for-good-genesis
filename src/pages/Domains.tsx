import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Zap, TrendingUp, Scale, Car, Home, Wheat, Heart, Package, DollarSign, Globe, Building } from "lucide-react";
import Navigation from "@/components/Navigation";

const DOMAIN_CONFIG = [
  { id: "climate", label: "Climate", icon: Leaf, color: "text-green-500", description: "Climate change signals, carbon data, environmental trends" },
  { id: "esg", label: "ESG", icon: Building, color: "text-blue-500", description: "ESG scores, corporate sustainability, governance metrics" },
  { id: "policy", label: "Policy", icon: Scale, color: "text-purple-500", description: "Regulations, compliance, legal frameworks" },
  { id: "energy", label: "Energy", icon: Zap, color: "text-yellow-500", description: "Renewable energy, grid data, power consumption" },
  { id: "mobility", label: "Mobility", icon: Car, color: "text-cyan-500", description: "EV adoption, charging infrastructure, transport trends" },
  { id: "consumer", label: "Consumer", icon: TrendingUp, color: "text-pink-500", description: "Retail trends, consumer sentiment, foot traffic" },
  { id: "market", label: "Market", icon: DollarSign, color: "text-emerald-500", description: "Market indicators, clean energy stocks, sentiment" },
  { id: "housing", label: "Housing", icon: Home, color: "text-orange-500", description: "Real estate, construction permits, market reports" },
  { id: "agriculture", label: "Agriculture", icon: Wheat, color: "text-amber-500", description: "Crop data, food security, sustainability farming" },
  { id: "health", label: "Health", icon: Heart, color: "text-red-500", description: "Public health, environmental health impacts" },
  { id: "supply_chain", label: "Supply Chain", icon: Package, color: "text-indigo-500", description: "Logistics, disruptions, sustainability signals" },
  { id: "macro", label: "Macro", icon: Globe, color: "text-slate-500", description: "Economic indicators, global trends, policy impacts" },
];

export default function Domains() {
  const [domainStats, setDomainStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomainStats();
  }, []);

  const loadDomainStats = async () => {
    try {
      setLoading(true);

      // Fetch curated pool stats by domain
      const { data: curatedData } = await supabase
        .from("curated_pool")
        .select("domain, confidence_score, quality_tier");

      // Fetch dataset stats by domain
      const { data: datasetData } = await supabase
        .from("datasets")
        .select("domain, active")
        .eq("active", true);

      const stats: Record<string, any> = {};

      DOMAIN_CONFIG.forEach((domain) => {
        const curatedItems = curatedData?.filter((item) => item.domain === domain.id) || [];
        const datasets = datasetData?.filter((item) => item.domain === domain.id) || [];

        stats[domain.id] = {
          curatedCount: curatedItems.length,
          datasetCount: datasets.length,
          avgConfidence: curatedItems.length > 0
            ? (curatedItems.reduce((sum, item) => sum + Number(item.confidence_score), 0) / curatedItems.length).toFixed(2)
            : "0.00",
          highQuality: curatedItems.filter((item) => item.quality_tier === "platinum" || item.quality_tier === "gold").length,
        };
      });

      setDomainStats(stats);
    } catch (error) {
      console.error("Error loading domain stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Data Domains</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our multi-domain ethical data marketplace. Each domain represents a vertical of sustainability, 
            market intelligence, and environmental impact signals.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading domain statistics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOMAIN_CONFIG.map((domain) => {
              const Icon = domain.icon;
              const stats = domainStats[domain.id] || { curatedCount: 0, datasetCount: 0, avgConfidence: "0.00", highQuality: 0 };

              return (
                <Card key={domain.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-8 w-8 ${domain.color}`} />
                      <div className="flex-1">
                        <CardTitle>{domain.label}</CardTitle>
                        <CardDescription className="text-xs mt-1">{domain.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Curated Records</p>
                        <p className="text-2xl font-bold">{stats.curatedCount}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Datasets</p>
                        <p className="text-2xl font-bold">{stats.datasetCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Avg: {stats.avgConfidence}
                        </Badge>
                        {stats.highQuality > 0 && (
                          <Badge variant="secondary">
                            {stats.highQuality} High-Quality
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
          <CardHeader>
            <CardTitle>Multi-Domain Advantage</CardTitle>
            <CardDescription>Why DataForEarth covers diverse verticals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <p><strong>Comprehensive Insights:</strong> Cross-domain signals reveal hidden patterns in sustainability and market behavior</p>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <p><strong>Flexible Sourcing:</strong> Choose datasets matching your vertical or combine domains for holistic analysis</p>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <p><strong>Adaptive Harvesting:</strong> Our AI scrapers continuously expand coverage based on demand</p>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <p><strong>Enterprise Quality:</strong> High-confidence, deduplicated, multi-tier quality scoring across all domains</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
