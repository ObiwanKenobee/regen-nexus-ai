import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const domains = [
  {
    domain: "Economic Sciences / Political Economics",
    programs: "MIDE (HTW Berlin), MSc Development Economics (Göttingen)",
    application: "Models regenerative finance and equitable trade flows; simulates development policy outcomes through AI forecasting",
    color: "primary"
  },
  {
    domain: "Development Cooperation / Management",
    programs: "MA Development Management (RU Bochum), Sustainable Development Management (HS Rhein-Waal)",
    application: "Integrates participatory governance models, enabling local communities to co-design impact metrics and funding priorities",
    color: "secondary"
  },
  {
    domain: "Environmental Risks / Resource Management",
    programs: "Geography of Environmental Risks (U Bonn), NEXtra PhD (TU Dresden)",
    application: "Builds climate risk models and resilience indexes for community-led adaptation",
    color: "accent"
  },
  {
    domain: "Urban and Regional Planning",
    programs: "SPRING (TU Dortmund), Urban Management (TU Berlin)",
    application: "Creates digital twins of cities (like Nairobi or Kigali) to plan infrastructure around sustainability and inclusive growth",
    color: "primary"
  },
  {
    domain: "Agricultural & Forest Sciences",
    programs: "AgEcon (Hohenheim), Tropical Forestry (TU Dresden)",
    application: "Connects regenerative agriculture and carbon credit systems to rural development vaults",
    color: "secondary"
  },
  {
    domain: "Public Health / Social Systems",
    programs: "MSc Global Urban Health (Freiburg), MSc International Health (Heidelberg)",
    application: "Measures human well-being as part of sustainability — linking social health outcomes to environmental and financial indicators",
    color: "accent"
  },
  {
    domain: "Social Sciences & Law",
    programs: "LL.M. IP and Competition Law (Munich), INEMA (Ludwigsburg/Helwan)",
    application: "Protects indigenous innovation and intellectual property within climate adaptation solutions",
    color: "primary"
  }
];

const AcademicDomains = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Intelligent Academic Fusion
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            RDX integrates cutting-edge research across 8+ academic disciplines, transforming 
            theoretical frameworks into operational infrastructure for sustainable development
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {domains.map((item, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-medium transition-all duration-300 border-border bg-card group"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-card-foreground">
                      {item.domain}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${item.color === 'primary' ? 'border-primary/30 text-primary bg-primary/5' : ''}
                        ${item.color === 'secondary' ? 'border-secondary/30 text-secondary bg-secondary/5' : ''}
                        ${item.color === 'accent' ? 'border-accent/30 text-accent bg-accent/5' : ''}
                        shrink-0
                      `}
                    >
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    {item.programs}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Platform Application:</span> {item.application}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground italic">
            Partnered with leading European universities and African research institutions
          </p>
        </div>
      </div>
    </section>
  );
};

export default AcademicDomains;
