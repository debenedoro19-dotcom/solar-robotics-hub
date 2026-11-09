import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "@/components/SmartLink";
import HeroModelSwitcher from "@/components/home/HeroModelSwitcher";
import HomeInventoryPeek from "@/components/home/HomeInventoryPeek";
import AllocationSimulator from "@/components/home/AllocationSimulator";
import EcosystemBentoGrid from "@/components/home/EcosystemBentoGrid";
import GiveawaysSection from "@/components/sections/GiveawaysSection";
import InvestmentPackagesSection from "@/components/sections/InvestmentPackagesSection";
import FloatingSupport from "@/components/sections/FloatingSupport";
import ScrollAnimations from "@/components/ScrollAnimations";

function VideoInventoryPanel() {
  return (
    <section className="tsla-panel">
      <video
        src="/assets/video/inventory.mp4"
        poster="/assets/video/inventory-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={(e) => e.currentTarget.classList.add("is-playing")}
      />
      <div className="pt-28 sm:pt-32 px-6">
        <p className="lux-label tsla-rise" style={{ color: "var(--on-media)", opacity: 0.85 }}>Live Inventory</p>
        <h2 className="tsla-rise tsla-rise-1 mt-3 text-5xl sm:text-6xl font-medium tracking-tight">Drive Today</h2>
        <p className="tsla-rise tsla-rise-2 mt-3 text-sm sm:text-base opacity-90">Verified vehicles, energy and robotics — ready to order</p>
      </div>
      <div className="pb-10 px-6 w-full max-w-3xl tsla-rise tsla-rise-3">
        <div className="lux-metrics mb-8">
          <div><div className="text-2xl sm:text-3xl font-medium">20+</div><div className="lux-label" style={{ color: "var(--on-media)" }}>Models</div></div>
          <div><div className="text-2xl sm:text-3xl font-medium">1 Day</div><div className="lux-label" style={{ color: "var(--on-media)" }}>Specialist Contact</div></div>
          <div><div className="text-2xl sm:text-3xl font-medium">24/7</div><div className="lux-label" style={{ color: "var(--on-media)" }}>Support</div></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
          <Link href="/inventory" className="tsla-btn tsla-btn-solid">Shop Inventory</Link>
          <Link href="/register" className="tsla-btn tsla-btn-ghost">Start Investing</Link>
        </div>
      </div>
      <div className="tsla-scroll-cue" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden min-h-screen">
      <Header />
      <h1 className="sr-only">Trade Tesla — vehicles, energy, solar, robotics and investing</h1>
      
      {/* Cinematic Hero Video Panel */}
      <VideoInventoryPanel />

      {/* Interactive Feature & Model Switcher */}
      <HeroModelSwitcher />

      {/* Database-Backed Live Inventory Peek Carousel */}
      <HomeInventoryPeek />

      {/* Interactive Allocation & Yield Simulator */}
      <AllocationSimulator />

      {/* Ecosystem Bento Grid (Energy, Robotics, Space) */}
      <EcosystemBentoGrid />

      {/* Official Tesla Giveaways */}
      <GiveawaysSection />

      {/* Investment Packages Section */}
      <InvestmentPackagesSection />

      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
