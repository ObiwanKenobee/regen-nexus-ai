import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivityReportRequest {
  period: 'weekly' | 'monthly';
  recipientEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { period = 'weekly', recipientEmail }: ActivityReportRequest = await req.json();

    const now = new Date();
    const startDate = new Date();
    
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Fetch user activity metrics
    const { data: activityData, error: activityError } = await supabase
      .from('user_activity')
      .select('activity_type, created_at, user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (activityError) throw activityError;

    // Fetch transactions
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('amount, currency, transaction_type, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (transactionError) throw transactionError;

    // Fetch new users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (profilesError) throw profilesError;

    // Fetch vault metrics
    const { data: vaultsData, error: vaultsError } = await supabase
      .from('vaults')
      .select('total_capital, country, status');

    if (vaultsError) throw vaultsError;

    // Calculate metrics
    const totalTransactionVolume = (transactionData || []).reduce((sum, t) => sum + Number(t.amount), 0);
    const transactionCount = transactionData?.length || 0;
    const newUsersCount = profilesData?.length || 0;
    const totalVaultCapital = (vaultsData || []).reduce((sum, v) => sum + Number(v.total_capital), 0);
    const activeVaults = vaultsData?.filter(v => v.status === 'active').length || 0;
    
    // Activity breakdown
    const activityBreakdown: Record<string, number> = {};
    (activityData || []).forEach(a => {
      activityBreakdown[a.activity_type] = (activityBreakdown[a.activity_type] || 0) + 1;
    });

    // Unique active users
    const uniqueUsers = new Set((activityData || []).map(a => a.user_id)).size;

    // Transaction types breakdown
    const transactionTypes: Record<string, { count: number; volume: number }> = {};
    (transactionData || []).forEach(t => {
      if (!transactionTypes[t.transaction_type]) {
        transactionTypes[t.transaction_type] = { count: 0, volume: 0 };
      }
      transactionTypes[t.transaction_type].count++;
      transactionTypes[t.transaction_type].volume += Number(t.amount);
    });

    // Get admin emails for sending report
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    let adminEmails: string[] = [];
    if (adminRoles && adminRoles.length > 0) {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('email')
        .in('user_id', adminRoles.map(r => r.user_id));
      
      adminEmails = (adminProfiles || [])
        .filter(p => p.email)
        .map(p => p.email!);
    }

    const reportRecipients = recipientEmail ? [recipientEmail] : adminEmails;

    if (reportRecipients.length === 0) {
      console.log("No recipients for activity report");
      return new Response(
        JSON.stringify({ message: "No recipients found for report" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const periodLabel = period === 'weekly' ? 'Weekly' : 'Monthly';
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

    const transactionRows = Object.entries(transactionTypes)
      .map(([type, data]) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${type}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.count}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatCurrency(data.volume)}</td>
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
            .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .metric-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .metric-value { font-size: 28px; font-weight: bold; color: #10b981; }
            .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 12px; }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
            th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">${periodLabel} Platform Report</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">
                ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            
            <div class="content">
              <h2 style="margin-top: 0;">Executive Summary</h2>
              
              <table style="margin-bottom: 20px;">
                <tr>
                  <td class="metric-card" style="padding: 20px; background: white; border-radius: 12px;">
                    <div class="metric-value">${formatCurrency(totalTransactionVolume)}</div>
                    <div class="metric-label">Total Transaction Volume</div>
                  </td>
                  <td class="metric-card" style="padding: 20px; background: white; border-radius: 12px;">
                    <div class="metric-value">${transactionCount}</div>
                    <div class="metric-label">Transactions</div>
                  </td>
                </tr>
                <tr>
                  <td class="metric-card" style="padding: 20px; background: white; border-radius: 12px;">
                    <div class="metric-value">${uniqueUsers}</div>
                    <div class="metric-label">Active Users</div>
                  </td>
                  <td class="metric-card" style="padding: 20px; background: white; border-radius: 12px;">
                    <div class="metric-value">${newUsersCount}</div>
                    <div class="metric-label">New Signups</div>
                  </td>
                </tr>
              </table>

              <div class="section">
                <div class="section-title">Platform Metrics</div>
                <table>
                  <tr><td style="padding: 12px;">Total Vault Capital</td><td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(totalVaultCapital)}</td></tr>
                  <tr><td style="padding: 12px;">Active Vaults</td><td style="padding: 12px; text-align: right; font-weight: 600;">${activeVaults}</td></tr>
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

              ${transactionRows ? `
              <div class="section">
                <div class="section-title">Transaction Breakdown</div>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th style="text-align: right;">Count</th>
                      <th style="text-align: right;">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactionRows}
                  </tbody>
                </table>
              </div>
              ` : ''}

              <p style="margin-top: 30px; padding: 20px; background: #e0f2fe; border-radius: 8px; color: #0369a1;">
                <strong>📊 Insights:</strong> The platform processed ${transactionCount} transactions with ${uniqueUsers} active users during this ${period === 'weekly' ? 'week' : 'month'}.
              </p>
            </div>
            
            <div class="footer">
              <p>RVX Platform - Regenerative Finance for Africa</p>
              <p>This is an automated ${periodLabel.toLowerCase()} report. Visit your admin dashboard for more details.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to all recipients
    for (const email of reportRecipients) {
      await resend.emails.send({
        from: "RVX Platform <onboarding@resend.dev>",
        to: [email],
        subject: `RVX ${periodLabel} Activity Report - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        html: emailHtml,
      });
      console.log(`Activity report sent to ${email}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${periodLabel} report sent to ${reportRecipients.length} recipient(s)`,
        metrics: {
          totalTransactionVolume,
          transactionCount,
          newUsersCount,
          uniqueUsers,
          activeVaults,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error generating activity report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
