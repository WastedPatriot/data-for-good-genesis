import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Filter,
  Download,
  Upload,
  Zap,
  Eye,
  BarChart3,
  Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface DataRecord {
  id: string;
  source: string;
  category: string;
  confidence_score: number;
  quality_tier: string;
  status: string;
  created_at: string;
  tags: string[];
  preview: string;
}

interface HarvestStats {
  total_records: number;
  pending_review: number;
  approved: number;
  rejected: number;
  avg_confidence: number;
  quality_breakdown: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
}

export default function DataHarvestHub() {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [stats, setStats] = useState<HarvestStats>({
    total_records: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    avg_confidence: 0,
    quality_breakdown: { platinum: 0, gold: 0, silver: 0, bronze: 0 }
  });
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: 'pending',
    category: '',
    quality: '',
    minConfidence: '0.5'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHarvestData();
    loadStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHarvestData();
      loadStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filters]);

  const loadHarvestData = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.fetchReviewQueue(
        filters.status,
        {
          category: filters.category || undefined,
          minConfidence: filters.minConfidence,
          quality: filters.quality || undefined
        }
      );
      
      if (result.success) {
        setRecords(result.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load harvest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await window.electronAPI.querySupabase(
        'review_queue?select=status,confidence_score,quality_tier'
      );
      
      if (result.success && result.data) {
        const data = result.data;
        const pending = data.filter((r: any) => r.status === 'pending').length;
        const approved = data.filter((r: any) => r.status === 'approved').length;
        const rejected = data.filter((r: any) => r.status === 'rejected').length;
        const avgConf = data.reduce((sum: number, r: any) => sum + (r.confidence_score || 0), 0) / data.length;
        
        const qualityBreakdown = {
          platinum: data.filter((r: any) => r.quality_tier === 'platinum').length,
          gold: data.filter((r: any) => r.quality_tier === 'gold').length,
          silver: data.filter((r: any) => r.quality_tier === 'silver').length,
          bronze: data.filter((r: any) => r.quality_tier === 'bronze').length
        };
        
        setStats({
          total_records: data.length,
          pending_review: pending,
          approved,
          rejected,
          avg_confidence: avgConf || 0,
          quality_breakdown: qualityBreakdown
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    for (const id of selectedRecords) {
      try {
        if (action === 'approve') {
          await window.electronAPI.approveReviewItem(id, 'Bulk approved');
        } else {
          await window.electronAPI.rejectReviewItem(id, 'Bulk rejected');
        }
      } catch (error) {
        console.error(`Failed to ${action} record ${id}:`, error);
      }
    }
    
    setSelectedRecords(new Set());
    loadHarvestData();
    loadStats();
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const selectAll = () => {
    setSelectedRecords(new Set(records.map(r => r.id)));
  };

  const deselectAll = () => {
    setSelectedRecords(new Set());
  };

  const getQualityColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-500';
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      case 'bronze': return 'bg-orange-700';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_records}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_review}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.avg_confidence * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quality Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(stats.quality_breakdown).map(([tier, count]) => (
              <div key={tier} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{tier}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
                <Progress 
                  value={(count / stats.total_records) * 100} 
                  className={getQualityColor(tier)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Data Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadHarvestData} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedRecords.size > 0 && (
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <Button onClick={selectAll} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={deselectAll} variant="outline" size="sm">
                Deselect All
              </Button>
              <div className="flex-1" />
              <Badge variant="secondary" className="px-3 py-1">
                {selectedRecords.size} selected
              </Badge>
              <Button 
                onClick={() => handleBulkAction('approve')} 
                variant="default" 
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected
              </Button>
              <Button 
                onClick={() => handleBulkAction('reject')} 
                variant="destructive" 
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Harvested Data Records</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${records.length} records found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading harvest data...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No records found matching filters
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <Card key={record.id} className={selectedRecords.has(record.id) ? 'border-primary' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedRecords.has(record.id)}
                        onCheckedChange={() => toggleSelection(record.id)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={record.quality_tier === 'platinum' ? 'default' : 'outline'}>
                            {record.quality_tier}
                          </Badge>
                          <Badge variant="secondary">{record.source}</Badge>
                          <Badge variant="outline">
                            {(record.confidence_score * 100).toFixed(0)}% Confidence
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{record.category}</p>
                        {record.tags && record.tags.length > 0 && (
                          <div className="flex gap-2">
                            {record.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {record.preview}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={async () => {
                            await window.electronAPI.approveReviewItem(record.id, 'Approved');
                            loadHarvestData();
                            loadStats();
                          }}
                          disabled={record.status !== 'pending'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            await window.electronAPI.rejectReviewItem(record.id, 'Rejected');
                            loadHarvestData();
                            loadStats();
                          }}
                          disabled={record.status !== 'pending'}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
