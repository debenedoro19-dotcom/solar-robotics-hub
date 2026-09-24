import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { createClient } from '@/lib/supabase/client';
import { adminUpdateOrder, ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from '@/lib/inventory.functions';

type Order = {
  id: string; order_number: string; item_name: string; amount: number; payment_method: string;
  payment_proof_url: string | null; tx_reference: string | null; order_status: OrderStatus;
  full_name: string; email: string; phone: string; address_line: string; city: string; state: string;
  postal_code: string; country: string; notes: string | null; tracking_number: string | null; created_at: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const update = useServerFn(adminUpdateOrder);

  const load = useCallback(async () => {
    const { data } = await createClient().from('inventory_orders').select('*').order('created_at', { ascending: false }).limit(300);
    setOrders((data as Order[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
    const supabase = createClient();
    const ch = supabase.channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_orders' }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const shown = filter === 'all' ? orders : orders.filter((o) => o.order_status === filter);

  return (
    <div className="p-6 max-w-6xl mx-auto text-foreground">
      <h1 className="text-2xl font-extrabold mb-1">Inventory orders</h1>
      <p className="text-sm text-muted-foreground mb-5">Confirm payments and move orders through shipping. Customers are emailed at every status change; cancelling a wallet order refunds their balance.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', ...ORDER_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]} ({s === 'all' ? orders.length : orders.filter((o) => o.order_status === s).length})
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {shown.length === 0 && <p className="text-muted-foreground text-sm">No orders.</p>}
        {shown.map((o) => <OrderCard key={o.id} o={o} update={update} />)}
      </div>
    </div>
  );
}

function OrderCard({ o, update }: { o: Order; update: ReturnType<typeof useServerFn<typeof adminUpdateOrder>> }) {
  const [status, setStatus] = useState<OrderStatus>(o.order_status);
  const [tracking, setTracking] = useState(o.tracking_number ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function viewProof() {
    if (!o.payment_proof_url) return;
    const { data } = await createClient().storage.from('deposit-proofs').createSignedUrl(o.payment_proof_url, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  }

  async function save() {
    if (status === 'cancelled' && !confirm('Cancel this order? Wallet payments are refunded.')) return;
    setBusy(true); setMsg('');
    const r = await update({ data: { id: o.id, status, tracking: tracking || undefined, notes: note || undefined } });
    setBusy(false);
    setMsg(r.ok ? 'Saved — customer emailed.' : r.error);
    if (r.ok) setNote('');
  }

  const closed = o.order_status === 'cancelled' || o.order_status === 'delivered';
  return (
    <article className="glass-card rounded-2xl p-4 grid md:grid-cols-3 gap-4 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">{o.order_number} · {new Date(o.created_at).toLocaleString()}</p>
        <p className="font-bold">{o.item_name}</p>
        <p className="text-primary font-bold">${Number(o.amount).toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{o.payment_method === 'wallet' ? 'Paid from wallet' : `External: ${o.tx_reference ?? 'no reference'}`}</p>
        {o.payment_proof_url && <button onClick={viewProof} className="text-xs text-primary underline mt-1">View payment proof</button>}
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">{o.full_name}</p>
        <p>{o.email} · {o.phone}</p>
        <p>{o.address_line}, {o.city}, {o.state} {o.postal_code}, {o.country}</p>
        {o.notes && <p className="mt-1 italic">“{o.notes}”</p>}
      </div>
      <div className="space-y-2">
        <select disabled={closed} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="w-full px-2 py-2 rounded-lg bg-muted/40 border border-border">
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <input disabled={closed} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" className="w-full px-2 py-2 rounded-lg bg-muted/40 border border-border" />
        <input disabled={closed} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message to customer (optional)" className="w-full px-2 py-2 rounded-lg bg-muted/40 border border-border" />
        <button disabled={busy || closed} onClick={save} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-40">{busy ? 'Saving…' : 'Update order'}</button>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </div>
    </article>
  );
}
