import React, { useEffect, useState } from 'react';
import Link from '@/components/SmartLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useWallet, money } from '@/components/investor/wallet';
import { sendDepositSubmittedEmail } from '@/lib/emailService';
import QrCode from '@/components/payments/QrCode';
import { useCryptoWallets, walletUri } from '@/components/payments/cryptoWallets';
import {
  type CryptoNetworkId,
  calculateCryptoAmount,
  getCryptoPriceUsd,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  verifyTransactionOnChain,
} from '@/lib/blockchain-verifier';
import { autoConfirmDepositOnChain, createDepositSession } from '@/lib/blockchain-deposit.functions';

const PAYMENT_METHODS = [
  { id: 'crypto', label: 'Cryptocurrency (Auto-Verified On-Chain)', icon: '₿', desc: 'USDT (TRC-20 / ERC-20), ETH or BTC — live blockchain confirmation & auto-credit' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', desc: 'Wire transfer — currently unavailable' },
  { id: 'card', label: 'Debit / Credit Card', icon: '💳', desc: 'Visa, Mastercard, Amex — currently unavailable' },
];

const CRYPTO_NUDGE: Record<string, string> = {
  bank_transfer:
    'Bank wires can take 3–7 business days to clear and cannot be verified by our settlement desk in real time, so wire funding is paused. Cryptocurrency deposits confirm on-chain within minutes, auto-credit your dashboard upon blockchain verification, and carry zero intermediary fees — switch to Cryptocurrency to fund instantly.',
  card:
    'Card processors hold clean-tech investment funding for manual review and frequently reverse or decline it, which we cannot verify or credit reliably. Cryptocurrency is our fully supported rail: minutes to confirm, fully traceable on-chain, no chargeback risk and no processing fees — switch to Cryptocurrency to fund instantly.',
};

const QUICK_AMOUNTS = [250, 500, 1000, 5000, 10000];

export default function AccountDepositPage() {
  const { wallet, userId, userEmail, userName, loading, refresh: refreshWallet } = useWallet();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(PAYMENT_METHODS[0]!.id);
  const [network, setNetwork] = useState<CryptoNetworkId>('usdt');
  const [txRef, setTxRef] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [autoCredited, setAutoCredited] = useState(false);
  const [verifiedTxUrl, setVerifiedTxUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState('');
  const [rateUsd, setRateUsd] = useState(1);

  const value = Number(amount) || 0;
  const { wallets, loaded: walletsLoaded } = useCryptoWallets();
  const networks: { id: CryptoNetworkId; walletKey: 'usdt' | 'eth' | 'btc'; label: string; symbol: string; address: string }[] = [
    { id: 'usdt', walletKey: 'usdt', label: 'USDT (TRC-20)', symbol: 'USDT', address: wallets.usdt },
    { id: 'eth', walletKey: 'eth', label: 'Ethereum / USDT (ERC-20)', symbol: 'ETH', address: wallets.eth },
    { id: 'btc', walletKey: 'btc', label: 'Bitcoin (BTC)', symbol: 'BTC', address: wallets.btc },
  ];
  const activeNetwork = networks.find((n) => n.id === network) ?? networks[0]!;
  const cryptoEstimate = calculateCryptoAmount(value, rateUsd, activeNetwork.id === 'usdt' ? 2 : 6);

  useEffect(() => {
    let active = true;
    void getCryptoPriceUsd(network).then((price) => {
      if (active) setRateUsd(price);
    });
    return () => {
      active = false;
    };
  }, [network]);

  async function submitDeposit() {
    setError('');
    setStatusMsg('');
    if (method !== 'crypto') {
      setError('Only cryptocurrency deposits can be verified and credited right now. Please switch to Cryptocurrency.');
      return;
    }
    if (!userId) {
      setError('You must be signed in to fund your wallet.');
      return;
    }
    if (value < 50) {
      setError('Minimum deposit is $50.');
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const cleanedHash = txRef.trim();
    const reference = cleanedHash || `TT-${Date.now().toString(36).toUpperCase()}`;

    let proofUrl: string | null = null;
    if (proof) {
      setStatusMsg('Uploading payment proof…');
      const ext = proof.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('deposit-proofs').upload(path, proof, { cacheControl: '3600' });
      if (upErr) {
        setBusy(false);
        setStatusMsg('');
        setError(`Could not upload payment proof: ${upErr.message}`);
        return;
      }
      proofUrl = path;
    }

    // If user supplied a blockchain TXID, verify it on-chain before finalizing
    let verifiedOnChain = false;
    let explorerUrl = '';
    if (cleanedHash.length >= 60) {
      setStatusMsg(`Verifying TXID on ${activeNetwork.label} blockchain…`);
      const verification = await verifyTransactionOnChain(activeNetwork.id, cleanedHash, activeNetwork.address);
      if (!verification.valid) {
        setBusy(false);
        setStatusMsg('');
        setError(verification.message);
        return;
      }
      verifiedOnChain = verification.confirmed;
      explorerUrl = verification.explorerUrl || getExplorerTxUrl(activeNetwork.id, cleanedHash);
    }

    setStatusMsg('Recording deposit session…');
    const created = await createDepositSession({
      userId,
      userEmail,
      userName,
      amount: value,
      packageName: 'Wallet Funding',
      paymentMethod: `crypto:${activeNetwork.label}`,
      txRef: reference,
      notes: note.trim() || (verifiedOnChain ? `Verified on-chain TXID: ${cleanedHash}` : null),
      proofUrl,
    });

    if (created.error) {
      setBusy(false);
      setStatusMsg('');
      setError(created.error);
      return;
    }

    let creditedNow = false;
    if (verifiedOnChain && created.depositId) {
      setStatusMsg('Confirmed on-chain — crediting your dashboard balance…');
      const confirmRes = await autoConfirmDepositOnChain({
        depositId: created.depositId,
        txHash: cleanedHash,
        network: activeNetwork.label,
        amount: value,
        meta: { source: 'account-deposit', walletAddress: activeNetwork.address },
      });
      if (confirmRes.ok && confirmRes.credited) {
        creditedNow = true;
        await refreshWallet();
      }
    }

    setBusy(false);
    setStatusMsg('');
    void sendDepositSubmittedEmail(value.toLocaleString(), reference).catch(() => {});

    setAutoCredited(creditedNow);
    setVerifiedTxUrl(explorerUrl);
    setDone(true);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-fin-bg text-foreground pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-5">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Link href="/dashboard" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Dashboard
              </Link>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-3">Fund Your Wallet</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                Blockchain-verified deposits credit your available wallet balance automatically upon on-chain confirmation.
                Use your wallet for vehicles, energy hardware, freight delivery settlement, or investment allocations.
              </p>
            </div>
            <Link
              href={`/crypto-payment?package=Wallet+Funding${value >= 50 ? `&amount=${value}` : ''}`}
              className="px-4 py-2.5 rounded border border-foreground bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 text-center"
            >
              Open Live Blockchain Radar →
            </Link>
          </div>

          <div className="fin-card rounded-md p-5 mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-fin-muted mb-1">Available Wallet Balance</p>
              <p className="text-3xl font-medium tabular-nums text-fin-emerald">
                {loading ? '—' : money(wallet.available_balance)}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-fin-muted">On-Chain Auto-Settlement</p>
              <p className="text-xs font-semibold text-foreground mt-1">BTC · ETH · USDT TRC-20</p>
            </div>
          </div>

          {done ? (
            <div className="fin-card-elevated rounded-md p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold mb-2">
                {autoCredited ? 'Deposit Confirmed & Credited!' : 'Deposit Request Recorded'}
              </h2>
              <p className="text-sm text-fin-muted mb-6 max-w-md mx-auto">
                {autoCredited
                  ? `Your ${money(value)} transfer was verified directly on the blockchain and automatically credited to your dashboard wallet.`
                  : `We received your ${money(value)} funding request. Your wallet balance updates automatically once confirmed on-chain or approved by our settlement desk.`}
              </p>
              {verifiedTxUrl && (
                <div className="mb-6">
                  <a
                    href={verifiedTxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
                  >
                    View Verified Transaction on Blockchain Explorer ↗
                  </a>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard" className="px-5 py-2.5 rounded btn-emerald text-sm">
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => {
                    setDone(false);
                    setAutoCredited(false);
                    setVerifiedTxUrl('');
                    setAmount('');
                    setTxRef('');
                    setNote('');
                    setProof(null);
                    setProofPreview('');
                  }}
                  className="px-5 py-2.5 rounded border border-fin-border text-sm font-semibold text-fin-muted hover:text-foreground"
                >
                  New deposit
                </button>
              </div>
            </div>
          ) : (
            <div className="fin-card-elevated rounded-md p-6 space-y-7">
              <div>
                <label htmlFor="dep-amount" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">
                  Amount (USD)
                </label>
                <input
                  id="dep-amount"
                  type="number"
                  min={50}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full rounded bg-fin-bg border border-fin-border px-4 py-3 text-foreground tabular-nums focus:border-fin-emerald outline-none"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded border border-fin-border text-fin-muted hover:text-foreground hover:border-fin-emerald/50 transition-colors"
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
                      className={`flex items-center gap-4 p-4 rounded border text-left transition-colors ${
                        method === m.id ? 'border-fin-emerald bg-fin-emerald-soft' : 'border-fin-border bg-fin-elevated hover:border-fin-muted/40'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-foreground">{m.label}</span>
                        <span className="block text-[11px] text-fin-muted">{m.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {method !== 'crypto' && (
                <div className="rounded border border-border bg-muted/50 p-4">
                  <p className="text-sm font-bold text-foreground mb-1">Fund with Cryptocurrency instead</p>
                  <p className="text-[12px] text-fin-muted leading-relaxed">{CRYPTO_NUDGE[method]}</p>
                  <button
                    onClick={() => {
                      setMethod('crypto');
                      setError('');
                    }}
                    className="mt-3 px-4 py-2 rounded bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Switch to Cryptocurrency
                  </button>
                </div>
              )}

              {method === 'crypto' && (
                <div className="rounded bg-fin-elevated border border-fin-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-wider text-fin-muted">Network</p>
                    {activeNetwork.address && (
                      <a
                        href={getExplorerAddressUrl(activeNetwork.id, activeNetwork.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
                      >
                        Trace Wallet On-Chain ↗
                      </a>
                    )}
                  </div>
                  <div className="grid gap-2 mb-4">
                    {networks.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setNetwork(n.id)}
                        className={`px-4 py-2.5 rounded text-sm font-semibold text-left border transition-colors ${
                          network === n.id ? 'border-foreground bg-foreground text-background' : 'border-fin-border text-fin-muted hover:text-foreground'
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>

                  {value >= 50 && (
                    <div className="mb-4 rounded border border-fin-border bg-fin-bg px-4 py-2.5 flex items-center justify-between text-xs">
                      <span className="text-fin-muted">Estimated On-Chain Transfer</span>
                      <span className="font-mono font-semibold text-foreground">
                        {cryptoEstimate} {activeNetwork.symbol}
                      </span>
                    </div>
                  )}

                  <p className="text-xs uppercase tracking-wider text-fin-muted mb-2">Send funds to</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <QrCode
                      value={walletUri(activeNetwork.walletKey, activeNetwork.address)}
                      size={140}
                      label={`${activeNetwork.label} deposit QR code`}
                    />
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs break-all text-foreground">{activeNetwork.address || '—'}</code>
                        <button
                          onClick={() => {
                            void navigator.clipboard?.writeText(activeNetwork.address);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity shrink-0"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[11px] text-fin-muted mt-2 leading-relaxed">
                        {walletsLoaded ? 'Scan the QR with your wallet app or copy the address.' : 'Loading live address…'} Paste your TXID below for automatic on-chain confirmation & instant crediting, or use the{' '}
                        <Link href={`/crypto-payment?package=Wallet+Funding${value >= 50 ? `&amount=${value}` : ''}`} className="underline text-foreground font-medium">
                          Live Blockchain Radar
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dep-ref" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">
                    Blockchain TXID / Hash (for instant auto-credit)
                  </label>
                  <input
                    id="dep-ref"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="Paste 64-char TXID or 0x hash"
                    className="w-full rounded bg-fin-bg border border-fin-border px-4 py-3 text-foreground text-sm font-mono focus:border-fin-emerald outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="dep-note" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">
                    Note (optional)
                  </label>
                  <input
                    id="dep-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded bg-fin-bg border border-fin-border px-4 py-3 text-foreground text-sm focus:border-fin-emerald outline-none"
                  />
                </div>
              </div>

              {/* Payment proof upload */}
              <div className="rounded border border-dashed border-fin-border bg-fin-elevated p-4">
                <p className="text-xs uppercase tracking-wider text-fin-muted mb-1">Proof of Payment (Optional)</p>
                <p className="text-[12px] text-fin-muted mb-3 leading-relaxed">
                  Upload a screenshot of your transfer receipt if you prefer manual desk verification instead of TXID auto-credit.
                </p>
                {proofPreview ? (
                  <div className="flex items-start gap-4">
                    <img src={proofPreview} alt="Payment proof preview" className="h-28 w-28 rounded object-cover border border-fin-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-semibold truncate">{proof?.name}</p>
                      <p className="text-[11px] text-fin-muted mt-0.5">{proof ? `${(proof.size / 1024).toFixed(0)} KB` : ''}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setProof(null);
                          setProofPreview('');
                        }}
                        className="mt-2 px-3 py-1.5 rounded text-[11px] font-bold border border-fin-border text-fin-muted hover:text-foreground transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="dep-proof"
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded cursor-pointer hover:bg-fin-bg/60 transition-colors"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fin-muted" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">Click to upload screenshot</span>
                    <span className="text-[11px] text-fin-muted">PNG, JPG or WEBP · max 10 MB</span>
                  </label>
                )}
                <input
                  id="dep-proof"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 10 * 1024 * 1024) {
                      setError('Screenshot must be under 10 MB.');
                      return;
                    }
                    setError('');
                    setProof(f);
                    setProofPreview(f ? URL.createObjectURL(f) : '');
                  }}
                />
              </div>

              {statusMsg && <p className="text-xs font-medium text-foreground">{statusMsg}</p>}
              {error && <p className="text-sm text-fin-danger">{error}</p>}

              <button
                onClick={submitDeposit}
                disabled={busy || !userId || method !== 'crypto'}
                className="w-full py-3.5 rounded btn-emerald text-sm disabled:opacity-40"
              >
                {busy
                  ? statusMsg || 'Verifying…'
                  : !userId
                    ? 'Sign in to deposit'
                    : method !== 'crypto'
                      ? 'Select Cryptocurrency to continue'
                      : txRef.trim().length >= 60
                        ? `Verify On-Chain & Auto-Credit${value > 0 ? ` · ${money(value)}` : ''}`
                        : `Submit deposit request${value > 0 ? ` · ${money(value)}` : ''}`}
              </button>

              <p className="text-[11px] text-fin-muted text-center">
                Confirmed blockchain transactions auto-credit immediately. Minimum deposit $50.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
