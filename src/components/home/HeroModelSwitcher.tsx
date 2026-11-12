import React, { useCallback, useEffect, useState } from "react";
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

  const go = useCallback((dir: number) => {
    setIndex((prev) => (prev + dir + TESLA_HERO_SLIDES.length) % TESLA_HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      go(1);
    }, 6800);
    return () => window.clearInterval(id);
  }, [paused, go]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go]);

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
      className="relative h-[100svh] min-h-[640px] max-h-[1040px] w-full overflow-hidden bg-[#0a0b0d] text-white"
      aria-label="Featured Tesla lineup at Trade Tesla"
    >
      {/* Background slides with subtle Ken Burns scale */}
      {TESLA_HERO_SLIDES.map((s, idx) => (
        <div
          key={s.id}
          aria-hidden={idx !== index}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
            idx === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            fetchPriority={idx === 0 ? "high" : "auto"}
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-[16000ms] ease-out"
            style={{ transform: idx === index ? "scale(1.06)" : "scale(1.0)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,11,13,0.52) 0%, rgba(10,11,13,0.14) 45%, rgba(10,11,13,0.72) 100%)",
            }}
          />
        </div>
      ))}

      {/* Content overlay */}
      <div className="relative z-20 mx-auto flex h-full max-w-[1440px] flex-col justify-between px-5 pt-24 pb-16 sm:px-8 lg:px-12 lg:pt-28 lg:pb-16">
        {/* Centered Header */}
        <div key={slide.id} className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e82127] pulse-dot" />
            {slide.eyebrow} · Trade Tesla
          </p>

          <h1 className="font-display mt-4 text-[42px] font-medium leading-[1.02] tracking-[-0.04em] text-white text-shadow-hero sm:text-[64px] lg:text-[76px]">
            {slide.title}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm font-normal leading-relaxed text-white/85 sm:text-[15.5px]">
            {slide.subtitle}
          </p>

          {/* Tesla.com dual action CTAs */}
          <div className="mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="h-11 w-full sm:w-[205px] rounded-[4px] bg-white px-6 text-sm font-medium text-[#171a20] transition-all hover:bg-white/90 active:scale-[0.99]"
            >
              {slide.primaryCta.label}
            </button>
            <button
              type="button"
              onClick={() =>
                navigateWithLoader(slide.secondaryCta.href, slide.secondaryCta.label.toUpperCase())
              }
              className="h-11 w-full sm:w-[205px] rounded-[4px] border border-white/50 bg-black/25 px-6 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.99]"
            >
              {slide.secondaryCta.label}
            </button>
          </div>
        </div>

        {/* Bottom Glass Spec Pill */}
        <div className="mx-auto w-fit rounded-lg border border-white/15 bg-black/30 px-5 py-3 backdrop-blur-md sm:px-8 sm:py-3.5">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {slide.specs.map((spec) => (
              <div key={spec.label} className="text-center">
                <p className="font-display text-sm font-medium leading-none text-white tabular sm:text-base">
                  {spec.value}
                </p>
                <p className="mt-1.5 text-[8.5px] uppercase tracking-[0.16em] text-white/65 sm:text-[9.5px]">
                  {spec.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Left/Right Side Arrows (desktop) */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-3.5 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 md:grid"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-3.5 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 md:grid"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Bottom Controls: Index counter + Dot Indicators + Explore Link / Pause */}
      <div className="absolute inset-x-0 bottom-5 z-30 mx-auto flex max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <div className="hidden items-center gap-3 sm:flex">
          <span className="font-display text-[11px] tabular tracking-[0.18em] text-white/70">
            {String(index + 1).padStart(2, "0")} / {String(TESLA_HERO_SLIDES.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
            onClick={() => setPaused((p) => !p)}
            className="grid h-6 w-6 place-items-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {paused ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
        </div>

        <div className="mx-auto flex items-center gap-1.5 sm:mx-0">
          {TESLA_HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${idx + 1}: ${s.title}`}
              aria-current={idx === index}
              onClick={() => setIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === index ? "w-6 bg-white" : "w-1.5 bg-white/45 hover:bg-white/75"
              }`}
            />
          ))}
        </div>

        <a
          href="#lineup"
          className="hidden items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/75 hover:text-white transition-colors sm:flex"
        >
          Explore lineup
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
