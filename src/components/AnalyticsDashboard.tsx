import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Globe, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useCapitalFlowData } from '@/hooks/useCapitalFlowData';

const COLORS = ['#2A9D8F', '#E76F51', '#F4A261', '#264653', '#E9C46A', '#457B9D'];

export const AnalyticsDashboard = () => {
  const { vaults, investors, transactions, loading } = useCapitalFlowData();

  const monthlyFlowData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    
    transactions.forEach((tx) => {
      const date = new Date(tx.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + tx.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: amount / 1000000,
      }));
  }, [transactions]);

  const vaultDistribution = useMemo(() => {
    return vaults.map((v) => ({
      name: v.country,
      value: v.total_capital / 1000000,
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [vaults]);

  const investorTypeData = useMemo(() => {
    const typeData: Record<string, number> = {};
    investors.forEach((inv) => {
      typeData[inv.type] = (typeData[inv.type] || 0) + inv.total_invested;
    });
    return Object.entries(typeData).map(([type, amount]) => ({
      type,
      amount: amount / 1000000,
    }));
  }, [investors]);

  const totalCapital = vaults.reduce((sum, v) => sum + v.total_capital, 0);
  const totalTransactions = transactions.length;
  const activeVaults = vaults.length;
  const activeInvestors = investors.length;

  const growthRate = 23.5; // Simulated growth rate

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-secondary border-secondary/30">
            Real-Time Analytics
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Capital Flow{' '}
            <span className="text-transparent bg-clip-text bg-gradient-secondary">
              Dashboard
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track the movement of regenerative capital across the network with live analytics and trend insights.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Capital</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  ${(totalCapital / 1000000).toFixed(0)}M
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-emerald-500 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>{growthRate}% from last month</span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{totalTransactions}</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/10">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-emerald-500 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>12 new this week</span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Vaults</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{activeVaults}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <Globe className="w-5 h-5 text-accent" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-emerald-500 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>2 new this month</span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Investors</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{activeInvestors}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-emerald-500 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>5 new this quarter</span>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Capital Flow Over Time */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-6">Capital Flow Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFlowData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}M`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(1)}M`, 'Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2A9D8F"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Vault Distribution */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-6">Capital by Region</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vaultDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {vaultDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(1)}M`, 'Capital']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Investor Type Distribution */}
          <Card className="p-6 bg-card border-border lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-6">Investment by Investor Type</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investorTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}M`} />
                  <YAxis dataKey="type" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={150} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(1)}M`, 'Invested']}
                  />
                  <Bar dataKey="amount" fill="#E76F51" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
