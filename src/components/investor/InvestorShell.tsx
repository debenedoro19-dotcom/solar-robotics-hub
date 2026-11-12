import React from 'react';
import Link from '@/components/SmartLink';
import { usePathname } from '@/lib/next-shims';
import { createClient } from '@/lib/supabase/client';
import { money } from './wallet';
import { ThemeToggle } from '@/lib/theme';
import { TeslaShieldSvg } from '@/components/TeslaLoader';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/kyc', label: 'Verification' },
  { href: '/support', label: 'Support' },
];

/**
 * Shared chrome for every signed-in Trade Tesla investor surface (/dashboard, /account/*).
 * Matches the Tesla Studio visual identity of the main marketing experience.
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
    <div className="min-h-screen bg-background text-foreground lux-dash">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Trade Tesla Home">
                <TeslaShieldSvg className="w-5 h-5 text-[#e82127]" />
                <span className="font-display text-[13px] font-semibold tracking-[0.34em] uppercase whitespace-nowrap">
                  Trade Tesla
                </span>
              </Link>
              <nav className="hidden lg:flex items-center gap-1" aria-label="Account navigation">
                {NAV.map((item) => {
                  const active =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-foreground text-background'
                          : 'text-foreground/75 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <ThemeToggle />
              {typeof balance === 'number' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-border bg-muted/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground pulse-dot" />
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                    Wallet
                  </span>
                  <span className="font-display text-xs font-semibold tabular text-foreground">
                    {money(balance)}
                  </span>
                </div>
              )}
              {onDeposit && (
                <button
                  onClick={onDeposit}
                  className="h-9 px-3.5 rounded-[4px] text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  + Deposit
                </button>
              )}
              {onWithdraw && (
                <button
                  onClick={onWithdraw}
                  className="hidden sm:inline-flex items-center h-9 px-3.5 rounded-[4px] text-xs font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                >
                  Withdraw
                </button>
              )}
              <button
                onClick={signOut}
                className="h-9 px-3 rounded-[4px] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2.5 -mt-0.5">
            {NAV.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
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
