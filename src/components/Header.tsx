import React, { useState, useEffect } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/lib/theme';

const ecosystemLinks = [
  { label: 'Vehicles', href: '#inventory' },
  { label: 'Energy', href: '#market' },
  { label: 'Robotics', href: '#ecosystem' },
];

const navLinks = [
  { label: 'Invest', href: '#invest' },
  { label: 'Insights', href: '/news' },
  { label: 'About', href: '#elon-musk' },
];


export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth?.getUser()?.then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-background/80 backdrop-blur-xl border-b border-fin-border"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Live tracking badge pulse rail */}
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-40'}`} />


        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label="Trade Tesla home">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/35 transition-all duration-300" />
              <img
                src="/tesla-mark.png"
                width={30}
                height={30}
                alt=""
                aria-hidden="true"
                className="relative z-10 w-[30px] h-[30px] object-contain drop-shadow-[0_0_8px_rgba(227,25,55,0.6)]"
              />
            </div>

            <span className="text-foreground font-bold text-base tracking-widest uppercase">
              Trade <span className="text-primary" style={{ textShadow: '0 0 12px rgba(227,25,55,0.5)' }}>Tesla</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0 xl:gap-1">
            {navLinks?.map((link) => (
              link?.href?.startsWith('/') ? (
                <Link
                  key={link?.label}
                  href={link?.href}
                  className="px-4 py-2 text-xs font-semibold text-fin-muted hover:text-foreground transition-colors tracking-widest uppercase relative group"
                >
                  {link?.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-primary group-hover:w-4 transition-all duration-300" />
                </Link>
              ) : (
                <a
                  key={link?.label}
                  href={link?.href}
                  className="px-4 py-2 text-xs font-semibold text-fin-muted hover:text-foreground transition-colors tracking-widest uppercase relative group"
                >
                  {link?.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-primary group-hover:w-4 transition-all duration-300" />
                </a>
              )
            ))}

            {/* Ecosystem dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-fin-muted hover:text-foreground transition-colors tracking-widest uppercase inline-flex items-center gap-1.5"
                aria-haspopup="true"
              >
                Ecosystem
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200">
                <div className="min-w-[180px] rounded-2xl border border-fin-border bg-[var(--surface-1)] p-2 shadow-[var(--fin-modal-shadow)]">
                  {ecosystemLinks.map((l) => (
                    <a key={l.label} href={l.href} className="block px-3 py-2 rounded-xl text-xs font-semibold tracking-widest uppercase text-fin-muted hover:text-foreground hover:bg-[var(--surface-2)] transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              className="px-5 py-2 text-xs font-semibold text-foreground border border-fin-border rounded-xl hover:border-primary/50 transition-all duration-300 tracking-widest uppercase whitespace-nowrap"
            >
              {isLoggedIn ? 'Account' : 'Sign In'}
            </Link>
            <Link
              href={isLoggedIn ? '/invest' : '/register'}
              className="px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl btn-shimmer hover:bg-[#B3181D] transition-all duration-300 tracking-widest uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] whitespace-nowrap"
            >
              Start Investing
            </Link>

          </div>


          {/* Mobile Hamburger */}
          <div className="lg:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`w-5 h-0.5 bg-foreground transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-foreground transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-foreground transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
          </div>
        </div>
      </nav>
      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setMenuOpen(false)} />
        <div className={`absolute top-16 left-0 right-0 bg-[var(--surface-1)] border-b border-fin-border p-6 transition-transform duration-300 shadow-[0_8px_40px_rgba(0,0,0,0.8)] ${menuOpen ? 'translate-y-0' : '-translate-y-4'}`}>
          <div className="flex flex-col gap-1 mb-6">
            {navLinks?.map((link) => (
              link?.href?.startsWith('/') ? (
                <Link
                  key={link?.label}
                  href={link?.href}
                  className="px-4 py-3 text-sm font-semibold text-fin-muted hover:text-foreground hover:bg-[var(--surface-2)] rounded-xl transition-colors tracking-widest uppercase min-h-[44px] flex items-center"
                  onClick={() => setMenuOpen(false)}
                >
                  {link?.label}
                </Link>
              ) : (
                <a
                  key={link?.label}
                  href={link?.href}
                  className="px-4 py-3 text-sm font-semibold text-fin-muted hover:text-foreground hover:bg-[var(--surface-2)] rounded-xl transition-colors tracking-widest uppercase min-h-[44px] flex items-center"
                  onClick={() => setMenuOpen(false)}
                >
                  {link?.label}
                </a>
              )
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-fin-border">
            {!isLoggedIn && (
              <Link href="/login" className="w-full py-3 text-center text-xs font-semibold text-white border border-fin-border rounded-xl tracking-widest uppercase min-h-[44px] flex items-center justify-center" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            )}
            {isLoggedIn ? (
              <Link href="/dashboard" className="w-full py-3 text-center text-xs font-bold bg-primary text-white rounded-xl tracking-widest uppercase min-h-[44px] flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(227,25,55,0.3)' }} onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <Link href="/register" className="w-full py-3 text-center text-xs font-bold bg-primary text-white rounded-xl tracking-widest uppercase min-h-[44px] flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(227,25,55,0.3)' }} onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}