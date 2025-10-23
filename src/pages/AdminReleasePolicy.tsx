import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Zap } from "lucide-react";

interface ReleasePolicy {
  id: string;
  channel: string;
  min_days_between_releases: number;
  max_datasets_per_week: number;
  min_confidence: number;
  min_quality_tier: string;
  burst_mode_enabled: boolean;
  burst_reason: string | null;
  burst_activated_at: string | null;
  last_release_at: string | null;
}

export default function AdminReleasePolicy() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<ReleasePolicy[]>([]);
  const [burstReason, setBurstReason] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/");
        return;
      }

      fetchPolicies();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  };

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from("release_policy")
        .select("*")
        .order("channel");

      if (error) throw error;

      setPolicies(data || []);
      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePolicy = async (policyId: string, updates: Partial<ReleasePolicy>) => {
    try {
      const { error } = await supabase
        .from("release_policy")
        .update(updates)
        .eq("id", policyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Policy updated successfully",
      });

      fetchPolicies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const enableBurstMode = async (policyId: string) => {
    if (!burstReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for burst mode",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("release_policy")
        .update({
          burst_mode_enabled: true,
          burst_reason: burstReason,
          burst_activated_at: new Date().toISOString(),
        })
        .eq("id", policyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Burst mode enabled",
      });

      setBurstReason("");
      fetchPolicies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-black mb-8 text-gradient">Release Policy Management</h1>

        <div className="space-y-6">
          {policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader>
                <CardTitle className="capitalize">{policy.channel} Channel</CardTitle>
                <CardDescription>
                  Configure throttling and burst mode for this publishing channel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Throttling Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`min-days-${policy.id}`}>Min Days Between Releases</Label>
                    <Input
                      id={`min-days-${policy.id}`}
                      type="number"
                      value={policy.min_days_between_releases}
                      onChange={(e) =>
                        updatePolicy(policy.id, {
                          min_days_between_releases: parseInt(e.target.value),
                        })
                      }
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`max-datasets-${policy.id}`}>Max Datasets Per Week</Label>
                    <Input
                      id={`max-datasets-${policy.id}`}
                      type="number"
                      value={policy.max_datasets_per_week}
                      onChange={(e) =>
                        updatePolicy(policy.id, {
                          max_datasets_per_week: parseInt(e.target.value),
                        })
                      }
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`min-conf-${policy.id}`}>Min Confidence (0-1)</Label>
                    <Input
                      id={`min-conf-${policy.id}`}
                      type="number"
                      step="0.05"
                      value={policy.min_confidence}
                      onChange={(e) =>
                        updatePolicy(policy.id, {
                          min_confidence: parseFloat(e.target.value),
                        })
                      }
                      min="0"
                      max="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`min-quality-${policy.id}`}>Min Quality Tier</Label>
                    <Select
                      value={policy.min_quality_tier}
                      onValueChange={(value) =>
                        updatePolicy(policy.id, { min_quality_tier: value })
                      }
                    >
                      <SelectTrigger id={`min-quality-${policy.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Last Release Info */}
                {policy.last_release_at && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Last Release:</strong>{" "}
                      {new Date(policy.last_release_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Burst Mode */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Burst Mode
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Override throttles for emergency releases
                      </p>
                    </div>
                    <Switch
                      checked={policy.burst_mode_enabled}
                      onCheckedChange={(checked) =>
                        updatePolicy(policy.id, {
                          burst_mode_enabled: checked,
                          burst_reason: checked ? burstReason : null,
                        })
                      }
                    />
                  </div>

                  {policy.burst_mode_enabled ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm mb-2">
                        <strong>Reason:</strong> {policy.burst_reason}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Activated: {new Date(policy.burst_activated_at!).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Burst mode will automatically disable after the next release
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Reason for enabling burst mode (e.g., trending topic, conference, external demand)"
                        value={burstReason}
                        onChange={(e) => setBurstReason(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={() => enableBurstMode(policy.id)}
                        variant="outline"
                        disabled={!burstReason.trim()}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Enable Burst Mode
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
