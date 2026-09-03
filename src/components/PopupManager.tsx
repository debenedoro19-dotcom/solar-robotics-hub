import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase/client';
import {
  useSiteSetting,
  DEFAULT_WELCOME,
  DEFAULT_LEAD,
  DEFAULT_COOKIE,
  DEFAULT_TICKER,
} from '@/lib/siteSettings';

const LS = {
  welcome: 'tt_popup_welcome_at',
  lead: 'tt_popup_lead_at',
  cookie: 'tt_cookie_consent',
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
  'w-full px-3 py-2.5 rounded-xl text-sm bg-[#050507] border border-[#1E2027] text-white placeholder-[#6B7280] focus:border-primary/50 focus:outline-none transition-colors';

/* ---------------- Welcome / offer modal ---------------- */
function WelcomePopup({ onClose }: { onClose: () => void }) {
  const cfg = useSiteSetting('popup_welcome', DEFAULT_WELCOME);
  const navigate = useNavigate();
  if (!cfg.enabled) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center fin-overlay px-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md rounded-3xl border border-[#1E2027] bg-[#0D0E12] p-8 shadow-[0_0_60px_rgba(227,25,55,0.15)]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[#71717A] hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-5">
          <svg width="20" height="20" viewBox="0 0 342 512" fill="currentColor" className="text-primary" aria-hidden="true">
            <path d="M0 57.3C0 57.3 57.3 0 171 0s171 57.3 171 57.3L285 85.5s-28.5-28.5-114-28.5S57 85.5 57 85.5L0 57.3zM171 512L57 85.5s28.5 28.5 114 28.5 114-28.5 114-28.5L171 512z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">{cfg.title}</h2>
        <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">{cfg.body}</p>
        <button
          onClick={() => {
            onClose();
            const [path, hash] = cfg.ctaHref.split('#');
            if (hash) {
              navigate({ to: path || '/' });
              setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 400);
            } else {
              navigate({ to: cfg.ctaHref });
            }
          }}
          className="w-full py-3 rounded-xl tesla-btn-primary text-sm font-bold tracking-wide"
        >
          {cfg.ctaLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Lead capture modal ---------------- */
function LeadPopup({ onClose }: { onClose: () => void }) {
  const cfg = useSiteSetting('popup_lead', DEFAULT_LEAD);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  if (!cfg.enabled) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('saving');
    try {
      const { error } = await supabase.from('newsletter_leads').insert({ email, source: 'popup' });
      if (error) throw error;
      setStatus('done');
      markShown(LS.lead);
      setTimeout(onClose, 1600);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center fin-overlay px-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md rounded-3xl border border-[#1E2027] bg-[#0D0E12] p-8 shadow-[0_0_60px_rgba(227,25,55,0.15)]">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-[#71717A] hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">{cfg.title}</h2>
        <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">{cfg.body}</p>
        {status === 'done' ? (
          <p className="text-sm font-semibold text-emerald-400">You're on the list. Welcome aboard.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
            {status === 'error' && <p className="text-xs text-primary">Could not save — please try again.</p>}
            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full py-3 rounded-xl tesla-btn-primary text-sm font-bold tracking-wide disabled:opacity-60"
            >
              {status === 'saving' ? 'Subscribing…' : cfg.ctaLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Cookie bar ---------------- */
function CookieBar() {
  const cfg = useSiteSetting('popup_cookie', DEFAULT_COOKIE);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (cfg.enabled && !localStorage.getItem(LS.cookie)) setVisible(true);
    } catch {}
  }, [cfg.enabled]);

  if (!visible) return null;

  function accept() {
    try {
      localStorage.setItem(LS.cookie, 'accepted');
    } catch {}
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-[80] border-t border-[#1E2027] bg-[#050507]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          {cfg.body} See our{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and{' '}
          <a href="/terms" className="text-primary hover:underline">Terms</a>.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={accept} className="px-4 py-2 rounded-xl border border-[#1E2027] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors">
            Decline
          </button>
          <button onClick={accept} className="px-5 py-2 rounded-xl tesla-btn-primary text-xs font-bold">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Live withdrawal ticker ---------------- */
const NAMES = [
  'James M.', 'Sofia R.', 'Daniel K.', 'Aisha T.', 'Michael B.', 'Elena V.',
  'Chris P.', 'Priya S.', 'Marcus L.', 'Hana Y.', 'David O.', 'Laura G.',
  'Tunde A.', 'Ingrid H.', 'Rafael C.', 'Nina W.', 'Omar F.', 'Grace N.',
];
const CITIES = [
  'Austin', 'Phoenix', 'Miami', 'Denver', 'Seattle', 'Toronto', 'London',
  'Berlin', 'Dubai', 'Singapore', 'Sydney', 'Lagos', 'São Paulo', 'Tokyo',
  'Amsterdam', 'Cape Town', 'New York', 'Los Angeles',
];
const TIMES = ['just now', '1 min ago', '2 min ago', '4 min ago', '6 min ago', '9 min ago'];

function WithdrawalTicker() {
  const cfg = useSiteSetting('withdrawal_ticker', DEFAULT_TICKER);
  const [toast, setToast] = useState<string | null>(null);
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
      setToast(`${name} from ${city} withdrew $${amount.toLocaleString()} · ${time}`);
      timer.current = setTimeout(() => {
        setToast(null);
        timer.current = setTimeout(tick, Math.max(8, cfg.intervalSeconds) * 1000);
      }, 6000);
    };

    timer.current = setTimeout(tick, 5000);
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [cfg.enabled, cfg.intervalSeconds, cfg.minAmount, cfg.maxAmount]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[70] max-w-xs animate-[fadeSlideUp_0.4s_ease-out]">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-[#0D0E12]/95 backdrop-blur-xl px-4 py-3 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00F59B" strokeWidth="2" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white truncate">{toast}</p>
          <p className="text-[10px] text-emerald-400/80 tracking-wide uppercase">Verified withdrawal</p>
        </div>
        <button onClick={() => setToast(null)} aria-label="Dismiss" className="text-[#6B7280] hover:text-white shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Manager ---------------- */
export default function PopupManager() {
  const welcomeCfg = useSiteSetting('popup_welcome', DEFAULT_WELCOME);
  const leadCfg = useSiteSetting('popup_lead', DEFAULT_LEAD);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/account');

  // Welcome modal: timed, frequency-capped
  useEffect(() => {
    if (!welcomeCfg.enabled || isAdminPath) return;
    if (!cooledDown(LS.welcome, welcomeCfg.cooldownHours)) return;
    const t = setTimeout(() => {
      setShowWelcome(true);
      markShown(LS.welcome);
    }, Math.max(2, welcomeCfg.delaySeconds) * 1000);
    return () => clearTimeout(t);
  }, [welcomeCfg, isAdminPath]);

  // Lead modal: timed + exit intent
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
    document.addEventListener('mouseout', onExit);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mouseout', onExit);
    };
  }, [leadCfg, isAdminPath, showWelcome]);

  return (
    <>
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
      {showLead && !showWelcome && <LeadPopup onClose={() => setShowLead(false)} />}
      {!isAdminPath && <CookieBar />}
      {!isAdminPath && <WithdrawalTicker />}
    </>
  );
}
