import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Leaf, DollarSign, GraduationCap, Heart } from "lucide-react";

const metrics = [
  {
    icon: DollarSign,
    value: "$2.5B+",
    label: "Capital Mobilized",
    trend: "+34%",
    description: "Regenerative finance flowing to community vaults"
  },
  {
    icon: Users,
    value: "150K+",
    label: "Community Members",
    trend: "+28%",
    description: "Active participants in sovereign vault networks"
  },
  {
    icon: Leaf,
    value: "8.2M",
    label: "Tons CO₂ Offset",
    trend: "+45%",
    description: "Through verified regenerative agriculture projects"
  },
  {
    icon: GraduationCap,
    value: "50+",
    label: "Research Partners",
    trend: "+12%",
    description: "Universities and academic institutions"
  },
  {
    icon: Heart,
    value: "92%",
    label: "Health Improvement",
    trend: "+8%",
    description: "In well-being metrics across pilot communities"
  },
  {
    icon: TrendingUp,
    value: "15",
    label: "SDG Alignments",
    trend: "Active",
    description: "Direct contribution to UN Sustainable Development Goals"
  }
];

const ImpactMetrics = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Real-Time Impact Dashboard
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Live metrics demonstrating the measurable transformation driven by the RDX platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-medium transition-all duration-300 border-border bg-card group relative overflow-hidden"
              >
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-1 rounded">
                      {metric.trend}
                    </span>
                  </div>
                  
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {metric.value}
                  </div>
                  
                  <div className="text-sm font-semibold text-muted-foreground mb-2">
                    {metric.label}
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {metric.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Data updated in real-time from sovereign vaults across Kenya, Rwanda, and Ghana
          </p>
        </div>
      </div>
    </section>
  );
};

export default ImpactMetrics;
