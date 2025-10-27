import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Download, 
  TrendingUp, 
  Crown,
  Search,
  Filter,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface Dataset {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  size_mb: number | null;
  enterprise_grade: boolean;
  sector: string | null;
  region: string | null;
}

interface SubscriptionData {
  subscribed: boolean;
  hasOrganization: boolean;
  organizationId?: string;
  subscription?: {
    tier: string;
    subscription_end: string;
    downloads_used: number;
    downloads_limit: number | null;
  };
}

const CompanyPortal = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndSubscription();
    fetchDatasets();
  }, []);

  useEffect(() => {
    filterDatasets();
  }, [searchTerm, categoryFilter, datasets]);

  const checkAuthAndSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) throw error;

      if (!data.hasOrganization) {
        toast({
          title: "Organization Required",
          description: "Please create an organization profile to access the company portal.",
          variant: "destructive",
        });
        navigate("/organization-signup");
        return;
      }

      if (!data.subscribed) {
        toast({
          title: "Subscription Required",
          description: "Please subscribe to a plan to download datasets.",
        });
        navigate("/organization-profile");
        return;
      }

      setSubscriptionData(data);
    } catch (error: any) {
      console.error("Error checking subscription:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      });
    }
  };

  const fetchDatasets = async () => {
    try {
      const { data, error } = await supabase
        .from("datasets")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast({
        title: "Error",
        description: "Failed to load datasets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDatasets = () => {
    let filtered = [...datasets];

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((d) => d.category === categoryFilter);
    }

    setFilteredDatasets(filtered);
  };

  const handleDownload = async (datasetId: string) => {
    setDownloading(datasetId);
    try {
      const { data, error } = await supabase.functions.invoke("download-dataset-subscription", {
        body: { datasetId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Download Successful!",
          description: data.message,
        });

        // Refresh subscription data to show updated download counts
        await checkAuthAndSubscription();
      }
    } catch (error: any) {
      console.error("Download error:", error);
      
      if (error.message?.includes("subscription required")) {
        toast({
          title: "Subscription Required",
          description: "Please subscribe to a plan to download datasets.",
          variant: "destructive",
        });
        navigate("/organization-profile");
      } else if (error.message?.includes("limit reached")) {
        toast({
          title: "Download Limit Reached",
          description: "Upgrade your plan for more downloads.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Download Failed",
          description: error.message || "Failed to download dataset",
          variant: "destructive",
        });
      }
    } finally {
      setDownloading(null);
    }
  };

  const getTierBadge = () => {
    if (!subscriptionData?.subscription) return null;
    
    const tier = subscriptionData.subscription.tier;
    const colors = {
      starter: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      professional: "bg-primary/10 text-primary border-primary/20",
      enterprise: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };

    const icons = {
      starter: Sparkles,
      professional: TrendingUp,
      enterprise: Crown,
    };

    const Icon = icons[tier as keyof typeof icons] || Building2;

    return (
      <Badge variant="outline" className={colors[tier as keyof typeof colors]}>
        <Icon className="w-3 h-3 mr-1" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const categories = ["all", ...new Set(datasets.map((d) => d.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading company portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black mb-2 text-gradient flex items-center gap-3">
                <Building2 className="w-10 h-10" />
                Company Portal
              </h1>
              <p className="text-muted-foreground">Download datasets using your subscription</p>
            </div>
            <Button onClick={() => navigate("/organization-profile")} variant="outline">
              Manage Subscription
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Subscription Status Card */}
          {subscriptionData?.subscription && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Plan</p>
                      {getTierBadge()}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-lg border">
                    <p className="text-2xl font-bold">
                      {subscriptionData.subscription.downloads_used}
                    </p>
                    <p className="text-xs text-muted-foreground">Downloads Used</p>
                  </div>
                  <div className="text-center p-3 bg-card rounded-lg border">
                    <p className="text-2xl font-bold">
                      {subscriptionData.subscription.downloads_limit || "∞"}
                    </p>
                    <p className="text-xs text-muted-foreground">Monthly Limit</p>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-2xl font-bold text-primary">
                      {subscriptionData.subscription.downloads_limit
                        ? subscriptionData.subscription.downloads_limit -
                          subscriptionData.subscription.downloads_used
                        : "∞"}
                    </p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search datasets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datasets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredDatasets.map((dataset) => (
              <motion.div
                key={dataset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{dataset.category}</Badge>
                      {dataset.enterprise_grade && (
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{dataset.name}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {dataset.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dataset.size_mb && (
                        <p className="text-sm text-muted-foreground">
                          Size: {dataset.size_mb} MB
                        </p>
                      )}
                      <Button
                        onClick={() => handleDownload(dataset.id)}
                        disabled={downloading === dataset.id}
                        className="w-full"
                      >
                        {downloading === dataset.id ? (
                          <>
                            <Download className="w-4 h-4 mr-2 animate-pulse" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Dataset
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredDatasets.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No datasets found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanyPortal;
