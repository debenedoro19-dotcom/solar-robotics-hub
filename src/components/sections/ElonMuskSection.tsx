import React, { useState, useCallback } from "react";
import AppImage from "@/components/ui/AppImage";

const companies = [
  {
    id: "tesla",
    name: "Tesla",
    founded: "2003",
    role: "CEO & Product Architect",
    tagline: "Accelerating the world's transition to sustainable energy",
    review:
      "Under Musk's leadership, Tesla transformed electric mobility, utility-scale Megapack storage, Solar Roof tiles, and Full Self-Driving neural networks—scaling global Gigafactories and Optimus humanoid robotics.",
    valuation: "$700B+",
    highlights: ["Model S, 3, X, Y, Cybertruck & Cybercab", "Gigafactory network", "Full Self-Driving AI", "Powerwall & Megapack"],
  },
  {
    id: "spacex",
    name: "SpaceX",
    founded: "2002",
    role: "CEO & CTO",
    tagline: "Making humanity multiplanetary",
    review:
      "SpaceX pioneered orbital rocket reusability with Falcon 9 and Starlink global broadband, while advancing Starship super heavy-lift launch capability.",
    valuation: "$350B+",
    highlights: ["Falcon 9 reusability", "Starship orbital test program", "Starlink constellation", "NASA Artemis lander"],
  },
  {
    id: "neuralink",
    name: "Neuralink",
    founded: "2016",
    role: "Co-founder & CEO",
    tagline: "High-bandwidth neural interfaces",
    review:
      "Developing ultra-high-bandwidth brain-computer interfaces to restore motor independence and pioneer direct digital control.",
    valuation: "$8B+",
    highlights: ["N1 wireless implant", "Clinical trials underway", "Robotic micro-threading", "Assistive interface software"],
  },
  {
    id: "xai",
    name: "xAI",
    founded: "2023",
    role: "Founder & CEO",
    tagline: "Understanding the universe with real-time AI",
    review:
      "Built the Memphis Colossus supercomputer cluster powering Grok reasoning models and real-time enterprise inference.",
    valuation: "$50B+",
    highlights: ["Grok reasoning models", "Colossus supercomputer", "Real-time web & telemetry", "Deep compute integration"],
  },
  {
    id: "x",
    name: "X",
    founded: "2022",
    role: "Owner & Executive Chairman",
    tagline: "Real-time global town square and digital payments",
    review:
      "Rebuilt around real-time creator monetization, live streaming, Grok AI integration, and peer-to-peer payment infrastructure.",
    valuation: "$19B+",
    highlights: ["600M+ monthly users", "X Money architecture", "Grok assistant native integration", "Global town square"],
  },
  {
    id: "boring",
    name: "The Boring Company",
    founded: "2016",
    role: "Founder",
    tagline: "Zero-emission high-speed underground urban transit",
    review:
      "Constructing continuous subterranean EV transit loops using custom Prufrock tunnel boring machines in Las Vegas and expanding cities.",
    valuation: "$5.7B+",
    highlights: ["Vegas Convention Loop", "Prufrock TBM fleet", "Electric transit stations", "All-weather underground tunnels"],
  },
];

const bioTimeline = [
  { year: "1971", event: "Born in Pretoria, South Africa" },
  { year: "1999", event: "Sold Zip2 for $307M; co-founded X.com (PayPal)" },
  { year: "2002", event: "Founded SpaceX to engineer reusable rockets" },
  { year: "2004", event: "Led Series A investment in Tesla; named Chairman" },
  { year: "2008", event: "Named Tesla CEO; Falcon 1 reached Earth orbit" },
  { year: "2015", event: "Launched Tesla Powerwall and Gigafactory expansion" },
  { year: "2024–2026", event: "Scaled Cybertruck, Cybercab, FSD & Optimus Gen 2" },
];

export default function ElonMuskSection() {
  const [activeCompany, setActiveCompany] = useState(companies[0]);

  const handleCompanySelect = useCallback((c: (typeof companies)[number]) => {
    setActiveCompany(c);
  }, []);

  return (
    <section id="elon-musk" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-10 bg-background">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e82127]">
            Leadership & Long-Term Vision
          </p>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Elon Musk — The Architect Behind the Ecosystem
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
            From zero-emission electric vehicles and utility energy storage to humanoid robotics
            and reusable orbital rockets.
          </p>
        </div>

        {/* Biography Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-16">
          <div className="lg:col-span-2 relative rounded-xl overflow-hidden min-h-[420px] border border-border bg-[#0a0b0d]">
            <AppImage
              src="/assets/images/elon_musk_portrait.webp"
              alt="Elon Musk portrait"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,11,13,0.05) 45%, rgba(10,11,13,0.9) 100%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="font-display text-2xl font-semibold">Elon Musk</div>
              <div className="text-xs text-white/70 uppercase tracking-widest mt-1">
                CEO & Product Architect · Tesla / SpaceX / xAI
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Biography</h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Born June 28, 1971, in Pretoria, South Africa, Elon Musk moved to North America
                  to study physics and economics at the University of Pennsylvania before founding
                  Zip2 and X.com (PayPal).
                </p>
                <p>
                  Reinvesting his proceeds directly into SpaceX and Tesla, he focused engineering on
                  sustainable transport, solar energy generation, utility battery storage,
                  real-world FSD neural networks, and Optimus humanoid robotics.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">
                Key Milestones
              </h2>
              <div className="space-y-3 border-l border-border pl-5">
                {bioTimeline.map((item) => (
                  <div key={item.year} className="flex items-baseline gap-4">
                    <span className="w-20 shrink-0 font-display text-xs font-semibold text-[#e82127] tabular">
                      {item.year}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Connected Ecosystem
          </p>
          <h2 className="font-display mt-1 text-2xl sm:text-3xl font-semibold mb-6">
            Venture Portfolio
          </h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCompanySelect(c)}
                className={`rounded-[4px] px-4 py-2 text-xs font-medium transition-colors ${
                  activeCompany.id === c.id
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h3 className="font-display text-2xl font-semibold text-foreground">
                {activeCompany.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Founded {activeCompany.founded} · {activeCompany.role}
              </p>
              <p className="mt-4 text-sm font-medium text-foreground">
                &ldquo;{activeCompany.tagline}&rdquo;
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {activeCompany.review}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/35 p-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Est. Enterprise Scale
                </div>
                <div className="font-display mt-1 text-3xl font-semibold text-foreground tabular">
                  {activeCompany.valuation}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Core Milestones
                </div>
                <ul className="space-y-2">
                  {activeCompany.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#e82127] shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
