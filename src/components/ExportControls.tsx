import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Transaction {
  id: string;
  from_investor_id: string | null;
  to_vault_id: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  description: string | null;
  created_at: string;
  investor?: { name: string; type: string; region: string };
  vault?: { name: string; country: string };
}

interface Vault {
  id: string;
  name: string;
  country: string;
  total_capital: number;
  community_members: number;
  projects_funded: number;
}

interface Investor {
  id: string;
  name: string;
  type: string;
  region: string;
  total_invested: number;
}

interface ExportControlsProps {
  transactions: Transaction[];
  vaults: Vault[];
  investors: Investor[];
}

export const ExportControls = ({ transactions, vaults, investors }: ExportControlsProps) => {
  const [exportType, setExportType] = useState<'transactions' | 'analytics'>('transactions');
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = String(value ?? '');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const generatePDF = (content: string, filename: string) => {
    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #2A9D8F; border-bottom: 2px solid #2A9D8F; padding-bottom: 10px; }
            h2 { color: #264653; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2A9D8F; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { background: #f0f7f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .metric { display: inline-block; margin: 10px 20px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #2A9D8F; }
            .metric-label { font-size: 14px; color: #666; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content}
          <script>setTimeout(() => window.print(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      if (exportType === 'transactions') {
        const data = transactions.map(tx => ({
          'Transaction ID': tx.id,
          'Date': new Date(tx.created_at).toLocaleDateString(),
          'Investor': tx.investor?.name || 'Unknown',
          'Investor Type': tx.investor?.type || 'N/A',
          'Vault': tx.vault?.name || 'Unknown',
          'Country': tx.vault?.country || 'N/A',
          'Amount': tx.amount,
          'Currency': tx.currency,
          'Type': tx.transaction_type,
          'Description': tx.description || '',
        }));
        generateCSV(data, 'transaction_history');
      } else {
        const vaultData = vaults.map(v => ({
          'Vault Name': v.name,
          'Country': v.country,
          'Total Capital': v.total_capital,
          'Community Members': v.community_members,
          'Projects Funded': v.projects_funded,
        }));
        generateCSV(vaultData, 'network_analytics');
      }
      setIsExporting(false);
    }, 500);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      const totalCapital = vaults.reduce((sum, v) => sum + v.total_capital, 0);
      const totalTransactions = transactions.length;
      const totalInvestors = investors.length;
      const totalVaults = vaults.length;
      
      if (exportType === 'transactions') {
        const transactionRows = transactions.slice(0, 50).map(tx => `
          <tr>
            <td>${new Date(tx.created_at).toLocaleDateString()}</td>
            <td>${tx.investor?.name || 'Unknown'}</td>
            <td>${tx.vault?.name || 'Unknown'}</td>
            <td>$${(tx.amount / 1000000).toFixed(2)}M</td>
            <td>${tx.transaction_type}</td>
          </tr>
        `).join('');

        const content = `
          <h1>Capital Flow Transaction Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          
          <div class="summary">
            <div class="metric">
              <div class="metric-value">${totalTransactions}</div>
              <div class="metric-label">Total Transactions</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${(totalCapital / 1000000).toFixed(0)}M</div>
              <div class="metric-label">Total Capital</div>
            </div>
            <div class="metric">
              <div class="metric-value">${totalInvestors}</div>
              <div class="metric-label">Active Investors</div>
            </div>
          </div>

          <h2>Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Investor</th>
                <th>Vault</th>
                <th>Amount</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows}
            </tbody>
          </table>
          ${transactions.length > 50 ? '<p><em>Showing first 50 transactions...</em></p>' : ''}
        `;
        generatePDF(content, 'transaction_report');
      } else {
        const vaultRows = vaults.map(v => `
          <tr>
            <td>${v.name}</td>
            <td>${v.country}</td>
            <td>$${(v.total_capital / 1000000).toFixed(2)}M</td>
            <td>${v.community_members.toLocaleString()}</td>
            <td>${v.projects_funded}</td>
          </tr>
        `).join('');

        const investorRows = investors.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${i.type}</td>
            <td>${i.region}</td>
            <td>$${(i.total_invested / 1000000).toFixed(2)}M</td>
          </tr>
        `).join('');

        const content = `
          <h1>Network Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          
          <div class="summary">
            <div class="metric">
              <div class="metric-value">${totalVaults}</div>
              <div class="metric-label">Active Vaults</div>
            </div>
            <div class="metric">
              <div class="metric-value">${totalInvestors}</div>
              <div class="metric-label">Investors</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${(totalCapital / 1000000).toFixed(0)}M</div>
              <div class="metric-label">Total Capital</div>
            </div>
            <div class="metric">
              <div class="metric-value">${vaults.reduce((sum, v) => sum + v.projects_funded, 0)}</div>
              <div class="metric-label">Projects Funded</div>
            </div>
          </div>

          <h2>Vault Overview</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Country</th>
                <th>Capital</th>
                <th>Members</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              ${vaultRows}
            </tbody>
          </table>

          <h2>Investor Network</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Region</th>
                <th>Invested</th>
              </tr>
            </thead>
            <tbody>
              ${investorRows}
            </tbody>
          </table>
        `;
        generatePDF(content, 'network_analytics_report');
      }
      setIsExporting(false);
    }, 500);
  };

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export Reports
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Report Type</label>
          <Select value={exportType} onValueChange={(v: 'transactions' | 'analytics') => setExportType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactions">Transaction History</SelectItem>
              <SelectItem value="analytics">Network Analytics</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            PDF
          </Button>
        </div>
      </div>
    </Card>
  );
};
