import React from 'react';
import Link from '@/components/SmartLink';
import { usePathname } from '@/lib/next-shims';
import { createClient } from '@/lib/supabase/client';
import { money } from './wallet';
import { ThemeToggle } from '@/lib/theme';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/kyc', label: 'Verification' },
  { href: '/support', label: 'Support' },
];

/**
 * Shared chrome for every signed-in investor surface (/dashboard, /account).
 * Tesla high-tech identity — red spark mark, wide tracking, dark glass — with
 * the institutional emerald data layer used across the wallet.
 */
export default function InvestorShell({
  children,
  balance,
  onDeposit,
  onWithdraw,
}: {
  children: React.ReactNode;
  balance?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}) {
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-fin-bg text-foreground">
      <header className="sticky top-0 z-50 border-b border-fin-border bg-fin-bg/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <Link href="/" className="flex items-center gap-2.5 shrink-0">
                <svg width="18" height="18" viewBox="0 0 342 512" fill="currentColor" className="text-primary" aria-hidden="true">
                  <path d="M0 57.3C0 57.3 57.3 0 171 0s171 57.3 171 57.3L285 85.5s-28.5-28.5-114-28.5S57 85.5 57 85.5L0 57.3zM171 512L57 85.5s28.5 28.5 114 28.5 114-28.5 114-28.5L171 512z" />
                </svg>
                <span className="font-bold text-sm tracking-[0.25em] uppercase">Tesla Trade</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {NAV.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold tracking-[0.18em] uppercase transition-colors ${
                        active ? 'text-white bg-fin-elevated border border-fin-border' : 'text-fin-muted hover:text-white'
                      }`}>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              {typeof balance === 'number' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-fin-emerald/30 bg-fin-emerald-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-fin-emerald animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-fin-muted">Wallet</span>
                  <span className="text-sm font-extrabold tabular-nums text-fin-emerald">{money(balance)}</span>
                </div>
              )}
              {onDeposit && (
                <button onClick={onDeposit} className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold tracking-widest uppercase bg-primary text-white hover:opacity-90 transition-opacity">
                  + Deposit
                </button>
              )}
              {onWithdraw && (
                <button onClick={onWithdraw} className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-[11px] font-bold tracking-widest uppercase fin-card hover:border-fin-emerald/40 transition-colors">
                  Withdraw
                </button>
              )}
              <button onClick={signOut} className="text-[11px] font-bold tracking-widest uppercase text-fin-muted hover:text-white transition-colors">
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mt-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${active ? 'bg-fin-elevated border border-fin-border text-white' : 'text-fin-muted'}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
