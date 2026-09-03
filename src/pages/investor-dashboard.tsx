import React, { lazy, useCallback, useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import { useNavigate } from '@tanstack/react-router';
import { createClient } from '@/lib/supabase/client';
import InvestorShell from '@/components/investor/InvestorShell';
import { MetricCard, Modal, WithdrawModal } from '@/components/investor/modals';
import { EMPTY_WALLET, money, toWallet, type Wallet } from '@/components/investor/wallet';
import PlanCard, { type InvestmentPlan as SharedPlan } from '@/components/investment/planCard';
import { sendInvestmentPurchasedEmail } from '@/lib/emailService';

const PortfolioChart = lazy(() => import('@/components/investor/PortfolioChart'));
const AccountPanel = lazy(() => import('@/pages/account'));

interface Plan {
  id: string;
  name: string;
  category: string;
  description: string;
  daily_roi: number;
  duration_days: number;
  min_deposit: number;
  max_deposit: number;
}

interface Contract {
  id: string;
  plan_name: string;
  plan_category: string;
  principal: number;
  daily_roi: number;
  duration_days: number;
  yield_earned: number;
  status: string;
  started_at: string;
  matures_at: string;
}

interface LedgerRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  'Solar Megapack': 'bg-primary/10 text-primary border-primary/30',
  'Optimus Robotics': 'bg-primary/10 text-primary border-primary/30',
  'Space Infrastructure': 'bg-primary/10 text-primary border-primary/30',
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-fin-emerald/10 text-fin-emerald border-fin-emerald/30',
  pending: 'bg-fin-amber/10 text-fin-amber border-fin-amber/30',
  failed: 'bg-fin-danger/10 text-fin-danger border-fin-danger/30',
  rejected: 'bg-fin-danger/10 text-fin-danger border-fin-danger/30',
};

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  investment: 'Plan Purchase',
  yield: 'Yield Payout',
  return: 'Yield Payout',
  withdrawal: 'Withdrawal',
  giveaway: 'Giveaway Entry',
};

interface GiveawayEntry {
  id: string;
  giveaway_title: string;
  amount_paid: number;
  status: string;
  created_at: string;
}

type Range = '7d' | '1m' | '1y' | 'all';

