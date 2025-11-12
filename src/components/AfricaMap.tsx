import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle2, Clock, Target } from "lucide-react";
import InteractiveMap from "./InteractiveMap";

const regions = [
  {
    country: "Kenya",
    status: "active",
    vaults: 12,
    communities: "45K+",
    focus: "Urban digital twins, AgTech innovation",
    icon: CheckCircle2
  },
  {
    country: "Rwanda",
    status: "active",
    vaults: 8,
    communities: "32K+",
    focus: "Forest restoration, Carbon credits",
    icon: CheckCircle2
  },
  {
    country: "Ghana",
    status: "active",
    vaults: 10,
    communities: "38K+",
    focus: "Coastal resilience, Renewable energy",
    icon: CheckCircle2
  },
  {
    country: "Nigeria",
    status: "planned",
    vaults: 0,
    communities: "Target: 60K+",
    focus: "Oil transition, Youth innovation hubs",
    icon: Clock
  },
  {
    country: "South Africa",
    status: "planned",
    vaults: 0,
    communities: "Target: 50K+",
    focus: "Just transition, Mining rehabilitation",
    icon: Clock
  },
  {
    country: "Ethiopia",
    status: "exploration",
    vaults: 0,
    communities: "Target: 40K+",
    focus: "Water management, Agricultural resilience",
    icon: Target
  }
];

const AfricaMap = () => {
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Living Laboratory Network
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Building regenerative infrastructure across Africa, one community at a time
          </p>
        </div>

        {/* Interactive Map */}
        <div className="mb-12">
          <InteractiveMap />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {regions.map((region, index) => {
              const Icon = region.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border bg-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold text-foreground">
                        {region.country}
                      </h3>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`
                        ${region.status === 'active' ? 'border-primary/30 text-primary bg-primary/5' : ''}
                        ${region.status === 'planned' ? 'border-secondary/30 text-secondary bg-secondary/5' : ''}
                        ${region.status === 'exploration' ? 'border-accent/30 text-accent bg-accent/5' : ''}
                      `}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {region.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sovereign Vaults</span>
                      <span className="font-semibold text-foreground">{region.vaults || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Community Members</span>
                      <span className="font-semibold text-foreground">{region.communities}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Focus:</span> {region.focus}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-8 bg-primary text-primary-foreground">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">
                  Expansion Roadmap: 15+ Nations by 2035
                </h3>
                <p className="text-primary-foreground/90 leading-relaxed">
                  Our strategic expansion plan targets comprehensive coverage across East, West, and Southern Africa, 
                  establishing a continental network of regenerative development hubs powered by local intelligence and global collaboration.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AfricaMap;
