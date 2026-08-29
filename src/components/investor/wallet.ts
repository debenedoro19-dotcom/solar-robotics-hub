import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// ── Shared wallet contract used by BOTH the dashboard and the account area ────
export interface Wallet {
  available_balance: number;
  total_invested: number;
  total_profit: number;
  total_deposited: number;
  total_withdrawn: number;
  total_returns: number;
}

export interface LedgerRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  payment_method?: string | null;
  wallet_address?: string | null;
  created_at: string;
}

export const EMPTY_WALLET: Wallet = {
  available_balance: 0,
  total_invested: 0,
  total_profit: 0,
  total_deposited: 0,
  total_withdrawn: 0,
  total_returns: 0,
};

export const NETWORKS = [
  { id: 'usdt_trc20', label: 'USDT (TRC-20)', address: 'TQn9Y2khDD95J42FQtQTdwVVRZqjHqPzGm' },
  { id: 'usdt_erc20', label: 'USDT (ERC-20)', address: '0x7a3B9c1D5e8F2a4b6C0d9E1f3A5b7C9d1E3f5A70' },
  { id: 'btc', label: 'Bitcoin (BTC)', address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' },
];

export const WITHDRAWAL_FEE_RATE = 0.015;

export const money = (n: number) =>
  `$${(Number.isFinite(Number(n)) ? Number(n) : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function toWallet(row: Record<string, unknown> | null | undefined): Wallet {
  if (!row) return EMPTY_WALLET;
  return {
    available_balance: Number(row['available_balance'] ?? 0),
    total_invested: Number(row['total_invested'] ?? 0),
    total_profit: Number(row['total_profit'] ?? 0),
    total_deposited: Number(row['total_deposited'] ?? 0),
    total_withdrawn: Number(row['total_withdrawn'] ?? 0),
    total_returns: Number(row['total_returns'] ?? 0),
  };
}

/**
 * Single source of truth for the signed-in investor's wallet.
 * Both /dashboard and /account read through this so the numbers never drift,
 * and both stay live via the same realtime channel.
 */
export function useWallet() {
  const [wallet, setWallet] = useState<Wallet>(EMPTY_WALLET);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (uid?: string) => {
    const supabase = createClient();
    let id = uid ?? null;
    if (!id) {
      const { data } = await supabase.auth.getUser();
      id = data?.user?.id ?? null;
    }
    if (!id) return;
    const { data: row } = await supabase.from('user_balance').select('*').eq('user_id', id).maybeSingle();
    if (!row) {
      await supabase.from('user_balance').insert({ user_id: id });
      setWallet(EMPTY_WALLET);
      return;
    }
    setWallet(toWallet(row));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (cancelled) return;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? '');
      setUserName(user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Investor');
      await refresh(user.id);
      if (cancelled) return;
      setLoading(false);

      channel = supabase
        .channel(`wallet_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_balance', filter: `user_id=eq.${user.id}` },
          (payload: { new: Record<string, unknown> }) => setWallet(toWallet(payload.new)),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { wallet, setWallet, userId, userEmail, userName, loading, refresh };
}
