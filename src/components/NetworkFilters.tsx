import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, MapPin, Building2 } from 'lucide-react';

interface Vault {
  id: string;
  name: string;
  country: string;
  status: string;
}

interface Investor {
  id: string;
  name: string;
  type: string;
  region: string;
}

interface NetworkFiltersProps {
  vaults: Vault[];
  investors: Investor[];
  selectedRegions: string[];
  selectedInvestorTypes: string[];
  onRegionChange: (regions: string[]) => void;
  onInvestorTypeChange: (types: string[]) => void;
}

export const NetworkFilters = ({
  vaults,
  investors,
  selectedRegions,
  selectedInvestorTypes,
  onRegionChange,
  onInvestorTypeChange,
}: NetworkFiltersProps) => {
  // Extract unique regions from vaults
  const regions = [...new Set(vaults.map(v => v.country))];
  
  // Extract unique investor types
  const investorTypes = [...new Set(investors.map(i => i.type))];

  const handleRegionToggle = (region: string) => {
    if (selectedRegions.includes(region)) {
      onRegionChange(selectedRegions.filter(r => r !== region));
    } else {
      onRegionChange([...selectedRegions, region]);
    }
  };

  const handleInvestorTypeToggle = (type: string) => {
    if (selectedInvestorTypes.includes(type)) {
      onInvestorTypeChange(selectedInvestorTypes.filter(t => t !== type));
    } else {
      onInvestorTypeChange([...selectedInvestorTypes, type]);
    }
  };

  const formatInvestorType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getVaultCountByRegion = (region: string) => {
    return vaults.filter(v => v.country === region && v.status === 'active').length;
  };

  const getInvestorCountByType = (type: string) => {
    return investors.filter(i => i.type === type).length;
  };

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary" />
        Network Filters
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vault Regions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="w-4 h-4" />
            Vault Regions
          </div>
          <div className="space-y-2">
            {regions.map((region) => (
              <div key={region} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={selectedRegions.includes(region)}
                    onCheckedChange={() => handleRegionToggle(region)}
                  />
                  <Label
                    htmlFor={`region-${region}`}
                    className="text-sm cursor-pointer"
                  >
                    {region}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getVaultCountByRegion(region)} vault{getVaultCountByRegion(region) !== 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Investor Types */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="w-4 h-4" />
            Investor Types
          </div>
          <div className="space-y-2">
            {investorTypes.map((type) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedInvestorTypes.includes(type)}
                    onCheckedChange={() => handleInvestorTypeToggle(type)}
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm cursor-pointer"
                  >
                    {formatInvestorType(type)}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getInvestorCountByType(type)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active filters summary */}
      {(selectedRegions.length < regions.length || selectedInvestorTypes.length < investorTypes.length) && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {selectedRegions.length > 0 && selectedRegions.length < regions.length && (
              <Badge variant="secondary" className="text-xs">
                {selectedRegions.length} of {regions.length} regions
              </Badge>
            )}
            {selectedInvestorTypes.length > 0 && selectedInvestorTypes.length < investorTypes.length && (
              <Badge variant="secondary" className="text-xs">
                {selectedInvestorTypes.length} of {investorTypes.length} investor types
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
