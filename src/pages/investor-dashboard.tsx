import React, { lazy, useCallback, useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import { useNavigate } from '@tanstack/react-router';
import { createClient } from '@/lib/supabase/client';
import InvestorShell from '@/components/investor/InvestorShell';
import { Modal } from '@/components/investor/modals';
import { WithdrawModal } from '@/components/investor/WithdrawModal';
import { EMPTY_WALLET, money, toWallet, type Wallet } from '@/components/investor/wallet';
import PlanCard, { type InvestmentPlan as SharedPlan } from '@/components/investment/planCard';
import { sendInvestmentPurchasedEmail } from '@/lib/emailService';
import { STATUS_LABEL, type OrderStatus } from '@/lib/inventory.functions';
import { resolveInventoryImageUrl } from '@/lib/inventoryImages';

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

interface InventoryOrderRow {
  id: string;
  order_number: string;
  item_name: string;
  item_category: string | null;
  item_image: string | null;
  amount: number;
  payment_method: string;
  order_status: OrderStatus;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
}

interface GiveawayEntry {
  id: string;
  giveaway_title: string;
  amount_paid: number;
  status: string;
  tracking_number?: string | null;
  created_at: string;
}

const ORDER_STEPS: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered'];

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-foreground text-background border-foreground',
  paid: 'bg-foreground text-background border-foreground',
  delivered: 'bg-foreground text-background border-foreground',
  claimed_fedex_queue: 'bg-foreground text-background border-foreground',
  pending: 'bg-amber-500/12 text-amber-500 border-amber-500/30',
  pending_payment: 'bg-amber-500/12 text-amber-500 border-amber-500/30',
  pending_shipping_verification: 'bg-amber-500/12 text-amber-500 border-amber-500/30',
  processing: 'bg-muted text-foreground border-border',
  shipped: 'bg-muted text-foreground border-border',
  failed: 'bg-[#e82127]/12 text-[#e82127] border-[#e82127]/30',
  rejected: 'bg-[#e82127]/12 text-[#e82127] border-[#e82127]/30',
  cancelled: 'bg-[#e82127]/12 text-[#e82127] border-[#e82127]/30',
};

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  investment: 'Plan Purchase',
  purchase: 'Inventory Purchase',
  yield: 'Yield Payout',
  return: 'Yield Payout',
  withdrawal: 'Withdrawal',
  giveaway: 'Giveaway Freight Dispatch',
};

type Range = '7d' | '1m' | '1y' | 'all';

