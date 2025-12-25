import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType = 'large_transaction' | 'admin_role_assigned' | 'moderator_role_assigned';

interface CriticalEventRequest {
  recipientEmail: string;
  eventType: EventType;
  eventData: {
    // For transactions
    amount?: number;
    currency?: string;
    investorName?: string;
    vaultName?: string;
    // For role changes
    userName?: string;
    userEmail?: string;
    oldRole?: string;
    newRole?: string;
    assignedBy?: string;
  };
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getEmailContent = (eventType: EventType, eventData: CriticalEventRequest['eventData']) => {
  switch (eventType) {
    case 'large_transaction':
      const formattedAmount = formatCurrency(eventData.amount || 0, eventData.currency || 'USD');
      return {
        subject: `🚨 Large Transaction Alert: ${formattedAmount}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b, #dc2626); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
                .amount { font-size: 36px; font-weight: bold; color: #dc2626; }
                .detail { margin: 10px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #f59e0b; }
                .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
                .value { font-size: 16px; font-weight: 600; color: #1e293b; }
                .alert-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <span class="alert-badge">CRITICAL ALERT</span>
                  <h1 style="margin: 10px 0 0 0;">Large Transaction Detected</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Immediate attention required</p>
                </div>
                <div class="content">
                  <p>A transaction exceeding the threshold has been recorded:</p>
                  
                  <div class="detail">
                    <div class="label">Transaction Amount</div>
                    <div class="amount">${formattedAmount}</div>
                  </div>
                  
                  <div class="detail">
                    <div class="label">From Investor</div>
                    <div class="value">${eventData.investorName || 'Unknown'}</div>
                  </div>
                  
                  <div class="detail">
                    <div class="label">To Vault</div>
                    <div class="value">${eventData.vaultName || 'Unknown'}</div>
                  </div>
                  
                  <p style="margin-top: 20px; color: #64748b;">This notification was triggered because the transaction amount exceeds the configured threshold for large transactions.</p>
                </div>
                <div class="footer">
                  <p>RVX Platform - Critical Event Notification</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'admin_role_assigned':
    case 'moderator_role_assigned':
      const roleType = eventType === 'admin_role_assigned' ? 'Admin' : 'Moderator';
      const roleColor = eventType === 'admin_role_assigned' ? '#eab308' : '#3b82f6';
      return {
        subject: `🔐 New ${roleType} Role Assignment`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, ${roleColor}, #1e40af); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
                .role-badge { display: inline-block; background: ${roleColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 18px; font-weight: 600; }
                .detail { margin: 10px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid ${roleColor}; }
                .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
                .value { font-size: 16px; font-weight: 600; color: #1e293b; }
                .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Role Assignment Alert</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Administrative privilege change detected</p>
                </div>
                <div class="content">
                  <p>A user has been assigned elevated privileges:</p>
                  
                  <div style="text-align: center; margin: 20px 0;">
                    <span class="role-badge">${roleType.toUpperCase()}</span>
                  </div>
                  
                  <div class="detail">
                    <div class="label">User</div>
                    <div class="value">${eventData.userName || eventData.userEmail || 'Unknown User'}</div>
                  </div>
                  
                  <div class="detail">
                    <div class="label">Email</div>
                    <div class="value">${eventData.userEmail || 'Not provided'}</div>
                  </div>
                  
                  <div class="detail">
                    <div class="label">Previous Role</div>
                    <div class="value">${eventData.oldRole || 'None'}</div>
                  </div>
                  
                  <div class="detail">
                    <div class="label">Assigned By</div>
                    <div class="value">${eventData.assignedBy || 'System'}</div>
                  </div>
                  
                  <p style="margin-top: 20px; color: #64748b;">If this change was not authorized, please review your admin access immediately.</p>
                </div>
                <div class="footer">
                  <p>RVX Platform - Security Notification</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    default:
      return {
        subject: 'RVX Platform - Critical Event',
        html: '<p>A critical event has occurred.</p>',
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, eventType, eventData }: CriticalEventRequest = await req.json();

    console.log("Sending critical event email:", { recipientEmail, eventType, eventData });

    const { subject, html } = getEmailContent(eventType, eventData);

    const emailResponse = await resend.emails.send({
      from: "RVX Platform <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Critical event email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending critical event email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
