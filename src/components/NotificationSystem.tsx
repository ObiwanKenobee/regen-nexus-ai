import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, X, AlertTriangle, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  created_at: string;
  transaction_type: string;
  investor?: { name: string };
  vault?: { name: string };
}

interface Notification {
  id: string;
  type: 'threshold' | 'large_transaction' | 'new_investor' | 'milestone';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationSystemProps {
  transactions?: Transaction[];
  newTransactionId?: string | null;
}

interface RealtimeTransactionPayload {
  new: {
    id: string;
    amount: number;
    currency: string;
    transaction_type: string;
    from_investor_id: string | null;
    to_vault_id: string | null;
    created_at: string;
  };
}

export const NotificationSystem = ({ transactions = [], newTransactionId }: NotificationSystemProps) => {
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState(10); // In millions
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  // Supabase Realtime subscription for new transactions
  useEffect(() => {
    if (!enabled) return;

    channelRef.current = supabase
      .channel('transaction-realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        async (payload: RealtimeTransactionPayload) => {
          const transaction = payload.new;
          
          // Fetch investor and vault names
          let investorName = 'Unknown Investor';
          let vaultName = 'Unknown Vault';

          if (transaction.from_investor_id) {
            const { data: investor } = await supabase
              .from('investors')
              .select('name')
              .eq('id', transaction.from_investor_id)
              .single();
            if (investor) investorName = investor.name;
          }

          if (transaction.to_vault_id) {
            const { data: vault } = await supabase
              .from('vaults')
              .select('name')
              .eq('id', transaction.to_vault_id)
              .single();
            if (vault) vaultName = vault.name;
          }

          const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: transaction.currency,
            maximumFractionDigits: 0,
          }).format(transaction.amount);

          const amountInMillions = transaction.amount / 1000000;

          // Show toast notification
          toast({
            title: 'New Transaction',
            description: (
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium">{formattedAmount} {transaction.transaction_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {investorName} → {vaultName}
                  </p>
                </div>
              </div>
            ),
          });

          // Add to notification panel
          if (amountInMillions >= threshold) {
            addNotification({
              type: 'large_transaction',
              title: 'Large Transaction Detected',
              message: `${investorName} invested ${formattedAmount} to ${vaultName}`,
            });

            // Send email notification for large transactions
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user?.email) {
                await supabase.functions.invoke('send-critical-event-email', {
                  body: {
                    recipientEmail: user.email,
                    eventType: 'large_transaction',
                    eventData: {
                      amount: transaction.amount,
                      currency: transaction.currency,
                      investorName,
                      vaultName,
                    },
                  },
                });
                console.log('Large transaction email notification sent');
              }
            } catch (emailError) {
              console.error('Failed to send large transaction email:', emailError);
            }
          } else {
            addNotification({
              type: 'threshold',
              title: 'New Capital Flow',
              message: `${formattedAmount} from ${investorName} to ${vaultName}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled, threshold, addNotification]);

  // Monitor for new transactions from props (legacy support)
  useEffect(() => {
    if (!enabled || !newTransactionId || transactions.length === 0) return;

    const newTx = transactions.find(tx => tx.id === newTransactionId);
    if (!newTx) return;

    const amountInMillions = newTx.amount / 1000000;

    // Check if transaction exceeds threshold
    if (amountInMillions >= threshold) {
      addNotification({
        type: 'large_transaction',
        title: 'Large Transaction Detected',
        message: `${newTx.investor?.name || 'Unknown'} invested $${amountInMillions.toFixed(1)}M to ${newTx.vault?.name || 'Unknown'}`,
      });
    }
  }, [newTransactionId, transactions, threshold, enabled, addNotification]);

  // Check for milestones
  useEffect(() => {
    if (!enabled || transactions.length === 0) return;

    const totalCapital = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalInMillions = totalCapital / 1000000;

    // Check milestones
    const milestones = [100, 250, 500, 1000];
    milestones.forEach(milestone => {
      const prevTotal = totalInMillions - (transactions[0]?.amount || 0) / 1000000;
      if (prevTotal < milestone && totalInMillions >= milestone) {
        addNotification({
          type: 'milestone',
          title: 'Milestone Reached!',
          message: `Total capital flow has reached $${milestone}M`,
        });
      }
    });
  }, [transactions, enabled, addNotification]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'large_transaction': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'milestone': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'new_investor': return <DollarSign className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Toggle notifications"
          />
          {enabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Alert Threshold ($ millions)
          </label>
          <Input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            min={1}
            max={100}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Get notified for transactions ≥ ${threshold}M
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowPanel(!showPanel)}
          className="w-full"
        >
          {showPanel ? 'Hide' : 'Show'} Notifications ({notifications.length})
        </Button>

        {showPanel && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-muted/50 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">
                Recent Alerts
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
            
            <ScrollArea className="h-[200px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 transition-colors ${
                        notification.read ? 'bg-background' : 'bg-primary/5'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </Card>
  );
};
