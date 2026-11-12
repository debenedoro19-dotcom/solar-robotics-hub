import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GiveawaysSection from "@/components/sections/GiveawaysSection";
import FloatingSupport from "@/components/sections/FloatingSupport";

export default function GiveawaysPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <div className="pt-14">
        <GiveawaysSection />
      </div>
      <Footer />
      <FloatingSupport />
    </main>
  );
}
