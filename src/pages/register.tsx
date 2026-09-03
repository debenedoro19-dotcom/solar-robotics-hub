import React, { useState } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';
import { sanitizeText, sanitizeEmail, sanitizePhone, validatePassword } from '@/lib/sanitize';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanName = sanitizeText(form.name);
    const cleanEmail = sanitizeEmail(form.email);
    const cleanPhone = sanitizePhone(form.phone);
    if (!cleanName || !cleanEmail || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    const pwCheck = validatePassword(form.password);
    if (!pwCheck.valid) {
      setError(pwCheck.message);
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      setError('You must accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      // Sign up via Supabase Auth — triggers built-in confirmation email
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          data: { full_name: cleanName, phone: cleanPhone },
          emailRedirectTo: `${siteUrl}/auth/callback?next=/kyc`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Supabase Auth sends the branded confirmation email through the managed
      // auth email webhook — no extra send here.
      void data;

      setRegisteredEmail(form.email);
      setEmailSent(true);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#050507] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <svg width="28" height="28" viewBox="0 0 342 512" fill="currentColor" className="text-primary" aria-hidden="true">
              <path d="M0 57.3C0 57.3 57.3 0 171 0s171 57.3 171 57.3L285 85.5s-28.5-28.5-114-28.5S57 85.5 57 85.5L0 57.3zM171 512L57 85.5s28.5 28.5 114 28.5 114-28.5 114-28.5L171 512z" />
            </svg>
            <span className="text-white font-bold text-base tracking-widest uppercase">Tesla Trade</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-sm text-[#71717A]">Join the Tesla investment ecosystem</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full step-active flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-xs text-white font-semibold tracking-wider uppercase">Account</span>
          </div>
          <div className="flex-1 h-px bg-[#1E2027]" />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full step-pending flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-xs text-[#6B7280] tracking-wider uppercase">Verify</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-sm text-primary">{error}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Full Name <span className="text-primary">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="John Smith"
              className="w-full px-4 py-3 rounded-xl text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Email Address <span className="text-primary">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 rounded-xl text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Password <span className="text-primary">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 rounded-xl text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-2">
              Confirm Password <span className="text-primary">*</span>
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repeat password"
              className="w-full px-4 py-3 rounded-xl text-sm input-tesla"
            />
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed">
            By creating an account you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>

          {/* Legal acknowledgment checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                  className={`w-4 h-4 rounded-xl border flex items-center justify-center transition-all duration-150 ${
                    acceptedTerms
                      ? 'bg-primary border-primary' :'bg-[#0D0E12] border-[#1E2027] group-hover:border-primary/50'
                  }`}
                >
                  {acceptedTerms && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#71717A] leading-relaxed">
                I have read and agree to the{' '}
                <Link href="/terms" target="_blank" className="text-primary hover:underline font-semibold">
                  Terms of Service
                </Link>
                , including the investment risk disclosures and eligibility requirements.{' '}
                <span className="text-primary">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  id="acceptPrivacy"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
                  className={`w-4 h-4 rounded-xl border flex items-center justify-center transition-all duration-150 ${
                    acceptedPrivacy
                      ? 'bg-primary border-primary' :'bg-[#0D0E12] border-[#1E2027] group-hover:border-primary/50'
                  }`}
                >
                  {acceptedPrivacy && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#71717A] leading-relaxed">
                I have read and agree to the{' '}
                <Link href="/privacy" target="_blank" className="text-primary hover:underline font-semibold">
                  Privacy Policy
                </Link>
                , including how my personal and financial data is collected and processed.{' '}
                <span className="text-primary">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 tesla-btn-primary rounded-xl min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account →'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-red-400 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
