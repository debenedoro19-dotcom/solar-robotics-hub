import { useEffect, useState } from 'react';
import Link from '@/components/SmartLink';
import InvestorShell from '@/components/investor/InvestorShell';
import { createClient } from '@/lib/supabase/client';
import { STATUS_LABEL, type OrderStatus } from '@/lib/inventory.functions';
import { normalizeInventoryImageUrl } from '@/lib/inventoryImages';
import { useWallet, money } from '@/components/investor/wallet';

type Order = {
  id: string;
  order_number: string;
  item_name: string;
  item_image: string | null;
  amount: number;
  payment_method: string;
  order_status: OrderStatus;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
};

const STEPS: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered'];

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const { wallet } = useWallet();

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase
        .from('inventory_orders')
        .select(
          'id,order_number,item_name,item_image,amount,payment_method,order_status,tracking_number,notes,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(100);
      setOrders((data as Order[]) ?? []);
    };
    void load();
    const ch = supabase
      .channel('my_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_orders' },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <InvestorShell balance={wallet.available_balance}>
      <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4 mt-2 mb-8 border-b border-border pb-6">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
                My Orders &amp; Delivery
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Live settlement, freight shipping &amp; FedEx carrier waybill tracking
              </p>
            </div>
            <Link
              href="/inventory"
              className="h-10 inline-flex items-center px-5 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Order Hardware
            </Link>
          </div>

          {orders === null ? (
            <div className="space-y-3">
              {[1, 2].map((k) => (
                <div key={k} className="h-28 rounded-[8px] bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-card border border-border rounded-[8px] p-10 text-center">
              <p className="text-sm text-muted-foreground mb-5">
                You have no vehicle or energy hardware orders yet.
              </p>
              <Link
                href="/inventory"
                className="inline-flex h-10 items-center px-5 rounded-[4px] bg-foreground text-background font-medium text-xs hover:opacity-90 transition-opacity"
              >
                Browse Inventory
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
                const idx = STEPS.indexOf(o.order_status);
                return (
                  <article
                    key={o.id}
                    className="bg-card border border-border rounded-[8px] p-5 sm:p-6 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {o.item_image && (
                        <img
                          src={normalizeInventoryImageUrl(o.item_image)}
                          alt={o.item_name}
                          className="w-20 h-14 rounded-[4px] object-cover bg-muted border border-border shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-mono">
                          {o.order_number} · {new Date(o.created_at).toLocaleDateString()}
                        </p>
                        <h2 className="font-display font-semibold text-base sm:text-lg truncate mt-0.5">
                          {o.item_name}
                        </h2>
                        <p className="text-sm text-foreground font-semibold tabular mt-0.5">
                          {money(Number(o.amount))} ·{' '}
                          <span className="text-muted-foreground font-normal">
                            {o.payment_method === 'wallet' ? 'Wallet Balance' : 'Crypto / Wire'}
                          </span>
                        </p>
                        {o.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{o.notes}</p>
                        )}
                      </div>
                      <span
                        className={`self-start sm:self-center text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-[3px] border ${
                          o.order_status === 'cancelled'
                            ? 'bg-[#e82127]/12 text-[#e82127] border-[#e82127]/30'
                            : 'bg-muted text-foreground border-border'
                        }`}
                      >
                        {STATUS_LABEL[o.order_status] ?? o.order_status}
                      </span>
                    </div>
                    {o.order_status !== 'cancelled' && (
                      <div className="grid grid-cols-5 gap-1.5 mt-5">
                        {STEPS.map((s, i) => (
                          <div key={s}>
                            <div
                              className={`h-1.5 rounded-full ${
                                i <= idx ? 'bg-foreground' : 'bg-muted'
                              }`}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1.5 hidden sm:block">
                              {STATUS_LABEL[s].replace('Awaiting payment confirmation', 'Pending')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {o.tracking_number && (
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        FedEx Tracking:{' '}
                        <span className="font-mono font-semibold text-foreground">
                          {o.tracking_number}
                        </span>
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </InvestorShell>
  );
}
