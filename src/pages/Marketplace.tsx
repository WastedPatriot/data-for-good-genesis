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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDatasets();
    checkAuth();
    
    // Check for success/cancel in URL params
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");
    const datasetName = params.get("dataset");

    if (success === "true") {
      toast({
        title: "Purchase Successful! 🎉",
        description: `You now have access to ${datasetName}. Check your email for details.`,
      });
      // Clean URL
      window.history.replaceState({}, document.title, "/marketplace");
    } else if (canceled === "true") {
      toast({
        title: "Purchase Canceled",
        description: "Your purchase was canceled. You can try again anytime.",
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, document.title, "/marketplace");
    }
  }, [toast]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      fetchUserPurchases(user.id);
    }
  };

  const fetchDatasets = async () => {
    try {
      const { data, error } = await supabase
        .from("datasets")
        .select("*")
        .eq("active", true)
        .order("featured", { ascending: false })
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
          description: "Please log in to purchase datasets",
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
          <h1 className="text-5xl font-black mb-4 text-center text-gradient">
            Ethical Data Marketplace
          </h1>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            Purchase ethically-sourced datasets that fund environmental initiatives. 
            Every purchase comes with an Ethical Data Badge.
          </p>

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
                    className={`bg-card border-2 rounded-xl p-6 hover-lift transition-all ${
                      dataset.featured
                        ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
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

                    <div className="mb-2">
                      <span className="inline-block bg-accent/20 text-accent-foreground text-xs font-medium px-2 py-1 rounded">
                        {dataset.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3">{dataset.name}</h3>
                    <p className="text-muted-foreground mb-6 min-h-[80px]">
                      {dataset.description}
                    </p>

                    {purchased ? (
                      <Button className="w-full" variant="outline" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Purchased
                      </Button>
                    ) : (
                      <Button
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
              Purchase our datasets directly through these verified data marketplaces — 
              each purchase comes with an Ethical Data Badge code for verification.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["Kaggle", "DataHub", "Snowflake Marketplace"].map((platform) => (
                <Button key={platform} variant="outline" className="border-2 hover-lift">
                  {platform}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Marketplace;
