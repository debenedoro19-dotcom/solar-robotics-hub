import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { createClient } from '@/lib/supabase/client';
import { useWallet, money } from '@/components/investor/wallet';
import { useCryptoWallets } from '@/components/payments/cryptoWallets';
import { placeWalletOrder, placeExternalOrder } from '@/lib/inventory.functions';
import { normalizeInventoryImageUrl } from '@/lib/inventoryImages';
import {
  calculateOrderTotals,
  HEROES_DISCOUNT_AMOUNT,
  HEROES_ELIGIBLE_ROLES,
} from '@/lib/orderPricing';

export interface CheckoutItem {
  id: number | string;
  name: string;
  price: string;
  image: string;
  category: string;
}

const input =
  'w-full h-10 px-3.5 rounded-[4px] bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#3e6ae1] transition-colors';

export default function CheckoutModal({
  item,
  onClose,
  initialHeroesDiscount = false,
}: {
  item: CheckoutItem;
  onClose: () => void;
  initialHeroesDiscount?: boolean;
}) {
  const { wallet, userId, loading } = useWallet();
  const { wallets } = useCryptoWallets();
  const wallFn = useServerFn(placeWalletOrder);
  const extFn = useServerFn(placeExternalOrder);
  const price = Number(item.price.replace(/[^0-9.]/g, '')) || 0;
  const resolvedImage = normalizeInventoryImageUrl(item.image);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<'wallet' | 'external'>('wallet');
  const [network, setNetwork] = useState<'usdt' | 'eth' | 'btc' | 'bank'>('usdt');
  const [applyHeroes, setApplyHeroes] = useState(initialHeroesDiscount);
  const [heroRole, setHeroRole] = useState<string>(HEROES_ELIGIBLE_ROLES[0]);
  const [f, setF] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    notes: '',
  });
  const [txRef, setTxRef] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFedexNotice, setShowFedexNotice] = useState(false);

  const pricing = calculateOrderTotals({
    assetPrice: price,
    category: item.category,
    applyHeroesDiscount: applyHeroes,
  });

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });
  const deliveryOk =
    f.fullName.trim().length > 1 &&
    f.phone.trim().length > 4 &&
    f.addressLine.trim() &&
    f.city.trim() &&
    f.state.trim() &&
    f.postalCode.trim() &&
    f.country.trim();
  const buyable = price > 0;
  const shortfall = pricing.totalDue - (wallet?.available_balance ?? 0);

  const NETS = [
    { id: 'usdt' as const, label: 'USDT (TRC-20)', address: wallets.usdt },
    { id: 'eth' as const, label: 'Ethereum / USDT (ERC-20)', address: wallets.eth },
    { id: 'btc' as const, label: 'Bitcoin (BTC)', address: wallets.btc },
    { id: 'bank' as const, label: 'Bank wire transfer', address: '' },
  ];
  const net = NETS.find((n) => n.id === network)!;

  function copyAddress(addr: string) {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const base = {
        itemId: String(item.id),
        itemName: item.name,
        itemPrice: price,
        itemCategory: item.category,
        itemImage: resolvedImage || item.image,
        applyHeroesDiscount: pricing.heroesDiscount > 0,
        heroRole: pricing.heroesDiscount > 0 ? heroRole : undefined,
        ...f,
        notes: f.notes || undefined,
      };

      if (method === 'wallet') {
        const r = await wallFn({ data: base });
        if (!r.ok) {
          setError(r.error || 'Could not place order');
          return;
        }
        setOrderNo(r.orderNumber);
      } else {
        if (!proof && !txRef.trim()) {
          setError('Please provide a transaction reference or upload a payment receipt screenshot.');
          return;
        }
        let proofPath: string | undefined;
        if (proof) {
          const ext = proof.name.split('.').pop()?.toLowerCase() || 'png';
          const path = `${userId || 'guest'}/order-${Date.now()}.${ext}`;
          const { error: up } = await createClient().storage.from('deposit-proofs').upload(path, proof);
          if (up) {
            setError(`Could not upload payment proof: ${up.message}`);
            return;
          }
          proofPath = path;
        }
        const r = await extFn({
          data: {
            ...base,
            txReference: txRef || undefined,
            proofPath,
            network: net.label,
          },
        });
        if (!r.ok) {
          setError(r.error || 'Order submission failed');
          return;
        }
        setOrderNo(r.orderNumber);
      }
      setStep(3);
    } catch {
      setError('Something went wrong placing your order. Please try again or contact support.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[8px] p-6 sm:p-7 bg-card text-foreground border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Buy ${item.name}`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 h-8 w-8 rounded-[4px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          ✕
        </button>

        <div className="flex gap-3.5 items-center mb-5 pr-8 border-b border-border pb-4">
          <img
            src={resolvedImage || item.image}
            alt={item.name}
            className="w-16 h-16 rounded-[6px] object-cover bg-muted border border-border"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#3e6ae1]">
              {item.category} · Trade Tesla Checkout
            </p>
            <h3 className="font-display font-semibold text-foreground leading-tight truncate mt-0.5">
              {item.name}
            </h3>
            <p className="font-display text-foreground font-semibold text-base tabular mt-0.5">
              {item.price}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                + {money(pricing.shippingFee)} delivery
              </span>
            </p>
          </div>
        </div>

        {!loading && !userId ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-muted text-foreground flex items-center justify-center mx-auto mb-3 text-lg font-bold border border-border">
              🔒
            </div>
            <h4 className="font-display font-semibold text-foreground text-lg mb-1">
              Account Required for Direct Checkout
            </h4>
            <p className="text-sm text-muted-foreground mb-5">
              Sign in to your Trade Tesla Account to complete settlement and track FedEx delivery.
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-[4px] bg-[#3e6ae1] px-5 text-white font-medium text-sm hover:bg-[#345ac7] transition-colors"
              >
                Account · Continue to Sign In
              </a>
            </div>
          </div>
        ) : !buyable ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            This item is currently reserved or pricing is being updated.
          </p>
        ) : step === 3 ? (
          <div className="py-2 space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#0e9f6e]/15 text-[#0e9f6e] flex items-center justify-center text-2xl font-bold border border-[#0e9f6e]/30">
                ✓
              </div>
              <h4 className="font-display font-semibold text-foreground text-xl mb-1">
                {method === 'wallet'
                  ? 'Order Confirmed & Settled'
                  : 'Order Placed & Awaiting Verification'}
              </h4>
              <p className="text-sm text-muted-foreground">
                Order reference:{' '}
                <span className="font-mono font-semibold text-[#3e6ae1]">{orderNo}</span>
              </p>
            </div>

            <div className="rounded-[6px] border border-border p-4 space-y-2 bg-muted/25 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Asset</span>
                <span className="font-medium text-foreground text-right">{item.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Delivery Freight</span>
                <span className="text-foreground tabular">{money(pricing.shippingFee)}</span>
              </div>
              {pricing.heroesDiscount > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-[#0e9f6e]">Our Heroes Discount ({heroRole})</span>
                  <span className="font-semibold text-[#0e9f6e] tabular">
                    -{money(pricing.heroesDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-2 border-t border-border pt-2">
                <span className="text-muted-foreground font-medium">Total Paid / Due</span>
                <span className="font-semibold text-foreground tabular">
                  {money(pricing.totalDue)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Delivery To</span>
                <span className="font-medium text-foreground text-right">{f.fullName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Shipping Address</span>
                <span className="text-foreground text-right text-xs max-w-[220px] truncate">
                  {f.addressLine}, {f.city}, {f.state}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Logistics Courier</span>
                <span className="font-semibold text-orange-500">
                  FedEx Special Freight / Transport
                </span>
              </div>
            </div>

            <div className="rounded-[6px] border border-orange-500/30 bg-orange-500/5 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-[3px] font-bold text-[10px] bg-orange-500 text-white uppercase tracking-wider">
                  FedEx Partner
                </span>
                <span className="font-semibold text-foreground">Logistics Dispatch Manifest</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your order is queued in our carrier dispatch manifest. A FedEx freight specialist
                will reach out at <strong className="text-foreground">{f.phone}</strong> for
                transport scheduling and handover.
              </p>
              <button
                onClick={() => setShowFedexNotice(!showFedexNotice)}
                className="text-[#3e6ae1] hover:underline font-medium block text-left"
              >
                {showFedexNotice
                  ? 'Hide FedEx Tracking Notice ▲'
                  : 'Open FedEx Delivery Tracking Notice ▼'}
              </button>
              {showFedexNotice && (
                <div className="pt-2 border-t border-border/50 text-muted-foreground space-y-1 text-[11px]">
                  <p className="font-medium text-foreground">FedEx Logistics Integration Status:</p>
                  <p>
                    • Waybill Status:{' '}
                    <span className="text-[#0e9f6e] font-semibold">
                      Active · Pre-Dispatch Inspection
                    </span>
                  </p>
                  <p>
                    • Live GPS telemetry activates once loaded onto the assigned carrier at the
                    regional fulfillment hub.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <a
                href="/dashboard"
                className="flex-1 h-11 flex items-center justify-center rounded-[4px] bg-[#3e6ae1] text-white font-medium text-sm hover:bg-[#345ac7] transition-colors"
              >
                Track in Dashboard
              </a>
              <button
                onClick={onClose}
                className="px-5 h-11 rounded-[4px] border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Step 1 · Delivery details
              </p>
              <span className="text-[11px] text-[#3e6ae1] font-semibold">
                {pricing.shippingLabel} · {money(pricing.shippingFee)}
              </span>
            </div>
            <input
              className={input}
              placeholder="Full legal name"
              value={f.fullName}
              onChange={set('fullName')}
              maxLength={120}
            />
            <input
              className={input}
              placeholder="Phone / WhatsApp (for courier updates)"
              value={f.phone}
              onChange={set('phone')}
              maxLength={40}
            />
            <input
              className={input}
              placeholder="Street address"
              value={f.addressLine}
              onChange={set('addressLine')}
              maxLength={200}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={input}
                placeholder="City"
                value={f.city}
                onChange={set('city')}
                maxLength={100}
              />
              <input
                className={input}
                placeholder="State / region"
                value={f.state}
                onChange={set('state')}
                maxLength={100}
              />
              <input
                className={input}
                placeholder="ZIP / postal code"
                value={f.postalCode}
                onChange={set('postalCode')}
                maxLength={20}
              />
              <input
                className={input}
                placeholder="Country"
                value={f.country}
                onChange={set('country')}
                maxLength={80}
              />
            </div>
            <textarea
              className="w-full p-3 rounded-[4px] bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#3e6ae1]"
              rows={2}
              placeholder="Delivery notes / Gate code (optional)"
              value={f.notes}
              onChange={set('notes')}
              maxLength={500}
            />
            <button
              disabled={!deliveryOk}
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-[4px] bg-[#3e6ae1] text-white font-medium text-sm disabled:opacity-40 hover:bg-[#345ac7] transition-colors"
            >
              Continue to Payment · {money(pricing.totalDue)} →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Step 2 · Payment &amp; Settlement
              </p>
              <span className="font-display text-sm font-semibold text-[#3e6ae1] tabular">
                {money(pricing.totalDue)} Due
              </span>
            </div>

            {pricing.heroesEligible && (
              <div className="rounded-[6px] border border-[#0e9f6e]/35 bg-[#0e9f6e]/8 p-3.5 space-y-2.5">
                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={applyHeroes}
                      onChange={(e) => setApplyHeroes(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#0e9f6e]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Apply ${HEROES_DISCOUNT_AMOUNT.toLocaleString()} Our Heroes Discount
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Military, Veterans, First Responders, Healthcare Workers &amp; Educators
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0e9f6e] tabular shrink-0">
                    -${HEROES_DISCOUNT_AMOUNT.toLocaleString()}
                  </span>
                </label>
                {applyHeroes && (
                  <select
                    value={heroRole}
                    onChange={(e) => setHeroRole(e.target.value)}
                    aria-label="Select qualifying service category"
                    className={input}
                  >
                    {HEROES_ELIGIBLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="rounded-[6px] border border-border divide-y divide-border text-sm bg-muted/15">
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Asset price</span>
                <span className="text-foreground font-medium tabular">
                  {money(pricing.assetPrice)}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">{pricing.shippingLabel}</span>
                <span className="text-foreground font-medium tabular">
                  {money(pricing.shippingFee)}
                </span>
              </div>
              {pricing.heroesDiscount > 0 && (
                <div className="flex justify-between p-3">
                  <span className="text-[#0e9f6e] font-medium">Our Heroes Discount</span>
                  <span className="text-[#0e9f6e] font-semibold tabular">
                    -{money(pricing.heroesDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Destination &amp; paperwork</span>
                <span className="text-foreground">Included</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/25">
                <span className="text-foreground font-semibold">Total Due Today</span>
                <span className="text-[#3e6ae1] font-bold tabular">
                  {money(pricing.totalDue)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['wallet', 'external'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`p-3 rounded-[6px] border text-left text-sm transition-all ${
                    method === m
                      ? 'border-[#3e6ae1] bg-[#3e6ae1]/10 shadow-sm'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <span className="font-semibold text-foreground block">
                    {m === 'wallet' ? 'Wallet Balance' : 'Crypto / Wire'}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">
                    {m === 'wallet'
                      ? `Available ${money(wallet?.available_balance ?? 0)}`
                      : 'USDT / ETH / BTC / Bank'}
                  </span>
                </button>
              ))}
            </div>

            {method === 'wallet' ? (
              shortfall > 0 ? (
                <div className="rounded-[6px] border border-[#e82127]/40 bg-[#e82127]/8 p-4 text-sm space-y-2">
                  <p className="text-[#e82127] font-semibold">Insufficient wallet balance</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Available balance is {money(wallet?.available_balance ?? 0)}. You need{' '}
                    {money(shortfall)} more to cover the total due of {money(pricing.totalDue)}{' '}
                    (including {money(pricing.shippingFee)} delivery).
                  </p>
                  <div className="flex gap-2 pt-1">
                    <a
                      href="/account/deposit"
                      className="px-3.5 py-2 rounded-[4px] bg-[#3e6ae1] text-white font-medium text-xs hover:bg-[#345ac7] transition-colors"
                    >
                      Deposit Funds
                    </a>
                    <button
                      onClick={() => setMethod('external')}
                      className="px-3.5 py-2 rounded-[4px] border border-border text-foreground font-medium text-xs hover:bg-muted transition-colors"
                    >
                      Pay via Crypto / Bank
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[6px] border border-[#3e6ae1]/30 bg-[#3e6ae1]/8 p-4 text-sm text-foreground">
                  <p className="font-semibold text-[#3e6ae1] mb-1">Instant Wallet Settlement</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {money(pricing.totalDue)} (including {money(pricing.shippingFee)} freight
                    delivery
                    {pricing.heroesDiscount > 0
                      ? ` and -${money(pricing.heroesDiscount)} Our Heroes discount`
                      : ''}
                    ) will be deducted immediately from your available wallet balance (
                    {money(wallet?.available_balance ?? 0)}).
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <select
                  className={input}
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as typeof network)}
                >
                  {NETS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>

                <div className="rounded-[6px] border border-border p-3.5 text-sm bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Pay exactly:{' '}
                      <strong className="text-foreground tabular">
                        {money(pricing.totalDue)}
                      </strong>
                    </span>
                    {net.address && (
                      <button
                        onClick={() => copyAddress(net.address)}
                        className="text-xs font-semibold text-[#3e6ae1] hover:underline"
                      >
                        {copied ? '✓ Copied' : 'Copy Address'}
                      </button>
                    )}
                  </div>
                  {net.address ? (
                    <div className="font-mono text-xs break-all text-foreground bg-background/80 p-2.5 rounded-[4px] border border-border select-all">
                      {net.address}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Bank wire transfer instructions will be sent to your registered email
                      immediately upon submitting this order.
                    </p>
                  )}
                </div>

                <input
                  className={input}
                  placeholder="Transaction hash or wire payment reference"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  maxLength={200}
                />

                <label className="block text-xs text-muted-foreground">
                  Upload payment receipt / screenshot:
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                    className="mt-1.5 block w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-[4px] file:border-0 file:text-xs file:font-medium file:bg-[#3e6ae1] file:text-white hover:file:opacity-90"
                  />
                </label>
              </div>
            )}

            {error && <p className="text-sm text-[#e82127] font-medium">{error}</p>}

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setStep(1)}
                className="px-4 h-11 rounded-[4px] border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                disabled={busy || (method === 'wallet' && shortfall > 0)}
                onClick={submit}
                className="flex-1 h-11 rounded-[4px] bg-[#3e6ae1] text-white font-medium text-sm disabled:opacity-40 hover:bg-[#345ac7] transition-colors"
              >
                {busy
                  ? 'Processing Purchase…'
                  : method === 'wallet'
                    ? `Authorize Payment — ${money(pricing.totalDue)}`
                    : `Submit Order (${money(pricing.totalDue)})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
