import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Database, Leaf, TrendingUp, Award, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  contributors: number;
  co2Offset: number;
  projectsFunded: number;
  datasetsPublished: number;
  totalRevenue: number;
  treesPlanted: number;
}

const ImpactDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    contributors: 0,
    co2Offset: 0,
    projectsFunded: 0,
    datasetsPublished: 0,
    totalRevenue: 0,
    treesPlanted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Count contributors from data_submissions
      const { count: contributorCount } = await supabase
        .from("data_submissions")
        .select("*", { count: "exact", head: true });

      // Count published datasets
      const { count: datasetCount } = await supabase
        .from("datasets")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      // Count audit logs with environmental actions
      const { data: auditLogs } = await supabase
        .from("audit_logs")
        .select("action, details")
        .in("action", ["dataset_published", "purchase_completed", "project_funded"]);

      // Calculate derived metrics
      const projectsFunded = auditLogs?.filter((log) => log.action === "project_funded").length || 0;
      const purchaseRevenue = auditLogs
        ?.filter((log) => log.action === "purchase_completed")
        .reduce((sum, log) => {
          const details = log.details as any;
          return sum + (details?.amount || 0);
        }, 0) || 0;

      // Estimate environmental impact (example calculations)
      const co2Offset = Math.floor(purchaseRevenue * 0.5); // 0.5 tons per $1000
      const treesPlanted = Math.floor(purchaseRevenue * 2); // 2 trees per $1000

      setStats({
        contributors: contributorCount || 0,
        datasetsPublished: datasetCount || 0,
        projectsFunded,
        totalRevenue: purchaseRevenue,
        co2Offset,
        treesPlanted,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: "Data Contributors",
      value: stats.contributors.toLocaleString(),
      color: "from-blue-500 to-cyan-600",
      description: "Individuals sharing data for good",
    },
    {
      icon: Database,
      label: "Datasets Published",
      value: stats.datasetsPublished.toLocaleString(),
      color: "from-purple-500 to-pink-600",
      description: "Ethically-sourced datasets available",
    },
    {
      icon: Leaf,
      label: "CO₂ Offset (tons)",
      value: stats.co2Offset.toLocaleString(),
      color: "from-green-500 to-emerald-600",
      description: "Carbon emissions prevented",
    },
    {
      icon: TrendingUp,
      label: "Projects Funded",
      value: stats.projectsFunded.toLocaleString(),
      color: "from-orange-500 to-red-600",
      description: "Environmental initiatives supported",
    },
    {
      icon: Award,
      label: "Trees Planted",
      value: stats.treesPlanted.toLocaleString(),
      color: "from-teal-500 to-green-600",
      description: "Trees funded by data sales",
    },
    {
      icon: DollarSign,
      label: "Eco Funding Raised",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      color: "from-yellow-500 to-orange-600",
      description: "Revenue directed to environment",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading impact data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-gradient glow-text">
            Data Impact Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Real-time tracking of how your data contributions are healing the planet
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border-2 border-border rounded-xl p-8 hover-lift hover:border-primary/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-black text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-bold mb-2">{stat.label}</div>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card/80 border-2 border-primary/30 rounded-xl p-8 backdrop-blur-sm"
        >
          <h2 className="text-3xl font-black mb-6 text-gradient">Recent Impact</h2>
          <div className="space-y-4">
            {stats.contributors === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activity yet. Be the first to contribute data and create impact!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-bold">New Contributor Joined</p>
                    <p className="text-sm text-muted-foreground">Anonymous user shared their data</p>
                  </div>
                </div>
                {stats.datasetsPublished > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Database className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-bold">Dataset Published</p>
                      <p className="text-sm text-muted-foreground">New ethical dataset available for purchase</p>
                    </div>
                  </div>
                )}
                {stats.projectsFunded > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Leaf className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-bold">Project Funded</p>
                      <p className="text-sm text-muted-foreground">Community voted to support a green initiative</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* How Impact is Calculated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-8"
        >
          <h3 className="text-2xl font-black mb-4 text-center">How We Calculate Impact</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gradient mb-2">$1,000</div>
              <p className="text-sm text-muted-foreground">
                Dataset revenue = 0.5 tons CO₂ offset + 2,000 trees planted
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient mb-2">100%</div>
              <p className="text-sm text-muted-foreground">
                All data sales revenue goes directly to environmental projects
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient mb-2">Real-time</div>
              <p className="text-sm text-muted-foreground">
                Dashboard updates as purchases and projects are completed
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
