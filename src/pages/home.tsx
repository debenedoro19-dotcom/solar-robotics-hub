import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import TrustBarSection from "@/components/sections/TrustBarSection";
import InvestmentPackagesSection from "@/components/sections/InvestmentPackagesSection";
import ReturnsCalculatorSection from "@/components/sections/ReturnsCalculatorSection";
import EcosystemSection from "@/components/sections/EcosystemSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PlatformCredibilitySection from "@/components/sections/PlatformCredibilitySection";
import SecurityComplianceSection from "@/components/sections/SecurityComplianceSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import FloatingSupport from "@/components/sections/FloatingSupport";
import ScrollAnimations from "@/components/ScrollAnimations";

export default function HomePage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden">
      <div className="grid-bg" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <HeroSection />
      <TrustBarSection />
      <div className="defer-paint"><InvestmentPackagesSection /></div>
      <div className="defer-paint"><ReturnsCalculatorSection /></div>
      <div className="defer-paint"><EcosystemSection /></div>
      <div className="defer-paint"><HowItWorksSection /></div>
      <div className="defer-paint"><PlatformCredibilitySection /></div>
      <div className="defer-paint"><SecurityComplianceSection /></div>
      <div className="defer-paint"><TestimonialsSection /></div>
      <div className="defer-paint"><FinalCTASection /></div>
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
