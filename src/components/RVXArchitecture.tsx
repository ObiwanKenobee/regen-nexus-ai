import { Card } from "@/components/ui/card";
import { Database, Users, TrendingUp, Globe, Zap, Shield } from "lucide-react";

const architecturePoints = [
  {
    icon: Users,
    title: "Community Sovereign Vaults",
    description: "Local communities co-design impact metrics and funding priorities through participatory governance models"
  },
  {
    icon: Globe,
    title: "Global Capital Mesh",
    description: "Connects investors, universities, and development agencies in a transparent, real-time network"
  },
  {
    icon: Database,
    title: "Real-Time Data Flow",
    description: "Live integration of climate data, economic indicators, and social impact metrics"
  },
  {
    icon: TrendingUp,
    title: "AI Forecasting",
    description: "Advanced modeling of development policy outcomes and regenerative finance flows"
  },
  {
    icon: Zap,
    title: "Rapid Innovation Cycles",
    description: "Accelerated deployment of solutions through digital twins and simulation environments"
  },
  {
    icon: Shield,
    title: "Indigenous IP Protection",
    description: "Legal frameworks protecting local innovation and traditional knowledge systems"
  }
];

const RVXArchitecture = () => {
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            The RVX Architecture
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A capital mesh ecosystem that ensures data, capital, and innovation flow seamlessly 
            between community-led sovereign vaults and global stakeholders
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {architecturePoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border bg-card group"
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                  <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">
                  {point.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="p-8 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  Living Laboratory Network
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Starting with Kenya, Rwanda, and Ghana, the RVX network establishes data-driven 
                  collaboration hubs that enable cooperative intelligence between local innovators, 
                  international research universities, governments, and regenerative finance models.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RVXArchitecture;
