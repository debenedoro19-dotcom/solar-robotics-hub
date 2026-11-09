import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GiveawaysSection from "@/components/sections/GiveawaysSection";
import FloatingSupport from "@/components/sections/FloatingSupport";
import ScrollAnimations from "@/components/ScrollAnimations";

export default function GiveawaysPage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden min-h-screen">
      <div className="grid-bg" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <div className="pt-16">
        <GiveawaysSection />
      </div>
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
