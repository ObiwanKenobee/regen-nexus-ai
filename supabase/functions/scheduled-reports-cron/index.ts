import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledReport {
  id: string;
  report_type: 'weekly' | 'monthly';
  is_enabled: boolean;
  last_sent_at: string | null;
  next_scheduled_at: string | null;
  recipient_emails: string[] | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    console.log(`Running scheduled reports cron at ${now.toISOString()}`);

    // Fetch all enabled scheduled reports that are due
    const { data: reports, error: reportsError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_enabled', true)
      .lte('next_scheduled_at', now.toISOString());

    if (reportsError) throw reportsError;

    if (!reports || reports.length === 0) {
      console.log("No scheduled reports due at this time");
      return new Response(
        JSON.stringify({ message: "No reports due", checked_at: now.toISOString() }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: { report_type: string; status: string; error?: string }[] = [];

    for (const report of reports as ScheduledReport[]) {
      try {
        console.log(`Processing ${report.report_type} report`);

        // Calculate date range
        const startDate = new Date();
        if (report.report_type === 'weekly') {
          startDate.setDate(now.getDate() - 7);
        } else {
          startDate.setMonth(now.getMonth() - 1);
        }

        // Fetch metrics
        const { data: activityData } = await supabase
          .from('user_activity')
          .select('activity_type, user_id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());

        const { data: transactionData } = await supabase
          .from('transactions')
          .select('amount, transaction_type')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());

        const { data: vaultsData } = await supabase
          .from('vaults')
          .select('total_capital, status');

        // Calculate metrics
        const totalTransactionVolume = (transactionData || []).reduce((sum, t) => sum + Number(t.amount), 0);
        const transactionCount = transactionData?.length || 0;
        const newUsersCount = profilesData?.length || 0;
        const uniqueUsers = new Set((activityData || []).map(a => a.user_id)).size;
        const totalVaultCapital = (vaultsData || []).reduce((sum, v) => sum + Number(v.total_capital), 0);
        const activeVaults = vaultsData?.filter(v => v.status === 'active').length || 0;

        // Activity breakdown
        const activityBreakdown: Record<string, number> = {};
        (activityData || []).forEach(a => {
          activityBreakdown[a.activity_type] = (activityBreakdown[a.activity_type] || 0) + 1;
        });

        // Get recipient emails
        let recipientEmails = report.recipient_emails || [];
        
        if (recipientEmails.length === 0) {
          // Get admin emails
          const { data: adminRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');

          if (adminRoles && adminRoles.length > 0) {
            const { data: adminProfiles } = await supabase
              .from('profiles')
              .select('email')
              .in('user_id', adminRoles.map(r => r.user_id));
            
            recipientEmails = (adminProfiles || [])
              .filter(p => p.email)
              .map(p => p.email!);
          }
        }

        if (recipientEmails.length === 0) {
          console.log(`No recipients for ${report.report_type} report`);
          results.push({ report_type: report.report_type, status: 'skipped', error: 'No recipients' });
          continue;
        }

        const periodLabel = report.report_type === 'weekly' ? 'Weekly' : 'Monthly';
        const formatCurrency = (amount: number) => 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

        const activityRows = Object.entries(activityBreakdown)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${count}</td>
            </tr>
          `)
          .join('');

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #10b981, #0ea5e9); color: white; padding: 40px 30px; }
                .content { padding: 30px; background: #f8fafc; }
                .metric-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 10px 0; }
                .metric-value { font-size: 28px; font-weight: bold; color: #10b981; }
                .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
                .section { margin: 30px 0; }
                .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 12px; }
                table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
                th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
                .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; background: #f1f5f9; }
                .auto-badge { display: inline-block; background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-left: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">${periodLabel} Platform Report <span class="auto-badge">Automated</span></h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">
                    ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                
                <div class="content">
                  <h2 style="margin-top: 0;">Executive Summary</h2>
                  
                  <div class="metric-card">
                    <div class="metric-value">${formatCurrency(totalTransactionVolume)}</div>
                    <div class="metric-label">Total Transaction Volume</div>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="metric-card">
                      <div class="metric-value">${transactionCount}</div>
                      <div class="metric-label">Transactions</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-value">${uniqueUsers}</div>
                      <div class="metric-label">Active Users</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-value">${newUsersCount}</div>
                      <div class="metric-label">New Signups</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-value">${activeVaults}</div>
                      <div class="metric-label">Active Vaults</div>
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">Platform Metrics</div>
                    <table>
                      <tr><td style="padding: 12px;">Total Vault Capital</td><td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(totalVaultCapital)}</td></tr>
                      <tr><td style="padding: 12px;">Total User Activities</td><td style="padding: 12px; text-align: right; font-weight: 600;">${activityData?.length || 0}</td></tr>
                    </table>
                  </div>

                  ${activityRows ? `
                  <div class="section">
                    <div class="section-title">Top User Activities</div>
                    <table>
                      <thead>
                        <tr>
                          <th>Activity Type</th>
                          <th style="text-align: right;">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${activityRows}
                      </tbody>
                    </table>
                  </div>
                  ` : ''}

                  <p style="margin-top: 30px; padding: 20px; background: #e0f2fe; border-radius: 8px; color: #0369a1;">
                    <strong>📊 Summary:</strong> The platform processed ${transactionCount} transactions with ${uniqueUsers} active users during this ${report.report_type === 'weekly' ? 'week' : 'month'}.
                  </p>
                </div>
                
                <div class="footer">
                  <p>RVX Platform - Regenerative Finance for Africa</p>
                  <p>This is an automated ${periodLabel.toLowerCase()} report sent via scheduled cron.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        // Send email
        for (const email of recipientEmails) {
          await resend.emails.send({
            from: "RVX Platform <onboarding@resend.dev>",
            to: [email],
            subject: `RVX ${periodLabel} Activity Report - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
            html: emailHtml,
          });
          console.log(`${periodLabel} report sent to ${email}`);
        }

        // Calculate next scheduled time
        const nextScheduled = new Date(now);
        if (report.report_type === 'weekly') {
          // Next Monday at 9 AM
          nextScheduled.setDate(nextScheduled.getDate() + ((8 - nextScheduled.getDay()) % 7 || 7));
          nextScheduled.setHours(9, 0, 0, 0);
        } else {
          // First of next month at 9 AM
          nextScheduled.setMonth(nextScheduled.getMonth() + 1);
          nextScheduled.setDate(1);
          nextScheduled.setHours(9, 0, 0, 0);
        }

        // Update the report record
        await supabase
          .from('scheduled_reports')
          .update({
            last_sent_at: now.toISOString(),
            next_scheduled_at: nextScheduled.toISOString(),
          })
          .eq('id', report.id);

        results.push({ report_type: report.report_type, status: 'sent' });
        console.log(`${periodLabel} report completed, next scheduled: ${nextScheduled.toISOString()}`);

      } catch (reportError: any) {
        console.error(`Error processing ${report.report_type} report:`, reportError);
        results.push({ report_type: report.report_type, status: 'error', error: reportError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_at: now.toISOString(),
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in scheduled-reports-cron:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
