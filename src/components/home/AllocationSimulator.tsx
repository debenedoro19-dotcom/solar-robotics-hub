import { useEffect, useMemo, useState } from "react";
import { money } from "@/components/investment/planCard";
import { useInvestmentPlans } from "@/components/investment/usePlans";
import { useTeslaLoader } from "@/components/TeslaLoader";

export default function AllocationSimulator({
  isLoggedIn = false,
}: {
  isLoggedIn?: boolean;
}) {
  const { plans, loading } = useInvestmentPlans();
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState(5000);
  const { navigateWithLoader } = useTeslaLoader();

  const plan = useMemo(
    () => plans.find((item) => item.id === planId) ?? plans[0],
    [planId, plans],
  );
  const minimum = plan ? Number(plan.min_deposit) : 0;
  const maximum = plan ? Number(plan.max_deposit) : 0;
  const safeAmount = plan ? Math.min(maximum, Math.max(minimum, amount)) : 0;
  const step = Math.max(10, Math.round((maximum - minimum) / 100));

  useEffect(() => {
    if (plan && amount < Number(plan.min_deposit)) setAmount(Number(plan.min_deposit));
    if (plan && amount > Number(plan.max_deposit)) setAmount(Number(plan.max_deposit));
  }, [amount, plan]);

  const dailyRoi = plan ? Number(plan.daily_roi) / 100 : 0;
  const durationDays = plan ? Number(plan.duration_days) : 0;
  const estDailyTarget = safeAmount * dailyRoi;
  const estTermTotal = estDailyTarget * durationDays;

  return (
    <section
      className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-10 sm:py-20"
      aria-labelledby="allocation-title"
    >
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Interactive Capital Allocator
          </span>
          <h2 id="allocation-title" className="font-display mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Model Program Terms Before Funding
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Compare any allocation across active solar grid, Megapack utility storage, Supercharger
            expansion, and Optimus robotics contracts inside your portfolio account.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigateWithLoader(
                  isLoggedIn ? "/dashboard" : "/login",
                  isLoggedIn ? "PORTFOLIO DASHBOARD" : "ACCOUNT SIGN IN",
                )
              }
              className="h-11 rounded-[4px] bg-[#3e6ae1] px-6 text-sm font-medium text-white hover:bg-[#345ac7] transition-colors"
            >
              {isLoggedIn ? "Open Dashboard to Allocate" : "Account Sign In"}
            </button>
            <button
              type="button"
              onClick={() => navigateWithLoader("/terms", "PROGRAM TERMS")}
              className="h-11 rounded-[4px] border border-border bg-card px-6 text-sm font-medium hover:bg-muted transition-colors"
            >
              Read Terms & Risk Notice
            </button>
          </div>
        </div>

        <div className="rounded-[6px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          {loading ? (
            <div className="space-y-4" aria-label="Loading programs">
              <div className="h-11 animate-pulse rounded-[4px] bg-muted" />
              <div className="h-24 animate-pulse rounded-[4px] bg-muted" />
            </div>
          ) : plan ? (
            <>
              <label
                htmlFor="allocation-program"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                Select Infrastructure Program
              </label>
              <select
                id="allocation-program"
                value={plan.id}
                onChange={(event) => setPlanId(event.target.value)}
                className="mt-2 h-11 w-full rounded-[4px] border border-input bg-background px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-foreground"
              >
                {plans.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {Number(item.daily_roi).toFixed(2)}% / day ({item.duration_days}d)
                  </option>
                ))}
              </select>

              <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
                <label htmlFor="allocation-amount" className="text-sm font-medium text-muted-foreground">
                  Selected Allocation
                </label>
                <p className="font-display text-3xl font-semibold tabular">{money(safeAmount)}</p>
              </div>
              <input
                id="allocation-amount"
                type="range"
                min={minimum}
                max={maximum}
                step={step}
                value={safeAmount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="teh-slider mt-4 w-full"
                aria-valuetext={money(safeAmount)}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular">
                <span>Min {money(minimum)}</span>
                <span>Max {money(maximum)}</span>
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Program Term
                  </dt>
                  <dd className="font-display mt-1 text-base font-semibold tabular">
                    {plan.duration_days} days
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Illustrative / Day
                  </dt>
                  <dd className="font-display mt-1 text-base font-semibold text-[#0e9f6e] tabular">
                    {money(estDailyTarget)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Target Return
                  </dt>
                  <dd className="font-display mt-1 text-base font-semibold text-[#0e9f6e] tabular">
                    {money(estTermTotal)}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
                Illustrative calculator only. Targets are non-guaranteed estimates based on program
                rate schedules; investing carries risk including possible loss of principal.
              </p>
            </>
          ) : (
            <div className="py-8 text-sm text-muted-foreground">
              No programs are currently available to compare.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
