import React, { useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import { supabase } from '@/lib/supabase/client';

interface Plan {
  id: string;
  name: string;
  category: string;
  description: string;
  daily_roi: number;
  duration_days: number;
  min_deposit: number;
  max_deposit: number;
  is_active: boolean;
  sort_order: number;
}

const EMPTY = {
  name: '',
  category: 'Solar',
  description: '',
  daily_roi: 1,
  duration_days: 30,
  min_deposit: 500,
  max_deposit: 10000,
  is_active: true,
};

const CATEGORIES = ['Solar', 'Robotics', 'Space', 'Energy', 'Vehicles'];

const inputClass =
  'w-full px-3 py-2.5 rounded-lg text-sm bg-[#050507] border border-[#12131A] text-white placeholder-[#52525B] focus:border-emerald-500/40 focus:outline-none transition-colors';
const labelClass = 'block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1.5';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error: e } = await supabase
      .from('investment_plans')
      .select('*')
      .order('sort_order', { ascending: true });
    if (e) setError(e.message);
    setPlans((data as Plan[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () => (filter === 'All' ? plans : plans.filter((p) => p.category === filter)),
    [plans, filter],
  );

  function openCreate() {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function openEdit(p: Plan) {
    setForm({
      name: p.name,
      category: p.category,
      description: p.description,
      daily_roi: Number(p.daily_roi),
      duration_days: p.duration_days,
      min_deposit: Number(p.min_deposit),
      max_deposit: Number(p.max_deposit),
      is_active: p.is_active,
    });
    setEditing(p);
    setCreating(false);
    setError(null);
  }

  function close() {
    setEditing(null);
    setCreating(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { error: uErr } = await supabase
          .from('investment_plans')
          .update(form)
          .eq('id', editing.id);
        if (uErr) throw uErr;
      } else {
        const nextOrder = plans.length ? Math.max(...plans.map((p) => p.sort_order)) + 1 : 1;
        const { error: iErr } = await supabase
          .from('investment_plans')
          .insert({ ...form, sort_order: nextOrder });
        if (iErr) throw iErr;
      }
      await load();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Plan) {
    await supabase.from('investment_plans').update({ is_active: !p.is_active }).eq('id', p.id);
    await load();
  }

  async function remove(p: Plan) {
    if (!window.confirm(`Delete plan "${p.name}"? Existing investments keep their snapshot.`)) return;
    const { error: e } = await supabase.from('investment_plans').delete().eq('id', p.id);
    if (e) setError(e.message);
    await load();
  }

  async function move(p: Plan, dir: -1 | 1) {
    const ordered = [...plans].sort((a, b) => a.sort_order - b.sort_order);
    const idx = ordered.findIndex((x) => x.id === p.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from('investment_plans').update({ sort_order: swap.sort_order }).eq('id', p.id),
      supabase.from('investment_plans').update({ sort_order: p.sort_order }).eq('id', swap.id),
    ]);
    await load();
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <Link
              href="/admin"
              className="text-[10px] font-bold uppercase tracking-widest text-[#666] hover:text-white transition-colors"
            >
              ← Admin
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight mt-2">Investment Packages</h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Create, edit, reorder and retire every investment plan offered on the platform.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest transition-colors"
          >
            + New Plan
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {['All', ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === c
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[#0D0E12] border border-slate-800/80 text-[#A1A1AA] hover:text-white'
              }`}
            >
              {c}
              <span className="ml-2 text-[10px] opacity-70">
                {c === 'All' ? plans.length : plans.filter((p) => p.category === c).length}
              </span>
            </button>
          ))}
        </div>

        {(creating || editing) && (
          <form
            onSubmit={save}
            className="mb-8 p-6 rounded-2xl bg-[#0D0E12] border border-slate-800/80"
          >
            <h2 className="text-sm font-bold mb-5">{editing ? `Edit — ${editing.name}` : 'New Plan'}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Plan name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Daily ROI (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.daily_roi}
                  onChange={(e) => setForm({ ...form, daily_roi: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Duration (days)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Minimum deposit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.min_deposit}
                  onChange={(e) => setForm({ ...form, min_deposit: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Maximum deposit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.max_deposit}
                  onChange={(e) => setForm({ ...form, max_deposit: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Visible to investors
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create plan'}
              </button>
              <button
                type="button"
                onClick={close}
                className="px-5 py-2.5 rounded-lg border border-slate-800/80 text-[#A1A1AA] text-xs font-bold uppercase tracking-widest hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-[#A1A1AA]">Loading plans…</p>
        ) : (
          <div className="space-y-3">
            {visible.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-[#0D0E12] border border-slate-800/80 flex flex-wrap gap-4 items-center justify-between"
              >
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{p.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                      {p.category}
                    </span>
                    {!p.is_active && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-400">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-1 max-w-xl">{p.description}</p>
                </div>
                <div className="text-xs text-[#A1A1AA] grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                  <span>
                    ROI <b className="text-emerald-400">{Number(p.daily_roi)}%/d</b>
                  </span>
                  <span>
                    Term <b className="text-white">{p.duration_days}d</b>
                  </span>
                  <span>
                    Min <b className="text-white">${Number(p.min_deposit).toLocaleString()}</b>
                  </span>
                  <span>
                    Max <b className="text-white">${Number(p.max_deposit).toLocaleString()}</b>
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => move(p, -1)} className="px-2.5 py-1.5 rounded border border-slate-800/80 text-xs text-[#A1A1AA] hover:text-white">↑</button>
                  <button onClick={() => move(p, 1)} className="px-2.5 py-1.5 rounded border border-slate-800/80 text-xs text-[#A1A1AA] hover:text-white">↓</button>
                  <button onClick={() => toggleActive(p)} className="px-3 py-1.5 rounded border border-slate-800/80 text-xs font-semibold text-[#A1A1AA] hover:text-white">
                    {p.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => openEdit(p)} className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    Edit
                  </button>
                  <button onClick={() => remove(p)} className="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <p className="text-sm text-[#A1A1AA]">No plans in this category yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
