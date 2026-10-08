import React, { useState, useEffect } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/lib/theme';

// Tesla.com style: few primary links in the center, everything else in the side menu.
const primaryLinks = [
  { label: 'Vehicles', href: '/inventory' },
  { label: 'Energy', href: '/ecosystem' },
  { label: 'Invest', href: '/invest' },
  { label: 'News', href: '/news' },
  { label: 'Careers', href: '/careers' },
];

const menuLinks = [
  { label: 'Inventory', href: '/inventory' },
  { label: 'Ecosystem', href: '/ecosystem' },
  { label: 'Invest', href: '/invest' },
  { label: 'Payments', href: '/payments' },
  { label: 'Giveaways', href: '/giveaways' },
  { label: 'Elon Musk', href: '/elon-musk' },
  { label: 'VIP Session', href: '/vip-session' },
  { label: 'Book a Session', href: '/book-session' },
  { label: 'News', href: '/news' },
  { label: 'Careers', href: '/careers' },
  { label: 'Account', href: '/dashboard' },
  { label: 'Deposit', href: '/account/deposit' },
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Support', href: '/support' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth?.getUser()?.then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const pill = 'px-3 py-1.5 rounded text-sm font-medium text-foreground/90 hover:bg-foreground/10 transition-colors whitespace-nowrap';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 lux-nav`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="px-6 lg:px-10 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Trade Tesla home">
            <img src="/tesla-mark.png" width={22} height={22} alt="" aria-hidden="true" className="w-[22px] h-[22px] object-contain" />
            <span className="text-foreground font-semibold text-sm tracking-[0.35em] uppercase">Trade Tesla</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((l) => (
              <Link key={l.label} href={l.href} className={pill}>{l.label}</Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href={isLoggedIn ? '/dashboard' : '/login'} className={`${pill} hidden sm:inline-flex`}>
              {isLoggedIn ? 'Account' : 'Sign In'}
            </Link>
            <button type="button" className={pill} onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-label="Open menu">
              Menu
            </button>
          </div>
        </div>
      </nav>

      {/* Side drawer menu */}
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <aside className={`absolute right-0 top-0 h-full w-full max-w-sm bg-background text-foreground p-6 pt-5 overflow-y-auto transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-end mb-6">
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-9 h-9 rounded hover:bg-foreground/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="flex flex-col">
            {menuLinks.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded text-[15px] font-medium hover:bg-foreground/10 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="tsla-btn tsla-btn-solid w-full">Dashboard</Link>
            ) : (
              <>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="tsla-btn tsla-btn-solid w-full">Get Started</Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="tsla-btn w-full border border-border">Sign In</Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
