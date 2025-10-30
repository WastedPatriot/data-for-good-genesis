import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReviewQueueItem {
  id: string;
  category: string;
  status: string;
  confidence_score: number;
  quality_tier: string;
  tags: string[];
  created_at: string;
  reviewed_at: string | null;
  raw_payload: any;
  normalized_payload: any;
  provenance_hash: string;
  source_type?: string;
  source_reference?: string;
  reviewed_by?: string;
  review_notes?: string;
}

interface Stats {
  total_records: number;
  pending: number;
  approved: number;
  rejected: number;
  curated_pool: number;
  avg_confidence: number;
  quality_breakdown: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
}

export function DataHarvestDashboard() {
  const [records, setRecords] = useState<ReviewQueueItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_records: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    curated_pool: 0,
    avg_confidence: 0,
    quality_breakdown: { platinum: 0, gold: 0, silver: 0, bronze: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load records based on active tab
      const { data: reviewData, error: reviewError } = await supabase
        .from('review_queue')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reviewError) throw reviewError;
      setRecords(reviewData || []);

      // Load statistics
      const [totalResult, pendingResult, approvedResult, rejectedResult, curatedResult, avgResult] = await Promise.all([
        supabase.from('review_queue').select('id', { count: 'exact', head: true }),
        supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('curated_pool').select('id', { count: 'exact', head: true }),
        supabase.from('review_queue').select('confidence_score')
      ]);

      // Calculate quality breakdown
      const qualityBreakdown = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
      reviewData?.forEach(item => {
        const tier = item.quality_tier?.toLowerCase() as keyof typeof qualityBreakdown;
        if (tier && qualityBreakdown.hasOwnProperty(tier)) {
          qualityBreakdown[tier]++;
        }
      });

      const avgConfidence = avgResult.data?.length 
        ? avgResult.data.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / avgResult.data.length
        : 0;

      setStats({
        total_records: totalResult.count || 0,
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        curated_pool: curatedResult.count || 0,
        avg_confidence: avgConfidence,
        quality_breakdown: qualityBreakdown
      });
    } catch (error) {
      console.error('Failed to load harvest data:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to fetch harvest statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('review_queue')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Item approved',
        description: 'Item will be moved to curated pool'
      });
      
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve item',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('review_queue')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Item rejected',
        description: 'Item has been rejected'
      });
      
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject item',
        variant: 'destructive'
      });
    }
  };

  const getQualityColor = (tier: string) => {
    const colors: Record<string, string> = {
      platinum: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      gold: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
      silver: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
      bronze: 'bg-orange-500/10 text-orange-700 dark:text-orange-300'
    };
    return colors[tier?.toLowerCase()] || 'bg-gray-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_records}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In review queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting curation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for datasets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Curated Pool</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.curated_pool}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for packaging
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Quality Distribution
          </CardTitle>
          <CardDescription>
            Average confidence: {(stats.avg_confidence * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge className="bg-purple-500/10 text-purple-700">Platinum</Badge>
              </span>
              <span>{stats.quality_breakdown.platinum}</span>
            </div>
            <Progress value={(stats.quality_breakdown.platinum / stats.total_records) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge className="bg-yellow-500/10 text-yellow-700">Gold</Badge>
              </span>
              <span>{stats.quality_breakdown.gold}</span>
            </div>
            <Progress value={(stats.quality_breakdown.gold / stats.total_records) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge className="bg-gray-500/10 text-gray-700">Silver</Badge>
              </span>
              <span>{stats.quality_breakdown.silver}</span>
            </div>
            <Progress value={(stats.quality_breakdown.silver / stats.total_records) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge className="bg-orange-500/10 text-orange-700">Bronze</Badge>
              </span>
              <span>{stats.quality_breakdown.bronze}</span>
            </div>
            <Progress value={(stats.quality_breakdown.bronze / stats.total_records) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Review Queue Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Review Queue
              </CardTitle>
              <CardDescription>Manage harvested data records</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Created</TableHead>
                      {activeTab === 'pending' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <p className="text-muted-foreground">Loading records...</p>
                        </TableCell>
                      </TableRow>
                    ) : records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No {activeTab} records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.source_type || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.category || 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getQualityColor(record.quality_tier)}>
                              {record.quality_tier || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(record.confidence_score || 0) * 100} 
                                className="w-16 h-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {((record.confidence_score || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString()}
                          </TableCell>
                          {activeTab === 'pending' && (
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(record.id)}
                                >
                                  <ThumbsUp className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(record.id)}
                                >
                                  <ThumbsDown className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
