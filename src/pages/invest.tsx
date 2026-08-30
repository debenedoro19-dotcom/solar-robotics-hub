import React, { useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import PlanCard, { PlanCardSkeleton } from '@/components/investment/planCard';
import { useInvestmentPlans } from '@/components/investment/usePlans';

export default function InvestPage() {
  const { plans, loading } = useInvestmentPlans();
  const [category, setCategory] = useState('All');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(Boolean(data.user)));
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(plans.map((p) => p.category)))],
    [plans],
  );
  const visible = category === 'All' ? plans : plans.filter((p) => p.category === category);

  return (
    <main className="relative bg-background text-foreground overflow-x-hidden min-h-screen">
      <div className="grid-bg" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <Header />

      <section className="relative z-10 pt-28 pb-10 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <span className="text-xs font-bold text-primary tracking-[0.25em] uppercase mb-3 block">Investment Packages</span>
          <h1 className="text-section-title font-extrabold tracking-tighter text-white max-w-3xl">
            Deploy capital across the <span className="gradient-text-primary">Tesla ecosystem</span>
          </h1>
          <p className="text-sm text-fin-muted mt-4 max-w-2xl">
            Fund your wallet, then commit to any contract below. Yield accrues daily and every position is tracked live
            in your dashboard.
          </p>
        </div>
      </section>

      <section className="relative z-10 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  category === c ? 'bg-primary text-primary-foreground' : 'fin-card text-fin-muted hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <PlanCardSkeleton key={i} />)
              : visible.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    action={
                      <Link
                        href={isLoggedIn ? '/dashboard' : '/login'}
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold text-center hover:opacity-90 transition-opacity"
                      >
                        {isLoggedIn ? 'Invest' : 'Sign in to Invest'}
                      </Link>
                    }
                  />
                ))}
          </div>

          {!loading && visible.length === 0 && (
            <p className="text-sm text-fin-muted">No packages available in this category right now.</p>
          )}

          <div className="fin-card rounded-3xl p-6 mt-10 grid gap-6 md:grid-cols-3">
            {[
              ['1. Fund your wallet', 'Deposit via crypto or bank transfer. Balances are credited once confirmed.'],
              ['2. Choose a package', 'Pick any contract within its minimum and maximum allocation range.'],
              ['3. Earn daily yield', 'Returns accrue every day of the term and settle back into your wallet.'],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-fin-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
