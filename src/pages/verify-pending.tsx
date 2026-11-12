import React, { useState, useEffect } from "react";
import Link from "@/components/SmartLink";
import { createClient } from "@/lib/supabase/client";
import { emailSafeOrigin } from "@/lib/site-url";
import { TeslaShieldSvg } from "@/components/TeslaLoader";
import { ThemeToggle } from "@/lib/theme";

export default function VerifyPendingPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleResend = async () => {
    if (!userEmail) return;
    setResending(true);
    setError("");
    try {
      const supabase = createClient();
      const siteUrl = emailSafeOrigin();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
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
      setError(err?.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
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

      <div className="mx-auto w-full max-w-[380px] px-4 py-12">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Email Verification
          </h1>
          {userEmail && (
            <p className="mt-1.5 text-sm font-medium text-foreground">{userEmail}</p>
          )}
        </div>

        <div className="px-4 py-3 rounded-[4px] bg-[#3e6ae1]/10 border border-[#3e6ae1]/30 text-xs leading-relaxed text-foreground mb-6">
          Notice: Email verification is temporarily suspended while mailbox maintenance is in progress. You can access your Trade Tesla account directly.
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <Link
            href="/dashboard"
            ctaLoader
            loaderLabel="ACCOUNT PORTAL"
            className="w-full h-11 rounded-[4px] bg-[#3e6ae1] text-white text-sm font-medium hover:bg-[#345ac7] transition-colors flex items-center justify-center"
          >
            Continue to Dashboard
          </Link>
        </div>

        {resent && (
          <div className="px-4 py-3 rounded-[4px] bg-[#0e9f6e]/10 border border-[#0e9f6e]/30 text-xs text-[#0e9f6e] mb-4">
            Verification email resent successfully. Check your inbox.
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[#e82127]/10 border border-[#e82127]/30 text-xs text-[#e82127] mb-4">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/35 p-4 mb-6 text-left">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.14em] font-semibold mb-2">
            Didn&apos;t receive it?
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you used the correct email</li>
            <li>Wait a few minutes and check again</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resent}
            className="w-full h-11 rounded-[4px] border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resending ? "Resending..." : resent ? "Email Sent" : "Resend Verification Email"}
          </button>

          <Link
            href="/login"
            ctaLoader
            loaderLabel="ACCOUNT SIGN IN"
            className="block w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Back to Account Sign In
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
