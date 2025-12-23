import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Send, Loader2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Vault {
  id: string;
  name: string;
  country: string;
  status: string;
}

interface Investor {
  id: string;
  name: string;
  type: string;
  region: string;
}

interface TransactionFormProps {
  vaults: Vault[];
  investors: Investor[];
  onSuccess?: () => void;
}

const transactionSchema = z.object({
  fromInvestorId: z.string().min(1, 'Please select an investor'),
  toVaultId: z.string().min(1, 'Please select a vault'),
  amount: z.number().min(1000, 'Minimum amount is $1,000').max(1000000000, 'Maximum amount is $1B'),
  transactionType: z.string().min(1, 'Please select a transaction type'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export const TransactionForm = ({ vaults, investors, onSuccess }: TransactionFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionType: 'investment',
    },
  });

  const selectedInvestor = watch('fromInvestorId');
  const selectedVault = watch('toVaultId');

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create transactions.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        from_investor_id: data.fromInvestorId,
        to_vault_id: data.toVaultId,
        amount: data.amount,
        transaction_type: data.transactionType,
        description: data.description || null,
        currency: 'USD',
      });

      if (error) throw error;

      // Send email notification
      const selectedInvestorData = investors.find(i => i.id === data.fromInvestorId);
      const selectedVaultData = vaults.find(v => v.id === data.toVaultId);
      
      if (user.email && selectedInvestorData && selectedVaultData) {
        try {
          await supabase.functions.invoke('send-transaction-email', {
            body: {
              recipientEmail: user.email,
              transactionType: data.transactionType,
              amount: data.amount,
              investorName: selectedInvestorData.name,
              vaultName: selectedVaultData.name,
              currency: 'USD',
            },
          });
        } catch (emailError) {
          console.log('Email notification skipped:', emailError);
        }
      }

      toast({
        title: 'Transaction Created',
        description: `$${(data.amount / 1000000).toFixed(2)}M successfully allocated`,
      });

      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to create transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVaults = vaults.filter(v => v.status === 'active');

  if (!user) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center py-8">
          <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Sign In Required</h3>
          <p className="text-muted-foreground mb-4">Please sign in to create transactions.</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Send className="w-5 h-5 text-primary" />
        Create New Transaction
      </h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="investor">From Investor</Label>
            <Select
              value={selectedInvestor}
              onValueChange={(value) => setValue('fromInvestorId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select investor" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id}>
                    {investor.name} ({investor.region})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fromInvestorId && (
              <p className="text-sm text-destructive">{errors.fromInvestorId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vault">To Vault</Label>
            <Select
              value={selectedVault}
              onValueChange={(value) => setValue('toVaultId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vault" />
              </SelectTrigger>
              <SelectContent>
                {activeVaults.map((vault) => (
                  <SelectItem key={vault.id} value={vault.id}>
                    {vault.name} ({vault.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.toVaultId && (
              <p className="text-sm text-destructive">{errors.toVaultId.message}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="10000000"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={watch('transactionType')}
              onValueChange={(value) => setValue('transactionType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="grant">Grant</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
              </SelectContent>
            </Select>
            {errors.transactionType && (
              <p className="text-sm text-destructive">{errors.transactionType.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Enter transaction details..."
            {...register('description')}
            className="resize-none"
            rows={2}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Transaction
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
