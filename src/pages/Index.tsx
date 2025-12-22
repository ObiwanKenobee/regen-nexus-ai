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

const Index = () => {
  return (
    <div className="min-h-screen transition-colors duration-500">
      <ThemeToggle />
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
