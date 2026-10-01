import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WITHDRAWAL_FEE_RATE, money } from './wallet';
import { sendWithdrawalRequestedEmail } from '@/lib/emailService';
import { sendWithdrawalCode, confirmWithdrawal } from '@/lib/withdrawal-confirm.functions';

export function MetricCard({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="fin-card rounded-md p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-fin-muted mb-2">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${accent ? 'text-fin-emerald' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-[11px] text-fin-muted mt-1">{sub}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 fin-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-md fin-modal p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-fin-muted hover:text-foreground text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}




/** Non-dismissible shell used for the processing / result stages. */
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

export function WithdrawModal({ balance, userId, userEmail, onClose, onDone, onError }: {
  balance: number; userId: string; userEmail: string; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
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
  // Stable per-attempt key: retrying the same request can never double-spend.
  const [idemKey] = useState(() =>
    (globalThis.crypto?.randomUUID?.() ?? `wd-${Date.now()}-${Math.random().toString(36).slice(2)}`),
  );

  void userId; void userEmail; // identity comes from the session server-side

  const value = Number(amount) || 0;
  const fee = value * WITHDRAWAL_FEE_RATE;
  const net = value - fee;
  const insufficient = value > balance;

  function review() {
    if (value <= 0) { onError('Enter a withdrawal amount'); return; }
    if (value < 20) { onError('Minimum withdrawal is $20'); return; }
    if (!address.trim()) { onError('Enter a destination wallet address'); return; }
    if (insufficient) { onError('Amount exceeds available balance'); return; }
    setStage('confirm');
  }

  async function submit() {
    setStage('processing');
    setFailure('');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('submit_withdrawal_request', {
        _amount: value,
        _method: 'crypto',
        _wallet_address: address.trim(),
        _description: `Crypto withdrawal (1.5% network fee ${money(fee)})`,
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
        if (!sent?.ok) throw new Error((sent && 'error' in sent ? sent.error : '') || 'Could not send your confirmation code');
        setMaskedEmail(sent.maskedEmail);
        setEmailCode('');
        setCodeError('');
        setStage('code');
        return;
      }

      setStage('success');
      void sendWithdrawalRequestedEmail(value.toString()).catch(() => {});
      onDone(`Withdrawal request submitted${res.tx_code ? ` · ${res.tx_code}` : ''}`);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Withdrawal could not be submitted');
      setStage('failed');
    }
  }

  async function submitCode() {
    setCodeError('');
    setCodeBusy(true);
    const res = await confirmWithdrawal({
      data: { requestId, code: emailCode, totp: totpCode || undefined },
    }).catch(() => null);
    setCodeBusy(false);
    if (!res?.ok) {
      if (res && 'needsTotp' in res && res.needsTotp) setNeedsTotp(true);
      setCodeError((res && 'error' in res ? res.error : '') || 'Could not confirm this withdrawal');
      return;
    }
    setStage('success');
    void sendWithdrawalRequestedEmail(value.toString()).catch(() => {});
    onDone(`Withdrawal confirmed${txCode ? ` · ${txCode}` : ''}`);
  }

  if (stage === 'code') {
    return (
      <LockedModal title="Confirm your withdrawal">
        <p className="text-sm text-fin-muted mb-4">
          We emailed a 6-digit confirmation code to {maskedEmail || 'your registered address'}. The code expires in
          15 minutes — the payout is not queued until it is confirmed.
        </p>
        {txCode && (
          <div className="rounded border border-fin-border bg-[var(--surface-2)] p-3 mb-4">
            <p className="fin-label mb-1">Transaction ID</p>
            <code className="text-sm font-bold text-foreground break-all">{txCode}</code>
          </div>
        )}
        <input
          value={emailCode}
          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="field-fin px-4 py-3 text-center text-lg tracking-[0.4em] fin-figure mb-3"
        />
        {needsTotp && (
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.slice(0, 12))}
            placeholder="Authenticator code"
            className="field-fin px-4 py-3 text-center text-sm tracking-[0.3em] mb-3"
          />
        )}
        {codeError && <p className="text-xs text-fin-danger mb-3">{codeError}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => sendWithdrawalCode({ data: { requestId } }).catch(() => {})}
            className="flex-1 py-3 rounded border border-fin-border text-sm font-semibold text-fin-muted hover:text-foreground"
          >
            Resend code
          </button>
          <button
            onClick={submitCode}
            disabled={codeBusy || emailCode.length !== 6}
            className="flex-1 py-3 rounded btn-emerald text-sm disabled:opacity-40"
          >
            {codeBusy ? 'Confirming…' : 'Confirm withdrawal'}
          </button>
        </div>
      </LockedModal>
    );
  }


  if (stage === 'processing') {
    return (
      <LockedModal title="Processing withdrawal">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-fin-border border-t-fin-emerald animate-spin" />
        <p className="text-sm text-fin-muted">
          Securing your funds and creating the payout request. Do not close this window.
        </p>
      </LockedModal>
    );
  }

  if (stage === 'success') {
    return (
      <LockedModal title="Withdrawal submitted">
        <div className="w-12 h-12 rounded-full bg-fin-emerald-soft border border-fin-emerald/40 flex items-center justify-center mx-auto mb-4 text-fin-emerald text-xl">✓</div>
        <p className="text-sm text-fin-muted mb-4">
          {money(value)} is reserved and queued for payout. You will be emailed once the payout is processed.
        </p>
        {txCode && (
          <div className="rounded border border-fin-border bg-[var(--surface-2)] p-3 mb-5">
            <p className="fin-label mb-1">Transaction ID</p>
            <code className="text-sm font-bold text-foreground break-all">{txCode}</code>
          </div>
        )}
        <button onClick={onClose} className="w-full py-3 rounded btn-emerald text-sm">Done</button>
      </LockedModal>
    );
  }

  if (stage === 'failed') {
    return (
      <LockedModal title="Withdrawal failed">
        <div className="w-12 h-12 rounded-full bg-fin-danger/15 border border-fin-danger/40 flex items-center justify-center mx-auto mb-4 text-fin-danger text-xl">!</div>
        <p className="text-sm text-fin-muted mb-5">{failure}</p>
        <div className="flex gap-3">
          <button onClick={() => setStage('form')} className="flex-1 py-3 rounded border border-fin-border text-sm font-semibold text-fin-muted hover:text-foreground">Back</button>
          <button onClick={submit} className="flex-1 py-3 rounded btn-emerald text-sm">Retry</button>
        </div>
      </LockedModal>
    );
  }

  if (stage === 'confirm') {
    return (
      <Modal title="Confirm Withdrawal" onClose={() => setStage('form')}>
        <div className="space-y-4">
          <div className="rounded border border-fin-border bg-[var(--surface-2)] p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-fin-muted">Amount</span><span className="font-bold fin-figure text-foreground">{money(value)}</span></div>
            <div className="flex justify-between"><span className="text-fin-muted">Network fee (1.5%)</span><span className="font-bold fin-figure text-foreground">{money(fee)}</span></div>
            <div className="flex justify-between"><span className="text-fin-muted">You receive</span><span className="font-bold text-fin-emerald tabular-nums">{money(Math.max(0, net))}</span></div>
            <div className="pt-2 border-t border-fin-border">
              <p className="fin-label mb-1">Destination</p>
              <code className="text-xs break-all text-foreground">{address.trim()}</code>
            </div>
          </div>
          <p className="text-[11px] text-fin-muted">
            Confirming reserves {money(value)} from your available balance immediately. Payouts are irreversible once processed.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setStage('form')} className="flex-1 py-3 rounded border border-fin-border text-sm font-semibold text-fin-muted hover:text-foreground">Edit</button>
            <button onClick={submit} className="flex-1 py-3 rounded btn-emerald text-sm">Confirm & Withdraw</button>
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
          <p className={`text-2xl font-extrabold tabular-nums ${insufficient ? 'text-fin-danger' : 'text-fin-emerald'}`}>{money(balance)}</p>
          <p className="text-[11px] text-fin-muted mt-2">
            Capital locked in active contracts is not withdrawable — it unlocks automatically, with its yield, when the
            contract term completes.
          </p>
        </div>

        <div>
          <label htmlFor="wd-address" className="fin-label block mb-2">Destination Wallet Address</label>
          <input id="wd-address" value={address} onChange={(e) => setAddress(e.target.value)}
            className="field-fin px-4 py-3 text-sm" />
        </div>

        <div>
          <label htmlFor="wd-amount" className="fin-label block mb-2">Amount (USD)</label>
          <input id="wd-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="field-fin px-4 py-3 fin-figure" />
        </div>

        <div className="rounded border border-fin-border bg-[var(--surface-2)] p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-fin-muted">Network fee (1.5%)</span><span className="font-bold fin-figure text-foreground">{money(fee)}</span></div>
          <div className="flex justify-between"><span className="text-fin-muted">You receive</span><span className="font-bold text-fin-emerald tabular-nums">{money(Math.max(0, net))}</span></div>
        </div>

        <button onClick={review} disabled={insufficient} className="w-full py-3 rounded btn-emerald text-sm disabled:opacity-40 disabled:hover:transform-none">
          {insufficient ? 'Insufficient balance' : 'Review Withdrawal'}
        </button>
      </div>
    </Modal>
  );
}
