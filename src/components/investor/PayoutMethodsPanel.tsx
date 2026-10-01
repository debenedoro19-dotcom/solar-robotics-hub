/**
 * Drop-in: manage saved crypto withdrawal methods.
 * Path on server: src/components/investor/PayoutMethodsPanel.tsx
 *
 * Usage:
 *   <PayoutMethodsPanel />
 */
import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CRYPTO_NETWORKS,
  type CryptoNetworkId,
  type PayoutMethod,
  getNetwork,
  maskAddress,
  validateCryptoAddress,
} from './payoutMethods';

export function PayoutMethodsPanel() {
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [network, setNetwork] = useState<CryptoNetworkId>('usdt_trc20');
  const [address, setAddress] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setMethods([]);
        return;
      }
      const { data, error: qErr } = await supabase
        .from('user_payout_methods')
        .select('*')
        .eq('user_id', auth.user.id)
        .eq('type', 'crypto')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setMethods((data as PayoutMethod[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load methods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addMethod(e: React.FormEvent) {
    e.preventDefault();
    const addrErr = validateCryptoAddress(network, address);
    if (addrErr) {
      setError(addrErr);
      return;
    }
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Sign in required');

      const net = getNetwork(network);
      const makeDefault = methods.length === 0;

      const { error: insErr } = await supabase.from('user_payout_methods').insert({
        user_id: auth.user.id,
        type: 'crypto',
        label: label.trim() || net?.label || 'Crypto wallet',
        network,
        address: address.trim(),
        is_default: makeDefault,
      });
      if (insErr) throw insErr;

      setLabel('');
      setAddress('');
      setOpen(false);
      setMsg('Withdrawal method saved.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save method');
    } finally {
      setBusy(false);
    }
  }

  async function setDefault(id: string) {
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { data, error: rpcErr } = await supabase.rpc('set_default_payout_method', { _id: id });
      if (rpcErr) throw rpcErr;
      const res = data as { ok?: boolean; error?: string } | null;
      if (res && res.ok === false) throw new Error(res.error || 'Failed');
      setMsg('Default method updated.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set default');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this withdrawal method?')) return;
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase.from('user_payout_methods').delete().eq('id', id);
      if (delErr) throw delErr;
      setMsg('Method removed.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight">Withdrawal methods</h3>
          <p className="text-[12.5px] text-fin-muted mt-1 max-w-lg leading-relaxed">
            Save crypto wallets once. We validate the address format before anything is stored. Payouts only go to
            methods you control.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 px-3.5 py-2 rounded btn-emerald text-xs font-semibold"
        >
          {open ? 'Cancel' : 'Add method'}
        </button>
      </div>

      {(error || msg) && (
        <p className={`text-xs font-medium ${error ? 'text-fin-danger' : 'text-fin-emerald'}`}>{error || msg}</p>
      )}

      {open && (
        <form onSubmit={addMethod} className="rounded-md border border-fin-border bg-[var(--surface-2)] p-4 space-y-3">
          <div>
            <label className="fin-label block mb-1.5">Label (optional)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My TRC20 wallet"
              className="field-fin px-3 py-2.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="fin-label block mb-1.5">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as CryptoNetworkId)}
              className="field-fin px-3 py-2.5 text-sm w-full"
            >
              {CRYPTO_NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} · {n.feeHint}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fin-label block mb-1.5">Wallet address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={getNetwork(network)?.placeholder || 'Address'}
              className="field-fin px-3 py-2.5 text-sm w-full font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" disabled={busy} className="w-full py-2.5 rounded btn-emerald text-sm font-semibold disabled:opacity-50">
            {busy ? 'Saving…' : 'Save method'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-fin-muted">Loading…</p>
      ) : methods.length === 0 ? (
        <div className="rounded-md border border-dashed border-fin-border p-6 text-center">
          <p className="text-sm text-fin-muted">No saved methods yet. Add a crypto wallet to withdraw faster and safer.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {methods.map((m) => {
            const net = getNetwork(m.network);
            return (
              <li
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-fin-border bg-[var(--surface-2)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{m.label || net?.label || 'Crypto'}</span>
                    {m.is_default && (
                      <span className="text-[10px] uppercase tracking-wide font-bold text-fin-emerald bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    {m.is_verified && (
                      <span className="text-[10px] uppercase tracking-wide font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-fin-muted mt-0.5">
                    {net?.label || m.network} · {maskAddress(m.address || '')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!m.is_default && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDefault(m.id)}
                      className="px-3 py-1.5 rounded-lg border border-fin-border text-[11px] font-semibold text-fin-muted hover:text-foreground"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(m.id)}
                    className="px-3 py-1.5 rounded-lg border border-fin-border text-[11px] font-semibold text-fin-danger/90 hover:text-fin-danger"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-fin-muted leading-relaxed">
        Always double-check the network matches the address — sending on the wrong network can mean lost funds.
      </p>
    </div>
  );
}
