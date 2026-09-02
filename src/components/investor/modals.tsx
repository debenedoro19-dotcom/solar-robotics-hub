import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WITHDRAWAL_FEE_RATE, money } from './wallet';
import { sendWithdrawalRequestedEmail } from '@/lib/emailService';

export function MetricCard({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="fin-card rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-fin-muted mb-2">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${accent ? 'text-fin-emerald' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[11px] text-fin-muted mt-1">{sub}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md fin-card-elevated rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-fin-muted hover:text-white text-xl leading-none">×</button>
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
        <div className="rounded-xl bg-fin-elevated border border-fin-border p-4">
          <p className="text-[11px] uppercase text-fin-muted">Available Balance</p>
          <p className={`text-2xl font-extrabold tabular-nums ${insufficient ? 'text-fin-danger' : 'text-fin-emerald'}`}>{money(balance)}</p>
        </div>

        <div>
          <label htmlFor="wd-address" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Destination Wallet Address</label>
          <input id="wd-address" value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl bg-fin-bg border border-fin-border px-4 py-3 text-white text-sm focus:border-fin-emerald outline-none" />
        </div>

        <div>
          <label htmlFor="wd-amount" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Amount (USD)</label>
          <input id="wd-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl bg-fin-bg border border-fin-border px-4 py-3 text-white tabular-nums focus:border-fin-emerald outline-none" />
        </div>

        <div className="rounded-xl border border-fin-border bg-fin-elevated p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-fin-muted">Network fee (1.5%)</span><span className="font-bold tabular-nums text-white">{money(fee)}</span></div>
          <div className="flex justify-between"><span className="text-fin-muted">You receive</span><span className="font-bold text-fin-emerald tabular-nums">{money(Math.max(0, net))}</span></div>
        </div>

        <button onClick={submit} disabled={busy || insufficient} className="w-full py-3 rounded-xl bg-fin-emerald text-black font-bold text-sm disabled:opacity-40">
          {busy ? 'Submitting…' : insufficient ? 'Insufficient balance' : 'Confirm Withdrawal'}
        </button>
      </div>
    </Modal>
  );
}
