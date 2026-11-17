import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/sections/FloatingSupport";
import AllocationSimulator from "@/components/home/AllocationSimulator";
import { supabase } from "@/integrations/supabase/client";
import PlanCard, { PlanCardSkeleton } from "@/components/investment/planCard";
import { useInvestmentPlans } from "@/components/investment/usePlans";
import { useTeslaLoader } from "@/components/TeslaLoader";

export default function InvestPage() {
  const { plans, loading } = useInvestmentPlans();
  const [category, setCategory] = useState("All");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { navigateWithLoader } = useTeslaLoader();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(Boolean(data.user)));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(plans.map((p) => p.category)))],
    [plans],
  );
  const visible = category === "All" ? plans : plans.filter((p) => p.category === category);

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />

      {/* Clean Studio Top Bar */}
      <section className="pt-24 pb-8 sm:pt-28 sm:pb-10 px-4 sm:px-6 lg:px-10 border-b border-border bg-background">
        <div className="mx-auto max-w-[1440px] flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[4px] border border-border bg-muted/40 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e82127]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Trade Tesla · Structured Clean Energy & AI Capital
              </span>
            </div>
            <h1 className="font-display mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              Investment Programs & Allocation
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Model return yields, explore proportional asset programs, and fund positions with daily liquidity telemetry.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigateWithLoader(
                  isLoggedIn ? "/dashboard" : "/login",
                  isLoggedIn ? "PORTFOLIO DASHBOARD" : "ACCOUNT",
                )
              }
              className="h-11 rounded-[4px] bg-foreground text-background px-6 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              {isLoggedIn ? "Open Portfolio Dashboard →" : "Sign In to Invest"}
            </button>
            <a
              href="#programs-catalog"
              className="inline-flex h-11 items-center justify-center rounded-[4px] border border-border bg-card px-6 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              View All Programs ↓
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Simulator (placed on /invest, never on /) */}
      <AllocationSimulator isLoggedIn={isLoggedIn} />

      {/* Live Supabase Investment Programs Catalog */}
      <section id="programs-catalog" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border pb-6 mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Active Programs
              </p>
              <h2 className="font-display mt-1.5 text-3xl font-semibold tracking-tight">
                Select Your Portfolio Allocation
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-[4px] px-4 py-2 text-xs font-medium transition-colors ${
                    category === c
                      ? "bg-foreground text-background"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <PlanCardSkeleton key={i} />)
              : visible.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          navigateWithLoader(
                            isLoggedIn ? "/dashboard" : "/login",
                            isLoggedIn ? `INVEST · ${plan.name.toUpperCase()}` : "ACCOUNT",
                          )
                        }
                        className="w-full h-10 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        {isLoggedIn ? "Allocate Now →" : "Account · Sign In to Invest"}
                      </button>
                    }
                  />
                ))}
          </div>

          {!loading && visible.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No packages available in this category right now.
            </p>
          )}

          {/* Onboarding Architecture */}
          <div className="mt-14 grid gap-6 rounded-[6px] border border-border bg-card p-6 sm:p-8 md:grid-cols-3">
            {[
              [
                "01 · Open Account & Verify",
                "Sign in or register through Account, complete rapid KYC verification, and enable 2FA security.",
              ],
              [
                "02 · Fund Wallet Balance",
                "Deposit funds via USD wire transfer, ACH settlement, or major digital currencies credited to your ledger.",
              ],
              [
                "03 · Track Term Settlement",
                "Activate any infrastructure package and monitor daily ledger activity through full term payout.",
              ],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          {/* Institutional Infrastructure & Settlement Architecture (Placed at bottom of page) */}
          <section className="mt-14 rounded-[6px] overflow-hidden border border-border bg-[#0a0b0d] text-white p-6 sm:p-10 relative">
            <img
              src="/images/energy-home.jpg"
              alt="Clean Energy Grid Infrastructure"
              className="absolute inset-0 h-full w-full object-cover opacity-25 pointer-events-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,11,13,0.85) 0%, rgba(10,11,13,0.96) 100%)",
              }}
            />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-[4px] border border-white/20 bg-white/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e82127]" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/90">
                    Trade Tesla Infrastructure Architecture
                  </span>
                </div>
                <h3 className="font-display mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Clean Energy, Autonomous Fleet & AI Infrastructure Programs
                </h3>
                <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-white/75">
                  Allocate capital to structured asset programs across Megapack utility storage, Solar
                  arrays, Supercharger network expansion, and Optimus robotics lines. Track daily
                  positions and maturity settlements in your verified account dashboard.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigateWithLoader(
                        isLoggedIn ? "/dashboard" : "/login",
                        isLoggedIn ? "PORTFOLIO DASHBOARD" : "ACCOUNT",
                      )
                    }
                    className="h-10 rounded-[4px] bg-white px-6 text-xs font-semibold text-[#171a20] hover:bg-white/90 transition-colors"
                  >
                    {isLoggedIn ? "Open Investment Dashboard" : "Account · Sign In to Invest"}
                  </button>
                  <a
                    href="#programs-catalog"
                    className="inline-flex h-10 items-center justify-center rounded-[4px] border border-white/35 px-6 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    View All Programs
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 rounded-[6px] border border-white/15 bg-black/60 p-5 backdrop-blur-xl">
                <div>
                  <div className="font-display text-2xl font-semibold tabular">Daily</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/65">
                    ROI Telemetry Ledger
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl font-semibold tabular">Multi-Rail</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/65">
                    Wire, Card & Crypto Funding
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl font-semibold tabular">KYC</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/65">
                    Identity Verified Accounts
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl font-semibold tabular">24/7</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/65">
                    Portfolio Transparency
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Institutional Risk Disclosure */}
          <div className="mt-12 border-t border-border pt-8 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Important Risk Disclosure
            </p>
            <p>
              All investing involves risk, including possible loss of principal. Target returns are
              illustrative projections and are not guaranteed. Past performance does not predict future
              results.
            </p>
            <p>
              These programs are offered by Trade Tesla on tradeenergyhub.com, an independent platform.
              Trade Tesla is not affiliated with, endorsed by, or sponsored by Tesla, Inc., and these
              programs do not represent shares of Tesla, Inc. (NASDAQ: TSLA).
            </p>
            <p>
              Identity verification (KYC) is required prior to capital allocation. Review our{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingSupport />
    </main>
  );
}
