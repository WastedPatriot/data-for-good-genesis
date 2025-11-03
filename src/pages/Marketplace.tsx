import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Database, Download, ShoppingCart, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Dataset {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  size_mb: number | null;
  featured: boolean;
  stripe_price_id: string;
  domain: string | null;
  sector: string | null;
  region: string | null;
  enterprise_grade: boolean;
  limited_supply: number | null;
  batch_number: number | null;
}

interface Purchase {
  dataset_id: string;
  status: string;
}

const Marketplace = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "trending" | "recommended">("newest");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDatasets();
    checkAuth();
    
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");
    const datasetName = params.get("dataset");
    const sessionId = params.get("session_id");

    const verify = async () => {
      if (success === "true" && sessionId) {
        try {
          await supabase.functions.invoke("verify-purchase", {
            body: { sessionId },
          });
          await checkAuth();
          toast({
            title: "Purchase Successful!",
            description: `You now have access to ${datasetName}. Check your email for details.`,
          });
        } catch (e: any) {
          console.error("Verify purchase error:", e);
        } finally {
          window.history.replaceState({}, document.title, "/marketplace");
        }
      } else if (canceled === "true") {
        toast({
          title: "Purchase Canceled",
          description: "Your purchase was canceled. You can try again anytime.",
          variant: "destructive",
        });
        window.history.replaceState({}, document.title, "/marketplace");
      }
    };

    verify();
  }, [toast]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      fetchUserPurchases(user.id);
    }
  };

  const fetchDatasets = async () => {
    try {
      let query = supabase
        .from("datasets")
        .select("*")
        .eq("active", true);

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "trending") {
        // For trending: order by purchases count (would need a join in production)
        query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      } else if (sortBy === "recommended") {
        // For recommended: order by featured first, then newest
        query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      }

      const { data, error } = await query;

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

  const fetchUserPurchases = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("dataset_id, status")
        .eq("user_id", userId)
        .eq("status", "completed");

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const handlePurchase = async (datasetId: string) => {
    try {
      setProcessingId(datasetId);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to purchase datasets",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      toast({
        title: "Redirecting to payment...",
        description: "Please wait while we prepare your purchase.",
      });

      const { data, error } = await supabase.functions.invoke("purchase-dataset", {
        body: { datasetId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate purchase",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const isPurchased = (datasetId: string) => {
    return purchases.some((p) => p.dataset_id === datasetId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-12 text-center">
            <h1 className="text-6xl md:text-7xl font-black mb-6 text-gradient-hero glow-text">
              Ethical Data Marketplace
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Access <span className="text-primary font-bold">premium, ethically-sourced datasets</span> at competitive prices. 
              From behavioral analytics to market intelligence—every purchase funds verified environmental and social impact projects.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm mb-8">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="text-muted-foreground font-medium">Instant Download</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span className="text-muted-foreground font-medium">Verified Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                <span className="text-muted-foreground font-medium">100% Funds Impact</span>
              </div>
            </div>
          </div>

          {/* Platform Explanation */}
          <div className="card-gradient border-2 border-primary/30 rounded-2xl p-8 mb-12 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-bold mb-2 text-primary">Quality Data</h3>
                <p className="text-sm text-muted-foreground">
                  Multi-source verified datasets with confidence scoring and provenance tracking
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-bold mb-2 text-accent">Instant Access</h3>
                <p className="text-sm text-muted-foreground">
                  Download immediately in multiple formats (CSV, JSON, Parquet) with API access
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🛡️</div>
                <h3 className="text-lg font-bold mb-2 text-primary">Enterprise Ready</h3>
                <p className="text-sm text-muted-foreground">
                  SLA-backed uptime, indemnification coverage, and dedicated support for enterprise datasets
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="text-lg font-bold mb-2 text-accent">Impact Driven</h3>
                <p className="text-sm text-muted-foreground">
                  100% of profits fund environmental and social projects with transparent allocation
                </p>
              </div>
            </div>
          </div>

          {/* Sorting Controls */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { value: "newest" as const, label: "Newest" },
              { value: "trending" as const, label: "Trending" },
              { value: "recommended" as const, label: "Recommended" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "outline"}
                onClick={() => {
                  setSortBy(option.value);
                  fetchDatasets();
                }}
                className="font-bold"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {datasets.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Datasets Available Yet</h3>
              <p className="text-muted-foreground">
                Check back soon for ethically-sourced datasets that fund environmental initiatives.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {datasets.map((dataset, index) => {
                const purchased = isPurchased(dataset.id);
                const processing = processingId === dataset.id;

                return (
                  <motion.div
                    key={dataset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`card-gradient border-2 rounded-2xl p-8 hover-lift transition-all relative overflow-hidden group ${
                      dataset.featured
                        ? "border-primary/50 animate-glow"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {dataset.featured && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50" />
                    )}
                    {dataset.featured && (
                      <div className="mb-4">
                        <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                          FEATURED
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <Database className="w-10 h-10 text-primary" />
                      <div className="text-right">
                        <div className="text-3xl font-black text-gradient">
                          ${dataset.price}
                        </div>
                        {dataset.size_mb && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {dataset.size_mb}MB
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="inline-block bg-accent/20 text-accent-foreground text-xs font-medium px-2 py-1 rounded">
                        {dataset.category}
                      </span>
                      {dataset.enterprise_grade && (
                        <span className="inline-block bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded border border-primary/30">
                          ⭐ ENTERPRISE
                        </span>
                      )}
                      {dataset.limited_supply && (
                        <span className="inline-block bg-destructive/20 text-destructive text-xs font-bold px-2 py-1 rounded border border-destructive/30">
                          🔥 {dataset.limited_supply} LEFT
                        </span>
                      )}
                      {dataset.domain && (
                        <span className="inline-block bg-secondary/20 text-secondary-foreground text-xs font-medium px-2 py-1 rounded">
                          {dataset.domain}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold mb-3 line-clamp-2">{dataset.name}</h3>
                    <p className="text-muted-foreground mb-4 min-h-[80px] text-sm leading-relaxed">
                      {dataset.description}
                    </p>

                    <div className="mb-6 flex flex-wrap gap-2 text-xs">
                      {dataset.sector && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-semibold">Sector:</span> {dataset.sector}
                        </div>
                      )}
                      {dataset.region && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-semibold">Region:</span> {dataset.region}
                        </div>
                      )}
                    </div>

                    {purchased ? (
                      <Button className="w-full font-bold" variant="success" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Purchased
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-glow hover-lift font-bold"
                        onClick={() => handlePurchase(dataset.id)}
                        disabled={processing}
                      >
                        {processing ? (
                          "Processing..."
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Purchase Dataset
                          </>
                        )}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-16 bg-card/50 border-2 border-border rounded-xl p-8 text-center hover-lift">
            <h2 className="text-3xl font-black mb-4 text-gradient">
              Available on Partnered Platforms
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We're working on partnerships with major data marketplaces to make our ethical datasets 
              available on trusted platforms. Each purchase will come with an Ethical Data Badge code for verification.
            </p>
            <div className="inline-block bg-accent/20 text-accent-foreground px-6 py-3 rounded-lg font-bold">
              Coming Soon - TBC
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Marketplace;
