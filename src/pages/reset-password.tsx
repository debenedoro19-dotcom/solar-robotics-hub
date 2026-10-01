import React, { useEffect, useState } from 'react';
import Link from '@/components/SmartLink';
import {  useRouter  } from '@/lib/next-shims';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasRecoverySession(Boolean(data.session));
      setCheckingLink(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || (event !== 'PASSWORD_RECOVERY' && event !== 'SIGNED_IN')) return;
      setHasRecoverySession(Boolean(session));
      setCheckingLink(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.password || !form.confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2500);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/tesla-mark.png" width={32} height={32} alt="" aria-hidden="true" className="text-primary object-contain" />
            <span className="text-foreground font-bold text-lg tracking-widest uppercase">Trade Tesla</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
            {success ? 'Password Updated' : 'Set New Password'}
          </h1>
          <p className="text-sm text-muted-foreground">
             {success ? 'Redirecting you to sign in…' : 'Choose a new password for your account.'}
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00F59B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your password has been reset successfully. You&apos;ll be redirected to sign in shortly.
            </p>
          </div>
        ) : checkingLink ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Checking your recovery link…</p>
        ) : !hasRecoverySession ? (
          <div className="space-y-5 py-4 text-center">
            <p className="text-sm text-muted-foreground">This recovery link is invalid or has expired.</p>
            <Link href="/forgot-password" className="tesla-btn-primary flex min-h-[48px] items-center justify-center rounded text-sm font-bold uppercase tracking-widest">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded bg-primary/10 border border-primary/30 text-sm text-primary">{error}</div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded text-sm input-tesla"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Confirm New Password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat new password"
                className="w-full px-4 py-3 rounded text-sm input-tesla"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 tesla-btn-primary rounded min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Updating...
                </>
              ) : (
                'Reset Password →'
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:text-red-400 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors tracking-wider uppercase">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
