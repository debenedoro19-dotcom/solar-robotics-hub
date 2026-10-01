/**
 * Drop-in replacement for WithdrawModal.
 *
 * Option A — paste this function into modals.tsx (replace old WithdrawModal only).
 * Option B — save as src/components/investor/WithdrawModal.tsx and import it.
 *
 * Props are unchanged so existing call sites keep working.
 */
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendWithdrawalRequestedEmail } from '@/lib/emailService';
import { sendWithdrawalCode, confirmWithdrawal } from '@/lib/withdrawal-confirm.functions';
import {
  FALLBACK_WITHDRAWAL,
  getNetwork,
  maskAddress,
  money,
  type PayoutMethod,
  validateCryptoAddress,
} from './payoutMethods';

// ── local shells (same look as investor modals) ─────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 fin-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-md fin-modal p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-fin-muted hover:text-foreground text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LockedModal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 fin-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-md fin-modal p-6 text-center">
        <h2 className="text-lg font-bold text-foreground tracking-tight mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

type Stage = 'form' | 'confirm' | 'processing' | 'code' | 'success' | 'failed';

const FEE_RATE = FALLBACK_WITHDRAWAL.feeRate;
const MIN_AMOUNT = FALLBACK_WITHDRAWAL.minAmount;

export function WithdrawModal({
  balance,
  userId,
  userEmail,
  onClose,
  onDone,
  onError,
}: {
  balance: number;
  userId: string;
  userEmail: string;
  onClose: () => void;
  onDone: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [methodId, setMethodId] = useState('');
  const [oneOffAddress, setOneOffAddress] = useState('');
  const [oneOffNetwork, setOneOffNetwork] = useState('usdt_trc20');
  const [useSaved, setUseSaved] = useState(true);
  const [loadingMethods, setLoadingMethods] = useState(true);

  const [stage, setStage] = useState<Stage>('form');
  const [txCode, setTxCode] = useState('');
  const [failure, setFailure] = useState('');
  const [requestId, setRequestId] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);

  const [idemKey] = useState(
    () => globalThis.crypto?.randomUUID?.() ?? `wd-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  void userId;
  void userEmail;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        const { data } = await supabase
          .from('user_payout_methods')
          .select('*')
          .eq('user_id', auth.user.id)
          .eq('type', 'crypto')
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
        if (cancelled) return;
        const list = (data as PayoutMethod[]) || [];
        setMethods(list);
        const def = list.find((m) => m.is_default) || list[0];
        if (def) {
          setMethodId(def.id);
          setUseSaved(true);
        } else {
          setUseSaved(false);
        }
      } finally {
        if (!cancelled) setLoadingMethods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = methods.find((m) => m.id === methodId);
  const value = Number(amount) || 0;
  const fee = value * FEE_RATE;
  const net = value - fee;
  const insufficient = value > balance;

  function destinationLabel(): string {
    if (useSaved && selected) {
      const net = getNetwork(selected.network);
      return `${selected.label || net?.label || 'Wallet'} · ${maskAddress(selected.address || '')}`;
    }
    return `${getNetwork(oneOffNetwork)?.label || oneOffNetwork} · ${maskAddress(oneOffAddress)}`;
  }

  function review() {
    if (value <= 0) {
      onError('Enter a withdrawal amount');
      return;
    }
    if (value < MIN_AMOUNT) {
      onError(`Minimum withdrawal is $${MIN_AMOUNT}`);
      return;
    }
    if (insufficient) {
      onError('Amount exceeds available balance');
      return;
    }
    if (useSaved) {
      if (!selected?.address) {
        onError('Select a saved withdrawal method (or add one under Withdrawal methods)');
        return;
      }
      const err = validateCryptoAddress(selected.network || '', selected.address);
      if (err) {
        onError(err);
        return;
      }
    } else {
      const err = validateCryptoAddress(oneOffNetwork, oneOffAddress);
      if (err) {
        onError(err);
        return;
      }
    }
    setStage('confirm');
  }

  async function submit() {
    setStage('processing');
    setFailure('');
    try {
      const walletAddress = useSaved ? (selected?.address || '').trim() : oneOffAddress.trim();
      const networkId = useSaved ? selected?.network || 'crypto' : oneOffNetwork;
      const netMeta = getNetwork(networkId);

      const supabase = createClient();
      const { data, error } = await supabase.rpc('submit_withdrawal_request', {
        _amount: value,
        _method: 'crypto',
        _wallet_address: walletAddress,
        _description: `Crypto withdrawal · ${netMeta?.label || networkId} (1.5% fee ${money(fee)})`,
        _idempotency_key: idemKey,
      });
      if (error) throw new Error(error.message);
      const res = data as
        | { ok: boolean; error?: string; tx_code?: string; request_id?: string; requires_confirmation?: boolean }
        | null;
      if (!res?.ok) throw new Error(res?.error ?? 'Withdrawal could not be submitted');

      setTxCode(res.tx_code ?? '');

      if (res.requires_confirmation && res.request_id) {
        setRequestId(res.request_id);
        const sent = await sendWithdrawalCode({ data: { requestId: res.request_id } }).catch(() => null);
        if (sent && 'ok' in sent && sent.ok) {
          setMaskedEmail(('maskedEmail' in sent && sent.maskedEmail) || 'your email');
          setNeedsTotp(Boolean('requiresTotp' in sent && sent.requiresTotp));
        }
        setStage('code');
        return;
      }

      void sendWithdrawalRequestedEmail(value.toString()).catch(() => {});
      setStage('success');
      onDone(`Withdrawal request submitted${res.tx_code ? ` · ${res.tx_code}` : ''}`);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Withdrawal could not be submitted');
      setStage('failed');
    }
  }

  async function confirmCode() {
    setCodeBusy(true);
    setCodeError('');
    const res = await confirmWithdrawal({
      data: { requestId, code: emailCode.trim(), totp: totpCode.trim() || undefined },
    }).catch(() => null);
    setCodeBusy(false);
    if (!res || !('ok' in res) || !res.ok) {
      setCodeError((res && 'error' in res ? res.error : '') || 'Could not confirm this withdrawal');
      return;
    }
    void sendWithdrawalRequestedEmail(value.toString()).catch(() => {});
    setStage('success');
    onDone(`Withdrawal confirmed${txCode ? ` · ${txCode}` : ''}`);
  }

  if (stage === 'code') {
    return (
      <LockedModal title="Confirm your withdrawal">
        <p className="text-sm text-fin-muted mb-4">
          Enter the 6-digit code we sent to {maskedEmail || 'your email'}.
        </p>
        <input
          value={emailCode}
          onChange={(e) => setEmailCode(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          className="field-fin px-4 py-3 text-center text-lg tracking-[0.3em] font-mono w-full mb-3"
        />
        {needsTotp && (
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="Authenticator code"
            className="field-fin px-4 py-3 text-center text-sm w-full mb-3"
          />
        )}
        {codeError && <p className="text-xs text-fin-danger mb-2">{codeError}</p>}
        <button
          type="button"
          disabled={codeBusy || emailCode.trim().length < 6}
          onClick={() => void confirmCode()}
          className="w-full py-3 rounded btn-emerald text-sm font-semibold disabled:opacity-50"
        >
          {codeBusy ? 'Confirming…' : 'Confirm withdrawal'}
        </button>
        <button
          type="button"
          className="mt-3 text-xs text-fin-muted hover:text-foreground"
          onClick={() => sendWithdrawalCode({ data: { requestId } }).catch(() => {})}
        >
          Resend code
        </button>
      </LockedModal>
    );
  }

  if (stage === 'processing') {
    return (
      <LockedModal title="Processing withdrawal">
        <p className="text-sm text-fin-muted">Securing your request…</p>
      </LockedModal>
    );
  }

  if (stage === 'success') {
    return (
      <LockedModal title="Withdrawal submitted">
        <p className="text-sm text-fin-muted mb-4">
          Your request is in the queue. You will receive updates by email.
          {txCode ? ` Reference: ${txCode}` : ''}
        </p>
        <button onClick={onClose} className="w-full py-3 rounded btn-emerald text-sm font-semibold">
          Done
        </button>
      </LockedModal>
    );
  }

  if (stage === 'failed') {
    return (
      <LockedModal title="Withdrawal failed">
        <p className="text-sm text-fin-danger mb-4">{failure}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setStage('form')}
            className="flex-1 py-3 rounded border border-fin-border text-sm font-semibold text-fin-muted hover:text-foreground"
          >
            Back
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded btn-emerald text-sm font-semibold">
            Close
          </button>
        </div>
      </LockedModal>
    );
  }

  if (stage === 'confirm') {
    return (
      <Modal title="Confirm Withdrawal" onClose={() => setStage('form')}>
        <div className="space-y-4">
          <div className="rounded border border-fin-border bg-[var(--surface-2)] p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-fin-muted">Amount</span>
              <span className="font-bold fin-figure">{money(value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fin-muted">Network fee (1.5%)</span>
              <span className="font-bold fin-figure text-foreground">{money(fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fin-muted">You receive</span>
              <span className="font-bold text-fin-emerald tabular-nums">{money(Math.max(0, net))}</span>
            </div>
            <div className="pt-2 border-t border-fin-border">
              <p className="text-[11px] text-fin-muted">Destination</p>
              <p className="text-sm font-medium text-foreground break-all">{destinationLabel()}</p>
            </div>
          </div>
          <p className="text-[11px] text-fin-muted leading-relaxed">
            {money(value)} will be reserved from your available balance. Payouts are irreversible once processed.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setStage('form')}
              className="flex-1 py-3 rounded border border-fin-border text-sm font-semibold text-fin-muted hover:text-foreground"
            >
              Edit
            </button>
            <button onClick={() => void submit()} className="flex-1 py-3 rounded btn-emerald text-sm">
              Confirm & Withdraw
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Withdraw Funds" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded bg-[var(--surface-2)] border border-fin-border p-4">
          <p className="fin-label">Available Balance</p>
          <p className={`text-2xl font-extrabold tabular-nums ${insufficient ? 'text-fin-danger' : 'text-fin-emerald'}`}>
            {money(balance)}
          </p>
          <p className="text-[11px] text-fin-muted mt-2">
            Capital locked in active contracts is not withdrawable — it unlocks with yield when the term completes.
          </p>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="fin-label">Destination</label>
            {methods.length > 0 && (
              <button
                type="button"
                className="text-[11px] font-semibold text-primary hover:underline"
                onClick={() => setUseSaved((v) => !v)}
              >
                {useSaved ? 'Use a different address' : 'Use saved method'}
              </button>
            )}
          </div>

          {loadingMethods ? (
            <p className="text-xs text-fin-muted">Loading methods…</p>
          ) : useSaved && methods.length > 0 ? (
            <select
              value={methodId}
              onChange={(e) => setMethodId(e.target.value)}
              className="field-fin px-4 py-3 text-sm w-full"
            >
              {methods.map((m) => {
                const net = getNetwork(m.network);
                return (
                  <option key={m.id} value={m.id}>
                    {(m.is_default ? '★ ' : '') + (m.label || net?.label || 'Wallet')} · {maskAddress(m.address || '')}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="space-y-2">
              <select
                value={oneOffNetwork}
                onChange={(e) => setOneOffNetwork(e.target.value)}
                className="field-fin px-4 py-3 text-sm w-full"
              >
                <option value="usdt_trc20">USDT (TRC-20)</option>
                <option value="usdt_erc20">USDT (ERC-20)</option>
                <option value="usdt_bep20">USDT (BEP-20)</option>
                <option value="btc">Bitcoin (BTC)</option>
                <option value="eth">Ethereum (ETH)</option>
              </select>
              <input
                value={oneOffAddress}
                onChange={(e) => setOneOffAddress(e.target.value)}
                placeholder={getNetwork(oneOffNetwork)?.placeholder || 'Wallet address'}
                className="field-fin px-4 py-3 text-sm w-full font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              {methods.length === 0 && (
                <p className="text-[11px] text-fin-muted">
                  Tip: save a method under <strong>Withdrawal methods</strong> so you don’t retype addresses.
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="wd-amount" className="fin-label block mb-2">
            Amount (USD)
          </label>
          <input
            id="wd-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field-fin px-4 py-3 fin-figure w-full"
            min={MIN_AMOUNT}
            step="0.01"
          />
        </div>

        <div className="rounded border border-fin-border bg-[var(--surface-2)] p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-fin-muted">Network fee (1.5%)</span>
            <span className="font-bold fin-figure text-foreground">{money(fee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fin-muted">You receive</span>
            <span className="font-bold text-fin-emerald tabular-nums">{money(Math.max(0, net))}</span>
          </div>
        </div>

        <button
          onClick={review}
          disabled={insufficient}
          className="w-full py-3 rounded btn-emerald text-sm disabled:opacity-40 disabled:hover:transform-none"
        >
          {insufficient ? 'Insufficient balance' : 'Review Withdrawal'}
        </button>
      </div>
    </Modal>
  );
}
