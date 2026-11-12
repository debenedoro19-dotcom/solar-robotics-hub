import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EcosystemSection from "@/components/sections/EcosystemSection";
import FloatingSupport from "@/components/sections/FloatingSupport";

export default function EcosystemPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <div className="pt-14">
        <EcosystemSection />
      </div>
      <Footer />
      <FloatingSupport />
    </main>
  );
}
