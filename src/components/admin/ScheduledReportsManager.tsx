import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { addDays, addMonths, format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Clock,
  Mail,
  Send,
  Loader2,
  CalendarDays,
  CalendarRange,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ScheduledReport {
  id: string;
  report_type: 'weekly' | 'monthly';
  is_enabled: boolean;
  last_sent_at: string | null;
  next_scheduled_at: string | null;
  recipient_emails: string[] | null;
  created_by: string;
}

const ScheduledReportsManager = () => {
  const { user } = useAuth();
  const [weeklyReport, setWeeklyReport] = useState<ScheduledReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<ScheduledReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [sendingMonthly, setSendingMonthly] = useState(false);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [savingMonthly, setSavingMonthly] = useState(false);
  const [weeklyEmails, setWeeklyEmails] = useState('');
  const [monthlyEmails, setMonthlyEmails] = useState('');

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*');

      if (error) throw error;

      const weekly = data?.find(r => r.report_type === 'weekly');
      const monthly = data?.find(r => r.report_type === 'monthly');

      setWeeklyReport(weekly ? { ...weekly, report_type: 'weekly' as const } : null);
      setMonthlyReport(monthly ? { ...monthly, report_type: 'monthly' as const } : null);
      setWeeklyEmails(weekly?.recipient_emails?.join(', ') || '');
      setMonthlyEmails(monthly?.recipient_emails?.join(', ') || '');
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextScheduledDate = (type: 'weekly' | 'monthly') => {
    const now = new Date();
    if (type === 'weekly') {
      // Next Monday at 9 AM
      const nextMonday = addDays(now, (8 - now.getDay()) % 7 || 7);
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday.toISOString();
    } else {
      // First of next month at 9 AM
      const nextMonth = addMonths(now, 1);
      nextMonth.setDate(1);
      nextMonth.setHours(9, 0, 0, 0);
      return nextMonth.toISOString();
    }
  };

  const saveReportSettings = async (type: 'weekly' | 'monthly') => {
    if (!user) return;

    const setSaving = type === 'weekly' ? setSavingWeekly : setSavingMonthly;
    const emails = type === 'weekly' ? weeklyEmails : monthlyEmails;
    const report = type === 'weekly' ? weeklyReport : monthlyReport;

    setSaving(true);
    try {
      const recipientEmails = emails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const payload = {
        report_type: type,
        is_enabled: report?.is_enabled ?? true,
        recipient_emails: recipientEmails.length > 0 ? recipientEmails : null,
        next_scheduled_at: calculateNextScheduledDate(type),
        created_by: user.id,
      };

      if (report?.id) {
        const { error } = await supabase
          .from('scheduled_reports')
          .update(payload)
          .eq('id', report.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('scheduled_reports')
          .insert(payload);

        if (error) throw error;
      }

      toast({
        title: 'Settings Saved',
        description: `${type === 'weekly' ? 'Weekly' : 'Monthly'} report settings updated.`,
      });

      fetchScheduledReports();
    } catch (error) {
      console.error('Error saving report settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save report settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleReportEnabled = async (type: 'weekly' | 'monthly', enabled: boolean) => {
    const report = type === 'weekly' ? weeklyReport : monthlyReport;

    if (report?.id) {
      try {
        const { error } = await supabase
          .from('scheduled_reports')
          .update({ is_enabled: enabled })
          .eq('id', report.id);

        if (error) throw error;

        if (type === 'weekly') {
          setWeeklyReport(prev => prev ? { ...prev, is_enabled: enabled } : null);
        } else {
          setMonthlyReport(prev => prev ? { ...prev, is_enabled: enabled } : null);
        }

        toast({
          title: enabled ? 'Report Enabled' : 'Report Disabled',
          description: `${type === 'weekly' ? 'Weekly' : 'Monthly'} reports ${enabled ? 'will be sent automatically' : 'have been paused'}.`,
        });
      } catch (error) {
        console.error('Error toggling report:', error);
      }
    } else {
      // Create new report entry
      saveReportSettings(type);
    }
  };

  const sendReportNow = async (type: 'weekly' | 'monthly') => {
    const setSending = type === 'weekly' ? setSendingWeekly : setSendingMonthly;
    const emails = type === 'weekly' ? weeklyEmails : monthlyEmails;

    setSending(true);
    try {
      const recipientEmails = emails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const response = await supabase.functions.invoke('send-activity-report', {
        body: {
          period: type,
          recipientEmail: recipientEmails[0] || user?.email,
        },
      });

      if (response.error) throw response.error;

      // Update last_sent_at
      const report = type === 'weekly' ? weeklyReport : monthlyReport;
      if (report?.id) {
        await supabase
          .from('scheduled_reports')
          .update({
            last_sent_at: new Date().toISOString(),
            next_scheduled_at: calculateNextScheduledDate(type),
          })
          .eq('id', report.id);
      }

      toast({
        title: 'Report Sent!',
        description: `${type === 'weekly' ? 'Weekly' : 'Monthly'} activity report has been sent successfully.`,
      });

      fetchScheduledReports();
    } catch (error) {
      console.error('Error sending report:', error);
      toast({
        title: 'Error',
        description: 'Failed to send activity report. Check that RESEND_API_KEY is configured.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
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

  const ReportCard = ({
    type,
    report,
    emails,
    setEmails,
    sending,
    saving,
  }: {
    type: 'weekly' | 'monthly';
    report: ScheduledReport | null;
    emails: string;
    setEmails: (value: string) => void;
    sending: boolean;
    saving: boolean;
  }) => {
    const isWeekly = type === 'weekly';
    const Icon = isWeekly ? CalendarDays : CalendarRange;

    return (
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isWeekly ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
              <Icon className={`w-5 h-5 ${isWeekly ? 'text-blue-500' : 'text-purple-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold">{isWeekly ? 'Weekly' : 'Monthly'} Report</h3>
              <p className="text-sm text-muted-foreground">
                {isWeekly ? 'Sent every Monday at 9 AM' : 'Sent on the 1st of each month'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={report?.is_enabled ?? false}
              onCheckedChange={(checked) => toggleReportEnabled(type, checked)}
            />
            <Label className="text-sm">
              {report?.is_enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-3 mb-4">
          {report?.last_sent_at && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Last sent {formatDistanceToNow(new Date(report.last_sent_at))} ago
            </Badge>
          )}
          {report?.next_scheduled_at && report?.is_enabled && (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Next: {format(new Date(report.next_scheduled_at), 'MMM d, yyyy h:mm a')}
            </Badge>
          )}
          {!report?.is_enabled && (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              Paused
            </Badge>
          )}
        </div>

        {/* Email Recipients */}
        <div className="space-y-2 mb-4">
          <Label htmlFor={`${type}-emails`} className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Recipient Emails
          </Label>
          <Input
            id={`${type}-emails`}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="admin@example.com, team@example.com"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            Separate multiple emails with commas. Leave blank to send to all admins.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => sendReportNow(type)}
            disabled={sending}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Now
          </Button>
          <Button
            onClick={() => saveReportSettings(type)}
            disabled={saving}
            variant="outline"
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            Save Schedule
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Scheduled Activity Reports</h2>
            <p className="text-sm text-muted-foreground">
              Configure automated email reports for platform engagement metrics
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> Scheduled reports require a cron job to be configured for automatic sending.
            Use the "Send Now" button to manually trigger reports at any time.
          </p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <ReportCard
          type="weekly"
          report={weeklyReport}
          emails={weeklyEmails}
          setEmails={setWeeklyEmails}
          sending={sendingWeekly}
          saving={savingWeekly}
        />
        <ReportCard
          type="monthly"
          report={monthlyReport}
          emails={monthlyEmails}
          setEmails={setMonthlyEmails}
          sending={sendingMonthly}
          saving={savingMonthly}
        />
      </div>
    </div>
  );
};

export default ScheduledReportsManager;
