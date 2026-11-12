import React, { useEffect, useState } from "react";
import Link from "@/components/SmartLink";
import { useRouter } from "@/lib/next-shims";
import { supabase } from "@/integrations/supabase/client";
import { TeslaShieldSvg } from "@/components/TeslaLoader";
import { ThemeToggle } from "@/lib/theme";

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
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <header className="h-14 px-6 lg:px-10 flex items-center justify-between border-b border-border/60">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Trade Tesla home">
          <TeslaShieldSvg className="w-5 h-5 text-[#e82127]" />
          <span className="font-display text-xs font-semibold tracking-[0.34em] uppercase">
            Trade Tesla
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto w-full max-w-[360px] px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {success ? "Password Updated" : "Set New Password"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {success ? "Redirecting you to Sign In..." : "Choose a new password for your Account."}
          </p>
        </div>

        {success ? (
          <div className="rounded-lg border border-border bg-muted/35 p-6 text-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-[#0e9f6e]/15 text-[#0e9f6e] font-bold flex items-center justify-center mx-auto">
              ✓
            </div>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. Redirecting you to Sign In shortly.
            </p>
          </div>
        ) : checkingLink ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Checking your recovery link...</p>
        ) : !hasRecoverySession ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              This recovery link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              ctaLoader
              loaderLabel="RESET PASSWORD"
              className="flex h-11 items-center justify-center rounded-[4px] bg-[#3e6ae1] text-white text-sm font-medium hover:bg-[#345ac7] transition-colors"
            >
              Request a New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 rounded-[4px] bg-[#e82127]/10 border border-[#e82127]/30 text-xs text-[#e82127]">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-1.5"
              >
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full h-11 px-3.5 rounded-[4px] bg-muted/45 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat new password"
                className="w-full h-11 px-3.5 rounded-[4px] bg-muted/45 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[4px] bg-[#3e6ae1] text-white text-sm font-medium hover:bg-[#345ac7] transition-colors disabled:opacity-60"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" ctaLoader loaderLabel="SIGN IN" className="text-foreground font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        )}
      </div>

      <footer className="py-5 px-6 text-center text-[11px] text-muted-foreground border-t border-border/60">
        Trade Tesla © 2026 ·{" "}
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link> ·{" "}
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
      </footer>
    </main>
  );
}
