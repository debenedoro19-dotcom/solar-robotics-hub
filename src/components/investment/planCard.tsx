import React from "react";

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

export const CATEGORY_STYLES: Record<string, string> = Object.fromEntries(
  [
    "Solar Megapack",
    "Optimus Robotics",
    "Space Infrastructure",
    "Vehicle Fleet",
    "Powerwall Energy",
    "Supercharger Network",
  ].map((c) => [c, "bg-muted/60 text-foreground border-border"]),
);

export const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`self-start rounded-[3px] border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] mb-3 ${
        CATEGORY_STYLES[category] ?? "bg-muted/60 text-muted-foreground border-border"
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
  const dailyRoi = Number(plan.daily_roi);
  const totalTermReturnPct = Number.isFinite(dailyRoi)
    ? (dailyRoi * Number(plan.duration_days || 0)).toFixed(1)
    : "—";

  return (
    <article className="group flex flex-col justify-between rounded-[6px] border border-border bg-card p-6 transition-all duration-300 hover:border-foreground/35 hover:shadow-lg">
      <div>
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={plan.category} />
          <span className="text-[11px] font-medium text-[#0e9f6e] tabular">
            +{totalTermReturnPct}% est. term target
          </span>
        </div>

        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {plan.name}
        </h3>
        <p className="mt-2 mb-6 text-xs leading-relaxed text-muted-foreground">
          {plan.description}
        </p>

        <dl className="grid grid-cols-2 gap-4 border-y border-border/80 py-4 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Daily Target ROI
            </dt>
            <dd className="font-display mt-1 text-lg font-semibold text-foreground tabular">
              {Number(plan.daily_roi).toFixed(2)}%
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Contract Term
            </dt>
            <dd className="font-display mt-1 text-lg font-semibold text-foreground tabular">
              {plan.duration_days} days
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Minimum
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular">
              {money(Number(plan.min_deposit))}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Maximum
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular">
              {money(Number(plan.max_deposit))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="pt-5">{action}</div>
    </article>
  );
}

export function PlanCardSkeleton() {
  return (
    <div
      className="h-[320px] animate-pulse rounded-[6px] border border-border bg-card p-6"
      aria-hidden="true"
    />
  );
}
