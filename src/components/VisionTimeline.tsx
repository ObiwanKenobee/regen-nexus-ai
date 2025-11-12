import { Card } from "@/components/ui/card";
import { Target, Sparkles, Network, Brain } from "lucide-react";

const milestones = [
  {
    year: "2025-2030",
    title: "Foundation Phase",
    description: "Launch pilot sovereign vaults in Kenya, Rwanda, and Ghana. Establish partnerships with universities and initial investor networks.",
    icon: Target,
    color: "primary"
  },
  {
    year: "2031-2045",
    title: "Scaling Intelligence",
    description: "Expand to 15+ African nations. Deploy AI-powered digital twins for major cities. Achieve operational integration across 12+ academic domains.",
    icon: Brain,
    color: "secondary"
  },
  {
    year: "2046-2060",
    title: "Continental Integration",
    description: "Full Africa-wide network. Autonomous climate adaptation systems. Regenerative finance becomes the dominant development model.",
    icon: Network,
    color: "accent"
  },
  {
    year: "2061-2070",
    title: "Global Transformation",
    description: "RDX model adopted globally. Development redefined as cooperative intelligence. Economies, ecologies, and education fully aligned.",
    icon: Sparkles,
    color: "primary"
  }
];

const VisionTimeline = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            2070 Vision Horizon
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A five-decade roadmap to transform development into a living laboratory of 
            cooperative intelligence, sustainability, and regenerative growth
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent hidden md:block" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <div 
                    key={index}
                    className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8`}
                  >
                    {/* Card */}
                    <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                      <Card className="p-6 hover:shadow-large transition-all duration-300 inline-block w-full md:w-auto">
                        <div className={`flex items-start gap-4 ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                            ${milestone.color === 'primary' ? 'bg-primary' : ''}
                            ${milestone.color === 'secondary' ? 'bg-secondary' : ''}
                            ${milestone.color === 'accent' ? 'bg-accent' : ''}
                          `}>
                            <Icon className={`h-6 w-6 ${
                              milestone.color === 'accent' ? 'text-accent-foreground' : 'text-primary-foreground'
                            }`} />
                          </div>
                          <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                            <div className="text-sm font-semibold text-primary mb-1">
                              {milestone.year}
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {milestone.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Center Dot */}
                    <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-background border-4 border-primary transform -translate-x-1/2 hidden md:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center">
          <Card className="p-8 bg-gradient-primary text-primary-foreground">
            <h3 className="text-2xl font-bold mb-4">
              By 2070: A New Definition of Development
            </h3>
            <p className="text-lg leading-relaxed opacity-95">
              The RDX network will have redefined "development" as a cooperative intelligence system — 
              where economies, ecologies, and education align to sustain both people and planet.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default VisionTimeline;
