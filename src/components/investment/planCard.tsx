import React from 'react';

export interface InvestmentPlan {
  id: string;
  name: string;
  category: string;
  description: string;
  daily_roi: number | string;
  duration_days: number;
  min_deposit: number | string;
  max_deposit: number | string;
  is_active?: boolean;
  sort_order?: number;
}

// Uniform site theme: every category badge uses the primary (Cyber Crimson) treatment.
export const CATEGORY_STYLES: Record<string, string> = Object.fromEntries(
  [
    'Solar Megapack',
    'Optimus Robotics',
    'Space Infrastructure',
    'Vehicle Fleet',
    'Powerwall Energy',
    'Supercharger Network',
  ].map((c) => [c, 'bg-primary/10 text-primary border-primary/30']),
);

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`self-start px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border mb-3 ${
        CATEGORY_STYLES[category] ?? 'bg-white/5 text-fin-muted border-fin-border'
      }`}
    >
      {category}
    </span>
  );
}

/** Single source of truth for how an investment package renders across the site. */
export default function PlanCard({
  plan,
  action,
}: {
  plan: InvestmentPlan;
  action: React.ReactNode;
}) {
  return (
    <article className="fin-card rounded-3xl p-5 flex flex-col">
      <CategoryBadge category={plan.category} />
      <h3 className="font-bold text-lg text-white">{plan.name}</h3>
      <p className="text-sm text-fin-muted mt-1 mb-4 flex-1">{plan.description}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <dt className="text-xs text-fin-muted">Daily ROI</dt>
          <dd className="font-bold text-fin-emerald tabular-nums">{Number(plan.daily_roi).toFixed(2)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-fin-muted">Term</dt>
          <dd className="font-bold text-white">{plan.duration_days} days</dd>
        </div>
        <div>
          <dt className="text-xs text-fin-muted">Minimum</dt>
          <dd className="font-bold text-white tabular-nums">{money(Number(plan.min_deposit))}</dd>
        </div>
        <div>
          <dt className="text-xs text-fin-muted">Maximum</dt>
          <dd className="font-bold text-white tabular-nums">{money(Number(plan.max_deposit))}</dd>
        </div>
      </dl>
      {action}
    </article>
  );
}

export function PlanCardSkeleton() {
  return <div className="fin-card rounded-3xl p-5 h-[290px] animate-pulse" aria-hidden="true" />;
}
