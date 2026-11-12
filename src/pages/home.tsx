import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/sections/FloatingSupport";
import HeroModelSwitcher from "@/components/home/HeroModelSwitcher";
import TeslaLineupSection from "@/components/home/TeslaLineupSection";
import HomeInventoryPeek from "@/components/home/HomeInventoryPeek";
import {
  QuickLinksSection,
  EnergyAndSolarSection,
  SuperchargerAndRoboticsSection,
} from "@/components/home/TeslaEnergySections";

export default function HomePage() {
  const [heroConfigureModelId, setHeroConfigureModelId] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header heroTransparent />
      <HeroModelSwitcher onConfigureModel={(id) => setHeroConfigureModelId(id)} />
      <QuickLinksSection />
      <TeslaLineupSection
        externalModelId={heroConfigureModelId}
        onClearExternalModel={() => setHeroConfigureModelId(null)}
      />
      <HomeInventoryPeek />
      <EnergyAndSolarSection />
      <SuperchargerAndRoboticsSection />
      <Footer />
      <FloatingSupport />
    </main>
  );
}
