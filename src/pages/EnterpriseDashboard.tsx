import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Download, TrendingUp, Shield, Award, FileText } from "lucide-react";
import { toast } from "sonner";

export default function EnterpriseDashboard() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [badge, setBadge] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSpent: 0,
    datasetsOwned: 0,
    lastDownload: null,
    ecoContribution: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load purchases
      const { data: purchaseData } = await (supabase as any)
        .from("purchases")
        .select("*, datasets(*)")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (purchaseData) {
        setPurchases(purchaseData);
        
        const totalSpent = purchaseData.reduce((sum, p) => sum + Number(p.amount_paid), 0);
        const ecoContribution = totalSpent * 0.1; // 10% goes to eco projects
        
        setStats({
          totalSpent,
          datasetsOwned: purchaseData.length,
          lastDownload: purchaseData[0]?.last_downloaded_at || null,
          ecoContribution
        });
      }

      // Load enterprise badge
      const { data: badgeData } = await (supabase as any)
        .from("enterprise_badges")
        .select("*")
        .eq("user_id", user.id)
        .eq("verified", true)
        .single();

      if (badgeData) setBadge(badgeData);

    } catch (error) {
      console.error("Error loading enterprise dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadEmbedCode = () => {
    const embedHTML = `
<!-- DataForEarth Verified Buyer Badge -->
<div style="padding: 20px; border: 2px solid #10b981; border-radius: 8px; max-width: 300px; text-align: center;">
  <img src="${badge?.badge_image_url || 'https://dataforearth.org/badge.png'}" alt="Verified Buyer" style="width: 100px; height: 100px;" />
  <h3 style="margin: 10px 0;">${badge?.badge_tier.toUpperCase()} Impact Partner</h3>
  <p style="color: #6b7280; font-size: 14px;">Verified by DataForEarth</p>
  <a href="https://dataforearth.org/verify/${badge?.badge_code}" style="color: #10b981; font-size: 12px;">Verify Badge</a>
</div>
    `.trim();

    const blob = new Blob([embedHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dataforearth-badge.html";
    a.click();
    
    toast.success("Badge embed code downloaded");
  };

  const downloadJSONLD = () => {
    const jsonLD = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Your Organization",
      "sustainabilityPartner": {
        "@type": "Organization",
        "name": "DataForEarth",
        "url": "https://dataforearth.org"
      },
      "esgMetrics": {
        "dataEthicsScore": badge?.badge_tier,
        "sustainabilityContribution": stats.ecoContribution,
        "verifiedPurchases": stats.datasetsOwned
      }
    };

    const blob = new Blob([JSON.stringify(jsonLD, null, 2)], { type: "application/ld+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "esg-data.jsonld";
    a.click();
    
    toast.success("ESG JSON-LD downloaded");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">Your data impact and ESG reporting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Datasets Owned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.datasetsOwned}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eco Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">${stats.ecoContribution.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Impact Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-lg">
                {badge?.badge_tier || "Not Verified"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {badge && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Your Enterprise Badge</CardTitle>
                    <CardDescription>Verified data ethics certification</CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="text-lg">
                  {badge.badge_tier.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={downloadEmbedCode} variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Download Badge
                </Button>
                <Button onClick={downloadJSONLD} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  ESG JSON-LD
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Badge Code: <code className="bg-muted px-2 py-1 rounded">{badge.badge_code}</code>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>{purchases.length} datasets purchased</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{purchase.datasets?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${Number(purchase.amount_paid).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {purchase.download_count || 0} downloads
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
