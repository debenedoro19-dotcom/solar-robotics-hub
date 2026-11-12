import React, { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Link from "@/components/SmartLink";
import { setCurrentUser } from "@/lib/portfolioStore";
import { createClient } from "@/lib/supabase/client";
import { sanitizeEmail } from "@/lib/sanitize";
import { confirmUnverifiedUser } from "@/lib/auth.functions";
import { get2FAStatus, verify2FACode, recordSecurityEvent } from "@/lib/security.functions";
import { TeslaShieldSvg, useTeslaLoader } from "@/components/TeslaLoader";
import { ThemeToggle } from "@/lib/theme";

export default function LoginPage() {
  const confirmUserFn = useServerFn(confirmUnverifiedUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const { triggerLoader } = useTeslaLoader();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("email");
    if (prefill) setEmail(prefill);
    if (params.get("registered") === "1") {
      setNotice("Account created. Sign in below to access your Trade Tesla Account.");
    }
  }, []);

  async function finishLogin() {
    const supabase = createClient();
    await recordSecurityEvent({ data: { eventType: "login" } }).catch(() => {});

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    let isAdmin = false;
    if (user) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = !!roleRow;
    }

    let target = isAdmin ? "/admin" : "/dashboard";
    if (typeof window !== "undefined") {
      const wanted = new URLSearchParams(window.location.search).get("redirect");
      if (wanted && wanted.startsWith("/") && !wanted.startsWith("//")) target = wanted;
    }
    triggerLoader({
      label: isAdmin ? "ADMIN CONSOLE" : "ACCOUNT PORTAL",
      durationMs: 420,
      onComplete: () => {
        window.location.href = target;
      },
    });
  }

  async function submitTwoFactor(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await verify2FACode({ data: { code: twoFactorCode } }).catch(() => null);
    if (!res?.ok) {
      setLoading(false);
      setError(res && "error" in res ? res.error : "Could not verify that code.");
      return;
    }
    await finishLogin();
  }

  async function cancelTwoFactor() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setNeeds2FA(false);
    setTwoFactorCode("");
    setPassword("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !password) {
      setError("Please fill in all fields with valid values.");
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Automatically confirm unverified accounts since email verification is disconnected
      if (
        signInError &&
        /email not confirmed|not confirmed/i.test(signInError.message)
      ) {
        const confirmed = await confirmUserFn({ data: { email: cleanEmail } }).catch(() => null);
        if (confirmed?.ok) {
          const retry = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          data = retry.data;
          signInError = retry.error;
        }
      }

      if (signInError) {
        setLoading(false);
        setError(signInError.message);
        return;
      }

      const user = data?.user;
      if (user) {
        const fullName =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "Investor";
        setCurrentUser({
          id: user.id,
          name: fullName,
          email: user.email || "",
        });
      }

      const status = await get2FAStatus().catch(() => null);
      if (status?.enabled) {
        setLoading(false);
        setNeeds2FA(true);
        return;
      }

      await finishLogin();
    } catch {
      setLoading(false);
      const userId = "user_" + email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const storedUsers =
        typeof window !== "undefined" ? localStorage.getItem("tesla_trade_users") : null;
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const found = users.find((u: { id: string }) => u.id === userId);

      if (!found) {
        setError("No account found with this email. Please create an account below.");
        return;
      }

      setCurrentUser({ id: found.id, name: found.name, email: found.email });
      triggerLoader({
        label: "ACCOUNT PORTAL",
        durationMs: 420,
        onComplete: () => {
          window.location.href = "/dashboard";
        },
      });
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Minimal Tesla SSO Top Bar */}
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
            {needs2FA ? "Two-Factor Check" : "Sign In"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {needs2FA
              ? "Enter your authenticator code to continue."
              : "Access your Trade Tesla Account."}
          </p>
        </div>

        {needs2FA ? (
          <form onSubmit={submitTwoFactor} className="space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 rounded-[4px] bg-[#e82127]/10 border border-[#e82127]/30 text-xs font-medium text-[#e82127]">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="twofa"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                6-Digit Verification Code
              </label>
              <input
                id="twofa"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
                className="w-full h-11 px-3.5 rounded-[4px] bg-muted/40 border border-border text-center text-lg tracking-[0.35em] focus:outline-none focus:border-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={loading || twoFactorCode.trim().length < 6}
              className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
            <button
              type="button"
              onClick={cancelTwoFactor}
              className="w-full h-10 rounded-[4px] border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Use a different account
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {notice && (
              <div className="px-3.5 py-2.5 rounded-[4px] bg-muted/60 border border-border text-xs font-medium text-foreground">
                {notice}
              </div>
            )}
            {error && (
              <div className="px-3.5 py-2.5 rounded-[4px] bg-[#e82127]/10 border border-[#e82127]/30 text-xs font-medium text-[#e82127]">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                autoComplete="email"
                className="w-full h-11 px-3.5 rounded-[4px] bg-muted/45 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full h-11 px-3.5 rounded-[4px] bg-muted/45 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Signing In…" : "Next · Sign In"}
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">Or</span>
              </div>
            </div>

            <Link
              href="/register"
              ctaLoader
              loaderLabel="CREATE ACCOUNT"
              className="w-full h-11 rounded-[4px] bg-muted/70 border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center"
            >
              Create Account
            </Link>
          </form>
        )}
      </div>

      <footer className="py-6 px-6 text-center text-[11px] text-muted-foreground space-x-4">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy &amp; Legal
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms of Use
        </Link>
        <Link href="/support" className="hover:text-foreground">
          Support
        </Link>
      </footer>
    </main>
  );
}
