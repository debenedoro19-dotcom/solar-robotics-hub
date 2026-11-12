import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";

interface TeslaLoaderContextValue {
  isLoading: boolean;
  label: string;
  triggerLoader: (opts?: { label?: string; durationMs?: number; onComplete?: () => void }) => void;
  navigateWithLoader: (href: string, label?: string) => void;
  dismissLoader: () => void;
}

const TeslaLoaderContext = createContext<TeslaLoaderContextValue>({
  isLoading: false,
  label: "TRADE TESLA",
  triggerLoader: () => {},
  navigateWithLoader: () => {},
  dismissLoader: () => {},
});

export function useTeslaLoader() {
  return useContext(TeslaLoaderContext);
}

/** Crisp precision geometric Tesla "T" shield SVG mark (pure vector, scales razor-sharp). */
export function TeslaShieldSvg({
  className = "w-7 h-7",
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top curved brow arch */}
      <path
        d="M14 27C35 17 85 17 106 27L102 33C82 24 38 24 18 33L14 27Z"
        className={animated ? "tesla-path-arch" : ""}
        fill="currentColor"
      />
      {/* Main stylized T crest + tapered blade */}
      <path
        d="M21 39C38 32 49 32 54.5 34.5L60 44L65.5 34.5C71 32 82 32 99 39L94 46C83 41.5 74 41 69 43L60 106L51 43C46 41 37 41.5 26 46L21 39Z"
        className={animated ? "tesla-path-blade" : ""}
        fill="currentColor"
      />
    </svg>
  );
}

export function TeslaLoaderProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState("TRADE TESLA");
  const actionTimerRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (actionTimerRef.current !== null) {
      window.clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
    if (cleanupTimerRef.current !== null) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  }, []);

  const dismissLoader = useCallback(() => {
    clearTimers();
    setIsLoading(false);
  }, [clearTimers]);

  const triggerLoader = useCallback(
    (opts?: { label?: string; durationMs?: number; onComplete?: () => void }) => {
      clearTimers();
      const duration = opts?.durationMs ?? 480;
      setLabel(opts?.label || "TRADE TESLA");
      setIsLoading(true);

      actionTimerRef.current = window.setTimeout(() => {
        try {
          opts?.onComplete?.();
        } finally {
          cleanupTimerRef.current = window.setTimeout(() => {
            setIsLoading(false);
          }, 160);
        }
      }, duration);
    },
    [clearTimers],
  );

  const navigateWithLoader = useCallback(
    (href: string, customLabel?: string) => {
      if (!href) return;
      if (href.startsWith("#")) {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      const isExternal = href.startsWith("http") || href.startsWith("//") || href.startsWith("/api/");
      triggerLoader({
        label: customLabel || "TRADE TESLA",
        durationMs: 420,
        onComplete: () => {
          if (isExternal) {
            window.location.href = href;
          } else {
            const [path, hash] = href.split("#");
            router.navigate({
              to: (path || "/") as never,
              ...(hash ? { hash } : {}),
            });
            window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
          }
        },
      });
    },
    [router, triggerLoader],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoading) dismissLoader();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading, dismissLoader]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <TeslaLoaderContext.Provider
      value={{ isLoading, label, triggerLoader, navigateWithLoader, dismissLoader }}
    >
      {children}
      {isLoading && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0b0e]/92 backdrop-blur-xl animate-[fadeSlideUp_0.18s_ease-out_both]"
          role="status"
          aria-live="assertive"
          aria-label="Loading"
        >
          {/* Ambient radial crimson aura */}
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#e82127]/20 blur-[90px]"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center">
            {/* Orbital radar rings */}
            <div className="relative flex h-28 w-28 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border border-white/10"
                aria-hidden="true"
              />
              <div
                className="tesla-loader-ring absolute inset-0 rounded-full border-2 border-transparent border-t-[#e82127] border-r-[#e82127]/40"
                aria-hidden="true"
              />
              <div
                className="tesla-loader-ring-reverse absolute inset-2.5 rounded-full border border-transparent border-b-white/40"
                aria-hidden="true"
              />

              {/* Animated Tesla emblem */}
              <div className="tesla-logo-pulse text-white drop-shadow-[0_0_24px_rgba(232,33,39,0.55)]">
                <TeslaShieldSvg className="h-14 w-14" animated />
              </div>
            </div>

            {/* Wordmark & precision progress sweep */}
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <span className="font-display text-xs font-semibold tracking-[0.42em] text-white uppercase">
                {label}
              </span>
              <div className="h-[2px] w-36 overflow-hidden rounded-full bg-white/15">
                <div className="tesla-loader-bar h-full w-1/2 rounded-full bg-gradient-to-r from-[#e82127] via-white to-[#e82127]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </TeslaLoaderContext.Provider>
  );
}
