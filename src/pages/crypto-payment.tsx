import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from '@/components/SmartLink';
import { useSearchParams } from '@/lib/next-shims';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QrCode from '@/components/payments/QrCode';
import { useCryptoWallets, walletUri } from '@/components/payments/cryptoWallets';
import { useWallet, money } from '@/components/investor/wallet';
import {
  type CryptoNetworkId,
  type VerificationResult,
  calculateCryptoAmount,
  getCryptoPriceUsd,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  traceAddressIncomingTxs,
  verifyTransactionOnChain,
} from '@/lib/blockchain-verifier';
import { autoConfirmDepositOnChain, createDepositSession } from '@/lib/blockchain-deposit.functions';
import { sendDepositSubmittedEmail } from '@/lib/emailService';

interface CryptoOption {
  id: CryptoNetworkId;
  walletKey: 'btc' | 'eth' | 'usdt';
  name: string;
  symbol: string;
  network: string;
  icon: string;
  confirmations: string;
  explorerLabel: string;
}

const CRYPTO_META: CryptoOption[] = [
  {
    id: 'usdt',
    walletKey: 'usdt',
    name: 'Tether USDT',
    symbol: 'USDT',
    network: 'TRC-20 (Tron)',
    icon: '₮',
    confirmations: '20 confirmations (~1 min)',
    explorerLabel: 'TronScan',
  },
  {
    id: 'btc',
    walletKey: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Mainnet',
    icon: '₿',
    confirmations: '2 confirmations (~15 min)',
    explorerLabel: 'Mempool.space',
  },
  {
    id: 'eth',
    walletKey: 'eth',
    name: 'Ethereum / USDT',
    symbol: 'ETH',
    network: 'ERC-20 (Ethereum Mainnet)',
    icon: 'Ξ',
    confirmations: '12 confirmations (~3 min)',
    explorerLabel: 'Etherscan',
  },
];

const TIME_WINDOWS = [
  { minutes: 15, label: '15 min (Express)' },
  { minutes: 30, label: '30 min (Standard)' },
  { minutes: 60, label: '60 min (Extended)' },
];

const QUICK_AMOUNTS = [250, 500, 1000, 5000, 10000, 25000];

function generateTxRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'TE-';
  for (let i = 0; i < 4; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  ref += '-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

type Step = 'select' | 'send' | 'confirm' | 'success';
type VerifyStage = 'idle' | 'scanning_node' | 'verifying_tx' | 'crediting' | 'credited' | 'pending_review';

export default function CryptoPaymentClient() {
  const searchParams = useSearchParams();
  const packageName = searchParams.get('package') || 'Wallet Funding';
  const initialAmountParam = searchParams.get('amount') || '';

  const { wallet, userId, userEmail, userName, loading: walletLoading, refresh: refreshWallet } = useWallet();
  const { wallets, loaded: walletsLoaded } = useCryptoWallets();

  const [step, setStep] = useState<Step>('select');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoNetworkId>('usdt');
  const [amountInput, setAmountInput] = useState<string>(initialAmountParam && Number(initialAmountParam) > 0 ? initialAmountParam : '1000');
  const [windowMinutes, setWindowMinutes] = useState<number>(30);

  const [txRef] = useState(() => generateTxRef());
  const [depositId, setDepositId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);

  const [rateUsd, setRateUsd] = useState<number>(1);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [creatingSession, setCreatingSession] = useState<boolean>(false);

  // Live blockchain tracing radar state
  const [radarActive, setRadarActive] = useState<boolean>(false);
  const [radarScans, setRadarScans] = useState<number>(0);
  const [lastScannedAt, setLastScannedAt] = useState<string>('');
  const [radarStatus, setRadarStatus] = useState<string>('Waiting for deposit session...');

  // Verification & auto-credit state
  const [txHash, setTxHash] = useState<string>('');
  const [verifyStage, setVerifyStage] = useState<VerifyStage>('idle');
  const [verifyError, setVerifyError] = useState<string>('');
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [autoCredited, setAutoCredited] = useState<boolean>(false);
  const [preDepositBalance, setPreDepositBalance] = useState<number>(0);

  const confirmingLock = useRef<boolean>(false);

  const numericAmount = Number(amountInput) || 0;
  const crypto = CRYPTO_META.find((c) => c.id === selectedCrypto) ?? CRYPTO_META[0]!;
  const walletAddress = wallets[crypto.walletKey] || '';
  const cryptoAmountStr = calculateCryptoAmount(numericAmount, rateUsd, crypto.id === 'usdt' ? 2 : 6);

  // Fetch live crypto exchange rate when network changes
  useEffect(() => {
    let active = true;
    setLoadingRate(true);
    void getCryptoPriceUsd(selectedCrypto).then((price) => {
      if (active) {
        setRateUsd(price);
        setLoadingRate(false);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedCrypto]);

  // Countdown timer during active deposit window
  useEffect(() => {
    if (step !== 'send' && step !== 'confirm') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const finalizeAndCredit = useCallback(
    async (resolvedHash: string, verifiedResult: VerificationResult, detectedAutomatically: boolean) => {
      if (confirmingLock.current) return;
      confirmingLock.current = true;
      setVerifyError('');
      setVerification(verifiedResult);
      setTxHash(resolvedHash);
      setVerifyStage('crediting');

      try {
        let activeDepositId = depositId;

        // Ensure a deposit_records row exists if user is signed in
        if (!activeDepositId && userId) {
          const created = await createDepositSession({
            userId,
            userEmail,
            userName,
            amount: numericAmount,
            packageName,
            paymentMethod: `crypto:${crypto.name} (${crypto.network})`,
            txRef,
            notes: `On-chain TXID: ${resolvedHash}`,
          });
          activeDepositId = created.depositId;
          if (activeDepositId) setDepositId(activeDepositId);
        }

        let credited = false;
        if (activeDepositId && verifiedResult.confirmed) {
          const creditRes = await autoConfirmDepositOnChain({
            depositId: activeDepositId,
            txHash: resolvedHash,
            network: crypto.network,
            amount: numericAmount,
            meta: {
              autoDetected: detectedAutomatically,
              blockHeight: verifiedResult.blockHeight,
              confirmations: verifiedResult.confirmations,
              walletAddress,
            },
          });
          credited = Boolean(creditRes.ok && creditRes.credited);
        }

        if (credited) {
          setAutoCredited(true);
          setVerifyStage('credited');
          await refreshWallet();
        } else {
          setAutoCredited(false);
          setVerifyStage('pending_review');
        }

        void sendDepositSubmittedEmail(numericAmount.toLocaleString(), txRef).catch(() => {});
        setRadarActive(false);
        setStep('success');
      } catch (err) {
        setVerifyError(err instanceof Error ? err.message : 'Unable to finalize settlement right now.');
        setVerifyStage('idle');
      } finally {
        confirmingLock.current = false;
      }
    },
    [crypto.name, crypto.network, depositId, numericAmount, packageName, refreshWallet, txRef, userEmail, userId, userName, walletAddress],
  );

  // Live Blockchain Address Radar: polls public blockchain explorers during expected deposit window
  useEffect(() => {
    if (!radarActive || step !== 'send' || !walletAddress || timeLeft <= 0) return;

    let cancelled = false;
    const pollBlockchain = async () => {
      if (cancelled || confirmingLock.current) return;
      setRadarScans((n) => n + 1);
      setLastScannedAt(new Date().toLocaleTimeString());
      setRadarStatus(`Tracing ${crypto.explorerLabel} for incoming ${crypto.symbol} to ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`);

      const trace = await traceAddressIncomingTxs(crypto.id, walletAddress, sessionStartedAt, numericAmount);
      if (cancelled || confirmingLock.current) return;

      if (trace.detected && trace.txHash) {
        setRadarStatus(`Incoming transfer detected! TX: ${trace.txHash.slice(0, 14)}...`);
        const verifiedResult: VerificationResult = {
          valid: true,
          confirmed: Boolean(trace.confirmed),
          confirmations: trace.confirmations ?? 1,
          txHash: trace.txHash,
          network: crypto.network,
          toAddress: walletAddress,
          amountCrypto: trace.amountCrypto,
          amountUsd: trace.amountUsd ?? numericAmount,
          explorerUrl: trace.explorerUrl ?? getExplorerTxUrl(crypto.id, trace.txHash),
          message: trace.confirmed
            ? `Automatically detected & confirmed on ${crypto.network}`
            : `Detected in ${crypto.network} mempool`,
        };
        await finalizeAndCredit(trace.txHash, verifiedResult, true);
      }
    };

    void pollBlockchain();
    const timer = setInterval(() => {
      void pollBlockchain();
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [crypto.explorerLabel, crypto.id, crypto.network, crypto.symbol, finalizeAndCredit, numericAmount, radarActive, sessionStartedAt, step, timeLeft, walletAddress]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const copyAddress = useCallback(() => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [walletAddress]);

  // Step 1 -> Step 2: Create tracked deposit session in Supabase & activate live blockchain radar
  const handleStartSession = async () => {
    setVerifyError('');
    if (numericAmount < 50) {
      setVerifyError('Minimum cryptocurrency deposit is $50 USD.');
      return;
    }
    if (!walletAddress) {
      setVerifyError('Deposit wallet address is still loading. Please wait a moment.');
      return;
    }

    setCreatingSession(true);
    setPreDepositBalance(wallet.available_balance);

    if (userId && !depositId) {
      const created = await createDepositSession({
        userId,
        userEmail,
        userName,
        amount: numericAmount,
        packageName,
        paymentMethod: `crypto:${crypto.name} (${crypto.network})`,
        txRef,
        notes: `Expected window: ${windowMinutes}m | Target: ${cryptoAmountStr} ${crypto.symbol}`,
      });
      if (created.depositId) {
        setDepositId(created.depositId);
      }
    }

    const now = Date.now();
    setSessionStartedAt(now);
    setTimeLeft(windowMinutes * 60);
    setRadarScans(0);
    setRadarActive(true);
    setCreatingSession(false);
    setStep('send');
  };

  // Step 3: Manual TXID verification against live blockchain nodes
  const handleVerifyTxHash = async () => {
    setVerifyError('');
    const cleanHash = txHash.trim();
    if (!cleanHash) {
      setVerifyError('Please paste your Transaction Hash / TXID so our node can verify your transfer on-chain.');
      return;
    }

    setVerifyStage('scanning_node');
    const result = await verifyTransactionOnChain(crypto.id, cleanHash, walletAddress);

    if (!result.valid) {
      setVerifyStage('idle');
      setVerifyError(result.message);
      return;
    }

    setVerifyStage('verifying_tx');
    await finalizeAndCredit(cleanHash, result, false);
  };

  const steps: Step[] = ['select', 'send', 'confirm', 'success'];
  const stepLabels = ['Configure', 'Live Trace', 'Verify TXID', 'Credited'];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground tracking-[0.22em] uppercase mb-2 block">
                Automated Blockchain Gateway
              </span>
              <h1 className="font-display text-3xl font-semibold text-foreground tracking-tight">
                Cryptocurrency Settlement
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5">
                Live on-chain address tracing confirms transfers within your deposit window and credits your dashboard automatically.
              </p>
            </div>
            {userId && (
              <div className="rounded border border-border bg-card px-4 py-2.5 shrink-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Dashboard Balance</div>
                <div className="text-base font-semibold tabular-nums text-foreground">
                  {walletLoading ? '—' : money(wallet.available_balance)}
                </div>
              </div>
            )}
          </div>

          {!walletLoading && !userId && (
            <div className="mb-6 rounded border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Sign in for instant automatic dashboard crediting</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign in to your Trade Tesla account so verified blockchain transfers credit your wallet balance automatically.
                </p>
              </div>
              <Link href="/login" className="px-4 py-2 rounded tesla-btn-primary text-xs font-semibold shrink-0 text-center">
                Sign In
              </Link>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s
                        ? 'bg-foreground text-background'
                        : steps.indexOf(step) > i
                          ? 'bg-foreground/15 text-foreground border border-foreground/30'
                          : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {steps.indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-wider uppercase hidden sm:block ${
                      step === s ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {stepLabels[i]}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${steps.indexOf(step) > i ? 'bg-foreground' : 'bg-border'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Summary Bar */}
          {step !== 'success' && (
            <div className="bg-card border border-border rounded px-5 py-3.5 grid grid-cols-3 gap-4 mb-8">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Destination</div>
                <div className="text-sm font-semibold text-foreground truncate">{packageName}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Amount</div>
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {numericAmount > 0 ? money(numericAmount) : 'Enter amount'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Session Ref</div>
                <div className="text-xs font-mono font-semibold text-muted-foreground">{txRef}</div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Configure Amount, Window & Network ── */}
          {step === 'select' && (
            <div className="space-y-6">
              {/* Amount Input */}
              <div className="bg-card border border-border rounded p-5">
                <label htmlFor="crypto-amount-usd" className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Deposit Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                  <input
                    id="crypto-amount-usd"
                    type="number"
                    min={50}
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="1000"
                    className="w-full pl-8 pr-4 py-3 rounded text-base font-semibold tabular-nums input-tesla"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmountInput(String(v))}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                        numericAmount === v
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Deposit Time Window */}
              <div className="bg-card border border-border rounded p-5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Expected Deposit Time Window
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {TIME_WINDOWS.map((w) => (
                    <button
                      key={w.minutes}
                      type="button"
                      onClick={() => setWindowMinutes(w.minutes)}
                      className={`py-2.5 px-3 rounded border text-xs font-semibold transition-all ${
                        windowMinutes === w.minutes
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2.5">
                  Our blockchain radar actively watches the receiving wallet throughout this window to auto-confirm your transfer.
                </p>
              </div>

              {/* Cryptocurrency Selection */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Select Cryptocurrency Network
                </p>
                <div className="space-y-3">
                  {CRYPTO_META.map((c) => {
                    const selected = selectedCrypto === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCrypto(c.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded border text-left transition-all ${
                          selected
                            ? 'border-foreground bg-card ring-1 ring-foreground/20'
                            : 'border-border bg-card/60 hover:border-foreground/40'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-full bg-muted border border-border flex items-center justify-center text-lg font-bold text-foreground shrink-0">
                          {c.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.network}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-foreground">{c.symbol}</div>
                          <div className="text-[10px] text-muted-foreground">{c.confirmations}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {verifyError && (
                <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive font-medium">
                  {verifyError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="flex-1 py-3.5 tesla-btn-outline rounded min-h-[48px] flex items-center justify-center text-xs font-semibold tracking-wider uppercase"
                >
                  ← Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleStartSession}
                  disabled={creatingSession || !walletsLoaded || numericAmount < 50}
                  className="flex-1 py-3.5 tesla-btn-primary rounded min-h-[48px] text-xs font-semibold tracking-wider uppercase disabled:opacity-40"
                >
                  {creatingSession ? 'Opening Session…' : `Initiate ${crypto.symbol} Payment →`}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Send Funds + Live Blockchain Radar ── */}
          {step === 'send' && (
            <div className="space-y-5">
              {/* Timer + Live Radar Header */}
              <div className="bg-card border border-border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-60" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-foreground" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Live Blockchain Radar Active ({crypto.explorerLabel})
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {radarStatus} {radarScans > 0 && `· Scan #${radarScans}${lastScannedAt ? ` (${lastScannedAt})` : ''}`}
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border shrink-0 self-start sm:self-center ${
                    timeLeft < 300 ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-background text-foreground'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-75">Window</span>
                  <span className="text-xs font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Payment Card */}
              <div className="bg-card border border-border rounded p-6">
                <div className="flex items-center justify-between pb-5 mb-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-xl font-bold text-foreground">
                      {crypto.icon}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground">{crypto.name}</div>
                      <div className="text-xs text-muted-foreground">{crypto.network}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRadarActive(false);
                      setStep('select');
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Change
                  </button>
                </div>

                {/* Exact Amount Breakdown */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6 pb-5 border-b border-border">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Exact Amount to Send</div>
                    <div className="text-2xl font-semibold text-foreground tabular-nums">
                      {loadingRate ? 'Calculating…' : `${cryptoAmountStr} ${crypto.symbol}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ≈ {money(numericAmount)} USD {crypto.id !== 'usdt' && `(1 ${crypto.symbol} ≈ ${money(rateUsd)})`}
                    </div>
                  </div>
                  <div className="sm:text-right flex flex-col justify-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Live Wallet Explorer</div>
                    <a
                      href={getExplorerAddressUrl(crypto.id, walletAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
                    >
                      Verify Wallet on {crypto.explorerLabel} ↗
                    </a>
                  </div>
                </div>

                {/* Wallet Address + Copy */}
                <div className="mb-5">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                    Verified {crypto.symbol} Deposit Address
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background border border-border rounded px-3.5 py-2.5 font-mono text-xs text-foreground break-all select-all">
                      {walletAddress}
                    </div>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="shrink-0 px-4 py-2.5 rounded border border-foreground bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-background border border-border rounded p-4 flex flex-col sm:flex-row items-center gap-5">
                  <QrCode value={walletUri(crypto.walletKey, walletAddress)} size={136} label={`${crypto.name} wallet QR code`} />
                  <div>
                    <div className="text-xs font-semibold text-foreground mb-1">Scan QR with Your Crypto Wallet</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Send <strong className="text-foreground">only {crypto.symbol}</strong> via the{' '}
                      <strong className="text-foreground">{crypto.network}</strong>. Once broadcast, our blockchain radar detects the transfer automatically and credits your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRadarActive(false);
                    setStep('select');
                  }}
                  className="flex-1 py-3.5 tesla-btn-outline rounded min-h-[48px] text-xs font-semibold tracking-wider uppercase"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="flex-1 py-3.5 tesla-btn-primary rounded min-h-[48px] text-xs font-semibold tracking-wider uppercase"
                >
                  I&apos;ve Sent — Verify TXID →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: On-Chain TXID Verification & Auto-Credit ── */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="bg-card border border-border rounded p-6">
                <div className="space-y-2.5 mb-6 pb-5 border-b border-border">
                  {[
                    { label: 'Cryptocurrency', value: `${crypto.name} (${crypto.symbol})` },
                    { label: 'Network', value: crypto.network },
                    { label: 'Expected Transfer', value: `${cryptoAmountStr} ${crypto.symbol} (${money(numericAmount)})` },
                    { label: 'Target Wallet', value: `${walletAddress.slice(0, 12)}...${walletAddress.slice(-8)}` },
                    { label: 'Session Reference', value: txRef },
                    { label: 'Window Remaining', value: formatTime(timeLeft) },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{item.label}</span>
                      <span className="font-mono font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <label htmlFor="tx-hash-input" className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Blockchain Transaction Hash / TXID
                  </label>
                  <input
                    id="tx-hash-input"
                    type="text"
                    value={txHash}
                    onChange={(e) => {
                      setTxHash(e.target.value);
                      if (verifyError) setVerifyError('');
                    }}
                    placeholder={crypto.id === 'eth' ? '0x4a3b2c1d...' : '64-character blockchain transaction hash'}
                    className="w-full px-4 py-3 rounded text-sm input-tesla font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Copy the TXID from your wallet or exchange withdrawal screen. We verify the transaction directly on{' '}
                    <strong className="text-foreground">{crypto.explorerLabel}</strong> and auto-credit your dashboard upon confirmation.
                  </p>
                </div>

                {verifyStage !== 'idle' && (
                  <div className="mt-5 rounded border border-border bg-background p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
                      {verifyStage === 'scanning_node' && `Querying ${crypto.explorerLabel} blockchain node…`}
                      {verifyStage === 'verifying_tx' && 'Validating destination address & block confirmations…'}
                      {verifyStage === 'crediting' && 'Confirmed on-chain — crediting your dashboard wallet…'}
                    </div>
                  </div>
                )}

                {verifyError && (
                  <div className="mt-4 rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive font-medium leading-relaxed">
                    {verifyError}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('send')}
                  disabled={verifyStage !== 'idle'}
                  className="flex-1 py-3.5 tesla-btn-outline rounded min-h-[48px] text-xs font-semibold tracking-wider uppercase disabled:opacity-40"
                >
                  ← Back to Radar
                </button>
                <button
                  type="button"
                  onClick={handleVerifyTxHash}
                  disabled={verifyStage !== 'idle'}
                  className="flex-1 py-3.5 tesla-btn-primary rounded min-h-[48px] text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
                >
                  {verifyStage !== 'idle' ? 'Verifying On-Chain…' : 'Verify & Auto-Credit ✓'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Confirmed & Auto-Credited Receipt ── */}
          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                ✓
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                {autoCredited ? 'Payment Confirmed & Credited!' : 'On-Chain Transfer Verified'}
              </h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto leading-relaxed">
                {autoCredited
                  ? `${money(numericAmount)} has been verified on the ${crypto.network} and automatically credited to your Trade Tesla dashboard wallet.`
                  : verification?.message || `Your ${crypto.name} transfer has been located on-chain and queued for instant dashboard settlement.`}
              </p>

              {/* Updated Balance Highlight */}
              {userId && (
                <div className="bg-card border border-border rounded p-5 mb-6 grid grid-cols-2 gap-4 text-left">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Credited Deposit</div>
                    <div className="text-xl font-semibold tabular-nums text-foreground mt-1">+{money(numericAmount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Live Dashboard Balance</div>
                    <div className="text-xl font-semibold tabular-nums text-foreground mt-1">
                      {money(autoCredited ? Math.max(wallet.available_balance, preDepositBalance + numericAmount) : wallet.available_balance)}
                    </div>
                  </div>
                </div>
              )}

              {/* Blockchain Receipt */}
              <div className="bg-card border border-border rounded p-6 mb-8 text-left">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Blockchain Settlement Receipt</div>
                <div className="space-y-3">
                  {[
                    { label: 'Session Reference', value: txRef },
                    { label: 'Destination', value: packageName },
                    { label: 'Amount Credited', value: money(numericAmount) },
                    { label: 'Network', value: verification?.network || crypto.network },
                    {
                      label: 'Settlement Status',
                      value: autoCredited ? 'Confirmed & Auto-Credited' : verification?.confirmed ? 'Confirmed On-Chain' : 'Mempool Detected',
                    },
                    ...(verification?.blockHeight ? [{ label: 'Block Height', value: `#${verification.blockHeight}` }] : []),
                    ...(txHash ? [{ label: 'TX Hash', value: `${txHash.slice(0, 14)}...${txHash.slice(-10)}` }] : []),
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-xs">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      <span className="font-mono font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
                {txHash && (
                  <div className="mt-4 pt-3 border-t border-border flex justify-end">
                    <a
                      href={verification?.explorerUrl || getExplorerTxUrl(crypto.id, txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
                    >
                      View Transaction on {crypto.explorerLabel} ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 py-3.5 tesla-btn-primary rounded min-h-[48px] flex items-center justify-center text-xs font-semibold tracking-wider uppercase"
                >
                  Go to Dashboard →
                </Link>
                <Link
                  href="/invest"
                  className="flex-1 py-3.5 tesla-btn-outline rounded min-h-[48px] flex items-center justify-center text-xs font-semibold tracking-wider uppercase"
                >
                  Allocate to Investment
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
