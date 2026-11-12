import React, { useState } from "react";
import Link from "@/components/SmartLink";
import { TeslaShieldSvg, useTeslaLoader } from "@/components/TeslaLoader";
import { TESLA_VEHICLES } from "@/data/teslaCatalog";
import { supabase } from "@/integrations/supabase/client";

const footerGroups = [
  {
    title: "Vehicles",
    links: [
      { label: "Live Inventory", href: "/inventory" },
      { label: "Model Aero Flying Car", href: "/flying-car" },
      { label: "Schedule Test Drive", href: "/flying-car?mode=test_drive" },
      { label: "Model S Plaid", href: "/inventory" },
      { label: "Cybertruck", href: "/inventory" },
    ],
  },
  {
    title: "Energy & AI",
    links: [
      { label: "Solar Roof V3", href: "/ecosystem" },
      { label: "Powerwall 3", href: "/ecosystem" },
      { label: "Megapack 2 XL", href: "/ecosystem" },
      { label: "Optimus Gen 2", href: "/ecosystem#robotics" },
      { label: "Supercharger Network", href: "/ecosystem" },
    ],
  },
  {
    title: "Programs",
    links: [
      { label: "Investment Plans", href: "/invest" },
      { label: "Allocation Simulator", href: "/invest" },
      { label: "Free Giveaways", href: "/giveaways" },
      { label: "Funding & Rails", href: "/payments" },
      { label: "VIP Briefings", href: "/vip-session" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Elon Musk & Vision", href: "/elon-musk" },
      { label: "Newsroom", href: "/news" },
      { label: "Careers", href: "/careers" },
      { label: "Support Center", href: "/support" },
      { label: "Account", href: "/login" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [region, setRegion] = useState("United States · English");
  const { navigateWithLoader } = useTeslaLoader();

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      await supabase.from("newsletter_leads").insert({ email: trimmed, source: "footer" });
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("done");
      setEmail("");
    }
  }

  return (
    <footer className="relative z-10 border-t border-border bg-background text-foreground">
      {/* Newsletter Strip */}
      <div className="mx-auto max-w-[1440px] px-5 pt-12 pb-10 sm:px-8 lg:px-10">
        <div className="grid gap-6 rounded-xl border border-border bg-muted/35 p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">
              Stay plugged in.
            </h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
              Inventory arrivals, Cybercab & Optimus releases, energy hardware allocations, and free giveaway drops.
            </p>
          </div>

          {status === "done" ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground font-bold">
                ✓
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">You&apos;re subscribed</p>
                <p className="text-[11px] text-muted-foreground">
                  Trade Tesla platform updates are on the way.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={subscribe} className="w-full">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="Your email address"
                  className={`h-11 flex-1 rounded-[4px] border bg-card px-3.5 text-sm outline-none focus:border-foreground ${
                    status === "error" ? "border-[#e82127]" : "border-border"
                  }`}
                />
                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="h-11 shrink-0 rounded-[4px] bg-foreground px-6 text-xs font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {status === "saving" ? "Saving..." : "Subscribe"}
                </button>
              </div>
              <p className={`mt-1.5 text-[10.5px] ${status === "error" ? "text-[#e82127]" : "text-muted-foreground"}`}>
                {status === "error"
                  ? "Please enter a valid email address."
                  : "By subscribing you agree to our Privacy Policy. Unsubscribe any time."}
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Multi-Column Trade Tesla Links */}
      <div className="mx-auto max-w-[1440px] px-5 pb-10 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-3 lg:col-span-2 lg:pr-8">
            <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="Trade Tesla home">
              <TeslaShieldSvg className="w-4 h-4 text-[#e82127]" />
              <span className="font-display text-xs font-semibold tracking-[0.34em] uppercase">
                Trade Tesla
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Electric vehicles, clean energy hardware, autonomous robotics, and structured capital programs on{" "}
              <span className="font-medium text-foreground">tradeenergyhub.com</span>.
            </p>
            <div className="mt-4 space-y-1.5">
              {TESLA_VEHICLES.slice(0, 3).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => navigateWithLoader("/inventory", v.name.toUpperCase())}
                  className="flex w-full max-w-[260px] items-center justify-between gap-3 border-b border-border/60 py-1.5 text-left text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{v.name}</span>
                  <span className="tabular font-medium">${v.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-foreground">
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      ctaLoader
                      loaderLabel={link.label.toUpperCase()}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-2"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-border/80">
        <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Trade Tesla © 2026</span>
              <Link href="/privacy" ctaLoader loaderLabel="PRIVACY" className="hover:text-foreground">
                Privacy & Legal
              </Link>
              <Link href="/terms" ctaLoader loaderLabel="TERMS" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/support" ctaLoader loaderLabel="SUPPORT" className="hover:text-foreground">
                Contact
              </Link>
              <Link href="/news" ctaLoader loaderLabel="NEWS" className="hover:text-foreground">
                Newsroom
              </Link>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <select
                aria-label="Select region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="cursor-pointer bg-transparent text-[11px] text-muted-foreground outline-none hover:text-foreground"
              >
                <option>United States · English</option>
                <option>Canada · English</option>
                <option>United Kingdom · English</option>
                <option>Europe · English</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
