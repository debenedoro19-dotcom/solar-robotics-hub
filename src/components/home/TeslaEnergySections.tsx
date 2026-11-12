import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TESLA_ENERGY_SYSTEMS,
  TESLA_SUPERCHARGERS,
  US_SOLAR_STATES,
} from "@/data/teslaCatalog";
import { useTeslaLoader } from "@/components/TeslaLoader";

const formatUsd = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

export function QuickLinksSection() {
  const { navigateWithLoader } = useTeslaLoader();

  const cards = [
    {
      label: "Vehicles",
      title: "Direct Delivery Lineup",
      summary: "Model S Plaid, Model 3 Highland, Model Y, Model X, Cybertruck, Semi & Cybercab.",
      image: "/images/car-red.jpg",
      href: "/inventory",
    },
    {
      label: "Energy & Solar",
      title: "Powerwall 3 & Solar Roof",
      summary: "13.5 kWh whole-home backup, tempered solar glass tiles, and utility-scale Megapack.",
      image: "/images/energy-home.jpg",
      href: "/ecosystem",
    },
    {
      label: "Giveaways",
      title: "Free Vehicle Claims",
      summary: "100% free promotional campaigns with verified FedEx freight courier dispatch.",
      image: "/images/car-truck.jpg",
      href: "/giveaways",
    },
  ];

  const stats = [
    { metric: "5-Star Safety", caption: "NHTSA rating across the Model S / 3 / X / Y fleet" },
    { metric: "60,000+ Superchargers", caption: "Up to 350 kW NACS fast charging worldwide" },
    { metric: "30% Clean Credit", caption: "Federal residential credit on Solar Roof & Powerwall 3" },
    { metric: "Over-the-Air", caption: "Continuous neural, range, and feature software updates" },
  ];

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-10 bg-background border-b border-border">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Start Here
          </p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Vehicles · Energy · Giveaways
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => navigateWithLoader(card.href, card.label.toUpperCase())}
              className="group relative h-[280px] sm:h-[330px] overflow-hidden rounded-xl bg-[#0a0b0d] text-left text-white"
            >
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                className="h-full w-full object-cover opacity-85 transition-transform duration-[1100ms] ease-out group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,11,13,0.08) 0%, rgba(10,11,13,0.82) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    {card.label}
                  </p>
                  <h3 className="font-display mt-1.5 text-2xl font-medium leading-none tracking-tight">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-white/75 leading-relaxed max-w-xs">{card.summary}</p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/30 backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-[#171a20]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Verified Tesla Trust Strip */}
        <div className="mt-6 grid grid-cols-1 gap-5 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.metric} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e82127]" />
              <div>
                <div className="text-xs font-semibold text-foreground">{s.metric}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{s.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EnergyAndSolarSection() {
  const [bill, setBill] = useState(220);
  const [stateCode, setStateCode] = useState("CA");
  const [roofType, setRoofType] = useState<"panels" | "roof">("panels");
  const [battery, setBattery] = useState(true);
  const [lifetimeView, setLifetimeView] = useState<"monthly" | "annual">("monthly");
  const { navigateWithLoader } = useTeslaLoader();

  const estimate = useMemo(() => {
    const state = US_SOLAR_STATES.find((s) => s.code === stateCode) ?? US_SOLAR_STATES[0];
    const annualUsage = (bill * 12) / state.rate;
    const systemKw = Math.max(3.6, Math.min(18, annualUsage / (1450 * state.sun)));
    const production = Math.round(systemKw * 1450 * state.sun);
    const coverage = Math.min(100, Math.round((production / annualUsage) * 100));
    const costPerWatt = roofType === "roof" ? 4.15 : 2.8;
    const gross = Math.round(systemKw * 1000 * costPerWatt + (battery ? 11500 : 0));
    const credit = Math.round(gross * 0.3);
    const net = gross - credit;
    const remainingRate = Math.max(0.06, 1 - coverage / 100);
    const newMonthly = bill * remainingRate;
    const monthlySavings = Math.max(0, Math.round(bill - newMonthly));
    const payback = monthlySavings > 0 ? net / (monthlySavings * 12) : 0;
    const lifetime = Math.round(monthlySavings * 12 * 25 - net);
    const co2 = Math.round((production * 25 * 0.855) / 1000);
    return {
      state,
      systemKw: Math.round(systemKw * 10) / 10,
      production,
      coverage,
      gross,
      credit,
      net,
      monthlySavings,
      newMonthly: Math.round(newMonthly),
      payback: payback.toFixed(1),
      lifetime,
      co2,
      trees: Math.round(co2 * 16.5),
    };
  }, [bill, stateCode, roofType, battery]);

  const fillPercent = ((bill - 50) / 550) * 100;

  return (
    <section id="solar-calculator" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10 bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-[1440px] space-y-20">
        {/* Energy Hardware Row */}
        <div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tesla Energy Ecosystem
              </p>
              <h2 className="font-display mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {TESLA_ENERGY_SYSTEMS.map((sys) => (
              <article
                key={sys.id}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    <img
                      src={sys.image}
                      alt={sys.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur">
                      {sys.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg font-medium">{sys.name}</h3>
                      <span className="text-xs font-semibold tabular">{sys.priceLabel}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-foreground/80">{sys.headlineMetric}</p>
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

                <div className="px-5 pb-5 pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigateWithLoader(sys.href, sys.name.toUpperCase())}
                    className="flex-1 h-9 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Order Now
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateWithLoader("/ecosystem", sys.name.toUpperCase())}
                    className="h-9 rounded-[4px] border border-border px-3 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Specs
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* High-Craft Interactive Solar + Powerwall 3 Configurator */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            {/* Left: Home Energy Controls */}
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Solar + Powerwall 3 Configurator
                  </p>
                  <h3 className="font-display mt-1 text-2xl sm:text-3xl font-medium tracking-tight">
                    See What Your Roof Is Worth
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-foreground">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-foreground" /> Live Estimate
                </span>
              </div>

              {/* Electric Bill Slider */}
              <div className="mt-7">
                <div className="flex items-end justify-between">
                  <label
                    htmlFor="solar-bill-slider"
                    className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    Average Monthly Electric Bill
                  </label>
                  <span className="font-display text-3xl font-medium leading-none tabular">
                    ${bill}
                  </span>
                </div>
                <input
                  id="solar-bill-slider"
                  type="range"
                  min={50}
                  max={600}
                  step={10}
                  value={bill}
                  onChange={(e) => setBill(Number(e.target.value))}
                  className="teh-slider mt-4 w-full"
                  style={{
                    background: `linear-gradient(to right, var(--foreground) ${fillPercent}%, var(--border) ${fillPercent}%)`,
                  }}
                  aria-valuetext={`$${bill} per month`}
                />
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground tabular">
                  <span>$50</span>
                  <span>$600+</span>
                </div>
              </div>

              {/* State + Roof Style */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="solar-state-select"
                    className="block mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    State
                  </label>
                  <select
                    id="solar-state-select"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="h-11 w-full rounded-[4px] border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground"
                  >
                    {US_SOLAR_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    System Type
                  </span>
                  <div className="grid h-11 grid-cols-2 gap-1 rounded-[4px] bg-muted/60 p-1">
                    {(["panels", "roof"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRoofType(opt)}
                        className={`rounded-[3px] text-xs transition-all ${
                          roofType === opt
                            ? "bg-card font-medium text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt === "panels" ? "Solar Panels" : "Solar Roof V3"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Powerwall 3 Toggle */}
              <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Pair with Powerwall 3 (13.5 kWh)</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Whole-home backup protection + 11.5 kW continuous output before 30% tax credit.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={battery}
                  aria-label="Include Powerwall 3"
                  onClick={() => setBattery((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    battery ? "bg-foreground" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow transition-transform ${
                      battery ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
                Estimates model {estimate.state.name}&apos;s average residential utility rate (${estimate.state.rate.toFixed(2)}/kWh) and peak sun factor.
              </p>
            </div>

            {/* Right: Dark Bento Savings Output */}
            <div className="border-t border-border bg-muted/20 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="rounded-xl bg-[#0a0b0d] p-6 text-white">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/55">
                    Estimated Utility Savings
                  </p>
                  <div className="flex rounded-full bg-white/10 p-0.5">
                    {(["monthly", "annual"] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setLifetimeView(view)}
                        className={`rounded-full px-2.5 py-1 text-[10px] capitalize transition-colors ${
                          lifetimeView === view
                            ? "bg-white text-[#171a20] font-medium"
                            : "text-white/65 hover:text-white"
                        }`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-end gap-2">
                  <p className="font-display text-4xl sm:text-5xl font-medium leading-none tracking-tight tabular">
                    {formatUsd(
                      lifetimeView === "monthly"
                        ? estimate.monthlySavings
                        : estimate.monthlySavings * 12,
                    )}
                  </p>
                  <span className="pb-1 text-sm text-white/55">
                    /{lifetimeView === "monthly" ? "mo" : "yr"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-white/65">
                  {estimate.coverage}% bill offset · {battery ? "With Powerwall 3 backup" : "Solar generation only"}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg bg-white/[0.07] p-3">
                    <p className="text-[9.5px] uppercase tracking-[0.12em] text-white/50">
                      25-Year Net Savings
                    </p>
                    <p className="mt-1 font-display text-lg font-medium tabular">
                      {formatUsd(estimate.lifetime)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.07] p-3">
                    <p className="text-[9.5px] uppercase tracking-[0.12em] text-white/50">
                      Estimated Payback
                    </p>
                    <p className="mt-1 font-display text-lg font-medium tabular">
                      {estimate.payback} yrs
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Recommended Size", value: `${estimate.systemKw} kW` },
                  { label: "Annual Production", value: `${estimate.production.toLocaleString()} kWh` },
                  { label: "30% Federal Credit", value: `-${formatUsd(estimate.credit)}` },
                  { label: "Est. Net Cost", value: formatUsd(estimate.net) },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-card p-3.5">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 font-display text-base font-medium tabular">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Today vs After Solar progress comparison */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Current electric bill</span>
                  <span className="tabular font-medium">{formatUsd(bill)}/mo</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full rounded-full bg-foreground/25" />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Estimated bill after Tesla Solar</span>
                  <span className="tabular font-semibold text-foreground">
                    {formatUsd(estimate.newMonthly)}/mo
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500"
                    style={{ width: `${Math.max(4, (estimate.newMonthly / bill) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => navigateWithLoader("/inventory", "ORDER SOLAR & POWERWALL")}
                  className="h-11 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Order Hardware Now
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithLoader("/ecosystem", "ENERGY ARCHITECTURE")}
                  className="h-11 rounded-[4px] border border-border bg-card text-xs font-medium hover:bg-muted transition-colors"
                >
                  View Energy Specs
                </button>
              </div>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                Equivalent to ~{estimate.trees.toLocaleString()} trees planted or {estimate.co2} tonnes CO₂ offset over 25 years.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountStat({
  value,
  decimals = 0,
  suffix = "",
  label,
  detail,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
  detail: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, value]);

  return (
    <div ref={ref} className="border-t border-white/15 pt-4">
      <p className="font-display text-3xl sm:text-4xl font-medium leading-none tracking-tight tabular">
        {display.toFixed(decimals)}
        <span className="text-xl text-white/55">{suffix}</span>
      </p>
      <p className="mt-2 text-xs font-medium text-white">{label}</p>
      <p className="mt-0.5 text-[11px] text-white/45">{detail}</p>
    </div>
  );
}

export function SuperchargerAndRoboticsSection() {
  const [query, setQuery] = useState("");
  const { navigateWithLoader } = useTeslaLoader();

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return TESLA_SUPERCHARGERS.slice(0, 3);
    const list = TESLA_SUPERCHARGERS.filter((s) =>
      `${s.name} ${s.area}`.toLowerCase().includes(term),
    );
    return list.slice(0, 3);
  }, [query]);

  return (
    <section className="bg-[#0a0b0d] text-white py-20 sm:py-24 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px] space-y-24">
        {/* Supercharger V3/V4 + Interactive Station Finder */}
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
          <div className="space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e82127]">
              Global NACS Charging Network
            </span>
            <h2 className="font-display text-3xl font-medium tracking-tight sm:text-5xl">
              Stop Less. Go Further.
            </h2>
            <p className="text-sm leading-relaxed text-white/75 max-w-xl">
              Plug in anywhere across 60,000+ Supercharger stalls. Route Planner automatically
              preconditions the pack ahead of arrival for up to 350 kW V4 charging—adding up to
              200 miles in 15 minutes.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/15 pt-6">
              {[
                { v: "60,000+", l: "Global Stalls" },
                { v: "350 kW", l: "V4 Peak Rate" },
                { v: "15 min", l: "Up to 200 mi" },
                { v: "99.97%", l: "Uptime SLA" },
              ].map((stat) => (
                <div key={stat.l}>
                  <div className="font-display text-xl sm:text-2xl font-medium tabular">{stat.v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/55 mt-1">{stat.l}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigateWithLoader("/inventory", "CHARGING HARDWARE")}
                className="h-10 rounded-[4px] bg-white px-5 text-xs font-medium text-[#171a20] hover:bg-white/90 transition-colors"
              >
                Shop Home Wall Connector
              </button>
              <button
                type="button"
                onClick={() => navigateWithLoader("/ecosystem", "SUPERCHARGER NETWORK")}
                className="h-10 rounded-[4px] border border-white/30 px-5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                Charging Architecture
              </button>
            </div>
          </div>

          {/* Interactive Supercharger Station Card (white floating finder matching tesla_ref) */}
          <div className="rounded-xl border border-white/15 bg-white p-5 text-[#171a20] shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#5c5e62]">
                  Live Network Telemetry
                </p>
                <h3 className="font-display mt-0.5 text-lg font-medium">Find a Supercharger</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#171a20]/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#171a20]">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#171a20]" /> Live
              </span>
            </div>

            <div className="mt-3.5 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city (San Francisco, Austin, Miami...)"
                aria-label="Search Supercharger hubs"
                className="h-10 flex-1 rounded-[4px] border border-black/15 bg-white px-3 text-xs outline-none placeholder:text-[#76797d] focus:border-[#171a20]"
              />
              <button
                type="button"
                onClick={() => setQuery("Austin")}
                className="h-10 rounded-[4px] border border-black/15 px-3 text-xs font-medium hover:bg-[#f4f4f4] transition-colors"
              >
                Near Me
              </button>
            </div>

            {/* Stylized highway vector map */}
            <div className="relative mt-3.5 h-[108px] overflow-hidden rounded-lg bg-[#e9efea]">
              <svg viewBox="0 0 400 108" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                <path d="M-20 75C60 63 88 26 164 34s108 50 268 20" stroke="#fff" strokeWidth="9" />
                <path d="M-10 26c86 12 124 44 208 38s128-28 214-12" stroke="#fff" strokeWidth="5" />
                <path d="M152 -10c8 44 6 74 20 128" stroke="#fff" strokeWidth="5" />
              </svg>
              {[
                { left: "24%", top: "52%" },
                { left: "58%", top: "34%" },
                { left: "78%", top: "62%" },
              ].map((pos, i) => (
                <span
                  key={i}
                  className="absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#171a20] text-white shadow-md ring-4 ring-white/60"
                  style={pos}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </span>
              ))}
              <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em]">
                V3 / V4 Grid · {matches.length} stations shown
              </span>
            </div>

            <ul className="mt-3 divide-y divide-black/[0.06]">
              {matches.length > 0 ? (
                matches.map((ch) => (
                  <li key={ch.name} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#171a20]">{ch.name}</p>
                      <p className="text-[10px] text-[#5c5e62]">
                        {ch.area} · {ch.kw} kW · {ch.amenities.join(" · ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-[11px] font-semibold text-[#171a20] tabular">
                        {ch.available} open
                      </span>
                      <span className="block text-[9px] text-[#76797d] tabular">of {ch.stalls} stalls</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4 text-center text-xs text-[#5c5e62]">
                  No hubs match &ldquo;{query}&rdquo;. Clear search to view national V4 sites.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Optimus Gen 2 Robotics */}
        <div className="grid gap-10 border-t border-white/15 pt-16 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-xl border border-white/10 order-2 lg:order-1">
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
            <h2 className="font-display text-3xl font-medium tracking-tight sm:text-5xl">
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

        {/* Impact Telemetry Row */}
        <div className="grid gap-10 border-t border-white/15 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
              Platform Telemetry · 2026
            </span>
            <h2 className="font-display mt-4 text-3xl sm:text-5xl font-medium leading-[1.06] tracking-tight">
              Progress you can measure.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Every Tesla vehicle, Solar Roof, Powerwall, and Optimus allocation delivered through
              Trade Tesla expands zero-emission autonomy worldwide.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            <CountStat value={8.4} decimals={1} suffix=" TWh" label="Clean energy dispatched" detail="Across global regional hubs" />
            <CountStat value={62} decimals={0} suffix="K" label="Homes powered" detail="With Solar Roof & Powerwall 3" />
            <CountStat value={214} decimals={0} suffix="K" label="Fleet units connected" detail="FSD-enabled & OTA updated" />
            <CountStat value={5.9} decimals={1} suffix="M t" label="CO₂ avoided" detail="Cumulative verified offset" />
          </div>
        </div>

        {/* Final Clean CTA Strip — Account leads directly to Login */}
        <div className="rounded-xl border border-white/15 bg-white/[0.04] p-8 sm:p-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            Trade Tesla Marketplace
          </p>
          <h2 className="font-display mt-2 text-2xl sm:text-4xl font-medium tracking-tight">
            Ready to Order Your Vehicle or Clean Energy System?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/75">
            Complete direct checkout online, enter 100% free vehicle giveaways with FedEx tracking,
            or access your Account portal.
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
