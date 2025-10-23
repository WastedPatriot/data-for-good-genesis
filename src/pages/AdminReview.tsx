import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Flag, RefreshCw, Filter } from "lucide-react";

interface ReviewItem {
  id: string;
  created_at: string;
  source_type: string;
  source_reference: string;
  raw_payload: any;
  normalized_payload: any;
  category: string;
  tags: string[];
  confidence_score: number;
  quality_tier: string;
  provenance_hash: string;
  status: string;
  duplicate_of?: string;
  similar_items?: any[];
}

export default function AdminReview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: "pending",
    category: "",
    minConfidence: "0",
    quality: "",
    source: "",
  });
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkPublishDecision, setBulkPublishDecision] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (loading === false) {
      fetchItems();
    }
  }, [filters, loading]);

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

      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  };

  const fetchItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.minConfidence) params.append("minConfidence", filters.minConfidence);
      if (filters.quality) params.append("quality", filters.quality);
      if (filters.source) params.append("source", filters.source);

      const { data, error } = await supabase.functions.invoke("review-queue-fetch", {
        body: Object.fromEntries(params),
      });

      if (error) throw error;

      setItems(data.items || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAction = async (itemId: string, action: "approve" | "reject" | "flag") => {
    try {
      const { error } = await supabase.functions.invoke("review-queue-update", {
        body: {
          itemId,
          action,
          notes: bulkNotes,
          publishDecision: bulkPublishDecision || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Item ${action}ed successfully`,
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to perform bulk action",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const itemId of selectedItems) {
        await handleAction(itemId, action);
      }

      setSelectedItems(new Set());
      setBulkNotes("");
      setBulkPublishDecision("");

      toast({
        title: "Success",
        description: `Bulk ${action} completed`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(items.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
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
      <div className="container mx-auto max-w-7xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
            <CardDescription>
              Review and curate data submissions before publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              />

              <Input
                placeholder="Min Confidence (0-1)"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={filters.minConfidence}
                onChange={(e) => setFilters({ ...filters, minConfidence: e.target.value })}
              />

              <Select value={filters.quality} onValueChange={(v) => setFilters({ ...filters, quality: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Quality Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="user_contribution">User</SelectItem>
                  <SelectItem value="external_scraper">Scraper</SelectItem>
                  <SelectItem value="aggregated">Aggregated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-4 mb-6 flex-wrap">
              <Button onClick={selectAll} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={deselectAll} variant="outline" size="sm">
                Deselect All
              </Button>
              <Button onClick={fetchItems} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <div className="flex-1" />
              <Button
                onClick={() => handleBulkAction("approve")}
                variant="default"
                size="sm"
                disabled={selectedItems.size === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected ({selectedItems.size})
              </Button>
              <Button
                onClick={() => handleBulkAction("reject")}
                variant="destructive"
                size="sm"
                disabled={selectedItems.size === 0}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Selected ({selectedItems.size})
              </Button>
            </div>

            {/* Bulk Notes */}
            {selectedItems.size > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Textarea
                  placeholder="Bulk review notes (optional)"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  rows={3}
                />
                <Select value={bulkPublishDecision} onValueChange={setBulkPublishDecision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Publish Decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="on_site_only">On-Site Only</SelectItem>
                    <SelectItem value="external_only">External Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-4">
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No items found</p>
              ) : (
                items.map((item) => (
                  <Card key={item.id} className={selectedItems.has(item.id) ? "border-primary" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleSelection(item.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              item.quality_tier === "platinum" ? "default" :
                              item.quality_tier === "gold" ? "secondary" :
                              "outline"
                            }>
                              {item.quality_tier}
                            </Badge>
                            <Badge variant="outline">{item.source_type}</Badge>
                            <Badge variant="outline">Confidence: {(item.confidence_score * 100).toFixed(0)}%</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">
                            <strong>Category:</strong> {item.category}
                          </p>
                          {item.tags && item.tags.length > 0 && (
                            <p className="text-sm mb-2">
                              <strong>Tags:</strong> {item.tags.join(", ")}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground font-mono truncate">
                            {item.provenance_hash}
                          </p>
                          {item.duplicate_of && (
                            <Badge variant="destructive" className="mt-2">
                              Duplicate Detected
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAction(item.id, "approve")}
                            disabled={item.status !== "pending"}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(item.id, "reject")}
                            disabled={item.status !== "pending"}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(item.id, "flag")}
                            disabled={item.status !== "pending"}
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
