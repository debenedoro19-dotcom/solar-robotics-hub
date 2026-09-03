import React, { useState } from 'react';
import Link from '@/components/SmartLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useWallet, money } from '@/components/investor/wallet';
import { sendDepositSubmittedEmail } from '@/lib/emailService';
import QrCode from '@/components/payments/QrCode';
import { useCryptoWallets, walletUri } from '@/components/payments/cryptoWallets';


const PAYMENT_METHODS = [
  { id: 'crypto', label: 'Cryptocurrency', icon: '₿', desc: 'USDT (TRC-20 / ERC-20), ETH or BTC — instant verification' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', desc: 'Wire transfer — currently unavailable' },
  { id: 'card', label: 'Debit / Credit Card', icon: '💳', desc: 'Visa, Mastercard, Amex — currently unavailable' },
];

const CRYPTO_NUDGE: Record<string, string> = {
  bank_transfer:
    'Bank wires can take 3–7 business days to clear and cannot be verified by our settlement desk in real time, so wire funding is paused. Cryptocurrency deposits confirm on-chain within minutes, are credited by an administrator the same day, and carry zero intermediary fees — switch to Cryptocurrency to fund instantly.',
  card:
    'Card processors hold clean-tech investment funding for manual review and frequently reverse or decline it, which we cannot verify or credit reliably. Cryptocurrency is our fully supported rail: minutes to confirm, fully traceable on-chain, no chargeback risk and no processing fees — switch to Cryptocurrency to fund instantly.',
};


const QUICK_AMOUNTS = [250, 500, 1000, 5000, 10000];

export default function AccountDepositPage() {
  const { wallet, userId, userEmail, userName, loading } = useWallet();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(PAYMENT_METHODS[0]!.id);
  const [network, setNetwork] = useState('usdt');
  const [txRef, setTxRef] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState('');

  const value = Number(amount) || 0;
  const { wallets, loaded: walletsLoaded } = useCryptoWallets();
  const networks = [
    { id: 'usdt', label: 'USDT (TRC-20)', address: wallets.usdt },
    { id: 'eth', label: 'Ethereum / USDT (ERC-20)', address: wallets.eth },
    { id: 'btc', label: 'Bitcoin (BTC)', address: wallets.btc },
  ];
  const activeNetwork = networks.find((n) => n.id === network) ?? networks[0]!;

  async function submitDeposit() {
    setError('');
    if (method !== 'crypto') { setError('Only cryptocurrency deposits can be verified and credited right now. Please switch to Cryptocurrency.'); return; }
    if (!userId) { setError('You must be signed in to fund your wallet.'); return; }
    if (value < 50) { setError('Minimum deposit is $50.'); return; }

    setBusy(true);
    const supabase = createClient();
    const reference = txRef.trim() || `TT-${Date.now().toString(36).toUpperCase()}`;

    const { error: insertError } = await supabase.from('deposit_records').insert({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      amount: value,
      package_name: 'Wallet Funding',
      payment_method: method === 'crypto' ? `crypto:${activeNetwork.label}` : method,
      tx_ref: reference,
      deposit_status: 'pending',
      notes: note.trim() || null,
    });
    setBusy(false);

    if (insertError) { setError(insertError.message); return; }
    void sendDepositSubmittedEmail(value.toLocaleString(), reference).catch(() => {});

    setDone(true);

  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-fin-bg text-white pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-5">
          <div className="mb-8">
            <Link href="/account" className="text-xs text-fin-muted hover:text-white transition-colors">← Back to account</Link>
            <h1 className="text-3xl font-extrabold mt-3">Fund Your Wallet</h1>
            <p className="text-sm text-fin-muted mt-2 max-w-xl">
              Deposits are credited to your available wallet balance once our team confirms the payment.
              You then deploy that balance into any investment plan or giveaway from your dashboard.
            </p>
          </div>

          <div className="fin-card rounded-3xl p-5 mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-fin-muted mb-1">Available Wallet Balance</p>
            <p className="text-3xl font-extrabold tabular-nums text-fin-emerald">
              {loading ? '—' : money(wallet.available_balance)}
            </p>
          </div>

          {done ? (
            <div className="fin-card-elevated rounded-3xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-fin-emerald-soft border border-fin-emerald/40 flex items-center justify-center mx-auto mb-4 text-fin-emerald text-2xl">✓</div>
              <h2 className="text-xl font-bold mb-2">Deposit request submitted</h2>
              <p className="text-sm text-fin-muted mb-6">
                We received your {money(value)} funding request. Your wallet balance updates automatically
                the moment an administrator confirms the payment.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard" className="px-5 py-2.5 rounded-xl btn-emerald text-sm">Go to Dashboard</Link>
                <button
                  onClick={() => { setDone(false); setAmount(''); setTxRef(''); setNote(''); }}
                  className="px-5 py-2.5 rounded-xl border border-fin-border text-sm font-semibold text-fin-muted hover:text-white"
                >
                  New deposit
                </button>
              </div>
            </div>
          ) : (
            <div className="fin-card-elevated rounded-3xl p-6 space-y-7">
              <div>
                <label htmlFor="dep-amount" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Amount (USD)</label>
                <input
                  id="dep-amount"
                  type="number"
                  min={50}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-xl bg-fin-bg border border-fin-border px-4 py-3 text-white tabular-nums focus:border-fin-emerald outline-none"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded-xl border border-fin-border text-fin-muted hover:text-white hover:border-fin-emerald/50 transition-colors"
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-fin-muted mb-2">Payment Method</p>
                <div className="grid gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                        method === m.id ? 'border-fin-emerald bg-fin-emerald-soft' : 'border-fin-border bg-fin-elevated hover:border-fin-muted/40'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-white">{m.label}</span>
                        <span className="block text-[11px] text-fin-muted">{m.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {method !== 'crypto' && (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
                  <p className="text-sm font-bold text-primary mb-1">Fund with Cryptocurrency instead</p>
                  <p className="text-[12px] text-fin-muted leading-relaxed">{CRYPTO_NUDGE[method]}</p>
                  <button
                    onClick={() => { setMethod('crypto'); setError(''); }}
                    className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                  >
                    Switch to Cryptocurrency
                  </button>
                </div>
              )}



              {method === 'crypto' && (
                <div className="rounded-xl bg-fin-elevated border border-fin-border p-4">
                  <p className="text-xs uppercase tracking-wider text-fin-muted mb-2">Network</p>
                  <div className="grid gap-2 mb-4">
                    {networks.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setNetwork(n.id)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left border transition-colors ${
                          network === n.id ? 'border-primary bg-primary/10 text-primary' : 'border-fin-border text-fin-muted hover:text-white'
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs uppercase tracking-wider text-fin-muted mb-2">Send funds to</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <QrCode
                      value={walletUri(network, activeNetwork.address)}
                      size={140}
                      label={`${activeNetwork.label} deposit QR code`}
                    />
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs break-all text-white">{activeNetwork.address || '—'}</code>
                        <button
                          onClick={() => { void navigator.clipboard?.writeText(activeNetwork.address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          className="px-3 py-1.5 rounded-md text-xs font-bold bg-primary text-primary-foreground shrink-0"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[11px] text-fin-muted mt-2 leading-relaxed">
                        {walletsLoaded ? 'Scan the QR with your wallet app or copy the address.' : 'Loading live address…'} Send only on the selected network — wrong-network transfers are unrecoverable.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dep-ref" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Transaction reference (optional)</label>
                  <input
                    id="dep-ref"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="Tx hash or bank reference"
                    className="w-full rounded-xl bg-fin-bg border border-fin-border px-4 py-3 text-white text-sm focus:border-fin-emerald outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="dep-note" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Note to admin (optional)</label>
                  <input
                    id="dep-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl bg-fin-bg border border-fin-border px-4 py-3 text-white text-sm focus:border-fin-emerald outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-fin-danger">{error}</p>}

              <button
                onClick={submitDeposit}
                disabled={busy || !userId || method !== 'crypto'}
                className="w-full py-3.5 rounded-xl btn-emerald text-sm disabled:opacity-40"
              >
                {busy ? 'Submitting…' : !userId ? 'Sign in to deposit' : method !== 'crypto' ? 'Select Cryptocurrency to continue' : `Submit deposit request${value > 0 ? ` · ${money(value)}` : ''}`}
              </button>


              <p className="text-[11px] text-fin-muted text-center">
                Funds are credited to your wallet after admin confirmation. Minimum deposit $50.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
