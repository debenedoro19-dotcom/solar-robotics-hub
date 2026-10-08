import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { emailSafeOrigin } from '@/lib/site-url';

type Provider = 'google' | 'apple';

/** Google + Apple sign-in, styled as rounded monochrome pills. */
export default function SocialAuthButtons({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState('');
  const verb = mode === 'signup' ? 'Sign up' : 'Continue';

  async function go(provider: Provider) {
    setError('');
    setBusy(provider);
    let next = '/dashboard';
    const wanted = new URLSearchParams(window.location.search).get('redirect');
    if (wanted && wanted.startsWith('/') && !wanted.startsWith('//')) next = wanted;
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${emailSafeOrigin()}/auth/callback?oauth=1&next=${encodeURIComponent(next)}`,
        ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    });
    if (error) {
      setBusy(null);
      setError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is unavailable right now. Please use email instead.`);
    }
  }

  const btn = 'w-full h-12 lux-pill flex items-center justify-center gap-3 text-sm font-medium transition-colors disabled:opacity-60';

  return (
    <div className="space-y-3">
      {error && <div className="px-4 py-3 rounded bg-primary/10 border border-primary/30 text-sm text-primary">{error}</div>}
      <button type="button" onClick={() => go('apple')} disabled={!!busy}
        className={`${btn} bg-foreground text-background hover:opacity-90`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.06-.9.94-1.97 1.48-3.13 1.39a3.2 3.2 0 0 1-.02-.39c0-1.09.47-2.25 1.3-3.1.42-.44.95-.8 1.6-1.08.64-.28 1.25-.43 1.83-.46.02.2.03.39.03.58ZM20.5 17.1c-.36.83-.79 1.6-1.29 2.3-.68.97-1.24 1.64-1.67 2.01-.67.61-1.39.93-2.16.94-.55 0-1.22-.16-1.99-.48-.78-.32-1.49-.47-2.15-.47-.69 0-1.43.15-2.22.47-.79.32-1.43.49-1.92.5-.74.03-1.47-.3-2.2-.97-.47-.4-1.05-1.1-1.75-2.1-.75-1.06-1.37-2.29-1.85-3.69C.77 14.1.5 12.64.5 11.22c0-1.62.35-3.02 1.05-4.2a6.17 6.17 0 0 1 2.2-2.23 5.9 5.9 0 0 1 2.97-.84c.58 0 1.35.18 2.3.54.94.36 1.55.54 1.82.54.2 0 .88-.21 2.04-.63 1.1-.4 2.02-.56 2.78-.5 2.06.17 3.6.98 4.63 2.44-1.84 1.12-2.75 2.68-2.73 4.68.02 1.56.58 2.86 1.69 3.89.5.48 1.06.85 1.68 1.11-.13.4-.28.78-.43 1.15Z"/></svg>
        {busy === 'apple' ? 'Redirecting…' : `${verb} with Apple`}
      </button>
      <button type="button" onClick={() => go('google')} disabled={!!busy}
        className={`${btn} lux-glass text-foreground hover:bg-foreground/5`}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.16 3.58-8.81Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l3.99-3.1Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z"/></svg>
        {busy === 'google' ? 'Redirecting…' : `${verb} with Google`}
      </button>
      <div className="flex items-center gap-3 pt-2">
        <span className="h-px flex-1 bg-border" />
        <span className="lux-label">or with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
