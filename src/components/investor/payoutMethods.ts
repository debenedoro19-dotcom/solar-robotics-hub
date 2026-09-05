/**
 * Drop-in helpers: crypto networks and address validation.
 * Path on server: src/components/investor/payoutMethods.ts
 */

export type CryptoNetworkId =
  | 'usdt_trc20'
  | 'usdt_erc20'
  | 'usdt_bep20'
  | 'btc'
  | 'eth';

export interface CryptoNetwork {
  id: CryptoNetworkId;
  label: string;
  asset: string;
  /** Typical fee band for UI trust (informational). */
  feeHint: string;
  /** Client-side format check before submit. */
  validate: (address: string) => boolean;
  placeholder: string;
}

export interface PayoutMethod {
  id: string;
  user_id: string;
  type: 'crypto' | 'bank';
  label: string;
  network: string | null;
  address: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  routing_number: string | null;
  region: string | null;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const HEX40 = /^0x[a-fA-F0-9]{40}$/;
const TRON = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const BTC = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;

export const CRYPTO_NETWORKS: CryptoNetwork[] = [
  {
    id: 'usdt_trc20',
    label: 'USDT (TRC-20 · Tron)',
    asset: 'USDT',
    feeHint: 'Low network fee',
    validate: (a) => TRON.test(a.trim()),
    placeholder: 'T… (Tron address)',
  },
  {
    id: 'usdt_erc20',
    label: 'USDT (ERC-20 · Ethereum)',
    asset: 'USDT',
    feeHint: 'Higher gas — use for larger amounts',
    validate: (a) => HEX40.test(a.trim()),
    placeholder: '0x… (Ethereum address)',
  },
  {
    id: 'usdt_bep20',
    label: 'USDT (BEP-20 · BNB Chain)',
    asset: 'USDT',
    feeHint: 'Low network fee',
    validate: (a) => HEX40.test(a.trim()),
    placeholder: '0x… (BSC address)',
  },
  {
    id: 'btc',
    label: 'Bitcoin (BTC)',
    asset: 'BTC',
    feeHint: 'Network fee varies',
    validate: (a) => BTC.test(a.trim()),
    placeholder: 'bc1… or 1… / 3…',
  },
  {
    id: 'eth',
    label: 'Ethereum (ETH)',
    asset: 'ETH',
    feeHint: 'Gas fee varies',
    validate: (a) => HEX40.test(a.trim()),
    placeholder: '0x… (Ethereum address)',
  },
];

export function getNetwork(id: string | null | undefined): CryptoNetwork | undefined {
  return CRYPTO_NETWORKS.find((n) => n.id === id);
}

export function validateCryptoAddress(networkId: string, address: string): string | null {
  const net = getNetwork(networkId);
  if (!net) return 'Select a network';
  const a = address.trim();
  if (!a) return 'Enter a wallet address';
  if (!net.validate(a)) return `Invalid ${net.label} address format`;
  return null;
}

export function maskAddress(address: string): string {
  const a = address.trim();
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Align with existing platform defaults if settings are unavailable */
export const FALLBACK_WITHDRAWAL = {
  minAmount: 20,
  maxAmount: 50_000,
  feeRate: 0.015,
};

export function money(n: number): string {
  return `$${(Number.isFinite(Number(n)) ? Number(n) : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
