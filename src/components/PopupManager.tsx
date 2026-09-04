import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase/client";
import { useSiteSetting, DEFAULT_WELCOME, DEFAULT_LEAD, DEFAULT_COOKIE, DEFAULT_TICKER } from "@/lib/siteSettings";

/**
 * Popup theming via CSS variables.
 * Add these to your global CSS:
 *
 * :root {
 *   --popup-overlay: rgba(0, 0, 0, 0.45);
 *   --popup-surface: #ffffff;
 *   --popup-border: #e5e7eb;
 *   --popup-text: #111827;
 *   --popup-text-muted: #6b7280;
 *   --popup-text-subtle: #9ca3af;
 *   --popup-input-bg: #f9fafb;
 *   --popup-input-border: #e5e7eb;
 *   --popup-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.18);
 *   --popup-glow: rgba(227, 25, 55, 0.08);
 *   --popup-success: #059669;
 *   --popup-ticker-bg: rgba(255, 255, 255, 0.92);
 *   --popup-ticker-border: rgba(16, 185, 129, 0.25);
 *   --popup-ticker-glow: rgba(16, 185, 129, 0.12);
 * }
 *
 * .dark, [data-theme="dark"] {
 *   --popup-overlay: rgba(0, 0, 0, 0.72);
 *   --popup-surface: #0D0E12;
 *   --popup-border: #1E2027;
 *   --popup-text: #ffffff;
 *   --popup-text-muted: #A1A1AA;
 *   --popup-text-subtle: #71717A;
 *   --popup-input-bg: #050507;
 *   --popup-input-border: #1E2027;
 *   --popup-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.55);
 *   --popup-glow: rgba(227, 25, 55, 0.15);
 *   --popup-success: #34d399;
 *   --popup-ticker-bg: rgba(13, 14, 18, 0.95);
 *   --popup-ticker-border: rgba(16, 185, 129, 0.25);
 *   --popup-ticker-glow: rgba(16, 185, 129, 0.12);
 * }
 */

const LS = {
  welcome: "tt_popup_welcome_at",
  lead: "tt_popup_lead_at",
  cookie: "tt_cookie_consent",
};

function cooledDown(lsKey: string, hours: number): boolean {
  try {
    const at = localStorage.getItem(lsKey);
    if (!at) return true;
    return Date.now() - Number(at) > hours * 3600_000;
  } catch {
    return true;
  }
}

function markShown(lsKey: string) {
  try {
    localStorage.setItem(lsKey, String(Date.now()));
  } catch {}
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--popup-input-bg)] border border-[var(--popup-input-border)] text-[var(--popup-text)] placeholder-[var(--popup-text-subtle)] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200";

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--popup-text-subtle)] hover:text-[var(--popup-text)] hover:bg-[var(--popup-border)]/60 transition-colors duration-150"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

/* ---------------- Welcome / offer modal ---------------- */
function WelcomePopup({ onClose }: { onClose: () => void }) {
  const cfg = useSiteSetting("popup_welcome", DEFAULT_WELCOME);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!cfg.enabled) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 animate-[popupFadeIn_0.25s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="absolute inset-0 bg-[var(--popup-overlay)] backdrop-blur-[6px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[400px] rounded-2xl border border-[var(--popup-border)] bg-[var(--popup-surface)] p-7 ring-1 ring-black/5 dark:ring-white/5"
        style={{
          boxShadow: `var(--popup-shadow), 0 0 0 1px var(--popup-border), 0 0 40px var(--popup-glow)`,
        }}
      >
        <CloseButton onClick={onClose} />
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-5 shadow-sm">
          <svg
            width="18"
            height="18"
            viewBox="0 0 342 512"
            fill="currentColor"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M0 57.3C0 57.3 57.3 0 171 0s171 57.3 171 57.3L285 85.5s-28.5-28.5-114-28.5S57 85.5 57 85.5L0 57.3zM171 512L57 85.5s28.5 28.5 114 28.5 114-28.5 114-28.5L171 512z" />
          </svg>
        </div>
        <h2
          id="welcome-title"
          className="text-[1.25rem] font-bold tracking-tight text-[var(--popup-text)] mb-1.5 leading-snug"
        >
          {cfg.title}
        </h2>
        <p className="text-[13.5px] text-[var(--popup-text-muted)] leading-relaxed mb-6">{cfg.body}</p>
        <button
          onClick={() => {
            onClose();
            const [path, hash] = cfg.ctaHref.split("#");
            if (hash) {
              navigate({ to: path || "/" });
              setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 400);
            } else {
              navigate({ to: cfg.ctaHref });
            }
          }}
          className="w-full py-2.5 rounded-xl tesla-btn-primary text-[13px] font-semibold tracking-wide shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          {cfg.ctaLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Lead capture modal ---------------- */
