import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Bell, Mail, DollarSign, Users, Shield, Trophy, Loader2, Save } from 'lucide-react';

interface NotificationSettingsData {
  id?: string;
  user_id: string;
  large_transaction_threshold: number;
  email_on_large_transaction: boolean;
  email_on_new_user: boolean;
  email_on_role_change: boolean;
  email_on_milestone: boolean;
  notification_email: string | null;
}

const NotificationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsData>({
    user_id: user?.id || '',
    large_transaction_threshold: 100000,
    email_on_large_transaction: true,
    email_on_new_user: true,
    email_on_role_change: true,
    email_on_milestone: true,
    notification_email: user?.email || null,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          large_transaction_threshold: Number(data.large_transaction_threshold),
          email_on_large_transaction: data.email_on_large_transaction,
          email_on_new_user: data.email_on_new_user,
          email_on_role_change: data.email_on_role_change,
          email_on_milestone: data.email_on_milestone,
          notification_email: data.notification_email,
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        large_transaction_threshold: settings.large_transaction_threshold,
        email_on_large_transaction: settings.email_on_large_transaction,
        email_on_new_user: settings.email_on_new_user,
        email_on_role_change: settings.email_on_role_change,
        email_on_milestone: settings.email_on_milestone,
        notification_email: settings.notification_email,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('notification_settings')
          .update(payload)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error, data } = await supabase
          .from('notification_settings')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSettings(prev => ({ ...prev, id: data.id }));
        }
      }

      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Email Notification Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure when and how you receive email notifications
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notification Email */}
        <div className="space-y-2">
          <Label htmlFor="notification-email" className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Notification Email Address
          </Label>
          <Input
            id="notification-email"
            type="email"
            value={settings.notification_email || ''}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, notification_email: e.target.value }))
            }
            placeholder="Enter email for notifications"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use your account email
          </p>
        </div>

        {/* Large Transaction Threshold */}
        <div className="space-y-2">
          <Label htmlFor="threshold" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            Large Transaction Threshold
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="threshold"
              type="number"
              value={settings.large_transaction_threshold}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  large_transaction_threshold: Number(e.target.value),
                }))
              }
              className="max-w-[200px]"
              min={0}
              step={10000}
            />
            <span className="text-sm text-muted-foreground">
              {formatCurrency(settings.large_transaction_threshold)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Transactions above this amount will trigger email notifications
          </p>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium">Notification Types</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-green-500" />
              <div>
                <Label htmlFor="large-transaction">Large Transactions</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when transactions exceed your threshold
                </p>
              </div>
            </div>
            <Switch
              id="large-transaction"
              checked={settings.email_on_large_transaction}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, email_on_large_transaction: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <Label htmlFor="new-user">New User Registrations</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when new users sign up
                </p>
              </div>
            </div>
            <Switch
              id="new-user"
              checked={settings.email_on_new_user}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, email_on_new_user: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-yellow-500" />
              <div>
                <Label htmlFor="role-change">Role Changes</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when user roles are modified
                </p>
              </div>
            </div>
            <Switch
              id="role-change"
              checked={settings.email_on_role_change}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, email_on_role_change: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-purple-500" />
              <div>
                <Label htmlFor="milestone">Milestone Achievements</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when capital milestones are reached
                </p>
              </div>
            </div>
            <Switch
              id="milestone"
              checked={settings.email_on_milestone}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, email_on_milestone: checked }))
              }
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
