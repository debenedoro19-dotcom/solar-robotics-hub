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




export function WithdrawModal({ balance, userId, userEmail, onClose, onDone, onError }: {
  balance: number; userId: string; userEmail: string; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const value = Number(amount) || 0;
  const fee = value * WITHDRAWAL_FEE_RATE;
  const net = value - fee;
  const insufficient = value > balance;

  async function submit() {
    if (value <= 0) { onError('Enter a withdrawal amount'); return; }
    if (!address.trim()) { onError('Enter a destination wallet address'); return; }
    if (insufficient) { onError('Amount exceeds available balance'); return; }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('balance_transactions').insert({
      user_id: userId,
      type: 'withdrawal',
      amount: -value,
      status: 'pending',
      wallet_address: address.trim(),
      description: `Crypto withdrawal (1.5% network fee ${money(fee)})`,
      reference: userEmail,
    });
    setBusy(false);
    if (error) { onError(error.message); return; }
    void sendWithdrawalRequestedEmail(value.toString()).catch(() => {});
    onDone('Withdrawal request submitted for review');
    onClose();
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

        <button onClick={submit} disabled={busy || insufficient} className="w-full py-3 rounded-xl btn-emerald text-sm disabled:opacity-40 disabled:hover:transform-none">
          {busy ? 'Submitting…' : insufficient ? 'Insufficient balance' : 'Confirm Withdrawal'}
        </button>
      </div>
    </Modal>
  );
}
