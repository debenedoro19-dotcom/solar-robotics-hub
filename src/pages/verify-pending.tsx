import React, { useEffect } from "react";
import Link from "@/components/SmartLink";
import { TeslaShieldSvg } from "@/components/TeslaLoader";
import { ThemeToggle } from "@/lib/theme";

export default function VerifyPendingPage() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);

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

      <div className="mx-auto w-full max-w-[360px] px-4 py-12 text-center space-y-5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Redirecting to Sign In
        </h1>
        <p className="text-sm text-muted-foreground">
          No email verification is required. Continue directly to your Trade Tesla sign-in page.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Continue to Sign In
        </Link>
      </div>

      <footer className="py-5 px-6 text-center text-[11px] text-muted-foreground border-t border-border/60">
        Trade Tesla © 2026
      </footer>
    </main>
  );
}
