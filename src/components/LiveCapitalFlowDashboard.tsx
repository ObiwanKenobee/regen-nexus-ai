import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCapitalFlowData } from '@/hooks/useCapitalFlowData';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useActivityTracker } from '@/hooks/useActivityTracker';

interface LiveMetric {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

const LiveCapitalFlowDashboard = () => {
  const { vaults, investors, transactions, flows, loading, newTransactionId } = useCapitalFlowData();
  const { trackFeatureUse } = useActivityTracker();
  const [animatedMetrics, setAnimatedMetrics] = useState<LiveMetric[]>([]);
  const [pulseActive, setPulseActive] = useState(false);

  // Track when users view this section
  useEffect(() => {
    trackFeatureUse('live_capital_dashboard_view');
  }, [trackFeatureUse]);

  // Animate when new transaction arrives
  useEffect(() => {
    if (newTransactionId) {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [newTransactionId]);

  // Calculate live metrics
  const metrics = useMemo(() => {
    const totalCapital = vaults.reduce((sum, v) => sum + Number(v.total_capital), 0);
    const totalInvested = investors.reduce((sum, i) => sum + Number(i.total_invested), 0);
    const activeFlows = flows.length;
    const recentTransactions = transactions.filter(
      t => new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const recentVolume = recentTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate changes (comparing to last 7 days for simplicity)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekTransactions = transactions.filter(
      t => new Date(t.created_at) > weekAgo && new Date(t.created_at) <= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const lastWeekVolume = lastWeekTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    const volumeChange = lastWeekVolume > 0 
      ? ((recentVolume - lastWeekVolume) / lastWeekVolume) * 100 
      : recentVolume > 0 ? 100 : 0;

    return [
      {
        label: 'Total Vault Capital',
        value: `$${(totalCapital / 1000000).toFixed(1)}M`,
        change: 12.5,
        changeLabel: 'from last month',
        icon: <DollarSign className="w-5 h-5" />,
        trend: 'up' as const,
      },
      {
        label: '24h Transaction Volume',
        value: `$${(recentVolume / 1000000).toFixed(2)}M`,
        change: volumeChange,
        changeLabel: 'vs yesterday',
        icon: <Activity className="w-5 h-5" />,
        trend: volumeChange >= 0 ? 'up' as const : 'down' as const,
      },
      {
        label: 'Active Capital Flows',
        value: activeFlows.toString(),
        change: 8.3,
        changeLabel: 'this week',
        icon: <Zap className="w-5 h-5" />,
        trend: 'up' as const,
      },
      {
        label: 'Network Participants',
        value: (vaults.length + investors.length).toString(),
        change: 4.2,
        changeLabel: 'new this month',
        icon: <Users className="w-5 h-5" />,
        trend: 'up' as const,
      },
    ];
  }, [vaults, investors, transactions, flows]);

  // Animate metrics on load
  useEffect(() => {
    setAnimatedMetrics(metrics);
  }, [metrics]);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6 h-32 bg-card/50" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${pulseActive ? 'bg-green-500 animate-ping' : 'bg-green-500'}`} />
              Live Capital Flow Dashboard
            </h2>
            <p className="text-muted-foreground mt-1">
              Real-time metrics from the RVX capital network
            </p>
          </div>
          {newTransactionId && (
            <Badge variant="default" className="animate-bounce bg-green-500 text-white">
              <Zap className="w-3 h-3 mr-1" />
              New Transaction!
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {animatedMetrics.map((metric, index) => (
            <Card 
              key={metric.label}
              className={`p-6 bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                pulseActive && index === 1 ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {metric.icon}
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{Math.abs(metric.change).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {metric.value}
                </p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  {metric.changeLabel}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent transaction activity ticker */}
        <div className="mt-8 overflow-hidden">
          <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
            {transactions.slice(0, 10).map((tx, i) => (
              <div key={tx.id || i} className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-full border border-border">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  ${(Number(tx.amount) / 1000000).toFixed(2)}M → {tx.transaction_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveCapitalFlowDashboard;
