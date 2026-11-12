import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveInventorySection from "@/components/sections/LiveInventorySection";
import FloatingSupport from "@/components/sections/FloatingSupport";

export default function InventoryPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <div className="pt-14">
        <LiveInventorySection />
      </div>
      <Footer />
      <FloatingSupport />
    </main>
  );
}
