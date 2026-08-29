import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import LiveInventorySection from "@/components/sections/LiveInventorySection";
import GiveawaysSection from "@/components/sections/GiveawaysSection";
import InvestmentPackagesSection from "@/components/sections/InvestmentPackagesSection";
import PlatformCredibilitySection from "@/components/sections/PlatformCredibilitySection";
import EcosystemSection from "@/components/sections/EcosystemSection";
import ElonMuskSection from "@/components/sections/ElonMuskSection";
import VIPSection from "@/components/sections/VIPSection";
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
      <LiveInventorySection />
      <div className="defer-paint"><GiveawaysSection /></div>
      <div className="defer-paint"><InvestmentPackagesSection /></div>
      <div className="defer-paint"><PlatformCredibilitySection /></div>
      <div className="defer-paint"><EcosystemSection /></div>
      <div className="defer-paint"><ElonMuskSection /></div>
      <div className="defer-paint"><VIPSection /></div>
      <div className="defer-paint"><TestimonialsSection /></div>
      <div className="defer-paint"><FinalCTASection /></div>
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