function LeadPopup({ onClose }: { onClose: () => void }) {
  const cfg = useSiteSetting("popup_lead", DEFAULT_LEAD);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 180);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [onClose]);

  if (!cfg.enabled) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("saving");
    try {
      const { error } = await supabase.from("newsletter_leads").insert({ email, source: "popup" });
      if (error) throw error;
      setStatus("done");
      markShown(LS.lead);
      setTimeout(onClose, 1600);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 animate-[popupFadeIn_0.25s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-title"
    >
      <div
        className="absolute inset-0 bg-[var(--popup-overlay)] backdrop-blur-[6px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[400px] rounded-2xl border border-[var(--popup-border)] bg-[var(--popup-surface)] p-7 ring-1 ring-black/5 dark:ring-white/5"
        style={{
          boxShadow: `var(--popup-shadow), 0 0 0 1px var(--popup-border), 0 0 40px var(--popup-glow)`,
        }}
      >
        <CloseButton onClick={onClose} />
        <h2
          id="lead-title"
          className="text-[1.25rem] font-bold tracking-tight text-[var(--popup-text)] mb-1.5 leading-snug pr-8"
        >
          {cfg.title}
        </h2>
        <p className="text-[13.5px] text-[var(--popup-text-muted)] leading-relaxed mb-5">{cfg.body}</p>
        {status === "done" ? (
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--popup-success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--popup-success)]">You&apos;re on the list. Welcome aboard.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
            {status === "error" && (
              <p className="text-xs text-primary font-medium">Could not save — please try again.</p>
            )}
            <button
              type="submit"
              disabled={status === "saving"}
              className="w-full py-2.5 rounded-xl tesla-btn-primary text-[13px] font-semibold tracking-wide disabled:opacity-55 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
            >
              {status === "saving" ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Subscribing…
                </span>
              ) : (
                cfg.ctaLabel
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Cookie bar ---------------- */
function CookieBar() {
  const cfg = useSiteSetting("popup_cookie", DEFAULT_COOKIE);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    try {
      if (cfg.enabled && !localStorage.getItem(LS.cookie)) {
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [cfg.enabled]);

  if (!visible) return null;

  function accept() {
    try {
      localStorage.setItem(LS.cookie, "accepted");
    } catch {}
    setExiting(true);
    setTimeout(() => setVisible(false), 220);
  }

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-[80] transition-transform duration-300 ease-out ${
        exiting ? "translate-y-full" : "translate-y-0 animate-[slideUpBar_0.35s_ease-out]"
      }`}
    >
      <div className="border-t border-[var(--popup-border)] bg-[var(--popup-surface)]/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 justify-between">
          <p className="text-[12.5px] text-[var(--popup-text-muted)] leading-relaxed max-w-2xl">
            {cfg.body}{" "}
            <a href="/privacy" className="text-primary hover:underline underline-offset-2 font-medium">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/terms" className="text-primary hover:underline underline-offset-2 font-medium">
              Terms
            </a>
            .
          </p>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={accept}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--popup-border)] text-[12px] font-medium text-[var(--popup-text-muted)] hover:text-[var(--popup-text)] hover:bg-[var(--popup-border)]/40 transition-colors duration-150"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="px-4 py-1.5 rounded-lg tesla-btn-primary text-[12px] font-semibold shadow-sm"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Live withdrawal ticker ---------------- */
const NAMES = [
  "James M.",
  "Sofia R.",
  "Daniel K.",
  "Aisha T.",
  "Michael B.",
  "Elena V.",
  "Chris P.",
  "Priya S.",
  "Marcus L.",
  "Hana Y.",
  "David O.",
  "Laura G.",
  "Tunde A.",
  "Ingrid H.",
  "Rafael C.",
  "Nina W.",
  "Omar F.",
  "Grace N.",
];
const CITIES = [
  "Austin",
  "Phoenix",
  "Miami",
  "Denver",
  "Seattle",
  "Toronto",
  "London",
  "Berlin",
  "Dubai",
  "Singapore",
  "Sydney",
  "Lagos",
  "São Paulo",
  "Tokyo",
  "Amsterdam",
  "Cape Town",
  "New York",
  "Los Angeles",
];
const TIMES = ["just now", "1 min ago", "2 min ago", "4 min ago", "6 min ago", "9 min ago"];

function WithdrawalTicker() {
  const cfg = useSiteSetting("withdrawal_ticker", DEFAULT_TICKER);
  const [toast, setToast] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!cfg.enabled) return;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const min = Math.max(100, cfg.minAmount);
      const max = Math.max(min, cfg.maxAmount);
      const amount = Math.round((min + Math.random() * (max - min)) / 10) * 10;
      const time = TIMES[Math.floor(Math.random() * TIMES.length)];

      setLeaving(false);
      setToast(`${name} from ${city} withdrew $${amount.toLocaleString()} · ${time}`);

      timer.current = setTimeout(() => {
        setLeaving(true);
        timer.current = setTimeout(() => {
          setToast(null);
          timer.current = setTimeout(tick, Math.max(8, cfg.intervalSeconds) * 1000);
        }, 320);
      }, 5500);
    };

    timer.current = setTimeout(tick, 4500);
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [cfg.enabled, cfg.intervalSeconds, cfg.minAmount, cfg.maxAmount]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-5 left-4 sm:left-5 z-[70] max-w-[280px] transition-all duration-300 ease-out ${
        leaving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 animate-[fadeSlideUp_0.4s_ease-out]"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-[var(--popup-ticker-border)] bg-[var(--popup-ticker-bg)] backdrop-blur-xl px-3.5 py-2.5 shadow-[0_8px_30px_var(--popup-ticker-glow)]">
        <div className="w-7 h-7 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-[var(--popup-text)] truncate leading-snug">{toast}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400/85 tracking-wide uppercase font-medium mt-0.5">
            Verified withdrawal
          </p>
        </div>
        <button
          onClick={() => {
            setLeaving(true);
            setTimeout(() => setToast(null), 280);
          }}
          aria-label="Dismiss"
          className="text-[var(--popup-text-subtle)] hover:text-[var(--popup-text)] shrink-0 p-0.5 rounded transition-colors"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Manager ---------------- */
export default function PopupManager() {
  const welcomeCfg = useSiteSetting("popup_welcome", DEFAULT_WELCOME);
  const leadCfg = useSiteSetting("popup_lead", DEFAULT_LEAD);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const location = useLocation();

  const isAdminPath =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/account");

  useEffect(() => {
    if (!welcomeCfg.enabled || isAdminPath) return;
    if (!cooledDown(LS.welcome, welcomeCfg.cooldownHours)) return;
    const t = setTimeout(
      () => {
        setShowWelcome(true);
        markShown(LS.welcome);
      },
      Math.max(2, welcomeCfg.delaySeconds) * 1000,
    );
    return () => clearTimeout(t);
  }, [welcomeCfg, isAdminPath]);

  useEffect(() => {
    if (!leadCfg.enabled || isAdminPath) return;
    if (!cooledDown(LS.lead, leadCfg.cooldownHours)) return;

    const maybeShow = () => {
      setShowLead((prev) => {
        if (prev || showWelcome) return prev;
        markShown(LS.lead);
        return true;
      });
    };

    const t = setTimeout(maybeShow, Math.max(10, leadCfg.delaySeconds) * 1000);
    const onExit = (e: MouseEvent) => {
      if (leadCfg.exitIntent && e.clientY <= 8) maybeShow();
    };
    document.addEventListener("mouseout", onExit);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mouseout", onExit);
    };
  }, [leadCfg, isAdminPath, showWelcome]);

  useEffect(() => {
    if (showWelcome || showLead) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showWelcome, showLead]);

  return (
    <>
      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpBar {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
      {showLead && !showWelcome && <LeadPopup onClose={() => setShowLead(false)} />}
      {!isAdminPath && <CookieBar />}
      {!isAdminPath && <WithdrawalTicker />}
    </>
  );
}
