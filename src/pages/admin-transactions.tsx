import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Txn {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  payment_method: string | null;
  reference: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
}

const money = (n: number) =>
  `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPES = ['all', 'deposit', 'withdrawal', 'investment', 'return', 'adjustment'] as const;
const STATUSES = ['all', 'pending', 'completed', 'failed', 'rejected'] as const;

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState<Txn[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data } = await supabase
      .from('balance_transactions')
      .select('id,user_id,type,amount,status,description,payment_method,reference,created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    const list = (data ?? []) as unknown as Txn[];
    setRows(list);

    const ids = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from('user_profiles')
        .select('id,email,full_name')
        .in('id', ids);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balance_transactions' }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (type !== 'all' && r.type !== type) return false;
      if (status !== 'all' && r.status !== status) return false;
      if (!needle) return true;
      const p = profiles[r.user_id];
      return (
        r.reference?.toLowerCase().includes(needle) ||
        r.description?.toLowerCase().includes(needle) ||
        p?.email?.toLowerCase().includes(needle) ||
        p?.full_name?.toLowerCase().includes(needle)
      );
    });
  }, [rows, type, status, q, profiles]);

  const totals = useMemo(() => {
    const t = { in: 0, out: 0 };
    filtered.forEach((r) => { if (r.amount >= 0) t.in += Number(r.amount); else t.out += Number(r.amount); });
    return t;
  }, [filtered]);

  return (
    <div className="px-5 sm:px-8 py-8 sm:py-10 max-w-[1400px] mx-auto">
      <header className="mb-8">
        <p className="fin-label text-[10px] text-fin-muted">Administration</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Transactions</h1>
        <p className="mt-2 text-sm text-fin-muted">Every ledger movement across deposits, withdrawals, plans and returns.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          ['Entries', String(filtered.length)],
          ['Credits', money(totals.in)],
          ['Debits', money(totals.out)],
        ].map(([label, value]) => (
          <div key={label} className="fin-card rounded-2xl p-5">
            <div className="fin-label text-[10px] text-fin-muted">{label}</div>
            <div className="fin-figure mt-1.5 text-xl font-extrabold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search user, reference or note"
          className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl border border-fin-border bg-[var(--surface-1)] text-sm text-foreground placeholder:text-fin-muted focus:outline-none focus:border-primary/50"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2.5 rounded-xl border border-fin-border bg-[var(--surface-1)] text-xs font-semibold uppercase tracking-widest text-foreground">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-fin-border bg-[var(--surface-1)] text-xs font-semibold uppercase tracking-widest text-foreground">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => void load()} className="px-4 py-2.5 rounded-xl border border-fin-border text-xs font-bold uppercase tracking-widest text-fin-muted hover:text-foreground transition-colors">
          Refresh
        </button>
      </div>

      <div className="fin-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fin-border">
                {['Date', 'Investor', 'Type', 'Amount', 'Status', 'Reference'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 fin-label text-[10px] text-fin-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-fin-muted text-sm">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-fin-muted text-sm">No transactions match these filters.</td></tr>
              )}
              {filtered.map((r) => {
                const p = profiles[r.user_id];
                return (
                  <tr key={r.id} className="border-b border-fin-border/60 last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-fin-muted text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-foreground font-semibold text-[13px]">{p?.full_name || '—'}</div>
                      <div className="text-fin-muted text-[11px]">{p?.email || r.user_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg border border-fin-border text-[10px] font-bold uppercase tracking-widest text-fin-muted">{r.type}</span>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap fin-figure font-bold ${Number(r.amount) >= 0 ? 'text-fin-emerald' : 'text-primary'}`}>
                      {money(Number(r.amount))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-fin-muted">{r.status}</td>
                    <td className="px-4 py-3 text-xs text-fin-muted max-w-[280px] truncate">{r.reference || r.description || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
