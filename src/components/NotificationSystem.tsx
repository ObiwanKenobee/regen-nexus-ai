import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, X, AlertTriangle, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  transactions: Transaction[];
  newTransactionId: string | null;
}

export const NotificationSystem = ({ transactions, newTransactionId }: NotificationSystemProps) => {
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState(10); // In millions
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  // Monitor for new transactions
  useEffect(() => {
    if (!enabled || !newTransactionId) return;

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

    // Always notify for new transactions
    addNotification({
      type: 'threshold',
      title: 'New Capital Flow',
      message: `$${amountInMillions.toFixed(2)}M from ${newTx.investor?.name || 'Unknown'} to ${newTx.vault?.name || 'Unknown'}`,
    });
  }, [newTransactionId, transactions, threshold, enabled, addNotification]);

  // Check for milestones
  useEffect(() => {
    if (!enabled) return;

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
