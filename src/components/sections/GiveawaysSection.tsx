import React, { useState, useEffect, memo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SmartLink from "@/components/SmartLink";
import { sendGiveawayEntryConfirmedEmail } from "@/lib/emailService";
import model3Img from "@/assets/giveaways/model_3.webp";
import cybertruckImg from "@/assets/giveaways/cybertruck.webp";

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  image_url: string | null;
  entry_fee: number;
  ends_at: string;
  entries_count: number;
  max_entries: number;
  badge: string;
}

// Instant-paint fallback that mirrors the seeded campaigns.
const FALLBACK_GIVEAWAYS: Giveaway[] = [
  {
    id: "fallback-1",
    title: "Win a 2025 Model 3 Long Range",
    description:
      "2025 Tesla Model 3 Long Range AWD. One winner selected after the campaign ends. Includes standard delivery within the continental US.",
    prize: "2025 Tesla Model 3 Long Range AWD",
    image_url: null,
    entry_fee: 200,
    ends_at: "2026-12-31",
    entries_count: 1247,
    max_entries: 5000,
    badge: "$200 ENTRY",
  },
  {
    id: "fallback-2",
    title: "Cybertruck Experience Weekend",
    description:
      "Win a full weekend with a Cybertruck Foundation Series plus a $2,000 platform credit toward any purchase.",
    prize: "Cybertruck Foundation Series + $2,000 credit",
    image_url: null,
    entry_fee: 500,
    ends_at: "2026-10-15",
    entries_count: 683,
    max_entries: 2000,
    badge: "$500 ENTRY",
  },
  {
    id: "fallback-3",
    title: "Trade Tesla — $1.3B Bitcoin Pool",
    description:
      "In celebration of crypto's growth: enter the Trade Tesla Bitcoin distribution. Commit $1,200 from your wallet (Tesla stock–aligned entry). When every entry slot is filled this cycle, rewards are released to participants from the pool. Paid from your available balance and logged in your ledger — same as all other giveaways. Invest today. Win tomorrow. Power the future.",
    prize: "$1.3 Billion Bitcoin pool — rewards when entries are full",
    image_url: "https://tradeenergyhub.com/assets/giveaways/bitcoin_pool.webp",
    entry_fee: 1200,
    ends_at: "2026-09-30",
    entries_count: 0,
    max_entries: 1084,
    badge: "$1,200 ENTRY",
  },
];
const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// Pick a legitimate vehicle image based on what the campaign is about.
function imageFor(g: Giveaway): string {
  if (g.image_url) return g.image_url;
  const text = `${g.title} ${g.prize}`.toLowerCase();
  if (text.includes("cybertruck") || text.includes("cyber")) return cybertruckImg;
  if (text.includes("bitcoin") || text.includes("btc") || text.includes("stock pool") || text.includes("$1.3")) {
    return "https://tradeenergyhub.com/assets/giveaways/bitcoin_pool.webp";
  }
  return model3Img;
}
interface TimeLeft {
  d: number;
  h: number;
  m: number;
  s: number;
}

function calcTimeLeft(endDate: string): TimeLeft {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const CountdownTimer = memo(function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    setTimeLeft(calcTimeLeft(endDate));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(endDate)), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const pads = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex gap-3" aria-label="Countdown timer">
      {[
        { v: timeLeft.d, l: "Days" },
        { v: timeLeft.h, l: "Hrs" },
        { v: timeLeft.m, l: "Min" },
        { v: timeLeft.s, l: "Sec" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <span className="text-2xl font-extrabold text-primary tabular-nums">{pads(v)}</span>
          <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">{l}</span>
        </div>
      ))}
    </div>
  );
});

