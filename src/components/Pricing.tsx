import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Shield, Globe, Leaf, Building2, Users } from 'lucide-react';

const plans = [
  {
    name: 'Sovereign Starter',
    description: 'For emerging communities ready to build their regenerative future',
    price: 0,
    period: 'forever',
    highlight: false,
    icon: Leaf,
    features: [
      'Up to $500K vault capacity',
      'Basic impact tracking',
      'Community dashboard',
      '3 project proposals per month',
      'Email support',
      'Standard verification',
    ],
    cta: 'Start Free',
    badge: null,
  },
  {
    name: 'Growth Vault',
    description: 'Scale your impact with enhanced tools and global investor access',
    price: 2.5,
    period: '% of AUM',
    highlight: true,
    icon: Zap,
    features: [
      'Up to $10M vault capacity',
      'Advanced impact analytics',
      'Real-time capital flow tracking',
      'Unlimited project proposals',
      'Priority investor matching',
      'AI-powered sustainability scoring',
      'Dedicated success manager',
      'Carbon credit integration',
    ],
    cta: 'Get Started',
    badge: 'Most Popular',
  },
  {
    name: 'Institutional',
    description: 'Enterprise-grade infrastructure for large-scale regenerative finance',
    price: 1.5,
    period: '% of AUM',
    highlight: false,
    icon: Building2,
    features: [
      'Unlimited vault capacity',
      'Multi-vault management',
      'White-label solutions',
      'Custom API integrations',
      'Regulatory compliance suite',
      'Dedicated legal support',
      'SLA guarantees',
      'Custom smart contracts',
      'Board-level reporting',
    ],
    cta: 'Contact Sales',
    badge: 'Enterprise',
  },
];

const investorPlans = [
  {
    name: 'Explorer',
    description: 'Discover regenerative investment opportunities',
    price: 0,
    features: ['Browse all vaults', 'Basic portfolio tracking', 'Monthly impact reports'],
  },
  {
    name: 'Impact Investor',
    description: 'Active participation with premium insights',
    price: 199,
    features: ['Priority deal flow', 'Advanced due diligence tools', 'Direct vault communication', 'Tax documentation'],
  },
  {
    name: 'Fund Manager',
    description: 'Institutional tools for scaled impact',
    price: 'Custom',
    features: ['Multi-fund management', 'Co-investment syndication', 'Custom mandates', 'API access'],
  },
];

export const Pricing = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/30">
            Transparent Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Aligned Incentives for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              Regenerative Growth
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our fee structure grows with your impact. No hidden costs, no extraction—just sustainable value creation for all stakeholders.
          </p>
        </div>

        {/* Vault Plans */}
        <div className="mb-20">
          <h3 className="text-2xl font-semibold text-foreground text-center mb-8 flex items-center justify-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            For Sovereign Vaults
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative p-8 transition-all duration-300 hover:shadow-large ${
                  plan.highlight
                    ? 'border-primary shadow-glow scale-105 bg-card'
                    : 'border-border bg-card/50 hover:bg-card'
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground">
                    {plan.badge}
                  </Badge>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.highlight ? 'bg-primary/10' : 'bg-muted'}`}>
                    <plan.icon className={`w-6 h-6 ${plan.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h4 className="text-xl font-bold text-foreground">{plan.name}</h4>
                </div>
                
                <p className="text-muted-foreground text-sm mb-6 min-h-[48px]">
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === 0 ? 'Free' : `${plan.price}%`}
                  </span>
                  {plan.price !== 0 && (
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Investor Plans */}
        <div>
          <h3 className="text-2xl font-semibold text-foreground text-center mb-8 flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-secondary" />
            For Investors
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {investorPlans.map((plan, idx) => (
              <Card key={plan.name} className="p-6 border-border bg-card/50 hover:bg-card transition-all duration-300 hover:shadow-medium">
                <h4 className="text-lg font-bold text-foreground mb-2">{plan.name}</h4>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="text-2xl font-bold text-foreground mb-4">
                  {typeof plan.price === 'number' ? (plan.price === 0 ? 'Free' : `$${plan.price}/mo`) : plan.price}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-secondary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">No lock-in contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm">Available in 54 African nations</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
