import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Vault {
  id: string;
  name: string;
  country: string;
  status: string;
  total_capital: number;
  community_members: number;
  carbon_offset_tons: number;
  projects_funded: number;
  position_x: number;
  position_y: number;
  position_z: number;
}

interface Investor {
  id: string;
  name: string;
  type: string;
  region: string;
  total_invested: number;
  position_x: number;
  position_y: number;
  position_z: number;
}

interface Transaction {
  id: string;
  from_investor_id: string | null;
  to_vault_id: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface TransactionWithDetails extends Transaction {
  investor?: Investor;
  vault?: Vault;
}

interface Flow {
  from: number;
  to: number;
  amount: string;
  color: string;
  transactionId: string;
}

export const useCapitalFlowData = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTransactionId, setNewTransactionId] = useState<string | null>(null);

  const flowColors = ['#2A9D8F', '#E76F51', '#F4A261', '#264653'];

  const fetchData = useCallback(async () => {
    try {
      const [vaultsRes, investorsRes, transactionsRes] = await Promise.all([
        supabase.from('vaults').select('*').order('created_at'),
        supabase.from('investors').select('*').order('created_at'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      ]);

      if (vaultsRes.error) throw vaultsRes.error;
      if (investorsRes.error) throw investorsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      const vaultsData = vaultsRes.data as Vault[];
      const investorsData = investorsRes.data as Investor[];
      const transactionsData = transactionsRes.data as Transaction[];

      setVaults(vaultsData);
      setInvestors(investorsData);

      // Enrich transactions with investor and vault details
      const enrichedTransactions: TransactionWithDetails[] = transactionsData.map(tx => ({
        ...tx,
        investor: investorsData.find(i => i.id === tx.from_investor_id),
        vault: vaultsData.find(v => v.id === tx.to_vault_id),
      }));
      setTransactions(enrichedTransactions);

      // Build flows from transactions
      const computedFlows: Flow[] = [];
      transactionsData.forEach((tx, idx) => {
        const investorIndex = investorsData.findIndex(i => i.id === tx.from_investor_id);
        const vaultIndex = vaultsData.findIndex(v => v.id === tx.to_vault_id);
        
        if (investorIndex !== -1 && vaultIndex !== -1) {
          computedFlows.push({
            from: vaultsData.length + investorIndex,
            to: vaultIndex,
            amount: `$${(tx.amount / 1000000).toFixed(0)}M`,
            color: flowColors[idx % flowColors.length],
            transactionId: tx.id,
          });
        }
      });
      setFlows(computedFlows);
    } catch (error) {
      console.error('Error fetching capital flow data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time transaction updates
  useEffect(() => {
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('New transaction received:', payload);
          const newTx = payload.new as Transaction;
          setNewTransactionId(newTx.id);
          
          // Refetch data to update flows
          fetchData();
          
          // Clear the highlight after animation
          setTimeout(() => setNewTransactionId(null), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const getVaultTransactions = useCallback((vaultId: string) => {
    return transactions.filter(tx => tx.to_vault_id === vaultId);
  }, [transactions]);

  const getInvestorTransactions = useCallback((investorId: string) => {
    return transactions.filter(tx => tx.from_investor_id === investorId);
  }, [transactions]);

  const getConnectedInvestors = useCallback((vaultId: string) => {
    const investorIds = transactions
      .filter(tx => tx.to_vault_id === vaultId)
      .map(tx => tx.from_investor_id)
      .filter((id, index, self) => id && self.indexOf(id) === index);
    
    return investors.filter(inv => investorIds.includes(inv.id));
  }, [transactions, investors]);

  const getConnectedVaults = useCallback((investorId: string) => {
    const vaultIds = transactions
      .filter(tx => tx.from_investor_id === investorId)
      .map(tx => tx.to_vault_id)
      .filter((id, index, self) => id && self.indexOf(id) === index);
    
    return vaults.filter(v => vaultIds.includes(v.id));
  }, [transactions, vaults]);

  return {
    vaults,
    investors,
    transactions,
    flows,
    loading,
    newTransactionId,
    getVaultTransactions,
    getInvestorTransactions,
    getConnectedInvestors,
    getConnectedVaults,
    refetch: fetchData,
  };
};
