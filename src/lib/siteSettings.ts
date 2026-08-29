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

async function fetchSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (data?.value && typeof data.value === 'object') {
      return { ...fallback, ...(data.value as Partial<T>) };
    }
  } catch {}
  return fallback;
}

export function useSiteSetting<T>(key: string, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    let cancelled = false;
    void fetchSetting(key, fallback).then((v) => {
      if (!cancelled) setValue(v);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return value;
}
