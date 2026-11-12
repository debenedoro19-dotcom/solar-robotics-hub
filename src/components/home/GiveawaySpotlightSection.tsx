import React, { useEffect, useState } from "react";
import model3Img from "@/assets/giveaways/model_3.webp";
import cybertruckImg from "@/assets/giveaways/cybertruck.webp";
import { createClient } from "@/lib/supabase/client";
import { useTeslaLoader } from "@/components/TeslaLoader";

interface SpotlightCampaign {
  id: string;
  eyebrow: string;
  title: string;
  prize: string;
  summary: string;
  image: string;
  endsAt: string;
  entries: number;
  maxEntries: number;
  specs: Array<{ label: string; value: string }>;
}

const DEFAULT_SPOTLIGHTS: SpotlightCampaign[] = [
  {
    id: "spotlight-model-3",
    eyebrow: "Spotlight Drop 01 · Free Vehicle Allocation",
    title: "Win a 2025 Model 3 Long Range",
    prize: "2025 Tesla Model 3 Long Range AWD",
    summary:
      "Reserve your $0 verified pass for a refreshed Model 3 Long Range Dual Motor featuring acoustic 360-degree glass and 341 miles of EPA range.",
    image: model3Img,
    endsAt: "2026-12-31",
    entries: 1247,
    maxEntries: 5000,
    specs: [
      { label: "Entry Fee", value: "$0 Free" },
      { label: "EPA Range", value: "341 mi" },
      { label: "0–60 mph", value: "4.2 s" },
      { label: "MSRP Value", value: "$47,490" },
    ],
  },
  {
    id: "spotlight-cybertruck",
    eyebrow: "Spotlight Drop 02 · Foundation Series",
    title: "Cybertruck Experience Weekend",
    prize: "Cybertruck Foundation Series + $2,000 Credit",
    summary:
      "Claim a zero-cost entry for an all-stainless Cybertruck Foundation Series weekend experience plus a $2,000 Trade Tesla purchase credit.",
    image: cybertruckImg,
    endsAt: "2026-10-15",
    entries: 683,
    maxEntries: 2000,
    specs: [
      { label: "Entry Fee", value: "$0 Free" },
      { label: "0–60 mph", value: "2.6 s" },
      { label: "Peak Power", value: "845 hp" },
      { label: "Bonus Credit", value: "$2,000" },
    ],
  },
];

