import React, { useState } from "react";
import Link from "@/components/SmartLink";
import { createClient } from "@/lib/supabase/client";
import { sanitizeText, sanitizeEmail, sanitizePhone, validatePassword } from "@/lib/sanitize";
import { emailSafeOrigin } from "@/lib/site-url";
import { TeslaShieldSvg, useTeslaLoader } from "@/components/TeslaLoader";
import { ThemeToggle } from "@/lib/theme";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const { triggerLoader } = useTeslaLoader();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanName = sanitizeText(form.name);
    const cleanEmail = sanitizeEmail(form.email);
    const cleanPhone = sanitizePhone(form.phone);
    if (!cleanName || !cleanEmail || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    const pwCheck = validatePassword(form.password);
    if (!pwCheck.valid) {
      setError(pwCheck.message);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      setError("You must accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const siteUrl = emailSafeOrigin();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          data: { full_name: cleanName, phone: cleanPhone },
          emailRedirectTo: `${siteUrl}/auth/callback?next=/kyc`,
        },
      });

      if (signUpError) {
        if (signUpError.status === 429 || signUpError.message.toLowerCase().includes("rate limit")) {
          setError("Account creation is temporarily busy. Please wait a few minutes before trying again.");
        } else if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("An account already exists for this email. Sign in or reset your password instead.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        triggerLoader({
          label: "ACCOUNT READY",
          durationMs: 420,
          onComplete: () => {
            window.location.href = "/dashboard";
          },
        });
        return;
      }

      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: form.password,
        });
        if (signInData?.session) {
          triggerLoader({
            label: "ACCOUNT READY",
            durationMs: 420,
            onComplete: () => {
              window.location.href = "/dashboard";
            },
          });
          return;
        }
      } catch {
        /* fallback to modal below */
      }

      setRegisteredEmail(form.email);
      setEmailSent(true);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-3.5 rounded-[4px] bg-muted/45 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors";

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

      {emailSent && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-[8px] bg-card border border-border p-7 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#0e9f6e]/15 border border-[#0e9f6e]/30 flex items-center justify-center mx-auto mb-4 text-[#0e9f6e] font-bold">
              ✓
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              Account Created
            </h2>
            <p className="text-xs text-muted-foreground mb-1">Your account has been created for</p>
            <p className="text-sm font-semibold text-foreground mb-3 break-all">{registeredEmail}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              Email verification is temporarily suspended. You can sign in right away to access your
              account.
            </p>
            <Link
              href="/login"
              ctaLoader
              loaderLabel="SIGN IN"
              className="flex h-11 w-full items-center justify-center rounded-[4px] bg-[#3e6ae1] text-white text-sm font-medium hover:bg-[#345ac7] transition-colors"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[380px] px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Create Account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join Trade Tesla for direct checkout, energy systems, and portfolio tracking.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 rounded-[4px] bg-[#e82127]/10 border border-[#e82127]/30 text-xs font-medium text-[#e82127]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Full Legal Name <span className="text-[#e82127]">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="John Smith"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Email Address <span className="text-[#e82127]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@domain.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Password <span className="text-[#e82127]">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Confirm Password <span className="text-[#e82127]">*</span>
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repeat password"
              className={inputClass}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#3e6ae1]"
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/terms" className="text-foreground underline">
                  Terms of Service
                </Link>{" "}
                and eligibility requirements.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#3e6ae1]"
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/privacy" className="text-foreground underline">
                  Privacy Policy
                </Link>{" "}
                regarding personal data processing.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-[4px] bg-[#3e6ae1] text-white text-sm font-medium hover:bg-[#345ac7] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Creating Account…" : "Create Account"}
          </button>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              ctaLoader
              loaderLabel="ACCOUNT"
              className="text-foreground font-medium underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>
        </form>
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