export default function InvestorDashboard() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [wallet, setWallet] = useState<Wallet>(EMPTY_WALLET);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [giveawayEntries, setGiveawayEntries] = useState<GiveawayEntry[]>([]);
  const [tab, setTab] = useState<'active' | 'browse'>('active');
  const [range, setRange] = useState<Range>('1m');
  const [view, setView] = useState<'portfolio' | 'account'>('portfolio');

  const navigate = useNavigate();
  const goDeposit = useCallback(() => { void navigate({ to: '/account/deposit' }); }, [navigate]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [investPlan, setInvestPlan] = useState<Plan | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const notify = useCallback((kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);
    setUserEmail(user.email ?? '');

    // Grow active contracts (daily ROI) and release matured ones into the wallet
    // before reading balances, so the numbers on screen are always current.
    await supabase.rpc('accrue_investments', { _user_id: user.id });



    const [balanceRes, plansRes, investmentsRes, ledgerRes, entriesRes] = await Promise.all([
      supabase.from('user_balance').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('investment_plans').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('user_investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('balance_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
      supabase.from('giveaway_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (balanceRes.data) {
      setWallet(toWallet(balanceRes.data as Record<string, unknown>));
    } else {
      await supabase.from('user_balance').insert({ user_id: user.id });
      setWallet(EMPTY_WALLET);
    }


    setPlans((plansRes.data ?? []) as Plan[]);
    setContracts((investmentsRes.data ?? []) as Contract[]);
    setLedger((ledgerRes.data ?? []) as LedgerRow[]);
    setGiveawayEntries((entriesRes.data ?? []) as GiveawayEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the wallet figure live: admin adjustments, deposits and payouts all
  // land in `user_balance`, so we subscribe to that row, and also re-read it
  // when the tab regains focus (in case the socket was asleep).
  const refreshWallet = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase.from('user_balance').select('*').eq('user_id', uid).maybeSingle();
    if (data) setWallet(toWallet(data as Record<string, unknown>));
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`wallet_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_balance', filter: `user_id=eq.${userId}` },
        () => { void refreshWallet(userId); },
      )
      .subscribe();

    const onFocus = () => { if (document.visibilityState === 'visible') void refreshWallet(userId); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const poll = window.setInterval(() => { void refreshWallet(userId); }, 30000);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(poll);
    };
  }, [userId, refreshWallet]);

  const activeContracts = contracts.filter((c) => c.status === 'active');
  const totalActiveCapital = activeContracts.reduce((sum, c) => sum + Number(c.principal), 0);
  const totalYield = contracts.reduce((sum, c) => sum + Number(c.yield_earned), 0) + wallet.total_profit;

  // Portfolio growth series derived from the ledger + accrued yield.
  const chartData = useMemo(() => {
    const days = range === '7d' ? 7 : range === '1m' ? 30 : range === '1y' ? 365 : 730;
    const points: { label: string; value: number }[] = [];
    const now = Date.now();
    const base = wallet.available_balance + totalActiveCapital;
    for (let i = days; i >= 0; i -= Math.max(1, Math.round(days / 24))) {
      const t = new Date(now - i * 86400000);
      const accrued = activeContracts.reduce((sum, c) => {
        const started = new Date(c.started_at).getTime();
        if (t.getTime() < started) return sum;
        const elapsedDays = Math.min((t.getTime() - started) / 86400000, c.duration_days);
        return sum + Number(c.principal) * (Number(c.daily_roi) / 100) * elapsedDays;
      }, 0);
      points.push({
        label: t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Number((base + accrued).toFixed(2)),
      });
    }
    return points;
  }, [range, wallet.available_balance, totalActiveCapital, activeContracts]);

  if (loading) {
    return (
      <main className="min-h-screen bg-fin-bg flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-fin-emerald border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-fin-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-sm text-fin-muted mb-6">Access your investor dashboard to view your wallet.</p>
          <Link href="/login" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <InvestorShell balance={wallet.available_balance} onDeposit={() => goDeposit()} onWithdraw={() => setWithdrawOpen(true)}>
    <main className="bg-fin-bg text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fin-muted">Investor Console</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Portfolio Overview</h1>
            <p className="text-sm text-fin-muted mt-1">{userEmail}</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-fin-elevated border border-fin-border">
            {(['portfolio', 'account'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${view === v ? 'bg-primary text-primary-foreground' : 'text-fin-muted hover:text-white'}`}>
                {v === 'portfolio' ? 'Portfolio' : 'Account & Verification'}
              </button>
            ))}
          </div>
        </header>

        {view === 'account' ? (
          <React.Suspense fallback={<div className="h-64 rounded-3xl bg-fin-elevated animate-pulse" />}>
            <AccountPanel embedded />
          </React.Suspense>
        ) : (
        <>


        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="fin-card-elevated rounded-3xl p-6 sm:p-8">
            <p className="ts-label mb-3">Available Wallet Balance</p>
            <p className="text-3xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
              {money(wallet.available_balance)}
            </p>
            <p className="text-sm text-fin-muted mt-2">
              Deposit-first platform — fund your wallet before deploying capital into a plan.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={() => goDeposit()} className="px-5 py-2.5 rounded-xl bg-[#E82127] text-white text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-[#B3181D] transition-all duration-300">+ Deposit</button>
              <button onClick={() => setWithdrawOpen(true)} className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl text-sm font-bold hover:border-white/25 transition-all duration-300">↑ Withdraw</button>
              <button onClick={() => { setTab('browse'); document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl text-sm font-bold hover:border-white/25 transition-all duration-300">⚡ Buy Plan</button>
            </div>
          </div>


          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard label="Total Active Capital" value={money(totalActiveCapital)} />
            <MetricCard label="Total Net Profit Accrued" value={money(totalYield)} accent />
            <MetricCard label="Active Contracts" value={String(activeContracts.length)} />
          </div>
        </section>

        {/* Chart */}
        <section className="fin-card rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold">Portfolio Analytics</h2>
              <p className="text-xs text-fin-muted">Capital base plus accrued daily yield</p>
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-fin-elevated border border-fin-border">
              {(['7d', '1m', '1y', 'all'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${range === r ? 'bg-primary text-primary-foreground' : 'text-fin-muted hover:text-white'}`}>
                  {r === 'all' ? 'All' : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <React.Suspense fallback={<div className="h-full w-full rounded-2xl bg-fin-elevated animate-pulse" />}>
              <PortfolioChart data={chartData} />
            </React.Suspense>
          </div>

        </section>

        {/* Marketplace */}
        <section id="marketplace" className="space-y-5">
          <div className="flex gap-2">
            {(['active', 'browse'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'fin-card text-fin-muted hover:text-white'}`}>
                {t === 'active' ? `Active Investments (${activeContracts.length})` : 'Browse & Deploy Capital'}
              </button>
            ))}
          </div>

          {tab === 'active' ? (
            activeContracts.length === 0 ? (
              <div className="fin-card rounded-3xl p-10 text-center">
                <p className="text-sm text-fin-muted mb-4">No active contracts yet.</p>
                <button onClick={() => setTab('browse')} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Browse Plans</button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeContracts.map((c) => {
                  const started = new Date(c.started_at).getTime();
                  const matures = new Date(c.matures_at).getTime();
                  const progress = Math.min(100, Math.max(0, ((Date.now() - started) / (matures - started)) * 100));
                  return (
                    <article key={c.id} className="fin-card rounded-3xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold">{c.plan_name}</h3>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_STYLES[c.plan_category] ?? 'bg-white/5 text-fin-muted border-fin-border'}`}>
                          {c.plan_category}
                        </span>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div><dt className="text-xs text-fin-muted">Principal</dt><dd className="font-bold tabular-nums">{money(Number(c.principal))}</dd></div>
                        <div><dt className="text-xs text-fin-muted">Daily ROI</dt><dd className="font-bold text-fin-emerald tabular-nums">{Number(c.daily_roi).toFixed(2)}%</dd></div>
                        <div><dt className="text-xs text-fin-muted">Yield Earned</dt><dd className="font-bold text-fin-emerald tabular-nums">{money(Number(c.yield_earned))}</dd></div>
                        <div><dt className="text-xs text-fin-muted">Matures</dt><dd className="font-bold">{new Date(c.matures_at).toLocaleDateString()}</dd></div>
                      </dl>
                      <div className="h-2 ts-progress">
                        <div className="ts-progress-fill" style={{ width: `${progress}%` }} />

                      </div>
                      <p className="text-[11px] text-fin-muted mt-2">{progress.toFixed(0)}% of {c.duration_days}-day term complete</p>
                      <p className="text-[11px] text-fin-muted mt-1">
                        🔒 Principal + yield unlock for withdrawal on {new Date(c.matures_at).toLocaleDateString()}
                      </p>
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p as unknown as SharedPlan}
                  action={
                    <button onClick={() => setInvestPlan(p)} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">Invest</button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Giveaway entries */}
        <section className="fin-card rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-fin-border flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Giveaway Entries</h2>
              <p className="text-xs text-fin-muted">Entries paid from your wallet balance</p>
            </div>
            <a href="/#giveaways" className="px-4 py-2 rounded-xl bg-fin-emerald text-black text-xs font-bold whitespace-nowrap">Enter a Giveaway</a>
          </div>
          {giveawayEntries.length === 0 ? (
            <p className="p-8 text-center text-sm text-fin-muted">No giveaway entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-fin-muted">
                    <th className="px-5 py-3 font-semibold">Campaign</th>
                    <th className="px-5 py-3 font-semibold text-right">Entry Fee</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {giveawayEntries.map((e) => (
                    <tr key={e.id} className="border-t border-fin-border">
                      <td className="px-5 py-3">{e.giveaway_title}</td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums">{money(Number(e.amount_paid))}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${STATUS_STYLES[e.status] ?? 'bg-white/5 text-fin-muted border-fin-border'}`}>{e.status}</span>
                      </td>
                      <td className="px-5 py-3 text-fin-muted whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Ledger */}
        <section className="fin-card rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-fin-border">
            <h2 className="text-lg font-bold">Transaction Ledger</h2>
            <p className="text-xs text-fin-muted">Deposits, plan purchases, giveaway entries, yield payouts and withdrawals</p>
          </div>
          {ledger.length === 0 ? (
            <p className="p-8 text-center text-sm text-fin-muted">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-fin-muted">
                    <th className="px-5 py-3 font-semibold">Date / Time</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row.id} className="border-t border-fin-border">
                      <td className="px-5 py-3 text-fin-muted whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3">{TYPE_LABELS[row.type] ?? row.type}</td>
                      <td className={`px-5 py-3 text-right font-bold tabular-nums ${Number(row.amount) < 0 ? 'text-white' : 'text-fin-emerald'}`}>
                        {Number(row.amount) < 0 ? '-' : '+'}{money(Math.abs(Number(row.amount)))}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${STATUS_STYLES[row.status] ?? 'bg-white/5 text-fin-muted border-fin-border'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
        )}
      </div>


      {withdrawOpen && (
        <WithdrawModal balance={wallet.available_balance} userId={userId} userEmail={userEmail} onClose={() => setWithdrawOpen(false)} onDone={(msg) => { notify('ok', msg); void load(); }} onError={(m) => notify('err', m)} />
      )}
      {investPlan && (
        <InvestModal
          plan={investPlan}
          balance={wallet.available_balance}
          onClose={() => setInvestPlan(null)}
          onDeposit={() => { setInvestPlan(null); goDeposit(); }}
          onDone={(msg) => { notify('ok', msg); void load(); }}
          onError={(m) => notify('err', m)} />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl border text-sm font-semibold ${toast.kind === 'ok' ? 'bg-fin-emerald/10 border-fin-emerald/40 text-fin-emerald' : 'bg-fin-danger/10 border-fin-danger/40 text-fin-danger'}`}>
          {toast.msg}
        </div>
      )}
      </main>
    </InvestorShell>

  );
}


function InvestModal({ plan, balance, onClose, onDone, onError, onDeposit }: {
  plan: Plan; balance: number; onClose: () => void;
  onDone: (msg: string) => void; onError: (msg: string) => void; onDeposit: () => void;
}) {
  const [amount, setAmount] = useState<string>(String(plan.min_deposit));
  const [busy, setBusy] = useState(false);
  const value = Number(amount) || 0;
  const insufficient = value > balance;
  const outOfBounds = value < Number(plan.min_deposit) || value > Number(plan.max_deposit);
  const dailyPayout = value * (Number(plan.daily_roi) / 100);
  const totalReturn = dailyPayout * plan.duration_days;

  async function confirm() {
    if (insufficient || outOfBounds || value <= 0) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('purchase_investment_plan', { _plan_id: plan.id, _amount: value });
    setBusy(false);
    if (error) { onError(error.message); return; }
    const result = data as { ok: boolean; error?: string } | null;
    if (!result?.ok) { onError(result?.error ?? 'Purchase failed'); return; }
    void sendInvestmentPurchasedEmail(value.toString()).catch(() => {});
    onDone(`${plan.name} activated with ${money(value)}`);
    onClose();
  }

  return (
    <Modal title={`Deploy Capital — ${plan.name}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-fin-elevated border border-fin-border p-3">
            <p className="text-[11px] uppercase text-fin-muted">Available Balance</p>
            <p className={`text-lg font-extrabold tabular-nums ${insufficient ? 'text-fin-danger' : 'text-fin-emerald'}`}>{money(balance)}</p>
          </div>
          <div className="rounded-xl bg-fin-elevated border border-fin-border p-3">
            <p className="text-[11px] uppercase text-fin-muted">Required Capital</p>
            <p className="text-lg font-extrabold tabular-nums">{money(value)}</p>
          </div>
        </div>

        <div>
          <label htmlFor="invest-amount" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Investment Amount</label>
          <input
            id="invest-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl bg-fin-bg border border-fin-border px-4 py-3 text-white tabular-nums focus:border-fin-emerald outline-none" />
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button key={pct} onClick={() => setAmount(String(Math.floor(balance * (pct / 100) * 100) / 100))}
                className="flex-1 py-1.5 rounded-md text-xs font-bold fin-card hover:border-fin-emerald/40 transition-colors">
                {pct === 100 ? 'MAX' : `${pct}%`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-fin-muted mt-2">
            Limits: {money(Number(plan.min_deposit))} – {money(Number(plan.max_deposit))} · {plan.duration_days}-day term
          </p>
        </div>

        <div className="rounded-xl border border-fin-emerald/25 bg-fin-emerald-soft p-4 space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-fin-muted">Projected daily payout</span><span className="font-bold text-fin-emerald tabular-nums">{money(dailyPayout)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-fin-muted">Total return at maturity</span><span className="font-bold text-fin-emerald tabular-nums">{money(totalReturn)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-fin-muted">Principal + yield</span><span className="font-bold tabular-nums">{money(value + totalReturn)}</span></div>
        </div>

        {insufficient ? (
          <div className="space-y-3">
            <p className="text-sm text-fin-danger font-semibold">Insufficient wallet balance for this allocation.</p>
            <button onClick={onDeposit} className="w-full py-3 rounded-xl bg-fin-emerald text-black font-bold text-sm">Deposit Funds</button>
          </div>
        ) : (
          <button
            onClick={confirm}
            disabled={busy || outOfBounds || value <= 0}
            className="w-full py-3 rounded-xl bg-fin-emerald text-black font-bold text-sm disabled:opacity-40">
            {busy ? 'Processing…' : outOfBounds ? 'Amount outside plan limits' : 'Confirm Investment'}
          </button>
        )}
      </div>
    </Modal>
  );
}
