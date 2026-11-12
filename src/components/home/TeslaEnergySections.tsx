import React, { useMemo, useState } from "react";
import { TESLA_ENERGY_SYSTEMS } from "@/data/teslaCatalog";
import { useTeslaLoader } from "@/components/TeslaLoader";

export function QuickLinksSection() {
  const { navigateWithLoader } = useTeslaLoader();

  const cards = [
    {
      label: "Vehicles",
      title: "Direct Delivery Inventory",
      summary: "Model S Plaid, Model 3 Highland, Model Y, Model X, Cybertruck, Semi & Cybercab.",
      image: "/images/car-red.jpg",
      href: "/inventory",
      cta: "Explore Vehicles",
    },
    {
      label: "Energy & Solar",
      title: "Powerwall 3 & Solar Roof",
      summary: "13.5 kWh whole-home backup, tempered solar glass tiles, and utility-scale Megapack.",
      image: "/images/energy-home.jpg",
      href: "/ecosystem",
      cta: "Explore Energy",
    },
    {
      label: "Giveaways",
      title: "Free Vehicle Claims",
      summary: "100% free promotional campaigns with verified FedEx freight courier dispatch.",
      image: "/images/car-truck.jpg",
      href: "/giveaways",
      cta: "View Giveaways",
    },
  ];

  const stats = [
    { metric: "5-Star", caption: "NHTSA Safety Rating across entire Model S / 3 / X / Y fleet" },
    { metric: "60,000+", caption: "Global Supercharger stalls engineered for up to 325 kW fast charging" },
    { metric: "30%", caption: "Federal Clean Energy Credit eligible on Solar Roof & Powerwall 3" },
    { metric: "OTA", caption: "Over-the-air telemetry, navigation & FSD neural updates included" },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-muted/35 border-b border-border">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              onClick={() => navigateWithLoader(card.href, card.label.toUpperCase())}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigateWithLoader(card.href, card.label.toUpperCase());
                }
              }}
              className="group relative h-[320px] cursor-pointer overflow-hidden rounded-[6px] bg-[#0a0b0d] text-white"
            >
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,11,13,0.12) 0%, rgba(10,11,13,0.85) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">
                  {card.label}
                </p>
                <h3 className="font-display mt-1.5 text-2xl font-semibold">{card.title}</h3>
                <p className="mt-1.5 text-xs text-white/80 leading-relaxed">{card.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white group-hover:underline">
                  {card.cta} →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Verified Tesla Trust Strip */}
        <div className="mt-10 grid grid-cols-1 gap-6 rounded-[6px] border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.metric}>
              <div className="font-display text-2xl font-semibold tracking-tight text-foreground tabular">
                {s.metric}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EnergyAndSolarSection() {
  const [monthlyBill, setMonthlyBill] = useState(240);
  const [powerwalls, setPowerwalls] = useState<0 | 1 | 2>(1);
  const { navigateWithLoader } = useTeslaLoader();

  const calc = useMemo(() => {
    const recommendedKw = Math.max(4.8, Math.round((monthlyBill / 19) * 10) / 10);
    const systemCost = Math.round(recommendedKw * 2750 + powerwalls * 11500);
    const federalCredit = Math.round(systemCost * 0.3);
    const netCost = systemCost - federalCredit;
    const annualSavings = Math.round(monthlyBill * 12 * (powerwalls > 0 ? 0.94 : 0.78));
    const paybackYears = Math.max(4, Math.round((netCost / Math.max(1, annualSavings)) * 10) / 10);
    return { recommendedKw, systemCost, federalCredit, netCost, annualSavings, paybackYears };
  }, [monthlyBill, powerwalls]);

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-10 bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-[1440px] space-y-20">
        {/* Energy Hardware Row */}
        <div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tesla Energy Ecosystem
              </p>
              <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Clean Generation, Storage & Home Charging
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigateWithLoader("/ecosystem", "ENERGY ECOSYSTEM")}
              className="self-start rounded-[4px] border border-border bg-card px-5 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Explore Full Ecosystem →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESLA_ENERGY_SYSTEMS.map((sys) => (
              <article
                key={sys.id}
                className="flex flex-col justify-between overflow-hidden rounded-[6px] border border-border bg-card transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    <img
                      src={sys.image}
                      alt={sys.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-3 left-3 rounded-[3px] bg-black/75 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                      {sys.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold">{sys.name}</h3>
                    <p className="mt-1 text-xs font-medium text-[#3e6ae1]">{sys.headlineMetric}</p>
                    <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                      {sys.summary}
                    </p>
                    <dl className="mt-4 space-y-1.5 border-t border-border/70 pt-3 text-xs">
                      {sys.specs.map((sp) => (
                        <div key={sp.label} className="flex justify-between">
                          <dt className="text-muted-foreground">{sp.label}</dt>
                          <dd className="font-medium tabular">{sp.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tabular">{sys.priceLabel}</span>
                  <button
                    type="button"
                    onClick={() => navigateWithLoader(sys.href, sys.name.toUpperCase())}
                    className="rounded-[4px] bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90 transition-opacity"
                  >
                    Order Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Interactive Home Solar + Powerwall 3 Sizing Calculator */}
        <div className="grid gap-10 rounded-[8px] border border-border bg-card p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0e9f6e]">
              Solar + Powerwall 3 Configurator
            </span>
            <h3 className="font-display mt-2 text-3xl font-semibold tracking-tight">
              Power Your Home from Sunlight
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Size your residential Solar Roof or panel array paired with Powerwall 3 LFP backup.
              Includes the 30% U.S. Federal Clean Energy Credit estimate.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <label htmlFor="solar-bill-slider" className="font-medium">
                    Average Monthly Electric Bill
                  </label>
                  <span className="font-display text-xl font-semibold tabular">
                    ${monthlyBill}/mo
                  </span>
                </div>
                <input
                  id="solar-bill-slider"
                  type="range"
                  min={80}
                  max={650}
                  step={10}
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(Number(e.target.value))}
                  className="teh-slider w-full"
                />
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular">
                  <span>$80/mo</span>
                  <span>$650/mo</span>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium mb-2.5">Powerwall 3 Storage</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 0 as const, label: "Solar Only", sub: "No battery" },
                    { count: 1 as const, label: "1 × Powerwall 3", sub: "13.5 kWh · 11.5 kW" },
                    { count: 2 as const, label: "2 × Powerwall 3", sub: "27.0 kWh Whole-Home" },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setPowerwalls(opt.count)}
                      className={`rounded-[4px] border p-3 text-left transition-all ${
                        powerwalls === opt.count
                          ? "border-foreground bg-muted/60"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[6px] border border-border bg-muted/35 p-6 sm:p-8 space-y-5">
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Recommended Array
                </div>
                <div className="font-display text-3xl font-semibold tabular mt-1">
                  {calc.recommendedKw} kW Solar
                </div>
              </div>
              <span className="rounded-[3px] bg-[#0e9f6e]/15 px-2.5 py-1 text-xs font-semibold text-[#0e9f6e]">
                {powerwalls > 0 ? "94% Grid Independence" : "78% Daytime Offset"}
              </span>
            </div>

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hardware & System Estimate</dt>
                <dd className="font-medium tabular">${calc.systemCost.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between text-[#0e9f6e]">
                <dt>30% Federal Clean Energy Credit</dt>
                <dd className="font-semibold tabular">-${calc.federalCredit.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2.5 font-semibold">
                <dt>Estimated Net Investment</dt>
                <dd className="tabular text-base">${calc.netCost.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>Estimated Annual Bill Offset</dt>
                <dd className="tabular font-medium text-foreground">
                  ~${calc.annualSavings.toLocaleString()}/yr ({calc.paybackYears}-yr payback)
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigateWithLoader("/inventory", "ORDER SOLAR & POWERWALL")}
                className="h-11 rounded-[4px] bg-[#3e6ae1] text-white text-xs font-medium hover:bg-[#345ac7] transition-colors"
              >
                Order Hardware Now
              </button>
              <button
                type="button"
                onClick={() => navigateWithLoader("/ecosystem", "ENERGY DETAILS")}
                className="h-11 rounded-[4px] border border-border bg-card text-xs font-medium hover:bg-muted transition-colors"
              >
                View Energy Specs
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SuperchargerAndRoboticsSection() {
  const { navigateWithLoader } = useTeslaLoader();

  return (
    <section className="bg-[#0a0b0d] text-white py-20 sm:py-24 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px] space-y-20">
        {/* Supercharger V3/V4 */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e82127]">
              Global NACS Charging Infrastructure
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              60,000+ Superchargers. Plug In, Charge, Go.
            </h2>
            <p className="text-sm leading-relaxed text-white/75 max-w-xl">
              Automatic route planning preconditions the battery before arrival. V3 & V4
              Supercharger cabinets deliver up to 250–350 kW peak charging—adding up to 200 miles in
              just 15 minutes with 99.9%+ network uptime.
            </p>
            <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              <div>
                <div className="font-display text-2xl font-semibold tabular">60,000+</div>
                <div className="text-[11px] uppercase tracking-wider text-white/60">Stalls Worldwide</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold tabular">15 min</div>
                <div className="text-[11px] uppercase tracking-wider text-white/60">Up to 200 mi</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold tabular">99.97%</div>
                <div className="text-[11px] uppercase tracking-wider text-white/60">Uptime SLA</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[6px] border border-white/10">
            <img
              src="/images/charger.jpg"
              alt="Tesla Supercharger V4 charging hardware"
              loading="lazy"
              className="h-[340px] sm:h-[400px] w-full object-cover"
            />
          </div>
        </div>

        {/* Optimus Gen 2 Robotics */}
        <div className="grid gap-10 border-t border-white/15 pt-16 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-[6px] border border-white/10 order-2 lg:order-1">
            <img
              src="/assets/images/tesla_optimus_robotics.webp"
              alt="Tesla Optimus Gen 2 Autonomous Humanoid Robot"
              loading="lazy"
              className="h-[340px] sm:h-[400px] w-full object-cover"
            />
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
              Autonomous Humanoid · Optimus Gen 2
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Real-World AI in Humanoid Form
            </h2>
            <p className="text-sm leading-relaxed text-white/75 max-w-xl">
              Standing 5&apos;8&quot; tall and weighing 125 lb, Optimus runs Tesla FSD neural networks
              trained on Dojo supercomputers. Engineered with 28 structural actuators and 11-DoF
              tactile sensing hands capable of delicate manufacturing and industrial logistics.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigateWithLoader("/ecosystem#robotics", "OPTIMUS GEN 2")}
                className="h-11 rounded-[4px] bg-white px-6 text-sm font-medium text-[#171a20] hover:bg-white/90 transition-colors"
              >
                Explore Optimus Hardware
              </button>
              <button
                type="button"
                onClick={() => navigateWithLoader("/inventory", "ROBOTICS INVENTORY")}
                className="h-11 rounded-[4px] border border-white/30 px-6 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                View Allocations
              </button>
            </div>
          </div>
        </div>

        {/* Final Clean CTA Strip — Account leads directly to Login */}
        <div className="rounded-[8px] border border-white/15 bg-white/[0.04] p-8 sm:p-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            Trade Tesla Marketplace
          </p>
          <h2 className="font-display mt-2 text-2xl sm:text-4xl font-semibold tracking-tight">
            Ready to Order Your Vehicle or Clean Energy System?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/75">
            Complete direct checkout online, enter 100% free vehicle giveaways with FedEx tracking, or
            access your Account portal.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigateWithLoader("/inventory", "LIVE INVENTORY")}
              className="h-11 min-w-[190px] rounded-[4px] bg-white px-6 text-sm font-medium text-[#171a20] hover:bg-white/90 transition-colors"
            >
              Browse Inventory
            </button>
            <button
              type="button"
              onClick={() => navigateWithLoader("/login", "ACCOUNT")}
              className="h-11 min-w-[190px] rounded-[4px] border border-white/35 px-6 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Account
            </button>
            <button
              type="button"
              onClick={() => navigateWithLoader("/careers", "CAREERS")}
              className="h-11 min-w-[160px] rounded-[4px] border border-white/20 px-6 text-sm font-medium text-white/85 hover:bg-white/10 transition-colors"
            >
              Careers
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
