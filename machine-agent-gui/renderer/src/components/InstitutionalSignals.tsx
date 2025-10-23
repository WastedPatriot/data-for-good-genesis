import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity,
  Zap,
  Target,
  BarChart3,
  ShieldAlert
} from 'lucide-react';

interface SignalData {
  risk_index: number;
  volatility_score: number;
  momentum_score: number;
  forward_pressure_score: number;
  sector_breakdown: Record<string, number>;
  anomaly_flags: string[];
  trend_indicators: Record<string, string>;
}

export const InstitutionalSignals = () => {
  const [signals, setSignals] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchSignals = async () => {
    setLoading(true);
    try {
      // In production: fetch from machine-agent backend
      // Simulate institutional signals data
      const mockSignals: SignalData = {
        risk_index: 67.5,
        volatility_score: 42.3,
        momentum_score: -15.8,
        forward_pressure_score: 73.2,
        sector_breakdown: {
          "Energy": 12,
          "Manufacturing": 8,
          "Technology": 5,
          "Transportation": 7
        },
        anomaly_flags: ["RISK_INDEX_SPIKE", "VOLATILITY_SURGE"],
        trend_indicators: {
          carbon_pricing: "Rising",
          regulatory_enforcement: "Increasing",
          climate_disasters: "Escalating"
        }
      };
      
      setSignals(mockSignals);
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-500';
    if (risk >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getMomentumIcon = (momentum: number) => {
    return momentum > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Institutional Signals</h2>
          <p className="text-muted-foreground">Real-time ESG & climate risk analysis</p>
        </div>
        <Button onClick={fetchSignals} disabled={loading}>
          <Activity className="mr-2 h-4 w-4" />
          {loading ? 'Updating...' : 'Refresh Signals'}
        </Button>
      </div>

      {lastUpdate && (
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdate}</p>
      )}

      {signals && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Index</CardTitle>
                <ShieldAlert className={`h-4 w-4 ${getRiskColor(signals.risk_index)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signals.risk_index}</div>
                <Progress value={signals.risk_index} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {signals.risk_index >= 70 ? 'High Risk' : signals.risk_index >= 50 ? 'Medium Risk' : 'Low Risk'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volatility Score</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signals.volatility_score}</div>
                <Progress value={signals.volatility_score} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Market stability index
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Momentum Score</CardTitle>
                {getMomentumIcon(signals.momentum_score)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signals.momentum_score}</div>
                <div className="h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${signals.momentum_score > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(signals.momentum_score) / 2}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {signals.momentum_score > 0 ? 'Improving' : 'Deteriorating'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forward Pressure</CardTitle>
                <Target className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signals.forward_pressure_score}</div>
                <Progress value={signals.forward_pressure_score} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Urgency to act
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Anomaly Alerts */}
          {signals.anomaly_flags.length > 0 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Anomaly Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {signals.anomaly_flags.map((flag, idx) => (
                    <Badge key={idx} variant="outline" className="border-yellow-500">
                      <Zap className="mr-1 h-3 w-3" />
                      {flag.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Analysis */}
          <Tabs defaultValue="sectors" className="w-full">
            <TabsList>
              <TabsTrigger value="sectors">Sector Breakdown</TabsTrigger>
              <TabsTrigger value="trends">Trend Indicators</TabsTrigger>
            </TabsList>

            <TabsContent value="sectors">
              <Card>
                <CardHeader>
                  <CardTitle>Sector Signal Distribution</CardTitle>
                  <CardDescription>
                    Number of signals by industry sector
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(signals.sector_breakdown).map(([sector, count]) => (
                      <div key={sector} className="flex items-center gap-4">
                        <div className="w-32 font-medium">{sector}</div>
                        <div className="flex-1">
                          <Progress value={(count / 15) * 100} />
                        </div>
                        <div className="w-12 text-right font-bold">{count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Indicators</CardTitle>
                  <CardDescription>
                    Current directional trends across signal categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(signals.trend_indicators).map(([category, trend]) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="font-medium capitalize">
                          {category.replace(/_/g, ' ')}
                        </div>
                        <Badge 
                          variant={
                            trend === 'Rising' || trend === 'Increasing' || trend === 'Escalating' 
                              ? 'destructive' 
                              : trend === 'Stable' || trend === 'Low' || trend === 'Moderate'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {trend}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
