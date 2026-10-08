import React, { useState, useEffect } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';
import { emailSafeOrigin } from '@/lib/site-url';

export default function VerifyPendingPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleResend = async () => {
    if (!userEmail) return;
    setResending(true);
    setError('');
    try {
      const supabase = createClient();
      const siteUrl = emailSafeOrigin();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/kyc`,
        },
      });
      if (resendError) {
        setError(resendError.message);
      } else {
        setResent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-10 justify-center">
          <img src="/tesla-mark.png" width={28} height={28} alt="" aria-hidden="true" className="text-primary object-contain" />
          <span className="text-foreground font-bold text-base tracking-widest uppercase">Trade Tesla</span>
        </Link>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-3">Verify your email</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          Your dashboard is locked until you verify.
        </p>
        {userEmail && (
          <p className="text-sm font-semibold text-foreground mb-6">{userEmail}</p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          We&apos;ve emailed you a confirmation link. Opening it takes a few seconds and gives you full access to your dashboard.
        </p>

        {/* Status messages */}
        {resent && (
          <div className="px-4 py-3 rounded bg-green-900/20 border border-green-700/30 text-sm text-green-400 mb-4">
            ✓ Verification email resent successfully. Check your inbox.
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded bg-primary/10 border border-primary/30 text-sm text-primary mb-4">
            {error}
          </div>
        )}

        {/* Tips */}
        <div className="bg-card border border-border rounded p-4 mb-8 text-left">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Didn't receive it?</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you used the correct email</li>
            <li>Wait a few minutes and check again</li>
          </ul>
        </div>

        {/* Actions */}
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="w-full py-3.5 tesla-btn-primary rounded min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
        >
          {resending ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Resending...
            </>
          ) : resent ? (
            '✓ Email Sent'
          ) : (
            'Resend Verification Email'
          )}
        </button>

        <Link
          href="/login"
          className="block w-full py-3 rounded border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors text-center"
        >
          Back to Sign In
        </Link>
      </div>
    </main>
  );
}
