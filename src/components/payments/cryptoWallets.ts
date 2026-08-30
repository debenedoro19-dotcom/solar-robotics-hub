import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type CryptoWalletMap = {
  btc: string;
  eth: string;
  usdt: string;
};

export const DEFAULT_CRYPTO_WALLETS: CryptoWalletMap = {
  btc: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf6',
  eth: '0x742d35Cc6634C0532925a3b8D4C9C4e8b1e2F3A4',
  usdt: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
};

/** BIP-21 / EIP-681 style URI so wallet apps auto-fill on scan. */
export function walletUri(id: string, address: string, amount?: number): string {
  if (!address) return '';
  const amt = amount && Number.isFinite(amount) && amount > 0 ? amount : undefined;
  if (id === 'btc') return `bitcoin:${address}${amt ? `?amount=${amt}` : ''}`;
  if (id === 'eth' || id === 'usdt_erc20') return `ethereum:${address}`;
  return address;
}

/** Live crypto wallet addresses configured by admin in Settings → Payments. */
export function useCryptoWallets() {
  const [wallets, setWallets] = useState<CryptoWalletMap>(DEFAULT_CRYPTO_WALLETS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'crypto_wallets')
          .maybeSingle();
        const v = (data?.value ?? null) as Partial<CryptoWalletMap> | null;
        if (active && v) {
          setWallets({
            btc: v.btc || DEFAULT_CRYPTO_WALLETS.btc,
            eth: v.eth || DEFAULT_CRYPTO_WALLETS.eth,
            usdt: v.usdt || DEFAULT_CRYPTO_WALLETS.usdt,
          });
        }
      } catch {
        /* keep defaults */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, []);

  return { wallets, loaded };
}
