import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  CheckCircle2, 
  Download, 
  TrendingUp, 
  Sparkles, 
  Crown,
  Zap
} from "lucide-react";

// Subscription tier configuration
const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: "$99/month",
    priceId: "price_1SMtuyJWLybuSYkrbDr7RuCJ",
    downloads: 5,
    icon: Sparkles,
    color: "text-blue-500",
    features: [
      "5 dataset downloads per month",
      "Access to basic datasets",
      "Standard support",
      "Email notifications",
    ],
  },
  professional: {
    name: "Professional",
    price: "$299/month",
    priceId: "price_1SMtuzJWLybuSYkrhfzod9jv",
    downloads: 20,
    icon: TrendingUp,
    color: "text-primary",
    features: [
      "20 dataset downloads per month",
      "Access to all datasets",
      "Enterprise-grade data",
      "Priority support",
      "Advanced analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "$999/month",
    priceId: "price_1SMtuzJWLybuSYkr9tarOSHw",
    downloads: null,
    icon: Crown,
    color: "text-yellow-500",
    features: [
      "Unlimited dataset downloads",
      "Access to all datasets",
      "Custom dataset requests",
      "Dedicated account manager",
      "Priority support",
      "API access",
    ],
  },
};

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

export const SubscriptionManager = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSubscription();
    
    // Refresh subscription status every 30 seconds
    const interval = setInterval(checkSubscription, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) throw error;

      setSubscriptionData(data);
    } catch (error: any) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to checkout",
          description: "Opening Stripe checkout in a new tab...",
        });
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Opening billing portal",
          description: "Manage your subscription in the new tab...",
        });
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast({
        title: "Portal Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading subscription status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData?.hasOrganization) {
    return null;
  }

  const currentTier = subscriptionData.subscription?.tier;
  const isSubscribed = subscriptionData.subscribed;

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {isSubscribed && currentTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Active Subscription
              </CardTitle>
              <CardDescription>
                You're currently on the {SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS]?.name} plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                  <p className="text-2xl font-bold text-primary">
                    {SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS]?.name}
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Downloads Used</p>
                  <p className="text-2xl font-bold">
                    {subscriptionData.subscription?.downloads_used || 0}
                    {subscriptionData.subscription?.downloads_limit && ` / ${subscriptionData.subscription.downloads_limit}`}
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Renews On</p>
                  <p className="text-sm font-semibold">
                    {subscriptionData.subscription?.subscription_end 
                      ? new Date(subscriptionData.subscription.subscription_end).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <Button onClick={handleManageSubscription} variant="outline" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Subscription Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Choose a plan that fits your organization's data needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
              const Icon = tier.icon;
              const isCurrentTier = currentTier === key;
              
              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    isCurrentTier 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {isCurrentTier && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Your Plan
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4">
                    <Icon className={`w-12 h-12 mx-auto mb-2 ${tier.color}`} />
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-3xl font-black text-primary">{tier.price}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tier.downloads ? `${tier.downloads} downloads/month` : "Unlimited downloads"}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrentTier && (
                    <Button
                      onClick={() => handleSubscribe(tier.priceId)}
                      disabled={checkingOut}
                      className="w-full"
                      variant={key === "professional" ? "default" : "outline"}
                    >
                      {checkingOut ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-pulse" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {isSubscribed ? "Upgrade" : "Subscribe"}
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {!isSubscribed && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center">
                💚 <strong>100% of profits fund environmental projects</strong> voted on by the community
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
