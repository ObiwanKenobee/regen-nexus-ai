import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users, Loader2, Plus, Globe, Briefcase, Lock } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

const countries = [
  'Kenya', 'Nigeria', 'Ghana', 'South Africa', 'Tanzania', 'Ethiopia', 
  'Rwanda', 'Uganda', 'Senegal', 'Côte d\'Ivoire', 'Morocco', 'Egypt'
];

const investorTypes = [
  'Impact Fund', 'Development Bank', 'University Endowment', 
  'Family Office', 'Corporate', 'Sovereign Fund'
];

const regions = ['North America', 'Europe', 'Asia', 'Africa', 'Middle East', 'Oceania'];

const vaultNameSchema = z.string().trim().min(3, 'Name must be at least 3 characters').max(100);
const investorNameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(100);

export const NodeCreationForms = () => {
  const { user } = useAuth();
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [isCreatingInvestor, setIsCreatingInvestor] = useState(false);
  const [showVaultConfirm, setShowVaultConfirm] = useState(false);
  const [showInvestorConfirm, setShowInvestorConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [vaultName, setVaultName] = useState('');
  const [vaultCountry, setVaultCountry] = useState('');
  const [vaultCapital, setVaultCapital] = useState('');

  const [investorName, setInvestorName] = useState('');
  const [investorType, setInvestorType] = useState('');
  const [investorRegion, setInvestorRegion] = useState('');
  const [investorAmount, setInvestorAmount] = useState('');

  const handleVaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameResult = vaultNameSchema.safeParse(vaultName);
    if (!nameResult.success) errors.vaultName = nameResult.error.errors[0].message;
    if (!vaultCountry) errors.vaultCountry = 'Please select a country';
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) setShowVaultConfirm(true);
  };

  const handleCreateVault = async () => {
    setShowVaultConfirm(false);
    setIsCreatingVault(true);
    try {
      const { error } = await supabase.from('vaults').insert({
        name: vaultName.trim(),
        country: vaultCountry,
        total_capital: parseFloat(vaultCapital) * 1000000 || 0,
        position_x: (Math.random() - 0.5) * 6,
        position_y: (Math.random() - 0.5) * 4,
        position_z: (Math.random() - 0.5) * 2,
        status: 'active',
      });
      if (error) throw error;
      toast({ title: 'Vault Created', description: `${vaultName} has been added` });
      setVaultName(''); setVaultCountry(''); setVaultCapital(''); setFormErrors({});
    } catch {
      toast({ title: 'Error', description: 'Failed to create vault', variant: 'destructive' });
    } finally {
      setIsCreatingVault(false);
    }
  };

  const handleInvestorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameResult = investorNameSchema.safeParse(investorName);
    if (!nameResult.success) errors.investorName = nameResult.error.errors[0].message;
    if (!investorType) errors.investorType = 'Please select a type';
    if (!investorRegion) errors.investorRegion = 'Please select a region';
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) setShowInvestorConfirm(true);
  };

  const handleCreateInvestor = async () => {
    setShowInvestorConfirm(false);
    setIsCreatingInvestor(true);
    try {
      const { error } = await supabase.from('investors').insert({
        name: investorName.trim(),
        type: investorType,
        region: investorRegion,
        total_invested: parseFloat(investorAmount) * 1000000 || 0,
        position_x: (Math.random() - 0.5) * 8,
        position_y: (Math.random() - 0.5) * 6,
        position_z: (Math.random() - 0.5) * 3,
      });
      if (error) throw error;
      toast({ title: 'Investor Added', description: `${investorName} has joined the network` });
      setInvestorName(''); setInvestorType(''); setInvestorRegion(''); setInvestorAmount(''); setFormErrors({});
    } catch {
      toast({ title: 'Error', description: 'Failed to add investor', variant: 'destructive' });
    } finally {
      setIsCreatingInvestor(false);
    }
  };

  return (
    <>
      <ConfirmationDialog open={showVaultConfirm} onOpenChange={setShowVaultConfirm} title="Create Sovereign Vault" description={`Create "${vaultName}" in ${vaultCountry}?`} confirmText="Create" onConfirm={handleCreateVault} variant="info" isLoading={isCreatingVault} />
      <ConfirmationDialog open={showInvestorConfirm} onOpenChange={setShowInvestorConfirm} title="Add Investor" description={`Add "${investorName}" to the network?`} confirmText="Add" onConfirm={handleCreateInvestor} variant="info" isLoading={isCreatingInvestor} />
      
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-accent border-accent/30">Grow the Network</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Add New <span className="text-transparent bg-clip-text bg-gradient-primary">Network Nodes</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Expand the regenerative finance network by adding new sovereign vaults or connecting impact investors.</p>
          </div>

          {!user ? (
            <Card className="max-w-md mx-auto p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
              <p className="text-muted-foreground mb-4">Please sign in to create vaults and investors.</p>
              <Link to="/auth"><Button>Sign In to Continue</Button></Link>
            </Card>
          ) : (
            <div className="max-w-3xl mx-auto">
              <Tabs defaultValue="vault" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="vault" className="flex items-center gap-2"><Building2 className="w-4 h-4" />New Vault</TabsTrigger>
                  <TabsTrigger value="investor" className="flex items-center gap-2"><Users className="w-4 h-4" />New Investor</TabsTrigger>
                </TabsList>

                <TabsContent value="vault">
                  <Card className="p-8 bg-card border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-lg bg-primary/10"><Globe className="w-6 h-6 text-primary" /></div>
                      <div><h3 className="text-xl font-semibold text-foreground">Create Sovereign Vault</h3><p className="text-sm text-muted-foreground">Set up a new community-led financial hub</p></div>
                    </div>
                    <form onSubmit={handleVaultSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="vaultName">Vault Name *</Label>
                          <Input id="vaultName" placeholder="e.g., Lake Victoria Basin Vault" value={vaultName} onChange={(e) => setVaultName(e.target.value)} required aria-describedby={formErrors.vaultName ? 'vault-name-error' : undefined} />
                          {formErrors.vaultName && <p id="vault-name-error" className="text-sm text-destructive">{formErrors.vaultName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vaultCountry">Country *</Label>
                          <Select value={vaultCountry} onValueChange={setVaultCountry}>
                            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                            <SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                          {formErrors.vaultCountry && <p className="text-sm text-destructive">{formErrors.vaultCountry}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vaultCapital">Initial Capital ($ millions)</Label>
                        <Input id="vaultCapital" type="number" placeholder="e.g., 10" value={vaultCapital} onChange={(e) => setVaultCapital(e.target.value)} min="0" step="0.1" />
                      </div>
                      <Button type="submit" className="w-full" disabled={isCreatingVault}>
                        {isCreatingVault ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create Vault</>}
                      </Button>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="investor">
                  <Card className="p-8 bg-card border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-lg bg-secondary/10"><Briefcase className="w-6 h-6 text-secondary" /></div>
                      <div><h3 className="text-xl font-semibold text-foreground">Add Investor</h3><p className="text-sm text-muted-foreground">Connect a new impact investor to the network</p></div>
                    </div>
                    <form onSubmit={handleInvestorSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="investorName">Investor Name *</Label>
                          <Input id="investorName" placeholder="e.g., Acme Impact Partners" value={investorName} onChange={(e) => setInvestorName(e.target.value)} required />
                          {formErrors.investorName && <p className="text-sm text-destructive">{formErrors.investorName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="investorType">Type *</Label>
                          <Select value={investorType} onValueChange={setInvestorType}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>{investorTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                          {formErrors.investorType && <p className="text-sm text-destructive">{formErrors.investorType}</p>}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="investorRegion">Region *</Label>
                          <Select value={investorRegion} onValueChange={setInvestorRegion}>
                            <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                            <SelectContent>{regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                          {formErrors.investorRegion && <p className="text-sm text-destructive">{formErrors.investorRegion}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="investorAmount">Total Invested ($ millions)</Label>
                          <Input id="investorAmount" type="number" placeholder="e.g., 25" value={investorAmount} onChange={(e) => setInvestorAmount(e.target.value)} min="0" step="0.1" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isCreatingInvestor}>
                        {isCreatingInvestor ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Plus className="w-4 h-4 mr-2" />Add Investor</>}
                      </Button>
                    </form>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
