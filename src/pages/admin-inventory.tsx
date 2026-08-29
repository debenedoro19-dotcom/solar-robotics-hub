import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from '@/components/SmartLink';
import { supabase } from '@/lib/supabase/client';

type Category = 'Vehicles' | 'Energy' | 'Solar' | 'Robotics';
const CATEGORIES: Category[] = ['Vehicles', 'Energy', 'Solar', 'Robotics'];
const BADGE_TYPES = ['new', 'cpo', 'energy', 'solar', 'robotics'] as const;

interface Item {
  id: string;
  name: string;
  price: string;
  badge: string;
  badge_type: string;
  category: string;
  image_url: string;
  alt: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY = {
  name: '',
  price: '',
  badge: 'NEW',
  badge_type: 'new',
  category: 'Vehicles',
  image_url: '',
  alt: '',
  is_active: true,
};

const inputClass =
  'w-full px-3 py-2.5 rounded-xl text-sm bg-[#050507] border border-[#12131A] text-white placeholder-[#52525B] focus:border-primary/40 focus:outline-none transition-colors';
const labelClass = 'block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1.5';

export default function AdminInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | Category>('All');
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data, error: e } = await supabase
      .from('inventory_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (e) setError(e.message);
    setItems((data as Item[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () => (filter === 'All' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  function openCreate() {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function openEdit(item: Item) {
    setForm({
      name: item.name,
      price: item.price,
      badge: item.badge,
      badge_type: item.badge_type,
      category: item.category,
      image_url: item.image_url,
      alt: item.alt,
      is_active: item.is_active,
    });
    setEditing(item);
    setCreating(false);
    setError(null);
  }

  function close() {
    setEditing(null);
    setCreating(false);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('inventory-images').upload(path, file, {
        cacheControl: '31536000',
        upsert: false,
      });
      if (upErr) throw upErr;
      // Bucket is private, so store a long-lived signed link visitors can load.
      const { data, error: sErr } = await supabase.storage
        .from('inventory-images')
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (sErr || !data) throw sErr ?? new Error('Could not create image link');
      setForm((f) => ({ ...f, image_url: data.signedUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { error: uErr } = await supabase
          .from('inventory_items')
          .update(form)
          .eq('id', editing.id);
        if (uErr) throw uErr;
      } else {
        const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 1;
        const { error: iErr } = await supabase
          .from('inventory_items')
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

  async function toggleActive(item: Item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)));
    await supabase.from('inventory_items').update({ is_active: !item.is_active }).eq('id', item.id);
  }

  async function remove(item: Item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await supabase.from('inventory_items').delete().eq('id', item.id);
  }

  // Reorder within the currently visible list, then persist both swapped rows.
  async function move(item: Item, dir: -1 | 1) {
    const list = visible;
    const idx = list.findIndex((i) => i.id === item.id);
    const other = list[idx + dir];
    if (!other) return;
    const a = item.sort_order;
    const b = other.sort_order;
    setItems((prev) =>
      [...prev.map((i) =>
        i.id === item.id ? { ...i, sort_order: b } : i.id === other.id ? { ...i, sort_order: a } : i,
      )].sort((x, y) => x.sort_order - y.sort_order),
    );
    await Promise.all([
      supabase.from('inventory_items').update({ sort_order: b }).eq('id', item.id),
      supabase.from('inventory_items').update({ sort_order: a }).eq('id', other.id),
    ]);
  }

  async function recategorize(item: Item, category: string) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, category } : i)));
    await supabase.from('inventory_items').update({ category }).eq('id', item.id);
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <Link href="/admin" className="text-xs text-[#71717A] hover:text-primary transition-colors">
              ← Admin overview
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tighter mt-2">Inventory Editor</h1>
            <p className="text-sm text-[#71717A] mt-1">
              Add, edit, reorder, recategorize and hide the products shown on the homepage.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity min-h-[44px]">
            + New item
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === c
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-[#0D0E12] text-[#A1A1AA] border border-[#12131A] hover:text-white'
              }`}>
              {c}
              <span className="ml-2 text-xs opacity-60">
                {c === 'All' ? items.length : items.filter((i) => i.category === c).length}
              </span>
            </button>
          ))}
        </div>

        {error && !creating && !editing && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-[#71717A]">Loading inventory…</p>
        ) : (
          <div className="space-y-2">
            {visible.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[#12131A] bg-[#0D0E12] p-3">
                <div className="flex flex-col gap-1">
                  <button
                    aria-label={`Move ${item.name} up`}
                    disabled={idx === 0}
                    onClick={() => void move(item, -1)}
                    className="w-7 h-6 rounded-xl bg-[#12131A] text-[#A1A1AA] text-xs hover:text-white disabled:opacity-30">
                    ↑
                  </button>
                  <button
                    aria-label={`Move ${item.name} down`}
                    disabled={idx === visible.length - 1}
                    onClick={() => void move(item, 1)}
                    className="w-7 h-6 rounded-xl bg-[#12131A] text-[#A1A1AA] text-xs hover:text-white disabled:opacity-30">
                    ↓
                  </button>
                </div>
                <img
                  src={item.image_url}
                  alt=""
                  className="w-20 h-14 object-cover rounded-xl bg-[#12131A] flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-bold leading-tight">{item.name}</p>
                  <p className="text-xs text-emerald-400 font-semibold">{item.price}</p>
                </div>
                <select
                  aria-label={`Category for ${item.name}`}
                  value={item.category}
                  onChange={(e) => void recategorize(item, e.target.value)}
                  className="px-2 py-1.5 rounded-xl text-xs bg-[#050507] border border-[#12131A] text-white">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void toggleActive(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    item.is_active
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#12131A] text-[#71717A] border-[#1E2027]'
                  }`}>
                  {item.is_active ? 'Live' : 'Hidden'}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#12131A] border border-[#12131A] text-white hover:border-primary/40">
                  Edit
                </button>
                <button
                  onClick={() => void remove(item)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10">
                  Delete
                </button>
              </div>
            ))}
            {visible.length === 0 && (
              <p className="text-sm text-[#71717A]">No items in this category yet.</p>
            )}
          </div>
        )}
      </div>

      {(creating || editing) && (
        <div
          className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm px-4 py-10"
          role="dialog"
          aria-modal="true">
          <form
            onSubmit={save}
            className="w-full max-w-lg rounded-3xl border border-[#12131A] bg-[#0D0E12] p-6 space-y-4">
            <h2 className="text-lg font-extrabold tracking-tight">
              {editing ? 'Edit item' : 'New inventory item'}
            </h2>

            <div>
              <label className={labelClass} htmlFor="inv-name">Name</label>
              <input id="inv-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="inv-price">Price label</label>
                <input id="inv-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="$79,990" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="inv-cat">Category</label>
                <select id="inv-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="inv-badge">Badge text</label>
                <input id="inv-badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="inv-badgetype">Badge style</label>
                <select id="inv-badgetype" value={form.badge_type} onChange={(e) => setForm({ ...form, badge_type: e.target.value })} className={inputClass}>
                  {BADGE_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="inv-image">Image URL</label>
              <input id="inv-image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://… or /assets/…" className={inputClass} />
              <div className="flex items-center gap-3 mt-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadImage(f);
                  }}
                  className="text-xs text-[#A1A1AA] file:mr-3 file:px-3 file:py-1.5 file:rounded-xl file:border-0 file:bg-[#12131A] file:text-white file:text-xs"
                />
                {uploading && <span className="text-xs text-[#A1A1AA]">Uploading…</span>}
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="" className="mt-3 w-full h-40 object-cover rounded-xl bg-[#12131A]" />
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="inv-alt">Image alt text</label>
              <input id="inv-alt" value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} className={inputClass} />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#D4D4D8]">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Visible on the site
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create item'}
              </button>
              <button type="button" onClick={close} className="px-5 py-3 rounded-xl text-sm font-bold border border-[#12131A] text-[#D4D4D8] hover:text-white">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
