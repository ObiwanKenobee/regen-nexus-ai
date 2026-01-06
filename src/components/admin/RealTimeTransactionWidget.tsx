import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  created_at: string;
  from_investor_id: string | null;
  to_vault_id: string | null;
}

interface ChartDataPoint {
  time: string;
  amount: number;
  cumulative: number;
}

const RealTimeTransactionWidget = () => {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    fetchRecentTransactions();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const fetchRecentTransactions = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    if (data) {
      setRecentTransactions(data);
      processChartData(data);
      calculateTodayStats(data);
    }
  };

  const setupRealtimeSubscription = () => {
    channelRef.current = supabase
      .channel('transaction-widget')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('New transaction:', payload);
          const newTransaction = payload.new as Transaction;
          setRecentTransactions((prev) => {
            const updated = [...prev, newTransaction];
            processChartData(updated);
            calculateTodayStats(updated);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });
  };

  const processChartData = (transactions: Transaction[]) => {
    const hourlyData: Record<string, number> = {};
    let cumulative = 0;

    transactions.forEach((t) => {
      const hour = format(new Date(t.created_at), 'HH:00');
      hourlyData[hour] = (hourlyData[hour] || 0) + t.amount;
    });

    const chartPoints: ChartDataPoint[] = [];
    Object.entries(hourlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([time, amount]) => {
        cumulative += amount;
        chartPoints.push({ time, amount, cumulative });
      });

    setChartData(chartPoints);
  };

  const calculateTodayStats = (transactions: Transaction[]) => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    setTodayTotal(total);
    setTransactionCount(transactions.length);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <ArrowUpRight className="w-3 h-3 text-green-500" />;
      case 'withdrawal':
        return <ArrowDownRight className="w-3 h-3 text-red-500" />;
      default:
        return <DollarSign className="w-3 h-3 text-primary" />;
    }
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Live Transaction Activity</h3>
            <p className="text-xs text-muted-foreground">Today's capital flow</p>
          </div>
        </div>
        <Badge variant={isLive ? 'default' : 'secondary'} className="gap-1">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          {isLive ? 'Live' : 'Connecting...'}
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Today's Total</span>
          </div>
          <p className="text-xl font-bold text-primary">{formatCurrency(todayTotal)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Transactions</span>
          </div>
          <p className="text-xl font-bold">{transactionCount}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32 mb-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No transactions yet today
          </div>
        )}
      </div>

      {/* Recent Transactions List */}
      <div>
        <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
        <ScrollArea className="h-32">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Waiting for transactions...
            </p>
          ) : (
            <div className="space-y-2">
              {recentTransactions
                .slice(-5)
                .reverse()
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(t.transaction_type)}
                      <div>
                        <span className="text-sm font-medium capitalize">
                          {t.transaction_type}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.created_at), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </Card>
  );
};

export default RealTimeTransactionWidget;
