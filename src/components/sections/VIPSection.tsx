import React from "react";
import AppImage from "@/components/ui/AppImage";
import { useTeslaLoader } from "@/components/TeslaLoader";

export default function VIPSection() {
  const { navigateWithLoader } = useTeslaLoader();

  return (
    <section id="vip" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-10 bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="grid lg:grid-cols-[360px_1fr]">
            {/* Portrait */}
            <div className="relative min-h-[340px] lg:min-h-full bg-[#0a0b0d]">
              <AppImage
                src="/assets/images/elon_musk_portrait.webp"
                alt="Elon Musk — CEO & Product Architect"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 360px"
                priority
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,11,13,0.1) 50%, rgba(10,11,13,0.85) 100%)",
                }}
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    Executive Concierge
                  </p>
                  <p className="font-display text-lg font-medium">Elon Musk</p>
                </div>
                <span className="rounded-[3px] bg-[#e82127] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                  Verified
                </span>
              </div>
            </div>

            {/* Briefing Details */}
            <div className="p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-[4px] border border-border bg-muted/50 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e82127] pulse-dot" />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Limited Executive Appointments
                  </span>
                </div>

                <h1 className="font-display mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                  Book a Private Briefing Session
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Discuss institutional fleet allocations, clean energy infrastructure, Optimus
                  robotics deployments, and long-term capital programs in a private 30-minute
                  executive briefing.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Appointment Fee", value: "$50,000" },
                    { label: "Session Duration", value: "30 Minutes" },
                    { label: "Format", value: "In-Person / Virtual" },
                  ].map((d) => (
                    <div key={d.label} className="rounded-[6px] border border-border bg-muted/35 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {d.label}
                      </div>
                      <div className="font-display mt-1 text-lg font-semibold text-foreground tabular">
                        {d.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigateWithLoader("/book-session", "VIP APPOINTMENT")}
                  className="h-11 rounded-[4px] bg-[#3e6ae1] px-7 text-sm font-medium text-white hover:bg-[#345ac7] transition-colors"
                >
                  Apply for an Appointment →
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithLoader("/support", "CONCIERGE SUPPORT")}
                  className="h-11 rounded-[4px] border border-border px-6 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Contact Concierge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