const GiveawayCard = memo(function GiveawayCard({
  g,
  idx,
  onEnter,
}: {
  g: Giveaway;
  idx: number;
  onEnter: (g: Giveaway) => void;
}) {
  const pct = Math.min(100, Math.round((g.entries_count / Math.max(1, g.max_entries)) * 100));
  return (
    <article
      className="glass-card glass-card-hover rounded-3xl overflow-hidden relative animate-[fadeSlideUp_0.5s_ease-out_both]"
      style={{ transitionDelay: `${idx * 100}ms` }}
    >
      <img
        src={imageFor(g)}
        alt={g.prize || g.title}
        width={1024}
        height={640}
        loading="lazy"
        className="w-full h-52 object-cover"
      />
      <div className="p-8 relative z-10">
        <div className="flex items-start justify-between mb-4 gap-4">
          <h3 className="text-xl font-extrabold text-foreground leading-tight">{g.title}</h3>
          <span className="shrink-0 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase bg-accent/15 text-accent border border-accent/30">
            {g.badge}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{g.description}</p>
        <div className="mb-6">
          <div className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">
            Ends{" "}
            {new Date(g.ends_at).toLocaleDateString("en-US", {
              timeZone: "UTC",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <CountdownTimer endDate={g.ends_at} />
        </div>
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
            <span>{g.entries_count.toLocaleString()} entries</span>
            <span>{g.max_entries.toLocaleString()} max</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={g.entries_count}
              aria-valuemin={0}
              aria-valuemax={g.max_entries}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {pct}% filled ·{" "}
            {g.entry_fee > 0 ? `${money(g.entry_fee)} entry — paid from your wallet balance` : "Free entry"}
          </div>
        </div>
        <button
          onClick={() => onEnter(g)}
          className="w-full py-3.5 bg-accent text-accent-foreground font-bold rounded-xl btn-shimmer text-sm transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 min-h-[48px]"
        >
          Enter Giveaway — {g.entry_fee > 0 ? money(g.entry_fee) : "Free"} →
        </button>
      </div>
    </article>
  );
});

function EntryModal({
  giveaway,
  onClose,
  onEntered,
}: {
  giveaway: Giveaway;
  onClose: () => void;
  onEntered: (id: string) => void;
}) {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (cancelled) return;
      if (!user) {
        setSignedIn(false);
        setChecking(false);
        return;
      }
      setSignedIn(true);
      const { data: row } = await supabase
        .from("user_balance")
        .select("available_balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setBalance(Number(row?.["available_balance"] ?? 0));
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const insufficient = balance < giveaway.entry_fee;

  async function confirm() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("enter_giveaway", { _giveaway_id: giveaway.id });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const result = data as { ok?: boolean; error?: string } | null;
    if (!result?.ok) {
      setError(result?.error || "Could not complete your entry");
      return;
    }
    void sendGiveawayEntryConfirmedEmail(giveaway.entry_fee.toString(), giveaway.title).catch(() => {});
    setBalance((b) => b - giveaway.entry_fee);
    setDone(true);
    onEntered(giveaway.id);
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-4 fin-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5 gap-4">
          <h2 className="text-lg font-bold text-foreground">{done ? "Entry confirmed" : "Confirm Giveaway Entry"}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>

        {checking ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Checking your wallet…</p>
        ) : !signedIn ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Giveaway entries are paid from your wallet balance. Sign in to enter{" "}
              <strong className="text-foreground">{giveaway.title}</strong>.
            </p>
            <SmartLink
              href="/login"
              className="block text-center w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
            >
              Sign in to enter
            </SmartLink>
            <SmartLink
              href="/register"
              className="block text-center w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm"
            >
              Create an account
            </SmartLink>
          </div>
        ) : done ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are entered into <strong className="text-foreground">{giveaway.title}</strong>.{" "}
              {money(giveaway.entry_fee)} was debited from your wallet balance and logged in your transaction ledger.
            </p>
            <SmartLink
              href="/dashboard"
              className="block text-center w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
            >
              View in dashboard
            </SmartLink>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prize</span>
                <span className="font-semibold text-foreground text-right">{giveaway.prize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry fee</span>
                <span className="font-bold text-foreground tabular-nums">{money(giveaway.entry_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet balance</span>
                <span className={`font-bold tabular-nums ${insufficient ? "text-destructive" : "text-foreground"}`}>
                  {money(balance)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Balance after entry</span>
                <span className="font-bold tabular-nums text-foreground">
                  {money(Math.max(0, balance - giveaway.entry_fee))}
                </span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {insufficient ? (
              <>
                <p className="text-sm text-destructive">
                  Your wallet balance is too low for this entry. Deposit funds first.
                </p>
                <SmartLink
                  href="/account/deposit"
                  className="block text-center w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
                >
                  Deposit Funds
                </SmartLink>
              </>
            ) : (
              <button
                onClick={confirm}
                disabled={busy}
                className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm disabled:opacity-60"
              >
                {busy ? "Processing…" : `Pay ${money(giveaway.entry_fee)} & Enter`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GiveawaysSection() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>(FALLBACK_GIVEAWAYS);
  const [active, setActive] = useState<Giveaway | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("giveaways").select("*").eq("is_active", true).order("sort_order");
        if (!cancelled && data && data.length > 0) setGiveaways(data as Giveaway[]);
      } catch {
        // keep fallback cards
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEntered = useCallback((id: string) => {
    setGiveaways((prev) => prev.map((g) => (g.id === id ? { ...g, entries_count: g.entries_count + 1 } : g)));
  }, []);

  return (
    <section id="giveaways" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 section-reveal">
          <span className="text-xs font-bold text-accent tracking-[0.25em] uppercase mb-3 block">Tesla Giveaways</span>
          <h2 className="text-section-title font-extrabold tracking-tighter text-foreground">
            Win Vehicles & <span className="gradient-text-accent">Exclusive Experiences</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Entries are paid instantly from your wallet balance — the same balance used for deposits, plans and
            withdrawals.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {giveaways.map((g, idx) => (
            <GiveawayCard key={g.id} g={g} idx={idx} onEnter={setActive} />
          ))}
        </div>
      </div>
      {active && <EntryModal giveaway={active} onClose={() => setActive(null)} onEntered={handleEntered} />}
    </section>
  );
}
