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
          <span className="text-sm text-muted-foreground mb-2 block">Investment Packages</span>
          <h1 className="text-section-title font-extrabold tracking-tighter text-foreground max-w-3xl">
            Clean energy asset programs
          </h1>
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
            Allocate capital to programs tied to energy storage, solar and charging infrastructure. Performance figures are
            targets, not guarantees, and every position is tracked in your dashboard.
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
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  category === c ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'
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
                        className="w-full py-2.5 rounded bg-primary text-primary-foreground text-sm font-medium text-center hover:opacity-90 transition-opacity"
                      >
                        {isLoggedIn ? 'Invest' : 'Sign in to Invest'}
                      </Link>
                    }
                  />
                ))}
          </div>

          {!loading && visible.length === 0 && (
            <p className="text-sm text-muted-foreground">No packages available in this category right now.</p>
          )}

          <div className="bg-card border border-border rounded-lg p-6 mt-10 grid gap-6 md:grid-cols-3">
            {[
              ['1. Fund your wallet', 'Deposit via crypto or bank transfer. Balances are credited once confirmed.'],
              ['2. Choose a package', 'Pick any contract within its minimum and maximum allocation range.'],
              ['3. Track performance', 'Program results are reported in your dashboard and settle to your wallet at the end of the term.'],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-medium text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-10 pt-6 space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">Important risk disclosure</p>
            <p>All investing involves risk, including possible loss of principal. Target returns are estimates and are not guaranteed. Past performance does not predict future results.</p>
            <p>These programs are offered by Trade Tesla, an independent company. Trade Tesla is not affiliated with, endorsed by, or sponsored by Tesla, Inc. These programs are not Tesla, Inc. (NASDAQ: TSLA) shares. To buy TSLA stock, use a registered brokerage.</p>
            <p>Identity verification (KYC) is required before any allocation. See our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
