import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, Signal, Calendar, Download, QrCode, Settings, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ESIMPurchase } from "@/types/esim";
import { QRCodeSVG } from "qrcode.react";


const MyESIMs = () => {
  const navigate = useNavigate();
  const [selectedESIM, setSelectedESIM] = useState<ESIMPurchase | null>(null);

  const { toast } = useToast();
  const [purchases, setPurchases] = useState<ESIMPurchase[]>([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      const { data, error } = await supabase
        .from("esim_purchases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load eSIMs", error);
        toast({ title: "Error", description: "Could not load your eSIMs", variant: "destructive" });
        return;
      }
      setPurchases((data || []) as ESIMPurchase[]);
    };

    fetchPurchases();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "expired": return "bg-red-500";
      case "pending": return "bg-yellow-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const parseGB = (text: string | null | undefined) => {
    if (!text) return 0;
    const n = parseFloat(text.toString().toLowerCase().replace("gb", "").trim());
    return isNaN(n) ? 0 : n;
  };

  const getDaysLeft = (expires_at?: string) => {
    if (!expires_at) return 0;
    const diff = new Date(expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getDataUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getDaysPercentage = (left: number, total: number) => {
    return total > 0 ? ((total - left) / total) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 via-primary/10 to-background pt-8 pb-12 px-4"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">My eSIMs</h1>
            <Button onClick={() => navigate('/esim/marketplace')} className="gap-2">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </div>
          <p className="text-muted-foreground">Manage your active data plans</p>
        </div>
      </motion.div>

      <div className="container mx-auto max-w-4xl px-4 mt-8">
        {purchases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Smartphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Active eSIMs</h2>
            <p className="text-muted-foreground mb-6">Get your first eSIM plan to start connecting worldwide</p>
            <Button onClick={() => navigate('/esim/marketplace')} size="lg">
              Browse Plans
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {purchases.map((esim, index) => {
              const dataUsed = esim.data_used ?? 0;
              const dataTotal = parseGB(esim.data_amount);
              const daysLeft = getDaysLeft(esim.expires_at || undefined);
              const totalDays = esim.duration;
              const installed = !!esim.activated_at;

              return (
                <motion.div
                  key={esim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {esim.country?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-xl">{esim.country}</CardTitle>
                            <CardDescription>{esim.data_amount} Plan</CardDescription>
                          </div>
                        </div>
                        <Badge variant={esim.status === 'active' ? 'default' : 'secondary'}>
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(esim.status)} mr-1`}></span>
                          {esim.status.charAt(0).toUpperCase() + esim.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Data Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Data Usage</span>
                          <span className="font-medium">
                            {dataUsed}GB / {dataTotal}GB
                          </span>
                        </div>
                        <Progress value={getDataUsagePercentage(dataUsed, dataTotal)} className="h-2" />
                        {dataTotal > 0 && dataUsed / Math.max(dataTotal, 1) > 0.8 && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Running low on data. Consider topping up or getting a new plan.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Time Remaining */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Time Remaining</span>
                          <span className="font-medium">{daysLeft} days left</span>
                        </div>
                        <Progress value={getDaysPercentage(daysLeft, totalDays)} className="h-2" />
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                        <div className="text-center">
                          <Signal className="w-5 h-5 text-primary mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm font-medium">{installed ? 'Installed' : 'Pending'}</p>
                        </div>
                        <div className="text-center">
                          <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Valid Until</p>
                          <p className="text-sm font-medium">
                            {esim.expires_at ? new Date(esim.expires_at).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <div className="text-center">
                          <Download className="w-5 h-5 text-primary mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Speed</p>
                          <p className="text-sm font-medium">4G/5G</p>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1" onClick={() => setSelectedESIM(esim)}>
                            <QrCode className="w-4 h-4 mr-2" />
                            View QR Code
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>eSIM Installation</DialogTitle>
                            <DialogDescription>
                              Scan this QR code on your device to install the eSIM
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col items-center py-6">
                            {esim.esim_qr_code || esim.esim_activation_code ? (
                              <QRCodeSVG value={(esim.esim_qr_code || esim.esim_activation_code)!} size={256} />
                            ) : (
                              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
                                <QrCode className="w-32 h-32 text-muted-foreground" />
                              </div>
                            )}
                            <p className="text-sm text-muted-foreground text-center mt-4">
                              Go to Settings → Cellular → Add Cellular Plan
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}

            {/* Top Up Suggestion */}
            <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Need More Data?</CardTitle>
                <CardDescription>Top up your existing plan or get a new one</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/esim/marketplace')}>
                  Browse Plans
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyESIMs;
