import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface WelcomePopupConfig {
  enabled: boolean;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  delaySeconds: number;
  cooldownHours: number;
}

export interface LeadPopupConfig {
  enabled: boolean;
  title: string;
  body: string;
  ctaLabel: string;
  exitIntent: boolean;
  delaySeconds: number;
  cooldownHours: number;
}

export interface CookieBarConfig {
  enabled: boolean;
  body: string;
}

export interface TickerConfig {
  enabled: boolean;
  intervalSeconds: number;
  minAmount: number;
  maxAmount: number;
}

export const DEFAULT_WELCOME: WelcomePopupConfig = {
  enabled: true,
  title: 'Welcome to Tesla Trade',
  body: 'Explore vehicles, energy, solar and robotics — plus investor packages with daily yield.',
  ctaLabel: 'Explore Inventory',
  ctaHref: '/#inventory',
  delaySeconds: 8,
  cooldownHours: 24,
};

export const DEFAULT_LEAD: LeadPopupConfig = {
  enabled: true,
  title: 'Get Tesla Trade Updates',
  body: 'Join our list for new inventory, plan launches and giveaways.',
  ctaLabel: 'Subscribe',
  exitIntent: true,
  delaySeconds: 30,
  cooldownHours: 72,
};

export const DEFAULT_COOKIE: CookieBarConfig = {
  enabled: true,
  body: 'We use cookies to improve your experience and analyze traffic.',
};

export const DEFAULT_TICKER: TickerConfig = {
  enabled: true,
  intervalSeconds: 22,
  minAmount: 1200,
  maxAmount: 48000,
};

// ── Generic settings access ───────────────────────────────────────────────────
// Every admin settings group lives in one `site_settings` row. Reads are cached
// per key and the cache is invalidated on save so changes take effect at once.

export const SETTINGS_KEYS = {
  platform: 'platform',
  security: 'security',
  customerCare: 'customer_care',
  email: 'email',
  cryptoWallets: 'crypto_wallets',
  giveaways: 'giveaways',
  popupWelcome: 'popup_welcome',
  popupLead: 'popup_lead',
  popupCookie: 'popup_cookie',
  ticker: 'withdrawal_ticker',
} as const;

const cache = new Map<string, unknown>();
const listeners = new Set<(key: string) => void>();

export function invalidateSetting(key: string) {
  cache.delete(key);
  listeners.forEach((fn) => fn(key));
}

export async function loadSetting<T>(key: string, fallback: T, force = false): Promise<T> {
  if (!force && cache.has(key)) return cache.get(key) as T;
  let result = fallback;
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (data?.value !== null && data?.value !== undefined) {
      result = Array.isArray(fallback)
        ? ((Array.isArray(data.value) ? data.value : fallback) as T)
        : ({ ...(fallback as object), ...(data.value as object) } as T);
    }
  } catch {}
  cache.set(key, result);
  return result;
}

/** Persists a settings group. Throws with a readable message when denied. */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error(error.message || 'Failed to save settings.');
  invalidateSetting(key);
}

const fetchSetting = loadSetting;

export function useSiteSetting<T>(key: string, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    let cancelled = false;
    const run = () =>
      void fetchSetting(key, fallback).then((v) => {
        if (!cancelled) setValue(v);
      });
    run();
    const onChange = (changed: string) => {
      if (changed === key) run();
    };
    listeners.add(onChange);
    return () => {
      cancelled = true;
      listeners.delete(onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return value;
}

// ── Customer care (footer / support widget / support page) ────────────────────

export interface CustomerCareConfig {
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  telegramEnabled: boolean;
  telegramUsername: string;
  telegramMessage: string;
  supportEmail: string;
  supportHours: string;
}

export const DEFAULT_CUSTOMER_CARE: CustomerCareConfig = {
  whatsappEnabled: false,
  whatsappNumber: '',
  whatsappMessage: 'Hello! I need help with my Tesla Trade account.',
  telegramEnabled: false,
  telegramUsername: '',
  telegramMessage: 'Hello! I need support with Tesla Trade.',
  supportEmail: 'support@tradeenergy.app',
  supportHours: 'Mon–Fri, 9am–6pm UTC',
};

export function useCustomerCare(): CustomerCareConfig {
  return useSiteSetting(SETTINGS_KEYS.customerCare, DEFAULT_CUSTOMER_CARE);
}

