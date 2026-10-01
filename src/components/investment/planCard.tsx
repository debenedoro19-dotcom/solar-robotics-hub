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
  ].map((c) => [c, 'bg-transparent text-muted-foreground border-border']),
);

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`self-start px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border mb-3 ${
        CATEGORY_STYLES[category] ?? 'text-muted-foreground border-border'
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
    <article className="bg-card border border-border rounded-lg p-6 flex flex-col">
      <CategoryBadge category={plan.category} />
      <h3 className="font-medium text-lg text-foreground">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 flex-1">{plan.description}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <dt className="text-xs text-muted-foreground">Daily ROI</dt>
          <dd className="font-medium text-foreground tabular-nums">{Number(plan.daily_roi).toFixed(2)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Term</dt>
          <dd className="font-medium text-foreground">{plan.duration_days} days</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Minimum</dt>
          <dd className="font-medium text-foreground tabular-nums">{money(Number(plan.min_deposit))}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Maximum</dt>
          <dd className="font-medium text-foreground tabular-nums">{money(Number(plan.max_deposit))}</dd>
        </div>
      </dl>
      {action}
    </article>
  );
}

export function PlanCardSkeleton() {
  return <div className="bg-card border border-border rounded-lg p-6 h-[290px] animate-pulse" aria-hidden="true" />;
}
