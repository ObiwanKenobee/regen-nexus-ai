import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Leaf, Briefcase, ArrowUpRight } from 'lucide-react';

interface VaultData {
  id: string;
  name: string;
  country: string;
  status: string;
  total_capital: number;
  community_members: number;
  carbon_offset_tons: number;
  projects_funded: number;
}

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
  transaction_type: string;
  description: string | null;
  created_at: string;
  investor?: InvestorData;
  vault?: VaultData;
}

interface VaultDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: VaultData | null;
  investor: InvestorData | null;
  transactions: Transaction[];
  connectedInvestors?: InvestorData[];
  connectedVaults?: VaultData[];
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

export const VaultDetailModal = ({
  isOpen,
  onClose,
  vault,
  investor,
  transactions,
  connectedInvestors = [],
  connectedVaults = [],
}: VaultDetailModalProps) => {
  const isVaultView = vault !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            {isVaultView ? (
              <>
                <div className="w-4 h-4 rounded-full bg-primary" />
                {vault?.name}
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-accent" />
                {investor?.name}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isVaultView && (
              <Badge 
                variant={vault?.status === 'active' ? 'default' : 'secondary'}
                className={vault?.status === 'active' ? 'bg-primary/20 text-primary border-primary/30' : ''}
              >
                {vault?.status === 'active' ? '● Active' : '○ Planned'}
              </Badge>
            )}
            {!isVaultView && investor && (
              <Badge className="bg-accent/20 text-accent border-accent/30">
                {investor.region}
              </Badge>
            )}
          </div>

          {/* Key Metrics */}
          {isVaultView && vault && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Total Capital
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(vault.total_capital)}
                </div>
              </Card>
              
              <Card className="p-4 bg-secondary/5 border-secondary/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  Community Members
                </div>
                <div className="text-2xl font-bold text-secondary">
                  {formatNumber(vault.community_members)}
                </div>
              </Card>
              
              <Card className="p-4 bg-accent/5 border-accent/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Leaf className="w-4 h-4" />
                  Carbon Offset
                </div>
                <div className="text-2xl font-bold text-accent">
                  {formatNumber(vault.carbon_offset_tons)} tons
                </div>
              </Card>
              
              <Card className="p-4 bg-foreground/5 border-foreground/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Briefcase className="w-4 h-4" />
                  Projects Funded
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {vault.projects_funded}
                </div>
              </Card>
            </div>
          )}

          {!isVaultView && investor && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-accent/5 border-accent/20">
                <div className="text-sm text-muted-foreground mb-1">Total Invested</div>
                <div className="text-2xl font-bold text-accent">
                  {formatCurrency(investor.total_invested)}
                </div>
              </Card>
              <Card className="p-4 bg-secondary/5 border-secondary/20">
                <div className="text-sm text-muted-foreground mb-1">Investor Type</div>
                <div className="text-lg font-semibold text-secondary capitalize">
                  {investor.type.replace('_', ' ')}
                </div>
              </Card>
            </div>
          )}

          {/* Community Impact (for vaults) */}
          {isVaultView && vault && vault.status === 'active' && (
            <Card className="p-4 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Community Impact</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">SDG Alignment Score</span>
                    <span className="text-primary font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Capital Deployment Rate</span>
                    <span className="text-primary font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Community Participation</span>
                    <span className="text-primary font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </Card>
          )}

          {/* Connected Investors/Vaults */}
          <Card className="p-4 bg-card border-border">
            <h3 className="font-semibold text-foreground mb-4">
              {isVaultView ? 'Connected Investors' : 'Connected Vaults'}
            </h3>
            <div className="space-y-2">
              {isVaultView ? (
                connectedInvestors.length > 0 ? (
                  connectedInvestors.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/5 border border-accent/10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span className="text-sm font-medium">{inv.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{inv.region}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No connected investors yet</p>
                )
              ) : (
                connectedVaults.length > 0 ? (
                  connectedVaults.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{v.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{v.country}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No connected vaults yet</p>
                )
              )}
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="p-4 bg-card border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Recent Transactions
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 border border-foreground/10">
                    <div>
                      <div className="text-sm font-medium">
                        {isVaultView ? tx.investor?.name : tx.vault?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">
                        +{formatCurrency(tx.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {tx.transaction_type}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
