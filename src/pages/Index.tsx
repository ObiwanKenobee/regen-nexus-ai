import Hero from "@/components/Hero";
import RVXArchitecture from "@/components/RVXArchitecture";
import AcademicDomains from "@/components/AcademicDomains";
import AfricaMap from "@/components/AfricaMap";
import VisionTimeline from "@/components/VisionTimeline";
import ImpactMetrics from "@/components/ImpactMetrics";
import CapitalFlowVisualization from "@/components/CapitalFlowVisualization";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <RVXArchitecture />
      <ImpactMetrics />
      <CapitalFlowVisualization />
      <AcademicDomains />
      <AfricaMap />
      <VisionTimeline />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
