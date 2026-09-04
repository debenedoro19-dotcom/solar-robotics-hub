import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackPage() {
  const [message, setMessage] = useState('Verifying your account…');

  useEffect(() => {
    const finishVerification = async () => {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const next = url.searchParams.get('next');
      const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage('This verification link is invalid or has expired. Please request a new one.');
          return;
        }
      }

      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setMessage('Verification completed. Please sign in to continue.');
        window.setTimeout(() => { window.location.href = '/login'; }, 1200);
        return;
      }

      window.location.href = destination;
    };

    void finishVerification();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
        <h1 className="text-xl font-bold text-foreground">Email verification</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}

export const Route = createFileRoute('/auth/callback')({
  head: () => ({
    meta: [
      { title: 'Verify Account — Trade Tesla' },
      { name: 'description', content: 'Complete your Trade Tesla account verification.' },
      { property: 'og:title', content: 'Verify Account — Trade Tesla' },
      { property: 'og:description', content: 'Complete your Trade Tesla account verification.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: AuthCallbackPage,
});