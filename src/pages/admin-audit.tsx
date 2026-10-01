import React, { useCallback, useEffect, useState } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 25;

interface AuditRow {
  id: string;
  user_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  amount: number | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const money = (v: number | null) =>
  v == null ? '—' : `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Complete, paginated transaction audit trail for administrators. */
export default function AdminAuditPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('transaction_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (filter) query = query.ilike('action', `%${filter}%`);
    const { data, count } = await query;
    setRows((data ?? []) as AuditRow[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, page, filter]);

  useEffect(() => { void load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-foreground tracking-tight">Audit Trail</h1>
            <p className="text-xs text-muted-foreground">Every deposit, withdrawal and balance action recorded server-side.</p>
          </div>
          <Link href="/admin" className="text-xs font-semibold text-muted-foreground hover:text-foreground">← Admin</Link>
        </div>

        <input
          value={filter}
          onChange={(e) => { setPage(0); setFilter(e.target.value); }}
          placeholder="Filter by action, e.g. withdrawal.paid"
          className="w-full md:w-96 mb-4 bg-card border border-border rounded px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />

        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['When', 'Action', 'Entity', 'Amount', 'Status', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12131A]">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-xs text-muted-foreground">Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-xs text-muted-foreground">No audit entries yet.</td></tr>
                ) : rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-bold text-foreground whitespace-nowrap">{r.action}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.entity_type}</td>
                    <td className="px-4 py-3 text-xs text-foreground tabular-nums">{money(r.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.status ?? '—'}</td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-xs truncate">
                      {r.metadata && Object.keys(r.metadata).length > 0 ? JSON.stringify(r.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded border border-border text-xs font-semibold text-muted-foreground disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {pages} · {total} entries</span>
          <button
            onClick={() => setPage((p) => ((p + 1) * PAGE_SIZE < total ? p + 1 : p))}
            disabled={(page + 1) * PAGE_SIZE >= total}
            className="px-4 py-2 rounded border border-border text-xs font-semibold text-muted-foreground disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
