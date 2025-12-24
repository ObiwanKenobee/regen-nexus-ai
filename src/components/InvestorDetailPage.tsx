import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, Building2, DollarSign, Globe, Calendar, 
  ArrowRight, Loader2, PieChart
} from 'lucide-react';

interface InvestorData {
  id: string;
  name: string;
  type: string;
  region: string;
  total_invested: number;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  description: string | null;
  created_at: string;
  to_vault_id: string | null;
}

interface ConnectedVault {
  id: string;
  name: string;
  country: string;
  total_capital: number;
  invested_amount: number;
}

interface InvestorDetailPageProps {
  isOpen: boolean;
  onClose: () => void;
  investor: InvestorData | null;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

export const InvestorDetailPage = ({ isOpen, onClose, investor }: InvestorDetailPageProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connectedVaults, setConnectedVaults] = useState<ConnectedVault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (investor && isOpen) {
      fetchInvestorData();
    }
  }, [investor, isOpen]);

  const fetchInvestorData = async () => {
    if (!investor) return;
    setLoading(true);

    try {
      // Fetch transactions for this investor
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('from_investor_id', investor.id)
        .order('created_at', { ascending: false });

      if (txData) {
        setTransactions(txData);

        // Get unique vault IDs
        const vaultIds = [...new Set(txData.map(tx => tx.to_vault_id).filter(Boolean))] as string[];

        if (vaultIds.length > 0) {
          // Fetch connected vaults
          const { data: vaultData } = await supabase
            .from('vaults')
            .select('id, name, country, total_capital')
            .in('id', vaultIds);

          if (vaultData) {
            // Calculate invested amount per vault
            const vaultsWithInvestment = vaultData.map(vault => {
              const invested = txData
                .filter(tx => tx.to_vault_id === vault.id)
                .reduce((sum, tx) => sum + tx.amount, 0);
              return {
                ...vault,
                invested_amount: invested,
              };
            });
            setConnectedVaults(vaultsWithInvestment);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching investor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const investmentStats = useMemo(() => {
    const totalInvested = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const avgInvestment = transactions.length > 0 ? totalInvested / transactions.length : 0;
    const vaultCount = connectedVaults.length;
    
    return { totalInvested, avgInvestment, vaultCount };
  }, [transactions, connectedVaults]);

  const portfolioDistribution = useMemo(() => {
    const total = connectedVaults.reduce((sum, v) => sum + v.invested_amount, 0);
    return connectedVaults.map(v => ({
      ...v,
      percentage: total > 0 ? (v.invested_amount / total) * 100 : 0,
    }));
  }, [connectedVaults]);

  if (!investor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-accent/10">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            {investor.name}
            <Badge variant="secondary">{investor.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Investor Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{formatCurrency(investmentStats.totalInvested)}</p>
            <p className="text-xs text-muted-foreground">Total Invested</p>
          </Card>
          <Card className="p-4 text-center">
            <Building2 className="w-5 h-5 mx-auto mb-2 text-secondary" />
            <p className="text-2xl font-bold">{investmentStats.vaultCount}</p>
            <p className="text-xs text-muted-foreground">Vaults Funded</p>
          </Card>
          <Card className="p-4 text-center">
            <Globe className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{investor.region}</p>
            <p className="text-xs text-muted-foreground">Region</p>
          </Card>
          <Card className="p-4 text-center">
            <PieChart className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{formatCurrency(investmentStats.avgInvestment)}</p>
            <p className="text-xs text-muted-foreground">Avg Investment</p>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="space-y-4">
              {connectedVaults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No investments yet</p>
              ) : (
                <div className="space-y-3">
                  {portfolioDistribution.map((vault) => (
                    <Card key={vault.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{vault.name}</h4>
                            <p className="text-sm text-muted-foreground">{vault.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatCurrency(vault.invested_amount)}</p>
                          <p className="text-xs text-muted-foreground">{vault.percentage.toFixed(1)}% of portfolio</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${vault.percentage}%` }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const vault = connectedVaults.find(v => v.id === tx.to_vault_id);
                    return (
                      <Card key={tx.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                              <ArrowRight className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{tx.transaction_type}</span>
                                <Badge variant="outline" className="text-xs">{tx.currency}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {vault ? `To ${vault.name} (${vault.country})` : 'Unknown vault'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(tx.amount)}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(tx.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {tx.description && (
                          <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
                            {tx.description}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
