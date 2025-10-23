import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  Zap,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings as SettingsIcon
} from 'lucide-react';

interface ReleasePolicy {
  id: string;
  channel: string;
  min_days_between_releases: number;
  max_datasets_per_week: number;
  min_confidence: number;
  min_quality_tier: string;
  last_release_at: string | null;
  burst_mode_enabled: boolean;
  burst_reason: string | null;
}

interface BuildFilters {
  category: string;
  tags: string;
  minConfidence: string;
  quality: string;
  limitSupply: string;
  price: string;
}

export default function DatasetPublisher() {
  const [policies, setPolicies] = useState<ReleasePolicy[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('on_site');
  const [buildFilters, setBuildFilters] = useState<BuildFilters>({
    category: '',
    tags: '',
    minConfidence: '0.7',
    quality: 'silver',
    limitSupply: '',
    price: '99.99'
  });
  const [burstReason, setBurstReason] = useState('');
  const [building, setBuilding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getReleasePolicy();
      if (result.success) {
        setPolicies(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPolicy = () => {
    return policies.find(p => p.channel === selectedChannel);
  };

  const canPublish = () => {
    const policy = getCurrentPolicy();
    if (!policy) return false;
    
    if (policy.burst_mode_enabled) return true;
    
    if (!policy.last_release_at) return true;
    
    const daysSince = Math.floor(
      (Date.now() - new Date(policy.last_release_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSince >= policy.min_days_between_releases;
  };

  const handleBuildDataset = async () => {
    setBuilding(true);
    try {
      const filters = {
        category: buildFilters.category || undefined,
        tags: buildFilters.tags ? buildFilters.tags.split(',').map(t => t.trim()) : undefined,
        minConfidence: parseFloat(buildFilters.minConfidence),
        quality: buildFilters.quality,
        limitSupply: buildFilters.limitSupply ? parseInt(buildFilters.limitSupply) : undefined,
        price: parseFloat(buildFilters.price),
        burstMode: getCurrentPolicy()?.burst_mode_enabled || false
      };

      const result = await window.electronAPI.buildDataset(selectedChannel, filters);
      
      if (result.success) {
        alert(`Dataset built successfully!\nID: ${result.data.dataset_id}\nName: ${result.data.name}`);
        loadPolicies();
      } else {
        alert(`Failed to build dataset: ${result.error}`);
      }
    } catch (error) {
      console.error('Build failed:', error);
      alert(`Build error: ${error}`);
    } finally {
      setBuilding(false);
    }
  };

  const handleEnableBurstMode = async () => {
    if (!burstReason.trim()) {
      alert('Please provide a reason for burst mode');
      return;
    }

    try {
      const result = await window.electronAPI.triggerBurstMode(burstReason);
      if (result.success) {
        alert('Burst mode enabled! Next publish will bypass throttles.');
        setBurstReason('');
        loadPolicies();
      }
    } catch (error) {
      console.error('Failed to enable burst mode:', error);
    }
  };

  const handleUpdatePolicy = async (policyId: string, updates: any) => {
    try {
      const result = await window.electronAPI.updateReleasePolicy({
        id: policyId,
        ...updates
      });
      
      if (result.success) {
        loadPolicies();
      }
    } catch (error) {
      console.error('Failed to update policy:', error);
    }
  };

  const policy = getCurrentPolicy();
  const publishEnabled = canPublish();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">Loading publisher...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Channel Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Dataset Publisher
          </CardTitle>
          <CardDescription>
            Build and publish datasets to marketplaces with throttle controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={selectedChannel === 'on_site' ? 'default' : 'outline'}
              onClick={() => setSelectedChannel('on_site')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Package className="w-6 h-6" />
              <div>
                <div className="font-semibold">On-Site Marketplace</div>
                <div className="text-xs text-muted-foreground">DataForEarth.com</div>
              </div>
            </Button>

            <Button
              variant={selectedChannel === 'external' ? 'default' : 'outline'}
              onClick={() => setSelectedChannel('external')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              <div>
                <div className="font-semibold">External Channels</div>
                <div className="text-xs text-muted-foreground">B2B & Partners</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Release Policy Status */}
      {policy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Release Policy - {selectedChannel === 'on_site' ? 'On-Site' : 'External'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Min Days Between</Label>
                <div className="text-2xl font-bold">{policy.min_days_between_releases}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max Per Week</Label>
                <div className="text-2xl font-bold">{policy.max_datasets_per_week}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Min Confidence</Label>
                <div className="text-2xl font-bold">{(policy.min_confidence * 100).toFixed(0)}%</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Min Quality</Label>
                <Badge className="text-sm mt-1">{policy.min_quality_tier}</Badge>
              </div>
            </div>

            {policy.last_release_at && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Last Release:</span>
                  <span>{new Date(policy.last_release_at).toLocaleString()}</span>
                  <span className="text-muted-foreground">
                    ({Math.floor((Date.now() - new Date(policy.last_release_at).getTime()) / (1000 * 60 * 60 * 24))} days ago)
                  </span>
                </div>
              </div>
            )}

            {/* Publish Status */}
            <div className={`p-4 rounded-lg ${publishEnabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
              <div className="flex items-center gap-2">
                {publishEnabled ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-500">Ready to Publish</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-yellow-500">Throttle Active</span>
                  </>
                )}
              </div>
              {!publishEnabled && !policy.burst_mode_enabled && (
                <p className="text-sm text-muted-foreground mt-2">
                  Must wait {policy.min_days_between_releases - Math.floor((Date.now() - new Date(policy.last_release_at!).getTime()) / (1000 * 60 * 60 * 24))} more days before next release.
                </p>
              )}
            </div>

            {/* Burst Mode */}
            {policy.burst_mode_enabled ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">Burst Mode Active</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Reason:</strong> {policy.burst_reason}
                </p>
                <p className="text-xs text-muted-foreground">
                  Will auto-disable after next successful publish
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="burst-reason">Enable Burst Mode (Override Throttles)</Label>
                <Textarea
                  id="burst-reason"
                  placeholder="Reason: e.g., trending topic, conference, external demand spike"
                  value={burstReason}
                  onChange={(e) => setBurstReason(e.target.value)}
                  rows={2}
                />
                <Button 
                  onClick={handleEnableBurstMode}
                  variant="outline"
                  disabled={!burstReason.trim()}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Enable Burst Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Build Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Build Configuration</CardTitle>
          <CardDescription>Configure filters for dataset assembly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., carbon_offsets"
                value={buildFilters.category}
                onChange={(e) => setBuildFilters({ ...buildFilters, category: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., climate, verified, high-impact"
                value={buildFilters.tags}
                onChange={(e) => setBuildFilters({ ...buildFilters, tags: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="min-confidence">Min Confidence (0-1)</Label>
              <Input
                id="min-confidence"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={buildFilters.minConfidence}
                onChange={(e) => setBuildFilters({ ...buildFilters, minConfidence: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="quality">Min Quality Tier</Label>
              <Select value={buildFilters.quality} onValueChange={(v) => setBuildFilters({ ...buildFilters, quality: v })}>
                <SelectTrigger id="quality">
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

            <div>
              <Label htmlFor="limit-supply">Limited Supply (Optional)</Label>
              <Input
                id="limit-supply"
                type="number"
                placeholder="e.g., 50 for scarcity"
                value={buildFilters.limitSupply}
                onChange={(e) => setBuildFilters({ ...buildFilters, limitSupply: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={buildFilters.price}
                onChange={(e) => setBuildFilters({ ...buildFilters, price: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={handleBuildDataset}
            disabled={building || (!publishEnabled && !policy?.burst_mode_enabled)}
            className="w-full h-12"
            size="lg"
          >
            {building ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Building Dataset...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                Build & Publish Dataset
              </>
            )}
          </Button>

          {!publishEnabled && !policy?.burst_mode_enabled && (
            <p className="text-sm text-yellow-600 text-center">
              ⚠️ Publishing is throttled. Enable burst mode to override.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
