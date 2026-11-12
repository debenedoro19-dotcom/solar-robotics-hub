import React from "react";
import { useTeslaLoader } from "@/components/TeslaLoader";
import { TESLA_ENERGY_SYSTEMS } from "@/data/teslaCatalog";

export default function EcosystemSection() {
  const { navigateWithLoader } = useTeslaLoader();

  return (
    <div className="bg-background text-foreground">
      {/* Ecosystem Hero */}
      <section className="relative overflow-hidden bg-[#0a0b0d] text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-10">
        <img
          src="/images/energy-home.jpg"
          alt="Tesla Solar Roof and Powerwall 3 modern installation"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,11,13,0.65) 0%, rgba(10,11,13,0.92) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[1440px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e82127]">
            Trade Tesla Ecosystem
          </span>
          <h1 className="font-display mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Clean Generation, Storage, Charging &amp; Robotics
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/78 sm:text-base">
            Built to integrate seamlessly from rooftop photon capture to whole-home LFP battery
            storage, Megapack utility dispatch, global NACS Supercharging, and Optimus humanoid
            automation.
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl border-t border-white/15 pt-6">
            <div>
              <div className="font-display text-2xl font-semibold tabular">13.5 kWh</div>
              <div className="text-[11px] uppercase tracking-wider text-white/60">Powerwall 3 Unit</div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold tabular">3.9 MWh</div>
              <div className="text-[11px] uppercase tracking-wider text-white/60">Megapack 2 XL</div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold tabular">60,000+</div>
              <div className="text-[11px] uppercase tracking-wider text-white/60">Superchargers</div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold tabular">28 DoF</div>
              <div className="text-[11px] uppercase tracking-wider text-white/60">Optimus Actuators</div>
            </div>
          </div>
        </div>
      </section>

      {/* Energy & Solar Systems Studio Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-6 mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tesla Energy Hardware
              </p>
              <h2 className="font-display mt-1.5 text-3xl font-semibold tracking-tight">
                Solar, Storage &amp; Home Charging
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigateWithLoader("/inventory", "HARDWARE INVENTORY")}
              className="self-start rounded-[4px] bg-foreground px-5 py-2.5 text-xs font-medium text-background hover:opacity-90 transition-opacity"
            >
              Order Hardware Directly →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESLA_ENERGY_SYSTEMS.map((sys) => (
              <article
                key={sys.id}
                className="flex flex-col justify-between overflow-hidden rounded-[6px] border border-border bg-card hover:border-foreground/35 transition-all"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    <img src={sys.image} alt={sys.name} className="h-full w-full object-cover" />
                    <span className="absolute top-3 left-3 rounded-[3px] bg-black/75 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      {sys.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold">{sys.name}</h3>
                    <p className="mt-1 text-xs font-medium text-[#3e6ae1]">{sys.headlineMetric}</p>
                    <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
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
                <div className="flex items-center justify-between border-t border-border px-5 py-4">
                  <span className="text-sm font-semibold tabular">{sys.priceLabel}</span>
                  <button
                    type="button"
                    onClick={() => navigateWithLoader("/inventory", sys.name.toUpperCase())}
                    className="h-9 rounded-[4px] bg-[#3e6ae1] px-4 text-xs font-medium text-white hover:bg-[#345ac7] transition-colors"
                  >
                    Order Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Optimus Gen 2 & SpaceX Robotics Synergy */}
      <section
        id="robotics"
        className="border-t border-border bg-[#0a0b0d] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-10"
      >
        <div className="mx-auto max-w-[1440px] space-y-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
                Autonomous Humanoid Robotics
              </span>
              <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                Optimus Gen 2 Specifications
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                General-purpose bi-pedal autonomous humanoid built for repetitive industrial
                logistics, factory tooling, and supervised utility tasks.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-white/15 pt-6 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Height &amp; Weight</dt>
                  <dd className="font-display mt-1 text-lg font-semibold">5&apos;8&quot; · 125 lb</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Tactile Hands</dt>
                  <dd className="font-display mt-1 text-lg font-semibold">11-DoF Force Sensing</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Actuation</dt>
                  <dd className="font-display mt-1 text-lg font-semibold">28 Structural Joints</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Compute</dt>
                  <dd className="font-display mt-1 text-lg font-semibold">FSD AI + Dojo Trained</dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigateWithLoader("/inventory", "OPTIMUS ALLOCATIONS")}
                  className="h-11 rounded-[4px] bg-white px-6 text-xs font-medium text-[#171a20] hover:bg-white/90 transition-colors"
                >
                  Reserve Optimus Allocation
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithLoader("/login", "ACCOUNT")}
                  className="h-11 rounded-[4px] border border-white/30 px-6 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Account
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[6px] border border-white/15">
              <img
                src="/assets/images/tesla_optimus_robotics.webp"
                alt="Optimus Gen 2"
                className="h-[360px] w-full object-cover"
              />
            </div>
          </div>

          <div className="grid gap-10 border-t border-white/15 pt-16 lg:grid-cols-2 lg:items-center">
            <div className="overflow-hidden rounded-[6px] border border-white/15 order-2 lg:order-1">
              <img
                src="/assets/images/spacex_starship_launch.webp"
                alt="SpaceX Starship launch integration"
                className="h-[320px] w-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e82127]">
                Aerospace &amp; AI Telemetry Synergy
              </span>
              <h3 className="font-display text-3xl font-semibold tracking-tight">
                Beyond Earth. Multiplanetary Scale.
              </h3>
              <p className="text-sm leading-relaxed text-white/75">
                Cross-pollinated metallurgy, battery chemistry, and autonomous flight guidance link
                Starship heavy-lift propulsion, Starlink mesh connectivity, and xAI compute clusters.
              </p>
              <button
                type="button"
                onClick={() => navigateWithLoader("/invest", "INFRASTRUCTURE PROGRAMS")}
                className="h-11 rounded-[4px] border border-white/30 px-6 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                Explore Infrastructure Programs →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
