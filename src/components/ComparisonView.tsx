import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeftRight, CalendarIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  created_at: string;
  transaction_type: string;
  investor?: { name: string };
  vault?: { name: string };
}

interface ComparisonViewProps {
  transactions: Transaction[];
}

interface PeriodStats {
  totalVolume: number;
  transactionCount: number;
  avgTransaction: number;
  topInvestors: { name: string; volume: number }[];
  topVaults: { name: string; volume: number }[];
}

export const ComparisonView = ({ transactions }: ComparisonViewProps) => {
  const [period1Start, setPeriod1Start] = useState<Date>(subDays(new Date(), 60));
  const [period1End, setPeriod1End] = useState<Date>(subDays(new Date(), 30));
  const [period2Start, setPeriod2Start] = useState<Date>(subDays(new Date(), 30));
  const [period2End, setPeriod2End] = useState<Date>(new Date());

  const calculatePeriodStats = (periodStart: Date, periodEnd: Date): PeriodStats => {
    const periodTxs = transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= startOfDay(periodStart) && txDate <= endOfDay(periodEnd);
    });

    const totalVolume = periodTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const transactionCount = periodTxs.length;
    const avgTransaction = transactionCount > 0 ? totalVolume / transactionCount : 0;

    // Calculate top investors
    const investorVolumes: Record<string, number> = {};
    periodTxs.forEach(tx => {
      const name = tx.investor?.name || 'Unknown';
      investorVolumes[name] = (investorVolumes[name] || 0) + tx.amount;
    });
    const topInvestors = Object.entries(investorVolumes)
      .map(([name, volume]) => ({ name, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3);

    // Calculate top vaults
    const vaultVolumes: Record<string, number> = {};
    periodTxs.forEach(tx => {
      const name = tx.vault?.name || 'Unknown';
      vaultVolumes[name] = (vaultVolumes[name] || 0) + tx.amount;
    });
    const topVaults = Object.entries(vaultVolumes)
      .map(([name, volume]) => ({ name, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3);

    return { totalVolume, transactionCount, avgTransaction, topInvestors, topVaults };
  };

  const period1Stats = useMemo(() => calculatePeriodStats(period1Start, period1End), [
    transactions, period1Start, period1End
  ]);

  const period2Stats = useMemo(() => calculatePeriodStats(period2Start, period2End), [
    transactions, period2Start, period2End
  ]);

  const getChangeIndicator = (val1: number, val2: number) => {
    if (val2 === 0 && val1 === 0) return { icon: Minus, color: 'text-muted-foreground', change: 0 };
    if (val1 === 0) return { icon: TrendingUp, color: 'text-emerald-500', change: 100 };
    const change = ((val2 - val1) / val1) * 100;
    if (change > 0) return { icon: TrendingUp, color: 'text-emerald-500', change };
    if (change < 0) return { icon: TrendingDown, color: 'text-red-500', change };
    return { icon: Minus, color: 'text-muted-foreground', change: 0 };
  };

  const volumeChange = getChangeIndicator(period1Stats.totalVolume, period2Stats.totalVolume);
  const countChange = getChangeIndicator(period1Stats.transactionCount, period2Stats.transactionCount);
  const avgChange = getChangeIndicator(period1Stats.avgTransaction, period2Stats.avgTransaction);

  const DatePicker = ({ date, onSelect, label }: { date: Date; onSelect: (d: Date) => void; label: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="text-xs">{label}: {format(date, 'MMM dd')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onSelect(d)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <ArrowLeftRight className="w-4 h-4" />
        Period Comparison
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Period 1</span>
          <DatePicker date={period1Start} onSelect={setPeriod1Start} label="From" />
          <DatePicker date={period1End} onSelect={setPeriod1End} label="To" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Period 2</span>
          <DatePicker date={period2Start} onSelect={setPeriod2Start} label="From" />
          <DatePicker date={period2End} onSelect={setPeriod2End} label="To" />
        </div>
      </div>

      <div className="space-y-3">
        {/* Volume Comparison */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">Total Volume</span>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm font-medium">${(period1Stats.totalVolume / 1000000).toFixed(1)}M</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm font-medium">${(period2Stats.totalVolume / 1000000).toFixed(1)}M</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${volumeChange.color}`}>
            <volumeChange.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{volumeChange.change.toFixed(0)}%</span>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">Transactions</span>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm font-medium">{period1Stats.transactionCount}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm font-medium">{period2Stats.transactionCount}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${countChange.color}`}>
            <countChange.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{countChange.change.toFixed(0)}%</span>
          </div>
        </div>

        {/* Average Transaction */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">Avg. Transaction</span>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm font-medium">${(period1Stats.avgTransaction / 1000000).toFixed(2)}M</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm font-medium">${(period2Stats.avgTransaction / 1000000).toFixed(2)}M</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${avgChange.color}`}>
            <avgChange.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{avgChange.change.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
