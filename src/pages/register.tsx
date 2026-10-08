import React, { useState } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';
import { sanitizeText, sanitizeEmail, sanitizePhone, validatePassword } from '@/lib/sanitize';
import { emailSafeOrigin } from '@/lib/site-url';

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
      const siteUrl = emailSafeOrigin();

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
        if (signUpError.status === 429 || signUpError.message.toLowerCase().includes('rate limit')) {
          setError('Account creation is temporarily busy. Please wait a few minutes before trying again.');
        } else if (signUpError.message.toLowerCase().includes('already registered')) {
          setError('An account already exists for this email. Sign in or reset your password instead.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // Projects with immediate confirmation return a session and need no email.
      if (data.session) {
        window.location.href = '/dashboard';
        return;
      }

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
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Calm confirmation — shown right after sign up */}
      {emailSent && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center px-4" role="status" aria-live="polite">
          <div className="w-full max-w-sm rounded-md bg-card border border-border p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-2">Account created</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              A confirmation link is on its way to
            </p>
            <p className="text-sm font-semibold text-foreground mb-3 break-all">{registeredEmail}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              You can confirm your email whenever you&apos;re ready — there&apos;s no rush. If it doesn&apos;t arrive, check your spam folder.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 tesla-btn-primary rounded text-sm font-bold tracking-widest uppercase text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}


      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/tesla-mark.png" width={28} height={28} alt="" aria-hidden="true" className="text-primary object-contain" />
            <span className="text-foreground font-bold text-base tracking-widest uppercase">Trade Tesla</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join the Tesla investment ecosystem</p>
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded bg-primary/10 border border-primary/30 text-sm text-primary">{error}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Full Name <span className="text-primary">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="John Smith"
              className="w-full px-4 py-3 rounded text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Email Address <span className="text-primary">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 rounded text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Password <span className="text-primary">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 rounded text-sm input-tesla"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Confirm Password <span className="text-primary">*</span>
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repeat password"
              className="w-full px-4 py-3 rounded text-sm input-tesla"
            />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
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
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
                    acceptedTerms
                      ? 'bg-primary border-primary' :'bg-card border-border group-hover:border-primary/50'
                  }`}
                >
                  {acceptedTerms && (
                    <svg className="w-2.5 h-2.5 text-foreground" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
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
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
                    acceptedPrivacy
                      ? 'bg-primary border-primary' :'bg-card border-border group-hover:border-primary/50'
                  }`}
                >
                  {acceptedPrivacy && (
                    <svg className="w-2.5 h-2.5 text-foreground" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
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
            className="w-full py-3.5 tesla-btn-primary rounded min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
          <p className="text-sm text-muted-foreground">
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
