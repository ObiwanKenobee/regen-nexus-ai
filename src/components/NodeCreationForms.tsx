import { useState } from 'react';
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
import { Building2, Users, Loader2, Plus, Globe, Briefcase } from 'lucide-react';

const countries = [
  'Kenya', 'Nigeria', 'Ghana', 'South Africa', 'Tanzania', 'Ethiopia', 
  'Rwanda', 'Uganda', 'Senegal', 'Côte d\'Ivoire', 'Morocco', 'Egypt'
];

const investorTypes = [
  'Impact Fund', 'Development Bank', 'University Endowment', 
  'Family Office', 'Corporate', 'Sovereign Fund'
];

const regions = ['North America', 'Europe', 'Asia', 'Africa', 'Middle East', 'Oceania'];

export const NodeCreationForms = () => {
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [isCreatingInvestor, setIsCreatingInvestor] = useState(false);

  // Vault form state
  const [vaultName, setVaultName] = useState('');
  const [vaultCountry, setVaultCountry] = useState('');
  const [vaultCapital, setVaultCapital] = useState('');

  // Investor form state
  const [investorName, setInvestorName] = useState('');
  const [investorType, setInvestorType] = useState('');
  const [investorRegion, setInvestorRegion] = useState('');
  const [investorAmount, setInvestorAmount] = useState('');

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vaultName || !vaultCountry) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingVault(true);

    // Generate random position for 3D visualization
    const posX = (Math.random() - 0.5) * 6;
    const posY = (Math.random() - 0.5) * 4;
    const posZ = (Math.random() - 0.5) * 2;

    try {
      const { error } = await supabase.from('vaults').insert({
        name: vaultName,
        country: vaultCountry,
        total_capital: parseFloat(vaultCapital) * 1000000 || 0,
        position_x: posX,
        position_y: posY,
        position_z: posZ,
        status: 'active',
      });

      if (error) throw error;

      toast({
        title: 'Vault Created',
        description: `${vaultName} has been added to the network`,
      });

      setVaultName('');
      setVaultCountry('');
      setVaultCapital('');
    } catch (error) {
      console.error('Error creating vault:', error);
      toast({
        title: 'Error',
        description: 'Failed to create vault. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingVault(false);
    }
  };

  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investorName || !investorType || !investorRegion) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingInvestor(true);

    // Generate random position for 3D visualization
    const posX = (Math.random() - 0.5) * 8;
    const posY = (Math.random() - 0.5) * 6;
    const posZ = (Math.random() - 0.5) * 3;

    try {
      const { error } = await supabase.from('investors').insert({
        name: investorName,
        type: investorType,
        region: investorRegion,
        total_invested: parseFloat(investorAmount) * 1000000 || 0,
        position_x: posX,
        position_y: posY,
        position_z: posZ,
      });

      if (error) throw error;

      toast({
        title: 'Investor Added',
        description: `${investorName} has joined the network`,
      });

      setInvestorName('');
      setInvestorType('');
      setInvestorRegion('');
      setInvestorAmount('');
    } catch (error) {
      console.error('Error creating investor:', error);
      toast({
        title: 'Error',
        description: 'Failed to add investor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingInvestor(false);
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-accent border-accent/30">
            Grow the Network
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Add New{' '}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              Network Nodes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expand the regenerative finance network by adding new sovereign vaults or connecting impact investors.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="vault" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="vault" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                New Vault
              </TabsTrigger>
              <TabsTrigger value="investor" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                New Investor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vault">
              <Card className="p-8 bg-card border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Create Sovereign Vault</h3>
                    <p className="text-sm text-muted-foreground">Set up a new community-led financial hub</p>
                  </div>
                </div>

                <form onSubmit={handleCreateVault} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="vaultName">Vault Name *</Label>
                      <Input
                        id="vaultName"
                        placeholder="e.g., Lake Victoria Basin Vault"
                        value={vaultName}
                        onChange={(e) => setVaultName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vaultCountry">Country *</Label>
                      <Select value={vaultCountry} onValueChange={setVaultCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vaultCapital">Initial Capital ($ millions)</Label>
                    <Input
                      id="vaultCapital"
                      type="number"
                      placeholder="e.g., 10"
                      value={vaultCapital}
                      onChange={(e) => setVaultCapital(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for $0 initial capital</p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreatingVault}>
                    {isCreatingVault ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Vault...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Vault
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="investor">
              <Card className="p-8 bg-card border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <Briefcase className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Add Investor</h3>
                    <p className="text-sm text-muted-foreground">Connect a new impact investor to the network</p>
                  </div>
                </div>

                <form onSubmit={handleCreateInvestor} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="investorName">Investor Name *</Label>
                      <Input
                        id="investorName"
                        placeholder="e.g., Acme Impact Partners"
                        value={investorName}
                        onChange={(e) => setInvestorName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="investorType">Type *</Label>
                      <Select value={investorType} onValueChange={setInvestorType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {investorTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="investorRegion">Region *</Label>
                      <Select value={investorRegion} onValueChange={setInvestorRegion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="investorAmount">Total Invested ($ millions)</Label>
                      <Input
                        id="investorAmount"
                        type="number"
                        placeholder="e.g., 25"
                        value={investorAmount}
                        onChange={(e) => setInvestorAmount(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isCreatingInvestor}>
                    {isCreatingInvestor ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Investor...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Investor
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
