import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import GiveawaysSection from "@/components/sections/GiveawaysSection";
import InvestmentPackagesSection from "@/components/sections/InvestmentPackagesSection";
import PlatformCredibilitySection from "@/components/sections/PlatformCredibilitySection";
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
      <div className="defer-paint"><GiveawaysSection /></div>
      <div className="defer-paint"><InvestmentPackagesSection /></div>
      <div className="defer-paint"><PlatformCredibilitySection /></div>
      <div className="defer-paint"><TestimonialsSection /></div>
      <div className="defer-paint"><FinalCTASection /></div>
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
