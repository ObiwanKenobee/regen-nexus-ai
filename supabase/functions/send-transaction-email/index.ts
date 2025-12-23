import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionEmailRequest {
  recipientEmail: string;
  transactionType: string;
  amount: number;
  investorName: string;
  vaultName: string;
  currency: string;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      transactionType, 
      amount, 
      investorName, 
      vaultName,
      currency 
    }: TransactionEmailRequest = await req.json();

    console.log("Sending transaction email:", {
      recipientEmail,
      transactionType,
      amount,
      investorName,
      vaultName,
    });

    const formattedAmount = formatCurrency(amount, currency);
    const subject = `New ${transactionType} Transaction: ${formattedAmount}`;

    const emailResponse = await resend.emails.send({
      from: "RVX Platform <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #0ea5e9); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .amount { font-size: 32px; font-weight: bold; color: #10b981; }
              .detail { margin: 10px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #10b981; }
              .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
              .value { font-size: 16px; font-weight: 600; color: #1e293b; }
              .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">New Transaction Alert</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">RVX Capital Flow Network</p>
              </div>
              <div class="content">
                <p>A new capital flow transaction has been recorded:</p>
                
                <div class="detail">
                  <div class="label">Transaction Type</div>
                  <div class="value">${transactionType}</div>
                </div>
                
                <div class="detail">
                  <div class="label">Amount</div>
                  <div class="amount">${formattedAmount}</div>
                </div>
                
                <div class="detail">
                  <div class="label">From Investor</div>
                  <div class="value">${investorName}</div>
                </div>
                
                <div class="detail">
                  <div class="label">To Vault</div>
                  <div class="value">${vaultName}</div>
                </div>
                
                <p style="margin-top: 20px;">This transaction has been successfully recorded in the RVX network and is now visible in the capital flow visualization.</p>
              </div>
              <div class="footer">
                <p>RVX Platform - Regenerative Finance for Africa</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-transaction-email function:", error);
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
