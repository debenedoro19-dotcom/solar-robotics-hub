import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@/lib/supabase/client';

type Status = 'working' | 'verified' | 'error';

function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('working');
  const [message, setMessage] = useState('Verifying your email address…');
  const [destination, setDestination] = useState('/dashboard');

  useEffect(() => {
    const finishVerification = async () => {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
      const code = url.searchParams.get('code');
      const tokenHash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type');
      const next = url.searchParams.get('next');
      const target = next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      setDestination(target);

      const errorDescription =
        url.searchParams.get('error_description') || hash.get('error_description');
      if (errorDescription) {
        setStatus('error');
        setMessage(errorDescription);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus('error');
          setMessage('This verification link is invalid or has already expired. Please request a new one.');
          return;
        }
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change',
        });
        if (error) {
          setStatus('error');
          setMessage('This verification link is invalid or has already expired. Please request a new one.');
          return;
        }
      }

      const { data } = await supabase.auth.getUser();
      setStatus('verified');
      if (!data.user) {
        setDestination('/login');
        setMessage('Your email is verified. Sign in to continue.');
        window.setTimeout(() => { window.location.href = '/login'; }, 2500);
        return;
      }

      setMessage('Your email address has been verified. Redirecting you now…');
      window.setTimeout(() => { window.location.href = target; }, 2000);
    };

    void finishVerification();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-sm">
        {status === 'working' && (
          <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
        )}
        {status === 'verified' && (
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00F59B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}
        <h1 className="text-xl font-bold text-foreground">
          {status === 'verified' ? 'Email verified' : status === 'error' ? 'Verification failed' : 'Email verification'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <a
          href={status === 'error' ? '/login' : destination}
          className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
        >
          {status === 'error' ? 'Back to sign in' : 'Continue →'}
        </a>
      </div>
    </main>
  );
}

export const Route = createFileRoute('/auth/callback')({
  head: () => ({
    meta: [
      { title: 'Verify Account — Tesla Trade' },
      { name: 'description', content: 'Complete your Tesla Trade account verification.' },
      { property: 'og:title', content: 'Verify Account — Tesla Trade' },
      { property: 'og:description', content: 'Complete your Tesla Trade account verification.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: AuthCallbackPage,
});