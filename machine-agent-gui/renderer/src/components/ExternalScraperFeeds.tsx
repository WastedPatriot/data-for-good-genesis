import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { toast } from "../components/ui/use-toast";
import { CheckCircle2, XCircle, Clock, FileText, Send, Loader2 } from "lucide-react";

interface ScraperRecord {
  id: string;
  source: string;
  timestamp: string;
  preview: string;
  approved: boolean;
  category: string;
}

export default function ExternalScraperFeeds() {
  const [records, setRecords] = useState<ScraperRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [autoApprove, setAutoApprove] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    loadQueuedRecords();
  }, []);

  const loadQueuedRecords = async () => {
    setLoading(true);
    try {
      // Load scraped data from local file or API
      // For now, simulate with sample data
      const sampleRecords: ScraperRecord[] = [
        {
          id: "1",
          source: "eco_sentiment",
          timestamp: new Date().toISOString(),
          preview: "Positive sentiment: Renewable energy investments surge...",
          approved: false,
          category: "Environmental News"
        },
        {
          id: "2",
          source: "ev_demand",
          timestamp: new Date().toISOString(),
          preview: "North America: EV interest score 87, wait time 12 weeks",
          approved: false,
          category: "Automotive"
        },
        {
          id: "3",
          source: "sustainability_keywords",
          timestamp: new Date().toISOString(),
          preview: "Keyword 'zero waste': Rising trend, 15K searches",
          approved: false,
          category: "Sustainability"
        }
      ];

      setRecords(sampleRecords);
    } catch (error: any) {
      toast({
        title: "Load Error",
        description: error.message || "Failed to load queued records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedRecords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRecords(newSet);
  };

  const selectAll = () => {
    const filteredIds = getFilteredRecords().map(r => r.id);
    setSelectedRecords(new Set(filteredIds));
  };

  const deselectAll = () => {
    setSelectedRecords(new Set());
  };

  const approveSelected = async () => {
    if (selectedRecords.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select records to approve",
        variant: "destructive"
      });
      return;
    }

    setIngesting(true);
    try {
      // In production: Call external-ingest endpoint with selected records
      const selectedData = records.filter(r => selectedRecords.has(r.id));

      console.log("Ingesting records:", selectedData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mark as approved and remove from queue
      setRecords(prev => prev.filter(r => !selectedRecords.has(r.id)));
      setSelectedRecords(new Set());

      toast({
        title: "Success",
        description: `${selectedData.length} records ingested successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Ingestion Error",
        description: error.message || "Failed to ingest records",
        variant: "destructive"
      });
    } finally {
      setIngesting(false);
    }
  };

  const rejectSelected = () => {
    if (selectedRecords.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select records to reject",
        variant: "destructive"
      });
      return;
    }

    // Remove rejected records
    setRecords(prev => prev.filter(r => !selectedRecords.has(r.id)));
    setSelectedRecords(new Set());

    toast({
      title: "Rejected",
      description: `${selectedRecords.size} records rejected`,
    });
  };

  const getFilteredRecords = () => {
    if (!categoryFilter) return records;
    return records.filter(r => 
      r.category.toLowerCase().includes(categoryFilter.toLowerCase())
    );
  };

  const filteredRecords = getFilteredRecords();
  const categories = Array.from(new Set(records.map(r => r.category)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>External Scraper Feeds</CardTitle>
          <CardDescription>
            Review and approve scraped data before ingestion into the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-approve"
                checked={autoApprove}
                onCheckedChange={(checked) => setAutoApprove(checked as boolean)}
              />
              <Label htmlFor="auto-approve" className="text-sm font-medium">
                Auto-approve future records
              </Label>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Filter by category..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>

            <Button onClick={loadQueuedRecords} variant="outline" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Refresh
            </Button>
          </div>

          {/* Category Badges */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Categories:</span>
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </Badge>
              ))}
              {categoryFilter && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter("")}
                >
                  Clear Filter
                </Badge>
              )}
            </div>
          )}

          {/* Selection Controls */}
          <div className="flex items-center gap-2">
            <Button onClick={selectAll} variant="ghost" size="sm">
              Select All
            </Button>
            <Button onClick={deselectAll} variant="ghost" size="sm">
              Deselect All
            </Button>
            <span className="text-sm text-muted-foreground ml-auto">
              {selectedRecords.size} of {filteredRecords.length} selected
            </span>
          </div>

          {/* Records List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                Loading records...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No queued records</p>
                <p className="text-sm">Run scraper to populate this feed</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                    selectedRecords.has(record.id)
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedRecords.has(record.id)}
                    onCheckedChange={() => toggleSelection(record.id)}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {record.source}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {record.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{record.preview}</p>
                  </div>
                  {record.approved && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={approveSelected}
              disabled={selectedRecords.size === 0 || ingesting}
              className="flex-1"
            >
              {ingesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingesting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Approve & Ingest ({selectedRecords.size})
                </>
              )}
            </Button>
            <Button
              onClick={rejectSelected}
              variant="destructive"
              disabled={selectedRecords.size === 0 || ingesting}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingestion Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{records.length}</div>
              <div className="text-xs text-muted-foreground">Queued</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-xs text-muted-foreground">Approved Today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-xs text-muted-foreground">Rejected Today</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
