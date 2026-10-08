import React, { useState } from 'react';
import Link from '@/components/SmartLink';
import { setCurrentUser } from '@/lib/portfolioStore';
import { createClient } from '@/lib/supabase/client';
import { sanitizeEmail } from '@/lib/sanitize';
import { get2FAStatus, verify2FACode, recordSecurityEvent } from '@/lib/security.functions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  /** Logs the device/IP, then routes by role. */
  async function finishLogin() {
    const supabase = createClient();
    await recordSecurityEvent({ data: { eventType: 'login' } }).catch(() => {});

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    let isAdmin = false;
    if (user) {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      isAdmin = !!roleRow;
    }

    // Honour ?redirect=/path when it is a safe same-site path.
    let target = isAdmin ? '/admin' : '/dashboard';
    if (typeof window !== 'undefined') {
      const wanted = new URLSearchParams(window.location.search).get('redirect');
      if (wanted && wanted.startsWith('/') && !wanted.startsWith('//')) target = wanted;
    }
    window.location.href = target;
  }

  async function submitTwoFactor(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await verify2FACode({ data: { code: twoFactorCode } }).catch(() => null);
    if (!res?.ok) {
      setLoading(false);
      setError(res && 'error' in res ? res.error : 'Could not verify that code.');
      return;
    }
    await finishLogin();
  }

  async function cancelTwoFactor() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setNeeds2FA(false);
    setTwoFactorCode('');
    setPassword('');
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !password) {
      setError('Please fill in all fields with valid values.');
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

      if (signInError) {
        setLoading(false);
        setError(signInError.message);
        return;
      }

      const user = data?.user;

      // Gate: email must be verified before accessing dashboard
      if (user && !user.email_confirmed_at) {
        setLoading(false);
        window.location.href = '/verify-pending';
        return;
      }

      if (user) {
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Investor';
        setCurrentUser({
          id: user.id,
          name: fullName,
          email: user.email || '',
        });
      }

      // Two-factor gate: signed in, but the session is not usable until the
      // authenticator code checks out.
      const status = await get2FAStatus().catch(() => null);
      if (status?.enabled) {
        setLoading(false);
        setNeeds2FA(true);
        return;
      }

      await finishLogin();
    } catch (err: any) {
      setLoading(false);
      // Fallback: localStorage-based login for legacy accounts
      const userId = 'user_' + email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const storedUsers = typeof window !== 'undefined' ? localStorage.getItem('tesla_trade_users') : null;
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const found = users.find((u: { id: string }) => u.id === userId);

      if (!found) {
        setError('No account found with this email. Please register first.');
        return;
      }

      setCurrentUser({ id: found.id, name: found.name, email: found.email });
      setTimeout(() => {
        setLoading(false);
        window.location.href = '/dashboard';
      }, 1000);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
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
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">Sign In</h1>
          <p className="text-sm text-muted-foreground">Access your investment dashboard</p>
        </div>

        {/* Two-factor step */}
        {needs2FA ? (
          <form onSubmit={submitTwoFactor} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded bg-primary/10 border border-primary/30 text-sm text-primary">{error}</div>
            )}
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app, or one of your backup codes.
            </p>
            <input
              id="twofa"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="123456"
              autoComplete="one-time-code"
              className="w-full px-4 py-3 rounded text-center text-lg tracking-[0.4em] input-tesla"
            />
            <button
              type="submit"
              disabled={loading || twoFactorCode.trim().length < 6}
              className="w-full py-3.5 rounded bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40"
            >
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
            <button
              type="button"
              onClick={cancelTwoFactor}
              className="w-full py-3 rounded border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Use a different account
            </button>
          </form>
        ) : (
        /* Form */
        <>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded bg-primary/10 border border-primary/30 text-sm text-primary">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-3 rounded text-sm input-tesla"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Forgot password?
            </Link>
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
                Signing In...
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>
        </>
        )}



        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
