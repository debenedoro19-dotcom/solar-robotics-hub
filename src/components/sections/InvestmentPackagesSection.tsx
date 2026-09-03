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
          <span className="text-xs font-bold text-primary tracking-[0.25em] uppercase mb-3 block">Investment Packages</span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="text-section-title font-extrabold tracking-tighter text-white">
              Choose Your <span className="gradient-text-primary">Allocation</span>
            </h2>
            <Link
              href="/invest"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-widest uppercase hover:text-red-400 transition-colors shrink-0"
            >
              View All Packages →
            </Link>
          </div>
          <p className="text-sm text-fin-muted mt-3 max-w-xl">
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
                      className="w-full py-2.5 rounded-xl btn-emerald text-sm text-center hover:opacity-90 transition-opacity"
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
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-white/[0.08] text-sm font-bold text-white hover:border-white/25 transition-all duration-300"
            >
              See all {plans.length} packages →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
