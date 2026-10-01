import React, { useEffect, useMemo, useState } from "react";
import Link from "@/components/SmartLink";
import { supabase } from "@/lib/supabase/client";

interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  image_url: string | null;
  entry_fee: number;
  ends_at: string;
  max_entries: number;
  entries_count: number;
  badge: string;
  sort_order: number;
  is_active: boolean;
}

interface Entry {
  id: string;
  giveaway_id: string;
  user_id: string;
  giveaway_title: string;
  amount_paid: number;
  status: string;
  created_at: string;
}
const EMPTY = {
  title: "",
  description: "",
  prize: "",
  image_url: "",
  entry_fee: 200,
  ends_at: "2026-12-31",
  max_entries: 1000,
  entries_count: 0,
  badge: "$200 ENTRY",
  is_active: true,
};
const inputClass =
  "w-full px-3 py-2.5 rounded text-sm bg-background border border-border text-foreground placeholder-[#52525B] focus:border-emerald-500/40 focus:outline-none transition-colors";
const labelClass = "block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5";

const money = (n: number) => `$${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function AdminGiveawaysPage() {
  const [items, setItems] = useState<Giveaway[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email: string; full_name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Giveaway | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entrantsFor, setEntrantsFor] = useState<string | null>(null);

  async function load() {
    const [giveawayRes, entryRes, profileRes] = await Promise.all([
      supabase.from("giveaways").select("*").order("sort_order", { ascending: true }),
      supabase.from("giveaway_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("user_profiles").select("id, email, full_name"),
    ]);
    if (giveawayRes.error) setError(giveawayRes.error.message);
    setItems((giveawayRes.data as Giveaway[]) ?? []);
    setEntries((entryRes.data as Entry[]) ?? []);
    const map: Record<string, { email: string; full_name: string }> = {};
    for (const p of (profileRes.data ?? []) as { id: string; email: string; full_name: string }[]) {
      map[p.id] = { email: p.email, full_name: p.full_name };
    }
    setProfiles(map);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(
    () => ({
      count: items.length,
      active: items.filter((g) => g.is_active).length,
      entries: items.reduce((s, g) => s + g.entries_count, 0),
      revenue: entries.reduce((s, e) => s + Number(e.amount_paid), 0),
    }),
    [items, entries],
  );

  function startCreate() {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
  }

  function startEdit(g: Giveaway) {
    setCreating(false);
    setEditing(g);
    setForm({
      title: g.title,
      description: g.description,
      prize: g.prize,
      image_url: g.image_url ?? "",
      entry_fee: Number(g.entry_fee),
      ends_at: g.ends_at.slice(0, 10),
      max_entries: g.max_entries,
      badge: g.badge,
      is_active: g.is_active,
      entries_count: g.entries_count ?? 0,
    });
  }

  async function save() {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      prize: form.prize,
      image_url: form.image_url || null,
      entry_fee: Number(form.entry_fee) || 0,
      ends_at: new Date(form.ends_at).toISOString(),
      max_entries: Number(form.max_entries) || 1000,
      entries_count: Math.max(0, Number(form.entries_count) || 0),
      badge: form.badge || (Number(form.entry_fee) > 0 ? `${money(Number(form.entry_fee))} ENTRY` : "FREE ENTRY"),
      is_active: form.is_active,
    };
    const res = editing
      ? await supabase.from("giveaways").update(payload).eq("id", editing.id)
      : await supabase.from("giveaways").insert({ ...payload, sort_order: items.length + 1 });
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setEditing(null);
    setCreating(false);
    await load();
  }

  async function toggleActive(g: Giveaway) {
    await supabase.from("giveaways").update({ is_active: !g.is_active }).eq("id", g.id);
    await load();
  }

  async function remove(g: Giveaway) {
    if (!confirm(`Delete "${g.title}"? Entries for this campaign will also be removed.`)) return;
    await supabase.from("giveaways").delete().eq("id", g.id);
    await load();
  }

  async function move(g: Giveaway, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === g.id);
    const other = items[idx + dir];
    if (!other) return;
    await Promise.all([
      supabase.from("giveaways").update({ sort_order: other.sort_order }).eq("id", g.id),
      supabase.from("giveaways").update({ sort_order: g.sort_order }).eq("id", other.id),
    ]);
    await load();
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Admin
        </Link>

        <div className="mt-4 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Giveaway Management</h1>
            <p className="text-sm text-muted-foreground">
              Every campaign here is live on the homepage and paid for from the investor wallet balance automatically.
            </p>
          </div>
          <button
            onClick={startCreate}
            className="px-5 py-2.5 bg-emerald-500 text-black text-xs font-bold rounded tracking-widest uppercase hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            + New Giveaway
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Campaigns", value: String(totals.count) },
            { label: "Active", value: String(totals.active) },
            { label: "Total Entries", value: totals.entries.toLocaleString() },
            { label: "Entry Fees Collected", value: money(totals.revenue) },
          ].map((k) => (
            <div key={k.label} className="bg-card border border-border rounded p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{k.label}</p>
              <p className="text-xl font-extrabold text-foreground tabular-nums">{k.value}</p>
            </div>
          ))}
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {(creating || editing) && (
          <div className="bg-card border border-emerald-500/20 rounded p-6 mb-8">
            <h2 className="text-sm font-bold mb-5">{editing ? `Edit: ${editing.title}` : "New Giveaway Campaign"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Win a 2025 Model Y"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Prize</label>
                <input
                  className={inputClass}
                  value={form.prize}
                  onChange={(e) => setForm({ ...form, prize: e.target.value })}
                  placeholder="2025 Tesla Model Y RWD"
                />
              </div>
              <div>
                <label className={labelClass}>Image URL (optional)</label>
                <input
                  className={inputClass}
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className={labelClass}>Entry Fee (USD, charged to wallet)</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.entry_fee}
                  onChange={(e) => setForm({ ...form, entry_fee: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={labelClass}>Badge</label>
                <input
                  className={inputClass}
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="$200 ENTRY"
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Max Entries</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={form.max_entries}
                  onChange={(e) => setForm({ ...form, max_entries: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={labelClass}>Base entries (floor)</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.entries_count}
                  onChange={(e) => setForm({ ...form, entries_count: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className={labelClass}>Active</span>
                <button
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? "bg-emerald-500" : "bg-muted"}`}
                  aria-pressed={form.is_active}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-500 text-black text-xs font-bold rounded tracking-widest uppercase disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Giveaway"}
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                className="px-5 py-2.5 bg-muted border border-border text-muted-foreground text-xs font-bold rounded tracking-widest uppercase hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading giveaways…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No giveaways yet. Create one to have it appear on the homepage.</p>
        ) : (
          <div className="space-y-4">
            {items.map((g, idx) => {
              const pct = Math.min(100, Math.round((g.entries_count / Math.max(1, g.max_entries)) * 100));
              const list = entries.filter((e) => e.giveaway_id === g.id);
              return (
                <div key={g.id} className="bg-card border border-border rounded p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold">{g.title}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {g.badge}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${g.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}
                        >
                          {g.is_active ? "Active" : "Hidden"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {g.prize} · Entry {money(Number(g.entry_fee))} · Ends {new Date(g.ends_at).toLocaleDateString()}
                      </p>
                      <div className="max-w-md">
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                          <span>{g.entries_count.toLocaleString()} entries</span>
                          <span>
                            {pct}% of {g.max_entries.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => move(g, -1)}
                        disabled={idx === 0}
                        className="px-2.5 py-1.5 bg-muted text-muted-foreground text-xs rounded disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(g, 1)}
                        disabled={idx === items.length - 1}
                        className="px-2.5 py-1.5 bg-muted text-muted-foreground text-xs rounded disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEntrantsFor(entrantsFor === g.id ? null : g.id)}
                        className="px-3 py-1.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold rounded"
                      >
                        Entrants ({list.length})
                      </button>
                      <button
                        onClick={() => toggleActive(g)}
                        className="px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-semibold rounded"
                      >
                        {g.is_active ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => startEdit(g)}
                        className="px-3 py-1.5 bg-zinc-300/10 border border-zinc-300/20 text-zinc-300 text-xs font-semibold rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(g)}
                        className="px-3 py-1.5 bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-semibold rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {entrantsFor === g.id && (
                    <div className="mt-5 border-t border-border pt-4">
                      {list.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No entrants yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-muted-foreground uppercase tracking-wider">
                                <th className="py-2 pr-4 font-semibold">Entrant</th>
                                <th className="py-2 pr-4 font-semibold">Paid</th>
                                <th className="py-2 pr-4 font-semibold">Status</th>
                                <th className="py-2 font-semibold">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map((e) => (
                                <tr key={e.id} className="border-t border-border">
                                  <td className="py-2 pr-4">
                                    {profiles[e.user_id]?.full_name || profiles[e.user_id]?.email || e.user_id}
                                  </td>
                                  <td className="py-2 pr-4 tabular-nums text-emerald-400">
                                    {money(Number(e.amount_paid))}
                                  </td>
                                  <td className="py-2 pr-4 uppercase">{e.status}</td>
                                  <td className="py-2 text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
