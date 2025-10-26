import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Globe, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface FundingEntry {
  id: string;
  month: string;
  project_id: string;
  amount: number;
  source: string;
  region_impact: string;
  projects?: {
    title: string;
    region_impact: string;
  };
}

interface MonthlyStats {
  month: string;
  total: number;
  byRegion: Record<string, number>;
  projectCount: number;
}

export default function ImpactTransparency() {
  const [ledger, setLedger] = useState<FundingEntry[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFundingData();
  }, []);

  const loadFundingData = async () => {
    try {
      const { data } = await supabase
        .from("funding_ledger")
        .select("*, projects(title, region_impact)")
        .order("month", { ascending: false })
        .limit(100);

      if (data) {
        setLedger(data);
        calculateMonthlyStats(data);
      }
    } catch (error) {
      console.error("Error loading funding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (data: any[]) => {
    const grouped: Record<string, MonthlyStats> = {};

    data.forEach((entry) => {
      const month = new Date(entry.month).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      if (!grouped[month]) {
        grouped[month] = {
          month,
          total: 0,
          byRegion: {},
          projectCount: 0,
        };
      }

      grouped[month].total += Number(entry.amount);
      grouped[month].projectCount += 1;

      const region = entry.region_impact || "global";
      grouped[month].byRegion[region] = (grouped[month].byRegion[region] || 0) + Number(entry.amount);
    });

    setMonthlyStats(Object.values(grouped));
  };

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      palestine: "bg-red-500/20 text-red-700 dark:text-red-300",
      sudan: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
      congo: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
      refugee: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
      reforestation: "bg-green-500/20 text-green-700 dark:text-green-300",
      global: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
    };
    return colors[region] || colors.global;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold">Impact Transparency</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every dollar from dataset sales is tracked and allocated to verified eco-social projects.
            100% visibility. Zero overhead hidden.
          </p>
        </motion.div>

        {/* Monthly Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {monthlyStats.slice(0, 6).map((stat, idx) => (
            <motion.div
              key={stat.month}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {stat.month}
                    </CardTitle>
                    <Badge variant="secondary">{stat.projectCount} projects</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-4">
                    ${stat.total.toFixed(2)}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(stat.byRegion)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([region, amount]) => (
                        <div key={region} className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className={getRegionColor(region)}>
                            {region}
                          </Badge>
                          <span className="font-medium">${amount.toFixed(0)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Full Ledger */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Complete Funding Ledger
            </CardTitle>
            <CardDescription>
              All transactions from dataset purchases to project funding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {entry.projects?.title || "General Fund"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getRegionColor(entry.region_impact)}>
                        {entry.region_impact}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.month).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">• {entry.source}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">${Number(entry.amount).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Impact Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Impact Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {monthlyStats.length > 0 &&
                Object.entries(monthlyStats[0].byRegion).map(([region, amount]) => (
                  <div key={region} className="text-center p-4 border rounded-lg">
                    <Badge className={getRegionColor(region)} variant="outline">
                      {region}
                    </Badge>
                    <p className="text-2xl font-bold mt-2">${amount.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