export default function InvestorDashboard() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [wallet, setWallet] = useState<Wallet>(EMPTY_WALLET);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [orders, setOrders] = useState<InventoryOrderRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [giveawayEntries, setGiveawayEntries] = useState<GiveawayEntry[]>([]);
  const [tab, setTab] = useState<'active' | 'browse'>('active');
  const [range, setRange] = useState<Range>('1m');
  const [view, setView] = useState<'portfolio' | 'account'>('portfolio');

  const navigate = useNavigate();
  const goDeposit = useCallback(() => {
    void navigate({ to: '/account/deposit' });
  }, [navigate]);
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

    await supabase.rpc('accrue_investments', { _user_id: user.id });

    const [balanceRes, plansRes, investmentsRes, ordersRes, ledgerRes, entriesRes] =
      await Promise.all([
        supabase.from('user_balance').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('investment_plans').select('*').eq('is_active', true).order('sort_order'),
        supabase
          .from('user_investments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('inventory_orders')
          .select(
            'id,order_number,item_name,item_category,item_image,amount,payment_method,order_status,tracking_number,notes,created_at',
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('balance_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('giveaway_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

    if (balanceRes.data) {
      setWallet(toWallet(balanceRes.data as Record<string, unknown>));
    } else {
      await supabase.from('user_balance').insert({ user_id: user.id });
      setWallet(EMPTY_WALLET);
    }

    setPlans((plansRes.data ?? []) as Plan[]);
    setContracts((investmentsRes.data ?? []) as Contract[]);
    setOrders((ordersRes.data ?? []) as InventoryOrderRow[]);
    setLedger((ledgerRes.data ?? []) as LedgerRow[]);
    setGiveawayEntries((entriesRes.data ?? []) as GiveawayEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        () => {
          void refreshWallet(userId);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_orders', filter: `user_id=eq.${userId}` },
        () => {
          void load();
        },
      )
      .subscribe();

    const onFocus = () => {
      if (document.visibilityState === 'visible') void refreshWallet(userId);
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const poll = window.setInterval(() => {
      void refreshWallet(userId);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(poll);
    };
  }, [userId, refreshWallet, load]);

  const activeContracts = contracts.filter((c) => c.status === 'active');
  const totalActiveCapital = activeContracts.reduce((sum, c) => sum + Number(c.principal), 0);
  const totalYield =
    contracts.reduce((sum, c) => sum + Number(c.yield_earned), 0) + wallet.total_profit;

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
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Account Sign In Required
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to view your Trade Tesla wallet, vehicle orders, and portfolio telemetry.
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center px-6 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Account · Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <InvestorShell
      balance={wallet.available_balance}
      onDeposit={() => goDeposit()}
      onWithdraw={() => setWithdrawOpen(true)}
    >
      <main className="text-foreground pb-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-8 sm:py-10 space-y-8">
          {/* Studio Console Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#e82127] pulse-dot" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Trade Tesla · Account Console
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight mt-2">
                Account &amp; Portfolio
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{userEmail}</p>
            </div>

            <div className="inline-flex gap-1 p-1 rounded-[6px] bg-muted/50 border border-border self-start sm:self-auto">
              {(['portfolio', 'account'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-[4px] text-xs font-medium transition-colors ${
                    view === v
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v === 'portfolio' ? 'Portfolio & Orders' : 'Profile & Verification'}
                </button>
              ))}
            </div>
          </header>

          {view === 'account' ? (
            <React.Suspense
              fallback={<div className="h-64 rounded-[8px] bg-muted/40 animate-pulse" />}
            >
              <AccountPanel embedded />
            </React.Suspense>
          ) : (
            <>
              {/* Hero Wallet & Quick Actions Card */}
              <section className="fin-card-elevated overflow-hidden">
                <div className="px-6 py-10 sm:px-10 sm:py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Available Wallet Balance
                    </p>
                    <p className="font-display mt-2 text-4xl sm:text-6xl font-semibold tracking-tight text-foreground tabular">
                      {money(wallet.available_balance)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                      Purchase vehicles, energy &amp; solar systems directly, settle freight
                      delivery, or deploy capital into infrastructure programs.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => goDeposit()}
                      className="h-11 px-6 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Deposit Funds
                    </button>
                    <button
                      onClick={() => setWithdrawOpen(true)}
                      className="h-11 px-6 rounded-[4px] border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Withdraw
                    </button>
                    <Link
                      href="/inventory"
                      className="inline-flex items-center justify-center h-11 px-6 rounded-[4px] border border-border bg-muted/60 text-foreground text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Browse Inventory
                    </Link>
                  </div>
                </div>

                {/* 4-Column Telemetry Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-border bg-muted/20">
                  {[
                    { l: 'Active Capital', v: money(totalActiveCapital) },
                    { l: 'Net Yield Accrued', v: money(totalYield), highlight: true },
                    { l: 'Active Contracts', v: String(activeContracts.length) },
                    { l: 'Hardware Orders', v: String(orders.length) },
                  ].map((m, i) => (
                    <div
                      key={m.l}
                      className={`px-6 py-5 ${i > 0 ? 'border-t lg:border-t-0 lg:border-l border-border' : ''} ${
                        i === 1 || i === 3 ? 'border-l border-border lg:border-l' : ''
                      }`}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {m.l}
                      </div>
                      <div className="font-display mt-1.5 text-xl sm:text-2xl font-semibold tabular text-foreground">
                        {m.v}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Orders & Delivery Tracking */}
              <section className="fin-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Vehicle &amp; Hardware Fulfillment
                    </p>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5">
                      My Orders &amp; Delivery Tracking
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/account/orders"
                      className="h-9 inline-flex items-center px-4 rounded-[4px] border border-border text-xs font-medium hover:bg-muted transition-colors"
                    >
                      All Orders
                    </Link>
                    <Link
                      href="/inventory"
                      className="h-9 inline-flex items-center px-4 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Order Hardware
                    </Link>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven&apos;t placed any vehicle or hardware orders yet. Up to $2,000 off
                      is available on eligible assets for Our Heroes.
                    </p>
                    <Link
                      href="/inventory"
                      className="inline-flex h-10 items-center px-5 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Explore Vehicles &amp; Energy →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {orders.slice(0, 5).map((o) => {
                      const idx = ORDER_STEPS.indexOf(o.order_status);
                      return (
                        <div key={o.id} className="p-5 sm:p-6 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {o.item_image && (
                              <img
                                src={resolveInventoryImageUrl(o.item_image, o.item_name, o.item_category ?? undefined)}
                                alt={o.item_name}
                                className="w-16 h-12 rounded-[4px] object-cover bg-muted border border-border shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono font-semibold text-foreground">
                                  {o.order_number}
                                </span>
                                <span>·</span>
                                <span>{new Date(o.created_at).toLocaleDateString()}</span>
                                <span>·</span>
                                <span>{o.payment_method === 'wallet' ? 'Wallet' : 'Crypto / Wire'}</span>
                              </div>
                              <h3 className="font-display font-semibold text-base text-foreground truncate mt-0.5">
                                {o.item_name}
                              </h3>
                              {o.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {o.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                              <span className="font-display text-base font-semibold tabular">
                                {money(Number(o.amount))}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider border ${
                                  STATUS_STYLES[o.order_status] ??
                                  'bg-muted text-muted-foreground border-border'
                                }`}
                              >
                                {STATUS_LABEL[o.order_status] ?? o.order_status}
                              </span>
                            </div>
                          </div>

                          {o.order_status !== 'cancelled' && (
                            <div className="grid grid-cols-5 gap-1.5 pt-1">
                              {ORDER_STEPS.map((s, i) => (
                                <div key={s}>
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      i <= idx ? 'bg-foreground' : 'bg-muted'
                                    }`}
                                  />
                                  <p className="text-[10px] text-muted-foreground mt-1 truncate hidden sm:block">
                                    {STATUS_LABEL[s].replace('Awaiting payment confirmation', 'Pending')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {o.tracking_number && (
                            <p className="text-xs text-muted-foreground">
                              Carrier Tracking:{' '}
                              <span className="font-mono font-semibold text-foreground">
                                {o.tracking_number}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Chart */}
              <section className="fin-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Performance
                    </p>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5">
                      Portfolio Analytics
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Capital base plus accrued daily yield
                    </p>
                  </div>
                  <div className="inline-flex gap-1 p-1 rounded-[6px] bg-muted/50 border border-border">
                    {(['7d', '1m', '1y', 'all'] as Range[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-3 py-1.5 rounded-[4px] text-[11px] font-medium uppercase tracking-wider transition-colors ${
                          range === r
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {r === 'all' ? 'All' : r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <React.Suspense
                    fallback={<div className="h-full w-full rounded-[6px] bg-muted/40 animate-pulse" />}
                  >
                    <PortfolioChart data={chartData} />
                  </React.Suspense>
                </div>
              </section>

              {/* Active Contracts & Capital Marketplace */}
              <section id="marketplace" className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex gap-1 p-1 rounded-[6px] bg-muted/50 border border-border">
                    {(['active', 'browse'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-[4px] text-xs font-medium transition-colors ${
                          tab === t
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t === 'active'
                          ? `Active Contracts (${activeContracts.length})`
                          : 'Capital Marketplace'}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/invest"
                    className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Open Full Investment Portal →
                  </Link>
                </div>

                {tab === 'active' ? (
                  activeContracts.length === 0 ? (
                    <div className="fin-card p-10 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        No active infrastructure contracts yet.
                      </p>
                      <button
                        onClick={() => setTab('browse')}
                        className="h-10 px-5 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        Browse Capital Programs
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {activeContracts.map((c) => {
                        const started = new Date(c.started_at).getTime();
                        const matures = new Date(c.matures_at).getTime();
                        const progress = Math.min(
                          100,
                          Math.max(0, ((Date.now() - started) / (matures - started)) * 100),
                        );
                        return (
                          <article key={c.id} className="fin-card p-6">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <h3 className="font-display text-lg font-semibold tracking-tight">
                                {c.plan_name}
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider border border-border bg-muted/60 text-foreground">
                                {c.plan_category}
                              </span>
                            </div>
                            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
                              <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Principal
                                </dt>
                                <dd className="font-display mt-0.5 text-lg font-semibold tabular">
                                  {money(Number(c.principal))}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Daily ROI
                                </dt>
                                <dd className="font-display mt-0.5 text-lg font-semibold tabular">
                                  {Number(c.daily_roi).toFixed(2)}%
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Yield Earned
                                </dt>
                                <dd className="font-display mt-0.5 text-lg font-semibold tabular text-foreground">
                                  {money(Number(c.yield_earned))}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Matures
                                </dt>
                                <dd className="font-display mt-0.5 text-lg font-semibold">
                                  {new Date(c.matures_at).toLocaleDateString()}
                                </dd>
                              </div>
                            </dl>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-foreground"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                              {progress.toFixed(0)}% of {c.duration_days}-day term · Unlocks{' '}
                              {new Date(c.matures_at).toLocaleDateString()}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {plans.map((p) => (
                      <PlanCard
                        key={p.id}
                        plan={p as unknown as SharedPlan}
                        action={
                          <button
                            onClick={() => setInvestPlan(p)}
                            className="w-full h-10 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                          >
                            Deploy Capital
                          </button>
                        }
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Giveaway Claims & Delivery */}
              <section className="fin-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      Giveaway Claims &amp; Freight Dispatch
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Free promotional prize claims and enclosed FedEx freight delivery status
                    </p>
                  </div>
                  <Link
                    href="/giveaways"
                    className="h-9 inline-flex items-center px-4 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    View Giveaways
                  </Link>
                </div>
                {giveawayEntries.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No giveaway delivery claims yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="px-5 py-3 font-semibold">Campaign</th>
                          <th className="px-5 py-3 font-semibold">Waybill</th>
                          <th className="px-5 py-3 font-semibold text-right">Shipping Fee</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {giveawayEntries.map((e) => (
                          <tr key={e.id} className="border-t border-border">
                            <td className="px-5 py-3 font-medium">{e.giveaway_title}</td>
                            <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                              {e.tracking_number || 'Pending'}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold tabular">
                              {money(Number(e.amount_paid))}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase border ${
                                  STATUS_STYLES[e.status] ??
                                  'bg-muted text-muted-foreground border-border'
                                }`}
                              >
                                {e.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(e.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Transaction Ledger */}
              <section className="fin-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-border">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Transaction Ledger
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Deposits, hardware orders, giveaway delivery charges, yield payouts, and withdrawals
                  </p>
                </div>
                {ledger.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No transactions recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="px-5 py-3 font-semibold">Date / Time</th>
                          <th className="px-5 py-3 font-semibold">Activity</th>
                          <th className="px-5 py-3 font-semibold">Details</th>
                          <th className="px-5 py-3 font-semibold text-right">Amount</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((row) => (
                          <tr key={row.id} className="border-t border-border">
                            <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(row.created_at).toLocaleString()}
                            </td>
                            <td className="px-5 py-3 font-medium">
                              {TYPE_LABELS[row.type] ?? row.type}
                            </td>
                            <td className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate">
                              {row.description || '—'}
                            </td>
                            <td
                              className="px-5 py-3 text-right font-semibold tabular text-foreground"
                            >
                              {Number(row.amount) < 0 ? '-' : '+'}
                              {money(Math.abs(Number(row.amount)))}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase border ${
                                  STATUS_STYLES[row.status] ??
                                  'bg-muted text-muted-foreground border-border'
                                }`}
                              >
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
          <WithdrawModal
            balance={wallet.available_balance}
            userId={userId}
            userEmail={userEmail}
            onClose={() => setWithdrawOpen(false)}
            onDone={(msg) => {
              notify('ok', msg);
              void load();
            }}
            onError={(m) => notify('err', m)}
          />
        )}
        {investPlan && (
          <InvestModal
            plan={investPlan}
            balance={wallet.available_balance}
            onClose={() => setInvestPlan(null)}
            onDeposit={() => {
              setInvestPlan(null);
              goDeposit();
            }}
            onDone={(msg) => {
              notify('ok', msg);
              void load();
            }}
            onError={(m) => notify('err', m)}
          />
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-[100] px-5 py-3 text-sm font-semibold fin-toast ${
              toast.kind === 'ok' ? 'fin-toast-ok' : 'fin-toast-err'
            }`}
          >
            <span className="fin-toast-msg">{toast.msg}</span>
          </div>
        )}
      </main>
    </InvestorShell>
  );
}

function InvestModal({
  plan,
  balance,
  onClose,
  onDone,
  onError,
  onDeposit,
}: {
  plan: Plan;
  balance: number;
  onClose: () => void;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
  onDeposit: () => void;
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
    const { data, error } = await supabase.rpc('purchase_investment_plan', {
      _plan_id: plan.id,
      _amount: value,
    });
    setBusy(false);
    if (error) {
      onError(error.message);
      return;
    }
    const result = data as { ok: boolean; error?: string } | null;
    if (!result?.ok) {
      onError(result?.error ?? 'Purchase failed');
      return;
    }
    void sendInvestmentPurchasedEmail(value.toString()).catch(() => {});
    onDone(`${plan.name} activated with ${money(value)}`);
    onClose();
  }

  return (
    <Modal title={`Deploy Capital — ${plan.name}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[6px] bg-muted/40 border border-border p-3.5">
            <p className="text-[11px] uppercase text-muted-foreground">Available Balance</p>
            <p
              className={`font-display text-lg font-semibold tabular ${
                insufficient ? 'text-[#e82127]' : 'text-foreground'
              }`}
            >
              {money(balance)}
            </p>
          </div>
          <div className="rounded-[6px] bg-muted/40 border border-border p-3.5">
            <p className="text-[11px] uppercase text-muted-foreground">Required Capital</p>
            <p className="font-display text-lg font-semibold tabular">{money(value)}</p>
          </div>
        </div>

        <div>
          <label
            htmlFor="invest-amount"
            className="block text-xs uppercase tracking-wider text-muted-foreground mb-2"
          >
            Investment Amount
          </label>
          <input
            id="invest-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-11 px-4 rounded-[4px] border border-border bg-muted/40 text-foreground font-semibold tabular focus:border-foreground outline-none"
          />
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() =>
                  setAmount(String(Math.floor(balance * (pct / 100) * 100) / 100))
                }
                className="flex-1 py-1.5 rounded-[4px] text-xs font-medium border border-border hover:bg-muted transition-colors"
              >
                {pct === 100 ? 'MAX' : `${pct}%`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Limits: {money(Number(plan.min_deposit))} – {money(Number(plan.max_deposit))} ·{' '}
            {plan.duration_days}-day term
          </p>
        </div>

        <div className="rounded-[6px] border border-border bg-muted/40 p-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projected daily payout</span>
            <span className="font-semibold text-foreground tabular">{money(dailyPayout)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total return at maturity</span>
            <span className="font-semibold text-foreground tabular">{money(totalReturn)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-1.5">
            <span className="text-muted-foreground">Principal + yield</span>
            <span className="font-semibold tabular">{money(value + totalReturn)}</span>
          </div>
        </div>

        {insufficient ? (
          <div className="space-y-3">
            <p className="text-sm text-[#e82127] font-semibold">
              Insufficient wallet balance for this allocation.
            </p>
            <button
              onClick={onDeposit}
              className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Deposit Funds
            </button>
          </div>
        ) : (
          <button
            onClick={confirm}
            disabled={busy || outOfBounds || value <= 0}
            className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {busy
              ? 'Processing…'
              : outOfBounds
                ? 'Amount outside plan limits'
                : 'Confirm Allocation'}
          </button>
        )}
      </div>
    </Modal>
  );
}
