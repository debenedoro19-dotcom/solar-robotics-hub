import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ElonMuskSection from "@/components/sections/ElonMuskSection";
import FloatingSupport from "@/components/sections/FloatingSupport";
import ScrollAnimations from "@/components/ScrollAnimations";

export default function ElonMuskPage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden">
      <div className="grid-bg" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <div className="pt-16">
        <ElonMuskSection />
      </div>
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