function computeCountdown(endsAt: string) {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function GiveawaySpotlightSection() {
  const [campaigns, setCampaigns] = useState<SpotlightCampaign[]>(DEFAULT_SPOTLIGHTS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [clock, setClock] = useState(() => computeCountdown(DEFAULT_SPOTLIGHTS[0].endsAt));
  const { navigateWithLoader } = useTeslaLoader();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("giveaways")
          .select("id,title,prize,ends_at,entries_count,max_entries")
          .eq("is_active", true)
          .not("title", "ilike", "%bitcoin%")
          .not("prize", "ilike", "%bitcoin%")
          .not("title", "ilike", "%btc%")
          .order("sort_order")
          .limit(3);

        if (!cancelled && data && data.length > 0) {
          setCampaigns(
            data.map((row, idx) => {
              const title = String(row.title ?? "");
              const isCyber =
                title.toLowerCase().includes("cyber") ||
                String(row.prize ?? "").toLowerCase().includes("cyber");
              const template = DEFAULT_SPOTLIGHTS[isCyber ? 1 : 0];
              return {
                id: String(row.id),
                eyebrow: `Spotlight Drop 0${idx + 1} · Verified Allocation`,
                title: title || template.title,
                prize: String(row.prize ?? template.prize),
                summary: template.summary,
                image: isCyber ? cybertruckImg : model3Img,
                endsAt: String(row.ends_at ?? template.endsAt),
                entries: Number(row.entries_count ?? template.entries),
                maxEntries: Number(row.max_entries ?? template.maxEntries),
                specs: template.specs,
              };
            }),
          );
        }
      } catch {
        /* keep canonical fallback spotlight */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = campaigns[activeIdx] ?? campaigns[0];

  useEffect(() => {
    setClock(computeCountdown(current.endsAt));
    const timer = window.setInterval(() => {
      setClock(computeCountdown(current.endsAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [current.endsAt]);

  const pct = Math.min(100, Math.max(8, Math.round((current.entries / Math.max(1, current.maxEntries)) * 100)));
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      id="giveaway-spotlight"
      className="relative overflow-hidden bg-[#0a0b0d] py-16 sm:py-22 px-4 sm:px-6 lg:px-10 text-white border-t border-white/10"
      aria-labelledby="home-giveaway-spotlight-heading"
    >
      <div className="mx-auto max-w-[1440px]">
        {/* Top Eyebrow + Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-3.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white">
              <span className="h-2 w-2 rounded-full bg-[#e82127] pulse-dot" />
              Signature Spotlight · Vehicle Giveaways
            </span>
            <span className="hidden md:inline text-xs text-white/55">
              Zero purchase required · Verified fair allocation
            </span>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Spotlight drop selector">
            {campaigns.map((camp, idx) => (
              <button
                key={camp.id}
                type="button"
                role="tab"
                aria-selected={activeIdx === idx}
                onClick={() => setActiveIdx(idx)}
                className={`h-9 rounded-[4px] px-4 text-xs font-medium transition-colors ${
                  activeIdx === idx
                    ? "bg-white text-[#171a20]"
                    : "border border-white/20 bg-white/[0.04] text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                0{idx + 1} · {camp.title.replace(/^Win a /i, "")}
              </button>
            ))}
          </div>
        </div>

        {/* Main Asymmetric Feature Stage */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          {/* Visual Pass Frame */}
          <div className="relative overflow-hidden rounded-[8px] border border-white/15 bg-[#121418] shadow-2xl">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
              <img
                src={current.image}
                alt={current.prize}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,11,13,0.18) 0%, rgba(18,20,24,0.88) 100%)",
                }}
              />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                <span className="rounded-[3px] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#171a20]">
                  $0 Free Entry
                </span>
                <span className="rounded-[3px] border border-white/25 bg-black/55 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                  Verified Allocation
                </span>
              </div>
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Active Prize Asset
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-semibold text-white">
                    {current.prize}
                  </p>
                </div>
                <span className="hidden sm:inline-block font-mono text-xs text-white/75 border border-white/20 rounded-[3px] px-2.5 py-1 bg-black/40">
                  {pct}% Allocated
                </span>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="p-5 border-t border-white/10 space-y-2.5">
              <div className="flex justify-between text-xs text-white/70 tabular">
                <span>{current.entries.toLocaleString()} claims registered</span>
                <span>{current.maxEntries.toLocaleString()} max pool</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Typography & Countdown Controls */}
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                {current.eyebrow}
              </p>
              <h2
                id="home-giveaway-spotlight-heading"
                className="font-display mt-2 text-3xl font-medium tracking-tight text-white sm:text-5xl leading-[1.05]"
              >
                {current.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
                {current.summary}
              </p>
            </div>

            {/* 4-Metric Spec Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {current.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-[6px] border border-white/12 bg-white/[0.04] px-3.5 py-3"
                >
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">
                    {spec.label}
                  </p>
                  <p className="font-display mt-1 text-base font-semibold text-white tabular">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Countdown Clock */}
            <div className="rounded-[6px] border border-white/15 bg-white/[0.04] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-2.5">
                Live Allocation Window Remaining
              </p>
              <div className="flex flex-wrap gap-6 sm:gap-8">
                {[
                  { label: "Days", val: clock.d },
                  { label: "Hrs", val: clock.h },
                  { label: "Min", val: clock.m },
                  { label: "Sec", val: clock.s },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="font-display text-2xl sm:text-3xl font-semibold text-white tabular block leading-none">
                      {pad(item.val)}
                    </span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-white/55">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual High-Contrast CTAs */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigateWithLoader("/giveaways", "GIVEAWAYS LOUNGE")}
                className="h-12 rounded-[4px] bg-white px-7 text-xs font-semibold uppercase tracking-[0.12em] text-[#171a20] hover:bg-white/90 transition-colors"
              >
                Enter Free Giveaway ($0) →
              </button>
              <button
                type="button"
                onClick={() => navigateWithLoader("/flying-car", "MODEL AERO PRE-BOOK")}
                className="h-12 rounded-[4px] border border-white/30 px-6 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                Pre-Book Flying Car &amp; Test Drive
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
