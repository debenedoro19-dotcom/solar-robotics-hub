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
  const [amount, setAmount] = useState(1000);
  const { navigateWithLoader } = useTeslaLoader();

  const plan = useMemo(
    () => plans.find((item) => item.id === planId) ?? plans[0],
    [planId, plans],
  );

  const minimum = plan ? Number(plan.min_deposit) : 500;
  const maximum = plan ? Number(plan.max_deposit) : 10000;
  const safeAmount = plan ? Math.min(maximum, Math.max(minimum, amount)) : 1000;
  const step = Math.max(50, Math.round((maximum - minimum) / 100));

  // When selected plan changes, set amount to its minimum if current amount is below minimum
  useEffect(() => {
    if (!plan) return;
    const planMin = Number(plan.min_deposit);
    const planMax = Number(plan.max_deposit);
    if (amount < planMin) {
      setAmount(planMin);
    } else if (amount > planMax) {
      setAmount(planMax);
    }
  }, [plan?.id]);

  const dailyRoi = plan ? Number(plan.daily_roi) / 100 : 0.01;
  const durationDays = plan ? Number(plan.duration_days) : 15;
  const estDailyTarget = safeAmount * dailyRoi;
  const estTermTotal = estDailyTarget * durationDays;
  const estTotalMaturity = safeAmount + estTermTotal;
  const totalReturnPct = Math.round(dailyRoi * durationDays * 100);

  // Quick preset chips that fall within the current plan's bounds
  const presets = [500, 1000, 2500, 5000, 10000, 25000].filter(
    (val) => val >= minimum && val <= maximum,
  );

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
              className="h-11 rounded-[4px] bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
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
                    {item.name} — +{Math.round(Number(item.daily_roi) * item.duration_days)}% Return ({item.duration_days} Days) · Min {money(Number(item.min_deposit))}
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

              {presets.length > 1 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                    Presets:
                  </span>
                  {presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold tabular transition-colors ${
                        safeAmount === val
                          ? "bg-foreground text-background"
                          : "border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {money(val)}
                    </button>
                  ))}
                </div>
              )}

              <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border pt-5">
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
                    Target Return
                  </dt>
                  <dd className="font-display mt-1 text-base font-semibold text-emerald-500 tabular">
                    +{totalReturnPct}%
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Projected Yield
                  </dt>
                  <dd className="font-display mt-1 text-base font-semibold text-foreground tabular">
                    {money(estTermTotal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Maturity Total
                  </dt>
                  <dd className="font-display mt-1 text-base font-semibold text-foreground tabular">
                    {money(estTotalMaturity)}
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
