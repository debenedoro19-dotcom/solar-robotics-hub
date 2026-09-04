import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WITHDRAWAL_FEE_RATE, money } from './wallet';
import { sendWithdrawalRequestedEmail } from '@/lib/emailService';

export function MetricCard({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="fin-card rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-fin-muted mb-2">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${accent ? 'text-fin-emerald' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-[11px] text-fin-muted mt-1">{sub}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, dismissible = true, maxWidth = 'max-w-md' }: {
  title: string; onClose: () => void; children: React.ReactNode; dismissible?: boolean; maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 fin-overlay backdrop-blur-[6px] animate-[fadeSlideUp_.18s_ease-out]" role="dialog" aria-modal="true">
      <div className={`w-full ${maxWidth} fin-modal p-6 sm:p-7 max-h-[90vh] overflow-y-auto animate-[fadeSlideUp_.24s_cubic-bezier(.22,1,.36,1)]`}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
          {dismissible && (
            <button onClick={onClose} aria-label="Close" className="text-fin-muted hover:text-foreground text-xl leading-none -mt-1">×</button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-fin-muted">{label}</span>
      <span className={`fin-figure text-sm ${strong ? 'font-bold' : 'font-semibold'} ${accent ? 'text-fin-emerald' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

const maskDestination = (v: string) =>
  v.length <= 10 ? v : `${v.slice(0, 6)}••••${v.slice(-4)}`;

type Stage = 'form' | 'confirm' | 'processing' | 'success' | 'failed';

export function WithdrawModal({ balance, userId, userEmail, onClose, onDone, onError }: {
  balance: number; userId: string; userEmail: string; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void;
}) {
  const [stage, setStage] = useState<Stage>('form');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('USDT (TRC-20)');
  const [txId, setTxId] = useState('');
  const [failReason, setFailReason] = useState('');
  const [copied, setCopied] = useState(false);

  const value = Number(amount) || 0;
  const fee = value * WITHDRAWAL_FEE_RATE;
  const net = value - fee;
  const insufficient = value > balance;

  function review() {
    if (value <= 0) { onError('Enter a withdrawal amount'); return; }
    if (!address.trim()) { onError('Enter a destination wallet address'); return; }
    if (insufficient) { onError('Amount exceeds available balance'); return; }
    setStage('confirm');
  }

  async function submit() {
    setStage('processing');
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc('submit_withdrawal_request', {
        _amount: value,
        _method: 'crypto',
        _wallet_address: address.trim(),
        _bank_name: null,
        _account_number: null,
        _account_name: null,
        _routing_number: null,
        _description: `Crypto withdrawal · ${network} · network fee ${money(fee)}`,
      });
      const result = data as { ok?: boolean; request_id?: string; error?: string } | null;
      if (error) throw new Error(error.message);
      if (!result?.ok) throw new Error(result?.error || 'The request could not be processed.');
      setTxId(result.request_id ?? '');
      setStage('success');
      void sendWithdrawalRequestedEmail(value.toString()).catch(() => {});
    } catch (err) {
      setFailReason(err instanceof Error ? err.message : 'Unexpected error while processing your withdrawal.');
      setStage('failed');
    }
  }

  if (stage === 'processing') {
    return (
      <Modal title="Processing Withdrawal" onClose={() => {}} dismissible={false}>
        <div className="flex flex-col items-center text-center py-6">
          <div className="h-14 w-14 rounded-full border-2 border-fin-border border-t-primary animate-spin" aria-hidden="true" />
          <p className="mt-6 text-sm font-semibold text-foreground">Your withdrawal is being securely processed…</p>
          <p className="mt-2 text-sm text-fin-muted">Estimated time: 2–15 minutes</p>
          <p className="mt-6 fin-label text-fin-muted">Please do not close this window</p>
        </div>
      </Modal>
    );
  }

  if (stage === 'success') {
    return (
      <Modal title="Withdrawal Successful" onClose={() => { onDone('Withdrawal request submitted for review'); onClose(); }}>
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-fin-emerald/12 text-fin-emerald flex items-center justify-center text-2xl">✓</div>
          <p className="mt-4 text-sm font-semibold text-foreground">Your funds are on the way</p>
        </div>
        <div className="mt-6 rounded-xl border border-fin-border bg-[var(--surface-2)] p-4">
          <Row label="Amount" value={money(value)} strong />
          <Row label="You receive" value={money(Math.max(0, net))} accent strong />
          <Row label="Estimated arrival" value="2–15 minutes" />
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-fin-muted">Transaction ID</span>
            <button
              type="button"
              onClick={() => { void navigator.clipboard.writeText(txId); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
              className="fin-figure text-xs font-semibold text-foreground hover:text-primary transition-colors"
            >
              {copied ? 'Copied' : `${txId.slice(0, 8)}… ⧉`}
            </button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href="/account?tab=withdrawals" className="py-3 rounded-xl border border-fin-border text-sm font-semibold text-foreground text-center hover:border-primary/50 transition-colors">
            View Transaction
          </a>
          <button onClick={() => { onDone('Withdrawal request submitted for review'); onClose(); }} className="py-3 rounded-xl btn-emerald text-sm">
            Done
          </button>
        </div>
      </Modal>
    );
  }

  if (stage === 'failed') {
    return (
      <Modal title="Withdrawal Could Not Be Completed" onClose={onClose}>
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-fin-danger/12 text-fin-danger flex items-center justify-center text-2xl">!</div>
          <p className="mt-4 text-sm font-semibold text-foreground">{failReason}</p>
          <p className="mt-2 text-sm text-fin-muted">
            Check the amount and destination address, then try again. If this keeps happening, our team can resolve it for you.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => setStage('form')} className="py-3 rounded-xl btn-emerald text-sm">Try Again</button>
          <a href="mailto:support@tradeenergyhub.com" className="py-3 rounded-xl border border-fin-border text-sm font-semibold text-foreground text-center hover:border-primary/50 transition-colors">
            Contact Support
          </a>
        </div>
      </Modal>
    );
  }

  if (stage === 'confirm') {
    return (
      <Modal title="Confirm Withdrawal" onClose={() => setStage('form')}>
        <div className="rounded-xl border border-fin-border bg-[var(--surface-2)] p-4">
          <Row label="Amount" value={money(value)} strong />
          <Row label="Destination" value={maskDestination(address.trim())} />
          <Row label="Network" value={network} />
          <Row label="Network fee (1.5%)" value={money(fee)} />
          <div className="h-px bg-[var(--fin-border)] my-2" />
          <Row label="Net amount" value={money(Math.max(0, net))} accent strong />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-fin-muted">
          This action cannot be undone once confirmed. Please verify all details carefully.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => setStage('form')} className="py-3 rounded-xl border border-fin-border text-sm font-semibold text-foreground hover:border-primary/50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} className="py-3 rounded-xl btn-emerald text-sm">Confirm Withdrawal</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Withdraw Funds" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl bg-[var(--surface-2)] border border-fin-border p-4">
          <p className="fin-label">Available Balance</p>
          <p className={`text-2xl font-extrabold tabular-nums ${insufficient ? 'text-fin-danger' : 'text-fin-emerald'}`}>{money(balance)}</p>
          <p className="text-[11px] text-fin-muted mt-2">
            Capital locked in active contracts is not withdrawable — it unlocks automatically, with its yield, when the
            contract term completes.
          </p>
        </div>

        <div>
          <label htmlFor="wd-network" className="fin-label block mb-2">Network</label>
          <select id="wd-network" value={network} onChange={(e) => setNetwork(e.target.value)} className="field-fin px-4 py-3 text-sm">
            <option>USDT (TRC-20)</option>
            <option>USDT (ERC-20)</option>
            <option>Bitcoin (BTC)</option>
          </select>
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

        <div className="rounded-xl border border-fin-border bg-[var(--surface-2)] p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-fin-muted">Network fee (1.5%)</span><span className="font-bold fin-figure text-foreground">{money(fee)}</span></div>
          <div className="flex justify-between"><span className="text-fin-muted">You receive</span><span className="font-bold text-fin-emerald tabular-nums">{money(Math.max(0, net))}</span></div>
        </div>

        <button onClick={review} disabled={insufficient} className="w-full py-3 rounded-xl btn-emerald text-sm disabled:opacity-40 disabled:hover:transform-none">
          {insufficient ? 'Insufficient balance' : 'Review Withdrawal'}
        </button>
      </div>
    </Modal>
  );
}

