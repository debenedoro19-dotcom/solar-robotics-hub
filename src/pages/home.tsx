import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "@/components/SmartLink";
import FloatingSupport from "@/components/sections/FloatingSupport";
import ScrollAnimations from "@/components/ScrollAnimations";
import HeroModelSwitcher from "@/components/home/HeroModelSwitcher";
import HomeInventoryPeek from "@/components/home/HomeInventoryPeek";
import AllocationSimulator from "@/components/home/AllocationSimulator";
import EcosystemBentoGrid from "@/components/home/EcosystemBentoGrid";

export default function HomePage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden">
      <Header />
      <HeroModelSwitcher />
      <HomeInventoryPeek />
      <AllocationSimulator />
      <EcosystemBentoGrid />
      <section className="border-t border-border px-5 py-12 text-center sm:px-8">
        <p className="lux-label">Careers & apprenticeship</p>
        <h2 className="mt-2 text-2xl font-medium">Build what comes next</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Explore open roles across engineering, operations, solar and technology.</p>
        <Link href="/careers" className="mt-5 inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted">Explore careers</Link>
      </section>
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
