import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Database, Award } from "lucide-react";
import { motion } from "framer-motion";

interface ContributorValue {
  total_contributions: number;
  approved_contributions: number;
  curated_items: number;
  total_estimated_value: number;
  avg_quality_score: number;
  last_contribution_date: string;
}

export default function ContributorValueCard({ userEmail }: { userEmail: string }) {
  const [value, setValue] = useState<ContributorValue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributorValue();
  }, [userEmail]);

  const loadContributorValue = async () => {
    try {
      const { data, error } = await supabase
        .from("contributor_value_summary")
        .select("*")
        .eq("contributor_email", userEmail)
        .maybeSingle();

      if (error) throw error;
      setValue(data);
    } catch (error) {
      console.error("Error loading contributor value:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading your contribution value...</p>
        </CardContent>
      </Card>
    );
  }

  if (!value || value.total_contributions === 0) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Your Data's Market Value
          </CardTitle>
          <CardDescription>
            Start contributing data to see its real-time market value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            When you contribute data, we'll show you exactly how much it's worth to organizations buying datasets. 
            Your data powers environmental change and you'll see its transparent market value here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const approvalRate = (value.approved_contributions / value.total_contributions) * 100;
  const qualityScore = (value.avg_quality_score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="h-6 w-6 text-primary" />
            Your Data's Market Value
          </CardTitle>
          <CardDescription>
            Real-time transparency on how much your contributions are worth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Value Display */}
          <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border-2 border-green-500/20">
            <p className="text-sm text-muted-foreground mb-2">Total Estimated Market Value</p>
            <motion.p 
              className="text-5xl font-black text-green-600"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              ${value.total_estimated_value.toFixed(2)}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {value.curated_items} curated items from your {value.total_contributions} contributions
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Contributions</p>
              </div>
              <p className="text-2xl font-bold">{value.total_contributions}</p>
              <Badge variant="secondary" className="mt-1">
                {value.approved_contributions} approved
              </Badge>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <p className="text-xs text-muted-foreground">Quality Score</p>
              </div>
              <p className="text-2xl font-bold">{qualityScore.toFixed(0)}%</p>
              <Badge 
                variant={qualityScore >= 80 ? "default" : "secondary"}
                className="mt-1"
              >
                {qualityScore >= 90 ? "Excellent" : qualityScore >= 80 ? "Good" : "Average"}
              </Badge>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-muted-foreground">Approval Rate</p>
              </div>
              <p className="text-2xl font-bold">{approvalRate.toFixed(0)}%</p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <p className="text-xs text-muted-foreground">Avg Value/Item</p>
              </div>
              <p className="text-2xl font-bold">
                ${(value.total_estimated_value / Math.max(value.curated_items, 1)).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong>How we calculate this:</strong> When your data is curated and included in datasets that organizations purchase, 
              we estimate its market value based on dataset pricing, quality scores, and usage. This is real-time, transparent pricing 
              showing exactly what organizations are paying for your contributions. Higher quality data = higher value.
            </p>
          </div>

          {value.last_contribution_date && (
            <p className="text-xs text-center text-muted-foreground">
              Last contribution: {new Date(value.last_contribution_date).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
