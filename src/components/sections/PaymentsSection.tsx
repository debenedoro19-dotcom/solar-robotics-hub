import React from "react";
import { useTeslaLoader } from "@/components/TeslaLoader";

const portfolioSlices = [
  { label: "Electric Vehicles & Fleet", pct: 45, color: "#171a20" },
  { label: "Energy Storage & Solar", pct: 30, color: "#5c5e62" },
  { label: "Optimus Robotics & AI", pct: 15, color: "#e82127" },
  { label: "Liquidity Reserves", pct: 10, color: "#a2a3a5" },
];

const paymentMethods = [
  {
    tag: "Wire & ACH",
    name: "Bank Wire Transfer",
    detail: "USD · Fedwire & SWIFT International",
    note: "Institutional settlement instructions issued automatically in your order flow and account portal.",
  },
  {
    tag: "Digital Assets",
    name: "Cryptocurrency Settlement",
    detail: "USDT (TRC20 / ERC20) · ETH · BTC",
    note: "Verified on-chain wallets visible at checkout and Account Deposit. Submit transaction hash for verification.",
  },
  {
    tag: "Cards",
    name: "Credit & Debit Cards",
    detail: "Visa · Mastercard · American Express",
    note: "Processed through encrypted gateway checkout for vehicle reservations, charging hardware, and orders.",
  },
];

export default function PaymentsSection() {
  const { navigateWithLoader } = useTeslaLoader();

  return (
    <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-10 bg-background">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Settlement & Treasury Architecture
          </p>
          <h1 className="font-display mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">
            Multi-Rail Checkout & Account Funding
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Complete direct hardware purchases or fund your Trade Tesla capital account using bank
            wire, verified crypto wallets, or card payment rails.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ecosystem Exposure Snapshot */}
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Platform Allocation Mix
              </h2>
              <p className="mt-1 text-xs text-muted-foreground mb-7">
                Illustrative sector weighting across Trade Tesla divisions
              </p>

              <div className="space-y-5">
                {portfolioSlices.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <span className="font-semibold tabular" style={{ color: s.color }}>
                        {s.pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.pct}%`, background: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Ecosystem Scale
                </div>
                <div className="font-display mt-1 text-2xl font-semibold text-foreground tabular">
                  $2.4T+
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Active Positions
                </div>
                <div className="font-display mt-1 text-2xl font-semibold text-foreground tabular">
                  12,400+
                </div>
              </div>
            </div>
          </div>

          {/* Accepted Settlement Methods */}
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Accepted Settlement Methods
              </h2>
              <p className="mt-1 text-xs text-muted-foreground mb-6">
                Available for vehicle orders, Solar Roof, Powerwall, and wallet funding
              </p>

              <div className="space-y-3.5">
                {paymentMethods.map((m) => (
                  <div
                    key={m.name}
                    className="rounded-lg border border-border bg-muted/25 p-4 transition-colors hover:border-foreground/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-semibold text-foreground">
                        {m.name}
                      </span>
                      <span className="rounded-[3px] border border-border bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {m.tag}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-medium text-foreground/80">{m.detail}</div>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{m.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigateWithLoader("/account/deposit", "FUND ACCOUNT")}
                className="h-10 rounded-[4px] bg-foreground px-5 text-xs font-medium text-background hover:opacity-90 transition-opacity"
              >
                Open Account Deposit
              </button>
              <button
                type="button"
                onClick={() => navigateWithLoader("/inventory", "BROWSE INVENTORY")}
                className="h-10 rounded-[4px] border border-border px-5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Shop Hardware
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
