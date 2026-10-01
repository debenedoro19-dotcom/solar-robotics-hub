import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { STATUS_LABEL, type OrderStatus } from '@/lib/inventory.functions';

type Order = {
  id: string; order_number: string; item_name: string; item_image: string | null; amount: number;
  payment_method: string; order_status: OrderStatus; tracking_number: string | null; created_at: string;
};

const STEPS: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered'];

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase.from('inventory_orders')
        .select('id,order_number,item_name,item_image,amount,payment_method,order_status,tracking_number,created_at')
        .order('created_at', { ascending: false }).limit(100);
      setOrders((data as Order[]) ?? []);
    };
    void load();
    const ch = supabase.channel('my_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_orders' }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-5">
          <a href="/account" className="text-xs text-muted-foreground hover:text-foreground">← Back to account</a>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 mb-6">My orders</h1>
          {orders === null ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : orders.length === 0 ? (
            <div className="glass-card rounded-md p-8 text-center">
              <p className="text-muted-foreground mb-4">You have no orders yet.</p>
              <a href="/inventory" className="inline-block px-5 py-2.5 rounded bg-primary text-primary-foreground font-bold text-sm">Browse inventory</a>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
                const idx = STEPS.indexOf(o.order_status);
                return (
                  <article key={o.id} className="glass-card rounded-md p-5">
                    <div className="flex gap-4 items-center">
                      {o.item_image && <img src={o.item_image} alt="" className="w-16 h-16 rounded object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{o.order_number} · {new Date(o.created_at).toLocaleDateString()}</p>
                        <h2 className="font-bold truncate">{o.item_name}</h2>
                        <p className="text-sm text-primary font-bold">${Number(o.amount).toLocaleString()} · {o.payment_method === 'wallet' ? 'Wallet' : 'Crypto / bank'}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${o.order_status === 'cancelled' ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'}`}>
                        {STATUS_LABEL[o.order_status]}
                      </span>
                    </div>
                    {o.order_status !== 'cancelled' && (
                      <div className="flex gap-1 mt-4">
                        {STEPS.map((s, i) => (
                          <div key={s} className="flex-1">
                            <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-primary' : 'bg-muted'}`} />
                            <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">{STATUS_LABEL[s].replace('Awaiting payment confirmation', 'Pending')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {o.tracking_number && <p className="text-xs text-muted-foreground mt-3">Tracking: <span className="font-mono text-foreground">{o.tracking_number}</span></p>}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
