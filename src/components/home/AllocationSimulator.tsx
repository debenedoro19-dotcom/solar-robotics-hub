import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import { Button } from '@/components/ui/button';
import { money } from '@/components/investment/planCard';
import { useInvestmentPlans } from '@/components/investment/usePlans';

export default function AllocationSimulator() {
  const { plans, loading } = useInvestmentPlans();
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState(1000);
  const plan = useMemo(() => plans.find((item) => item.id === planId) ?? plans[0], [planId, plans]);
  const minimum = plan ? Number(plan.min_deposit) : 0;
  const maximum = plan ? Number(plan.max_deposit) : 0;
  const safeAmount = plan ? Math.min(maximum, Math.max(minimum, amount)) : 0;
  const step = Math.max(1, Math.round((maximum - minimum) / 100));

  useEffect(() => {
    if (plan && amount < Number(plan.min_deposit)) setAmount(Number(plan.min_deposit));
    if (plan && amount > Number(plan.max_deposit)) setAmount(Number(plan.max_deposit));
  }, [amount, plan]);

  return (
    <section className="border-y border-border bg-muted/30 px-5 py-16 sm:px-8 sm:py-20" aria-labelledby="allocation-title">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="lux-label">Investment programs</p>
          <h2 id="allocation-title" className="mt-2 max-w-2xl text-3xl font-medium sm:text-4xl">Plan an allocation</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Compare an amount with a program&apos;s published range and term before reviewing its details.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/invest">Review programs</Link></Button>
            <Button asChild variant="outline"><Link href="/terms">Read the terms</Link></Button>
          </div>
        </div>

        <div className="border border-border bg-card p-5 sm:p-7">
          {loading ? (
            <div className="space-y-4" aria-label="Loading programs">
              <div className="h-10 animate-pulse bg-muted" />
              <div className="h-20 animate-pulse bg-muted" />
            </div>
          ) : plan ? (
            <>
              <label htmlFor="allocation-program" className="text-xs font-medium text-muted-foreground">Program</label>
              <select
                id="allocation-program"
                value={plan.id}
                onChange={(event) => setPlanId(event.target.value)}
                className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm text-foreground"
              >
                {plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>

              <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
                <label htmlFor="allocation-amount" className="text-sm text-muted-foreground">Illustrative allocation</label>
                <p className="text-2xl font-medium tabular-nums">{money(safeAmount)}</p>
              </div>
              <input
                id="allocation-amount"
                type="range"
                min={minimum}
                max={maximum}
                step={step}
                value={safeAmount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="mt-4 w-full accent-primary"
                aria-valuetext={money(safeAmount)}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{money(minimum)} minimum</span>
                <span>{money(maximum)} maximum</span>
              </div>

              <dl className="mt-6 grid grid-cols-2 border-t border-border pt-5">
                <div>
                  <dt className="lux-label">Selected amount</dt>
                  <dd className="mt-2 font-medium tabular-nums">{money(safeAmount)}</dd>
                </div>
                <div>
                  <dt className="lux-label">Program term</dt>
                  <dd className="mt-2 font-medium">{plan.duration_days} days</dd>
                </div>
              </dl>
              <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                This tool only compares your selected amount with the program range. It does not forecast returns. Investing involves risk, including possible loss of principal; targets are not guaranteed.
              </p>
            </>
          ) : (
            <div className="py-8 text-sm text-muted-foreground">No programs are currently available to compare.</div>
          )}
        </div>
      </div>
    </section>
  );
}