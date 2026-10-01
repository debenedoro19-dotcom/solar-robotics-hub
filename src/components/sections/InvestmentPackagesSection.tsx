import React from 'react';
import Link from '@/components/SmartLink';
import PlanCard, { PlanCardSkeleton } from '@/components/investment/planCard';
import { useInvestmentPlans } from '@/components/investment/usePlans';

export default function InvestmentPackagesSection() {
  const { plans, loading } = useInvestmentPlans();

  return (
    <section id="invest" className="relative z-10 py-20 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 section-reveal">
          <span className="text-sm text-muted-foreground mb-2 block">Investment Packages</span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
              Choose Your Allocation
            </h2>
            <Link
              href="/invest"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors shrink-0"
            >
              View All Packages →
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl">
            Every contract is funded from your wallet balance and accrues daily yield across Tesla energy, robotics and
            space infrastructure.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <PlanCardSkeleton key={i} />)
            : plans.slice(0, 6).map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  action={
                    <Link
                      href="/dashboard"
                      className="w-full py-2.5 rounded bg-primary text-primary-foreground text-sm font-medium text-center hover:opacity-90 transition-opacity"
                    >
                      Invest
                    </Link>
                  }
                />
              ))}
        </div>

        {!loading && plans.length > 6 && (
          <div className="mt-8 text-center">
            <Link
              href="/invest"
              className="inline-flex items-center justify-center px-8 py-2.5 rounded border border-border bg-secondary text-sm font-medium text-foreground hover:bg-muted transition-all duration-300"
            >
              See all {plans.length} packages →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
