import React, { useState } from 'react';
import Link from '@/components/SmartLink';
import { usePathname } from '@/lib/next-shims';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/lib/theme';

const NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: '/admin', label: 'Dashboard', icon: <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z" /> },
  { href: '/admin/users', label: 'Users', icon: <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> },
  { href: '/admin/deposits', label: 'Deposits', icon: <path d="M12 3v14m0 0l-5-5m5 5l5-5M4 21h16" /> },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: <path d="M12 21V7m0 0l-5 5m5-5l5 5M4 3h16" /> },
  { href: '/admin/plans', label: 'Investment Plans', icon: <path d="M3 17l6-6 4 4 8-8M21 7v6h-6" /> },
  { href: '/admin/transactions', label: 'Transactions', icon: <path d="M3 7h13l-3-3M21 17H8l3 3" /> },
  { href: '/admin/settings', label: 'Settings', icon: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.63.68 1.1 1.31 1.1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /> },
];

/** Institutional admin chrome: fixed sidebar on desktop, drawer on mobile. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const links = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-bold tracking-[0.14em] uppercase transition-colors ${
            isActive(item.href)
              ? 'bg-[var(--surface-2)] text-foreground border border-fin-border'
              : 'text-fin-muted hover:text-foreground hover:bg-[var(--surface-2)] border border-transparent'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {item.icon}
          </svg>
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={signOut}
        className="mt-2 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-bold tracking-[0.14em] uppercase text-fin-muted hover:text-primary transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-fin-bg text-foreground">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 h-14 px-4 border-b border-fin-border bg-fin-bg/90 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle admin navigation"
          className="w-9 h-9 rounded-xl border border-fin-border flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <span className="text-[11px] font-bold tracking-[0.24em] uppercase">Trade Tesla · Admin</span>
        <ThemeToggle />
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 lg:z-10 h-screen w-[248px] shrink-0 border-r border-fin-border bg-[var(--surface-1)] p-5 transition-transform duration-300 lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="hidden lg:flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/tesla-mark.png" width={22} height={22} alt="" aria-hidden="true" className="w-[22px] h-[22px] object-contain" />
              <span className="text-[11px] font-bold tracking-[0.24em] uppercase">Trade Tesla</span>
            </Link>
            <ThemeToggle />
          </div>
          <p className="fin-label text-[10px] text-fin-muted mb-3 lg:mt-0 mt-14">Administration</p>
          {links}
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
        )}

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
