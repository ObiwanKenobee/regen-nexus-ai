import { useEffect } from "react";
import Hero from "@/components/Hero";
import RVXArchitecture from "@/components/RVXArchitecture";
import AcademicDomains from "@/components/AcademicDomains";
import AfricaMap from "@/components/AfricaMap";
import VisionTimeline from "@/components/VisionTimeline";
import ImpactMetrics from "@/components/ImpactMetrics";
import CapitalFlowVisualization from "@/components/CapitalFlowVisualization";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Pricing } from "@/components/Pricing";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { NodeCreationForms } from "@/components/NodeCreationForms";
import { AuthButton } from "@/components/AuthButton";
import { NotificationSystem } from "@/components/NotificationSystem";
import SEOHead from "@/components/SEOHead";
import LiveCapitalFlowDashboard from "@/components/LiveCapitalFlowDashboard";
import { useActivityTracker } from "@/hooks/useActivityTracker";

const Index = () => {
  const { trackPageView, trackClick } = useActivityTracker();

  useEffect(() => {
    trackPageView("Home");
  }, [trackPageView]);

  return (
    <>
      <SEOHead
        title="Home"
        description="RDX Platform - AI-driven regenerative development exchange for climate-linked economic transformation. Connect community-led innovation with global capital across Africa."
        keywords="regenerative finance, climate investment, Africa development, sustainable capital, impact investing, sovereign vaults, green bonds"
      />
      <div className="min-h-screen transition-colors duration-500">
        <NotificationSystem />
        <header className="fixed top-4 right-4 z-50 flex items-center gap-2" role="navigation" aria-label="User actions">
          <AuthButton />
          <ThemeToggle />
        </header>
        <main>
          <Hero />
          <LiveCapitalFlowDashboard />
          <RVXArchitecture />
          <ImpactMetrics />
          <CapitalFlowVisualization />
          <AnalyticsDashboard />
          <NodeCreationForms />
          <Pricing />
          <AcademicDomains />
          <AfricaMap />
          <VisionTimeline />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
