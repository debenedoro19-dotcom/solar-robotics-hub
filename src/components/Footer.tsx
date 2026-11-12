import React from "react";
import Link from "@/components/SmartLink";
import { TeslaShieldSvg } from "@/components/TeslaLoader";

const footerLinks = [
  { label: "Trade Tesla © 2026", href: "/" },
  { label: "Vehicles", href: "/inventory" },
  { label: "Energy & Robotics", href: "/ecosystem" },
  { label: "Investments", href: "/invest" },
  { label: "Giveaways", href: "/giveaways" },
  { label: "Privacy & Legal", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "News", href: "/news" },
  { label: "Careers", href: "/careers" },
  { label: "Support", href: "/support" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 border-b border-border/70 pb-8 md:flex-row">
          <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="Trade Tesla home">
            <TeslaShieldSvg className="w-4 h-4 text-[#e82127]" />
            <span className="font-display text-xs font-semibold tracking-[0.34em] uppercase">
              Trade Tesla
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                ctaLoader={link.href !== "/"}
                loaderLabel={link.label.toUpperCase()}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center text-[11px] text-muted-foreground sm:flex-row sm:text-left">
          <p>
            Vehicles, energy storage, solar systems, and investment marketplace on{" "}
            <span className="text-foreground font-medium">tradeenergyhub.com</span>.
          </p>
          <p>Official Trade Tesla Platform · Independent Marketplace</p>
        </div>
      </div>
    </footer>
  );
}
