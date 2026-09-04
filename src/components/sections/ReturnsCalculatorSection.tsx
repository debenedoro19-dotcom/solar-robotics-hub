import React, { useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import { useInvestmentPlans } from '@/components/investment/usePlans';

const FALLBACK = [
  { id: 'core', name: 'Core Energy', daily_roi: 1.2, duration_days: 30, min_deposit: 500, max_deposit: 25000 },
  { id: 'growth', name: 'Growth Mobility', daily_roi: 1.8, duration_days: 45, min_deposit: 5000, max_deposit: 100000 },
  { id: 'private', name: 'Private Robotics', daily_roi: 2.4, duration_days: 60, min_deposit: 25000, max_deposit: 500000 },
];

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ReturnsCalculatorSection() {
  const { plans } = useInvestmentPlans();
  const list = plans.length ? plans : (FALLBACK as unknown as typeof plans);
  const [index, setIndex] = useState(0);
  const plan = list[Math.min(index, list.length - 1)];
  const min = Number(plan?.min_deposit ?? 500);
  const max = Number(plan?.max_deposit ?? 100000);
  const [amount, setAmount] = useState<number>(10000);

  const value = Math.min(Math.max(amount, min), max);

  const projection = useMemo(() => {
    const roi = Number(plan?.daily_roi ?? 1.2) / 100;
    const days = Number(plan?.duration_days ?? 30);
    const daily = value * roi;
    return {
      daily,
      monthly: daily * 30,
      term: daily * days,
      total: value + daily * days,
      days,
      roi: Number(plan?.daily_roi ?? 1.2),
    };
  }, [plan, value]);

  return (
    <section id="calculator" className="relative z-10 py-20 sm:py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="fin-label text-primary text-[11px]">Returns Calculator</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Model your allocation before you commit
          </h2>
          <p className="mt-4 text-sm sm:text-base text-fin-muted leading-relaxed">
            Select a mandate, set your capital, and see projected accrual across the full term. Figures
            use the live plan rates published on this platform.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Controls */}
          <div className="fin-card rounded-3xl p-6 sm:p-8">
            <p className="fin-label text-[10px] text-fin-muted">Mandate</p>
            <div className="mt-3 grid sm:grid-cols-3 gap-2">
              {list.slice(0, 3).map((p, i) => (
                <button
                  key={p.id ?? i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`px-3 py-3 rounded-2xl border text-left transition-all duration-200 ${
                    i === Math.min(index, list.length - 1)
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-fin-border hover:border-primary/30'
                  }`}
                >
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-foreground">
                    {p.name}
                  </span>
                  <span className="block mt-1 text-[11px] text-fin-muted">
                    {Number(p.daily_roi).toFixed(2)}% / day · {p.duration_days}d
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <p className="fin-label text-[10px] text-fin-muted">Capital</p>
                <p className="fin-figure text-2xl font-extrabold text-foreground">{usd(value)}</p>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={Math.max(100, Math.round((max - min) / 200))}
                value={value}
                onChange={(e) => setAmount(Number(e.target.value))}
                aria-label="Investment amount"
                className="mt-4 w-full accent-[var(--color-primary,#E31937)]"
              />
              <div className="mt-2 flex justify-between text-[11px] text-fin-muted fin-figure">
                <span>{usd(min)}</span>
                <span>{usd(max)}</span>
              </div>
            </div>
          </div>

          {/* Projection */}
          <div className="fin-card rounded-3xl p-6 sm:p-8 flex flex-col">
            <p className="fin-label text-[10px] text-fin-muted">Projected accrual</p>
            <div className="mt-5 grid grid-cols-2 gap-5">
              {[
                ['Daily', projection.daily],
                ['30 days', projection.monthly],
                [`Full term (${projection.days}d)`, projection.term],
                ['Value at maturity', projection.total],
              ].map(([label, v], i) => (
                <div key={label as string}>
                  <div className="fin-label text-[10px] text-fin-muted">{label as string}</div>
                  <div
                    className={`fin-figure mt-1.5 text-xl sm:text-2xl font-extrabold ${
                      i === 3 ? 'text-foreground' : 'text-fin-emerald'
                    }`}
                  >
                    {usd(Math.round(v as number))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-primary text-white text-xs font-bold tracking-widest uppercase btn-shimmer hover:bg-[#B3181D] transition-colors"
              >
                Start Investing
              </Link>
              <p className="mt-4 text-[11px] leading-relaxed text-fin-muted">
                Projections are illustrative and based on published plan rates. Returns are not guaranteed
                and capital is at risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
