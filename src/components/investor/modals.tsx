import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NETWORKS, WITHDRAWAL_FEE_RATE, money } from './wallet';

export function MetricCard({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="fin-card rounded-2xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-fin-muted mb-2">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${accent ? 'text-fin-emerald' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[11px] text-fin-muted mt-1">{sub}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md fin-card-elevated rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-fin-muted hover:text-white text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DepositModal({ userId, userEmail, onClose, onDone, onError }: {
  userId: string; userEmail: string; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void;
}) {
  const [network, setNetwork] = useState(NETWORKS[0]!);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit() {
    const value = Number(amount) || 0;
    if (value <= 0) { onError('Enter a deposit amount'); return; }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('balance_transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount: value,
      status: 'pending',
      payment_method: network.label,
      wallet_address: network.address,
      description: `Crypto deposit via ${network.label}`,
      reference: userEmail,
    });
    setBusy(false);
    if (error) { onError(error.message); return; }
    onDone('Deposit request submitted — pending confirmation');
    onClose();
  }

  return (
    <Modal title="Deposit Funds" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-fin-muted mb-2">Network</p>
          <div className="grid gap-2">
            {NETWORKS.map((n) => (
              <button key={n.id} onClick={() => setNetwork(n)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-left border transition-colors ${network.id === n.id ? 'border-fin-emerald bg-fin-emerald-soft text-fin-emerald' : 'border-fin-border bg-fin-elevated text-fin-muted hover:text-white'}`}>
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-fin-elevated border border-fin-border p-4">
          <p className="text-xs uppercase tracking-wider text-fin-muted mb-2">Deposit Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all text-white">{network.address}</code>
            <button
              onClick={() => { void navigator.clipboard?.writeText(network.address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-fin-emerald text-black shrink-0">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-4 h-32 rounded-lg border border-dashed border-fin-border flex items-center justify-center text-xs text-fin-muted">
            QR code
          </div>
        </div>

        <div>
          <label htmlFor="deposit-amount" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Amount (USD)</label>
          <input id="deposit-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg bg-fin-bg border border-fin-border px-4 py-3 text-white tabular-nums focus:border-fin-emerald outline-none" />
        </div>

        <button onClick={submit} disabled={busy} className="w-full py-3 rounded-lg bg-fin-emerald text-black font-bold text-sm disabled:opacity-40">
          {busy ? 'Submitting…' : 'Submit Deposit Request'}
        </button>
      </div>
    </Modal>
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
            className="w-full rounded-lg bg-fin-bg border border-fin-border px-4 py-3 text-white text-sm focus:border-fin-emerald outline-none" />
        </div>

        <div>
          <label htmlFor="wd-amount" className="block text-xs uppercase tracking-wider text-fin-muted mb-2">Amount (USD)</label>
          <input id="wd-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg bg-fin-bg border border-fin-border px-4 py-3 text-white tabular-nums focus:border-fin-emerald outline-none" />
        </div>

        <div className="rounded-xl border border-fin-border bg-fin-elevated p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-fin-muted">Network fee (1.5%)</span><span className="font-bold tabular-nums text-white">{money(fee)}</span></div>
          <div className="flex justify-between"><span className="text-fin-muted">You receive</span><span className="font-bold text-fin-emerald tabular-nums">{money(Math.max(0, net))}</span></div>
        </div>

        <button onClick={submit} disabled={busy || insufficient} className="w-full py-3 rounded-lg bg-fin-emerald text-black font-bold text-sm disabled:opacity-40">
          {busy ? 'Submitting…' : insufficient ? 'Insufficient balance' : 'Confirm Withdrawal'}
        </button>
      </div>
    </Modal>
  );
}
