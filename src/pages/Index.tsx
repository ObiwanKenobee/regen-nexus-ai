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

const Index = () => {
  return (
    <div className="min-h-screen transition-colors duration-500">
      <NotificationSystem />
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <AuthButton />
        <ThemeToggle />
      </div>
      <Hero />
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
      <Footer />
    </div>
  );
};

export default Index;
