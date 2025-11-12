import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Building2, GraduationCap, Users, Briefcase } from "lucide-react";

const stakeholders = [
  {
    icon: Building2,
    title: "Investors",
    description: "Access high-impact regenerative finance opportunities with transparent tracking",
    cta: "Explore Investment"
  },
  {
    icon: GraduationCap,
    title: "Universities",
    description: "Partner in applied research and deploy academic frameworks in living laboratories",
    cta: "Research Partnerships"
  },
  {
    icon: Users,
    title: "Communities",
    description: "Launch sovereign vaults and co-design local development priorities",
    cta: "Start a Vault"
  },
  {
    icon: Briefcase,
    title: "Development Agencies",
    description: "Scale proven models and integrate with existing SDG initiatives",
    cta: "Collaborate with RDX"
  }
];

const CallToAction = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Join the Regenerative Revolution
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Whether you're an investor, researcher, community leader, or development professional — 
            the RDX platform has a place for your contribution to sustainable transformation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {stakeholders.map((stakeholder, index) => {
            const Icon = stakeholder.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border bg-card group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all flex-shrink-0">
                    <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      {stakeholder.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {stakeholder.description}
                    </p>
                    <Button 
                      variant="ghost" 
                      className="text-primary hover:text-primary/80 p-0 h-auto font-semibold group/btn"
                    >
                      {stakeholder.cta}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-hero text-primary-foreground">
            <div className="text-center space-y-6">
              <h3 className="text-3xl font-bold">
                Ready to Transform Development?
              </h3>
              <p className="text-lg opacity-95 max-w-2xl mx-auto">
                Connect with our team to explore partnership opportunities, access platform features, 
                or learn more about the RDX vision for 2070
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                >
                  Request Platform Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  Download Whitepaper
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
