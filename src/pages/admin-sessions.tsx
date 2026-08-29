import React, { useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import { supabase } from '@/lib/supabase/client';

interface Booking {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  session_type: string;
  preferred_date: string | null;
  preferred_time: string | null;
  topics: string | null;
  payment_method: string;
  payment_status: string;
  amount: number;
  crypto_tx_hash: string | null;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = ['pending', 'paid', 'confirmed', 'completed', 'cancelled'];

const inputClass =
  'w-full px-3 py-2.5 rounded-lg text-sm bg-[#050507] border border-[#12131A] text-white placeholder-[#52525B] focus:border-emerald-500/40 focus:outline-none transition-colors';
const labelClass = 'block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1.5';

const statusColor = (s: string) =>
  s === 'paid' || s === 'confirmed' || s === 'completed'
    ? 'bg-emerald-500/10 text-emerald-400'
    : s === 'cancelled'
      ? 'bg-red-500/10 text-red-400'
      : 'bg-amber-500/10 text-amber-400';

export default function AdminSessionsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error: e } = await supabase
      .from('session_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (e) setError(e.message);
    setRows((data as Booking[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () => (filter === 'All' ? rows : rows.filter((r) => r.payment_status === filter)),
    [rows, filter],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    const { id, ...rest } = editing;
    const { error: uErr } = await supabase
      .from('session_bookings')
      .update({
        full_name: rest.full_name,
        email: rest.email,
        phone: rest.phone,
        session_type: rest.session_type,
        preferred_date: rest.preferred_date,
        preferred_time: rest.preferred_time,
        topics: rest.topics,
        payment_method: rest.payment_method,
        payment_status: rest.payment_status,
        amount: rest.amount,
        crypto_tx_hash: rest.crypto_tx_hash,
        admin_notes: rest.admin_notes,
      })
      .eq('id', id);
    if (uErr) setError(uErr.message);
    else {
      await load();
      setEditing(null);
    }
    setSaving(false);
  }

  async function setStatus(b: Booking, status: string) {
    await supabase.from('session_bookings').update({ payment_status: status }).eq('id', b.id);
    await load();
  }

  async function remove(b: Booking) {
    if (!window.confirm(`Delete booking for ${b.full_name}?`)) return;
    const { error: e } = await supabase.from('session_bookings').delete().eq('id', b.id);
    if (e) setError(e.message);
    await load();
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-[10px] font-bold uppercase tracking-widest text-[#666] hover:text-white transition-colors"
          >
            ← Admin
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2">Session Bookings</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Review, reschedule, update payment status and annotate every advisory session request.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {['All', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === s
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[#0D0E12] border border-slate-800/80 text-[#A1A1AA] hover:text-white'
              }`}
            >
              {s}
              <span className="ml-2 text-[10px] opacity-70">
                {s === 'All' ? rows.length : rows.filter((r) => r.payment_status === s).length}
              </span>
            </button>
          ))}
        </div>

        {editing && (
          <form onSubmit={save} className="mb-8 p-6 rounded-2xl bg-[#0D0E12] border border-slate-800/80">
            <h2 className="text-sm font-bold mb-5">Edit booking — {editing.full_name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Full name</label>
                <input className={inputClass} value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Session type</label>
                <input className={inputClass} value={editing.session_type} onChange={(e) => setEditing({ ...editing, session_type: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Preferred date</label>
                <input className={inputClass} value={editing.preferred_date ?? ''} onChange={(e) => setEditing({ ...editing, preferred_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Preferred time</label>
                <input className={inputClass} value={editing.preferred_time ?? ''} onChange={(e) => setEditing({ ...editing, preferred_time: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Amount ($)</label>
                <input type="number" step="0.01" className={inputClass} value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Payment method</label>
                <input className={inputClass} value={editing.payment_method} onChange={(e) => setEditing({ ...editing, payment_method: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Payment status</label>
                <select className={inputClass} value={editing.payment_status} onChange={(e) => setEditing({ ...editing, payment_status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Transaction hash</label>
                <input className={inputClass} value={editing.crypto_tx_hash ?? ''} onChange={(e) => setEditing({ ...editing, crypto_tx_hash: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Topics</label>
                <textarea rows={2} className={inputClass} value={editing.topics ?? ''} onChange={(e) => setEditing({ ...editing, topics: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Admin notes</label>
                <textarea rows={2} className={inputClass} value={editing.admin_notes ?? ''} onChange={(e) => setEditing({ ...editing, admin_notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-lg border border-slate-800/80 text-[#A1A1AA] text-xs font-bold uppercase tracking-widest hover:text-white">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-[#A1A1AA]">Loading bookings…</p>
        ) : (
          <div className="space-y-3">
            {visible.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-[#0D0E12] border border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{b.full_name}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor(b.payment_status)}`}>
                      {b.payment_status}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    {b.email} · {b.session_type}
                  </p>
                  {b.admin_notes && <p className="text-xs text-[#5c6470] mt-1">Note: {b.admin_notes}</p>}
                </div>
                <div className="text-xs text-[#A1A1AA] grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                  <span>
                    Date <b className="text-white">{b.preferred_date || '—'}</b>
                  </span>
                  <span>
                    Time <b className="text-white">{b.preferred_time || '—'}</b>
                  </span>
                  <span>
                    Amount <b className="text-emerald-400">${Number(b.amount).toLocaleString()}</b>
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={b.payment_status}
                    onChange={(e) => setStatus(b, e.target.value)}
                    className="px-2 py-1.5 rounded border border-slate-800/80 bg-[#050507] text-xs text-[#A1A1AA]"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setEditing(b)} className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    Edit
                  </button>
                  <button onClick={() => remove(b)} className="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {visible.length === 0 && <p className="text-sm text-[#A1A1AA]">No bookings in this view.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
