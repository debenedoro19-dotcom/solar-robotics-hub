import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { createClient } from '@/lib/supabase/client';
import { useWallet, money } from '@/components/investor/wallet';
import { useCryptoWallets } from '@/components/payments/cryptoWallets';
import { placeWalletOrder, placeExternalOrder } from '@/lib/inventory.functions';

export interface CheckoutItem {
  id: number | string;
  name: string;
  price: string;
  image: string;
  category: string;
}

const UUID = /^[0-9a-f-]{36}$/i;
const input = 'w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary';

export default function CheckoutModal({ item, onClose }: { item: CheckoutItem; onClose: () => void }) {
  const { wallet, userId, loading } = useWallet();
  const { wallets } = useCryptoWallets();
  const wallFn = useServerFn(placeWalletOrder);
  const extFn = useServerFn(placeExternalOrder);
  const price = Number(item.price.replace(/[^0-9.]/g, ''));
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<'wallet' | 'external'>('wallet');
  const [network, setNetwork] = useState<'usdt' | 'eth' | 'btc' | 'bank'>('usdt');
  const [f, setF] = useState({ fullName: '', phone: '', addressLine: '', city: '', state: '', postalCode: '', country: 'United States', notes: '' });
  const [txRef, setTxRef] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [orderNo, setOrderNo] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const deliveryOk = f.fullName.trim().length > 1 && f.phone.trim().length > 4 && f.addressLine.trim() && f.city.trim() && f.state.trim() && f.postalCode.trim() && f.country.trim();
  const buyable = UUID.test(String(item.id)) && price > 0;
  const shortfall = price - wallet.available_balance;
  const NETS = [
    { id: 'usdt' as const, label: 'USDT (TRC-20)', address: wallets.usdt },
    { id: 'eth' as const, label: 'Ethereum / USDT (ERC-20)', address: wallets.eth },
    { id: 'btc' as const, label: 'Bitcoin (BTC)', address: wallets.btc },
    { id: 'bank' as const, label: 'Bank transfer', address: '' },
  ];
  const net = NETS.find((n) => n.id === network)!;

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const base = { itemId: String(item.id), ...f, notes: f.notes || undefined };
      if (method === 'wallet') {
        const r = await wallFn({ data: base });
        if (!r.ok) { setError(r.error); return; }
        setOrderNo(r.orderNumber);
      } else {
        if (!proof && !txRef.trim()) { setError('Add a transaction reference or upload a payment screenshot.'); return; }
        let proofPath: string | undefined;
        if (proof) {
          const ext = proof.name.split('.').pop()?.toLowerCase() || 'png';
          const path = `${userId}/order-${Date.now()}.${ext}`;
          const { error: up } = await createClient().storage.from('deposit-proofs').upload(path, proof);
          if (up) { setError(`Could not upload payment proof: ${up.message}`); return; }
          proofPath = path;
        }
        const r = await extFn({ data: { ...base, txReference: txRef || undefined, proofPath, network: net.label } });
        if (!r.ok) { setError(r.error); return; }
        setOrderNo(r.orderNumber);
      }
      setStep(3);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Buy ${item.name}`}>
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>

        <div className="flex gap-3 items-center mb-5 pr-6">
          <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{item.category}</p>
            <h3 className="font-bold text-foreground leading-tight">{item.name}</h3>
            <p className="text-primary font-extrabold">{item.price}</p>
          </div>
        </div>

        {!loading && !userId ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">Sign in to purchase this item and track your order.</p>
            <a href="/login" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">Sign in to buy</a>
          </div>
        ) : !buyable ? (
          <p className="text-sm text-muted-foreground py-6 text-center">This item is not available for online purchase right now.</p>
        ) : step === 3 ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xl">✓</div>
            <h4 className="font-bold text-foreground mb-1">{method === 'wallet' ? 'Order confirmed' : 'Order received'}</h4>
            <p className="text-sm text-muted-foreground mb-1">Order number <span className="font-bold text-foreground">{orderNo}</span></p>
            <p className="text-sm text-muted-foreground mb-5">
              {method === 'wallet' ? 'Paid from your wallet. A confirmation email is on its way.' : 'We are verifying your payment and will email you once it is confirmed.'}
            </p>
            <a href="/account/orders" className="inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">Track my orders</a>
          </div>
        ) : step === 1 ? (
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Step 1 · Delivery details</p>
            <input className={input} placeholder="Full name" value={f.fullName} onChange={set('fullName')} maxLength={120} />
            <input className={input} placeholder="Phone number" value={f.phone} onChange={set('phone')} maxLength={40} />
            <input className={input} placeholder="Street address" value={f.addressLine} onChange={set('addressLine')} maxLength={200} />
            <div className="grid grid-cols-2 gap-3">
              <input className={input} placeholder="City" value={f.city} onChange={set('city')} maxLength={100} />
              <input className={input} placeholder="State / region" value={f.state} onChange={set('state')} maxLength={100} />
              <input className={input} placeholder="ZIP / postal code" value={f.postalCode} onChange={set('postalCode')} maxLength={20} />
              <input className={input} placeholder="Country" value={f.country} onChange={set('country')} maxLength={80} />
            </div>
            <textarea className={input} rows={2} placeholder="Delivery notes (optional)" value={f.notes} onChange={set('notes')} maxLength={500} />
            <button disabled={!deliveryOk} onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40">Continue to payment</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Step 2 · Payment</p>
            <div className="grid grid-cols-2 gap-2">
              {(['wallet', 'external'] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`p-3 rounded-xl border text-left text-sm ${method === m ? 'border-primary bg-primary/10' : 'border-border'}`}>
                  <span className="font-bold text-foreground block">{m === 'wallet' ? 'Wallet balance' : 'Crypto / bank'}</span>
                  <span className="text-xs text-muted-foreground">{m === 'wallet' ? `Available ${money(wallet.available_balance)}` : 'Pay & upload proof'}</span>
                </button>
              ))}
            </div>

            {method === 'wallet' ? (
              shortfall > 0 ? (
                <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                  Your balance is {money(shortfall)} short. <a href="/account/deposit" className="text-primary font-semibold">Fund your wallet</a> or pay by crypto / bank.
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{money(price)} will be deducted instantly and your order confirmed.</p>
              )
            ) : (
              <div className="space-y-3">
                <select className={input} value={network} onChange={(e) => setNetwork(e.target.value as typeof network)}>
                  {NETS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <div className="rounded-xl border border-border p-3 text-sm">
                  <p className="text-muted-foreground mb-1">Send exactly <span className="font-bold text-foreground">{money(price)}</span> {net.address ? 'to:' : ''}</p>
                  {net.address ? (
                    <p className="font-mono text-xs break-all text-foreground">{net.address}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Bank details are sent by our team after you submit — use your order number as the reference.</p>
                  )}
                </div>
                <input className={input} placeholder="Transaction hash / reference" value={txRef} onChange={(e) => setTxRef(e.target.value)} maxLength={200} />
                <label className="block text-xs text-muted-foreground">
                  Payment screenshot (optional)
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setProof(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-xs" />
                </label>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border border-border text-sm font-semibold">Back</button>
              <button
                disabled={busy || (method === 'wallet' && shortfall > 0)}
                onClick={submit}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40"
              >
                {busy ? 'Placing order…' : method === 'wallet' ? `Pay ${money(price)}` : 'Submit order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
