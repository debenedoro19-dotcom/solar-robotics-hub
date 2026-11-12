import React, { useEffect, useState } from "react";
import { TESLA_HERO_SLIDES } from "@/data/teslaCatalog";
import { useTeslaLoader } from "@/components/TeslaLoader";

export default function HeroModelSwitcher({
  onConfigureModel,
}: {
  onConfigureModel?: (modelId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { triggerLoader, navigateWithLoader } = useTeslaLoader();

  const slide = TESLA_HERO_SLIDES[index] ?? TESLA_HERO_SLIDES[0];

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % TESLA_HERO_SLIDES.length);
    }, 6800);
    return () => window.clearInterval(id);
  }, [paused]);

  const handlePrimaryCta = () => {
    const p = slide.primaryCta;
    if (p.actionType === "configure" && p.modelId && onConfigureModel) {
      triggerLoader({
        label: slide.title.toUpperCase(),
        durationMs: 420,
        onComplete: () => onConfigureModel(p.modelId!),
      });
      return;
    }
    navigateWithLoader(p.href, slide.badge.toUpperCase());
  };

  return (
    <section
      className="relative h-[100svh] min-h-[640px] max-h-[960px] w-full overflow-hidden bg-[#0a0b0d] text-white"
      aria-label="Featured Tesla lineup"
    >
      {/* Background slides with subtle Ken Burns scale */}
      {TESLA_HERO_SLIDES.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            fetchPriority={idx === 0 ? "high" : "auto"}
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-[7000ms] ease-out"
            style={{ transform: idx === index ? "scale(1.04)" : "scale(1)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,11,13,0.58) 0%, rgba(10,11,13,0.16) 42%, rgba(10,11,13,0.82) 100%)",
            }}
          />
        </div>
      ))}

      {/* Content overlay */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-between px-4 pt-24 pb-8 sm:px-8 lg:px-12 lg:pt-28 lg:pb-10">
        {/* Centered Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-[4px] border border-white/25 bg-black/35 px-3 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e82127] pulse-dot" />
            <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-white/90">
              {slide.eyebrow} · Trade Tesla
            </span>
          </div>

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-white text-shadow-hero sm:text-6xl lg:text-[64px] lg:leading-[1.05]">
            {slide.title}
          </h1>

          <p className="mx-auto mt-3.5 max-w-xl text-sm font-normal leading-relaxed text-white/88 sm:text-base">
            {slide.subtitle}
          </p>

          {/* Tesla.com dual action CTAs */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="h-11 min-w-[210px] rounded-[4px] bg-white px-7 text-sm font-medium text-[#171a20] transition-all hover:bg-white/90 active:scale-[0.99]"
            >
              {slide.primaryCta.label}
            </button>
            <button
              type="button"
              onClick={() =>
                navigateWithLoader(slide.secondaryCta.href, slide.secondaryCta.label.toUpperCase())
              }
              className="h-11 min-w-[210px] rounded-[4px] border border-white/55 bg-black/35 px-7 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.99]"
            >
              {slide.secondaryCta.label}
            </button>
          </div>
        </div>

        {/* Bottom Specs Bar & Slide Controls */}
        <div className="w-full">
          {/* Quick slide tabs on top */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
            {TESLA_HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(idx)}
                className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-all ${
                  idx === index
                    ? "bg-white text-[#171a20]"
                    : "bg-black/35 text-white/80 border border-white/20 hover:bg-white/15"
                }`}
              >
                {s.badge}
              </button>
            ))}
          </div>

          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 rounded-[6px] border border-white/15 bg-black/45 px-5 py-4 backdrop-blur-xl sm:flex-row">
            <div className="grid w-full grid-cols-2 gap-4 sm:flex sm:w-auto sm:flex-1 sm:justify-around">
              {slide.specs.map((spec) => (
                <div key={spec.label} className="text-center sm:text-left">
                  <div className="font-display text-lg font-semibold text-white tabular sm:text-xl">
                    {spec.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/65">
                    {spec.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-white/15 pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
              <span className="mr-1 font-mono text-xs text-white/70 tabular">
                0{index + 1} / 0{TESLA_HERO_SLIDES.length}
              </span>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() =>
                  setIndex((prev) => (prev - 1 + TESLA_HERO_SLIDES.length) % TESLA_HERO_SLIDES.length)
                }
                className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
                onClick={() => setPaused((p) => !p)}
                className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                {paused ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setIndex((prev) => (prev + 1) % TESLA_HERO_SLIDES.length)}
                className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
