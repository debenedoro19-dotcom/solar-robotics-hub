import React, { useState } from "react";
import Link from "@/components/SmartLink";
import { supabase } from "@/integrations/supabase/client";
import { emailSafeOrigin } from "@/lib/site-url";
import { TeslaShieldSvg } from "@/components/TeslaLoader";
import { ThemeToggle } from "@/lib/theme";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${emailSafeOrigin()}/reset-password` },
    );

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
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
            {sent ? "Check Your Email" : "Reset Password"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {sent
              ? "Recovery instructions have been sent."
              : "Enter your email to receive reset instructions."}
          </p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/35 p-5 text-center space-y-2">
              <div className="w-11 h-11 rounded-full bg-foreground text-background font-bold flex items-center justify-center mx-auto">
                ✓
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We&apos;ve sent password reset instructions to{" "}
                <span className="text-foreground font-semibold">{email}</span>.
              </p>
              <p className="text-xs text-muted-foreground">
                Check your spam folder or try another address.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="w-full h-11 rounded-[4px] border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              Try a different email
            </button>
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
                htmlFor="email"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3.5 rounded-[4px] bg-muted/45 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" ctaLoader loaderLabel="SIGN IN" className="text-foreground font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      <footer className="py-5 px-6 text-center text-[11px] text-muted-foreground border-t border-border/60">
        Trade Tesla © 2026 ·{" "}
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link> ·{" "}
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
      </footer>
    </main>
  );
}
