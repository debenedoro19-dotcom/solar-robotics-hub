import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VIPSection from "@/components/sections/VIPSection";
import FloatingSupport from "@/components/sections/FloatingSupport";
import ScrollAnimations from "@/components/ScrollAnimations";

export default function VipSessionPage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden">
      <div className="grid-bg" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <div className="pt-16">
        <VIPSection />
      </div>
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
