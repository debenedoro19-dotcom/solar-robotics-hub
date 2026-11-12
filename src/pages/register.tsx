import React, { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Link from "@/components/SmartLink";
import { sanitizeText, sanitizeEmail, sanitizePhone, validatePassword } from "@/lib/sanitize";
import { registerWithoutVerification } from "@/lib/auth.functions";
import { TeslaShieldSvg, useTeslaLoader } from "@/components/TeslaLoader";
import { ThemeToggle } from "@/lib/theme";

export default function RegisterPage() {
  const registerFn = useServerFn(registerWithoutVerification);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      const res = await registerFn({
        data: {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || undefined,
          password: form.password,
        },
      });

      if (!res.ok) {
        setError(res.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const target = `/login?registered=1&email=${encodeURIComponent(cleanEmail)}`;
      triggerLoader({
        label: "ACCOUNT CREATED",
        durationMs: 420,
        onComplete: () => {
          window.location.href = target;
        },
      });
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
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
                className="mt-0.5 h-4 w-4 accent-foreground"
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
                className="mt-0.5 h-4 w-4 accent-foreground"
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
            className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
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
