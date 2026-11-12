import React, { useEffect, useState } from "react";
import Link from "@/components/SmartLink";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/lib/theme";
import { TeslaShieldSvg, useTeslaLoader } from "@/components/TeslaLoader";
import { TESLA_VEHICLES } from "@/data/teslaCatalog";

const primaryLinks = [
  { label: "Vehicles", href: "/inventory", hasMega: true },
  { label: "Flying Car", href: "/flying-car" },
  { label: "Energy", href: "/ecosystem" },
  { label: "Robotics", href: "/ecosystem#robotics" },
  { label: "Invest", href: "/invest" },
  { label: "Giveaways", href: "/giveaways" },
  { label: "News", href: "/news" },
  { label: "Careers", href: "/careers" },
];

const drawerLinks = [
  { label: "Live Inventory", href: "/inventory", note: "Direct checkout — Vehicles, Energy & Robotics" },
  { label: "Flying Car & Test Drive", href: "/flying-car", note: "Pre-book Model Aero eVTOL or book prototype drive" },
  { label: "Tesla Ecosystem", href: "/ecosystem", note: "Solar, Powerwall 3, Supercharger & Optimus" },
  { label: "Investment Programs", href: "/invest", note: "Clean-energy portfolio allocations" },
  { label: "Free Giveaways", href: "/giveaways", note: "100% free $0 vehicle prize drops & claims" },
  { label: "Elon Musk & Vision", href: "/elon-musk", note: "Leadership & long-term roadmap" },
  { label: "VIP Executive Session", href: "/vip-session", note: "Private briefings & strategic tours" },
  { label: "Funding & Rails", href: "/payments", note: "Wire, card, and digital asset settlement" },
  { label: "Newsroom", href: "/news", note: "Platform announcements & milestones" },
  { label: "Careers", href: "/careers", note: "Engineering, energy & operations roles" },
  { label: "Support Center", href: "/support", note: "Dedicated concierge & ticket tracking" },
];

export default function Header({ heroTransparent = false }: { heroTransparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [vehiclesHover, setVehiclesHover] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { navigateWithLoader } = useTeslaLoader();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth?.getUser()?.then(({ data: { user } }) => setIsLoggedIn(!!user));
    const {
      data: { subscription },
    } = supabase?.auth?.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const overDarkHero = heroTransparent && !scrolled && !vehiclesHover;
  const accountHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <>
      <header
        onMouseLeave={() => setVehiclesHover(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          overDarkHero
            ? "bg-gradient-to-b from-black/65 via-black/30 to-transparent text-white"
            : "bg-background/90 backdrop-blur-xl text-foreground border-b border-border/80 shadow-[0_8px_28px_-22px_rgba(0,0,0,0.35)]"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          {/* Left: Trade Tesla Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="Trade Tesla home"
          >
            <TeslaShieldSvg
              className={`w-5 h-5 transition-colors ${
                overDarkHero ? "text-white" : "text-[#e82127]"
              }`}
            />
            <span className="font-display text-[13px] font-semibold tracking-[0.34em] uppercase whitespace-nowrap">
              Trade Tesla
            </span>
          </Link>

          {/* Center: Tesla.com Primary Links */}
          <nav
            className="hidden lg:flex items-center gap-1"
            aria-label="Primary navigation"
          >
            {primaryLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                ctaLoader
                loaderLabel={item.label.toUpperCase()}
                onMouseEnter={() => setVehiclesHover(Boolean(item.hasMega))}
                className={`px-3.5 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors whitespace-nowrap ${
                  overDarkHero
                    ? "text-white/95 hover:bg-white/15"
                    : "text-foreground/85 hover:bg-foreground/8 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Account (leads to Login when signed out) + Theme + Menu */}
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:block">
              <ThemeToggle
                className={
                  overDarkHero
                    ? "!bg-white/10 !border-white/25 !text-white hover:!bg-white/20"
                    : ""
                }
              />
            </div>

            <button
              type="button"
              onClick={() =>
                navigateWithLoader(accountHref, isLoggedIn ? "DASHBOARD" : "ACCOUNT")
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors whitespace-nowrap ${
                overDarkHero
                  ? "bg-white/15 text-white hover:bg-white/25 border border-white/25"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Account</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-label="Open menu"
              className={`px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors ${
                overDarkHero
                  ? "text-white hover:bg-white/15"
                  : "text-foreground hover:bg-foreground/8"
              }`}
            >
              Menu
            </button>
          </div>
        </div>

        {/* Desktop Vehicles Mega Drawer */}
        {vehiclesHover && (
          <div className="hidden lg:block border-t border-border bg-background/98 backdrop-blur-xl text-foreground shadow-2xl">
            <div className="mx-auto max-w-[1280px] px-10 py-8 grid grid-cols-[1fr_220px] gap-8">
              <div className="grid grid-cols-3 gap-6">
                {TESLA_VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVehiclesHover(false);
                      navigateWithLoader("/inventory", v.name.toUpperCase());
                    }}
                    className="group text-left rounded-[6px] p-2.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-[4px] bg-muted">
                      <img
                        src={v.heroImage}
                        alt={v.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between gap-2">
                      <span className="font-display text-sm font-semibold">{v.name}</span>
                      <span className="text-xs text-muted-foreground tabular">
                        ${v.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {v.rangeMiles} mi · 0–60 in {v.zeroToSixty}
                    </p>
                  </button>
                ))}
              </div>
              <div className="border-l border-border pl-6 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Quick Access
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVehiclesHover(false);
                      navigateWithLoader("/inventory", "INVENTORY");
                    }}
                    className="block text-sm font-medium hover:text-[#e82127] transition-colors"
                  >
                    Live Inventory Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehiclesHover(false);
                      navigateWithLoader("/ecosystem", "ENERGY & SOLAR");
                    }}
                    className="block text-sm font-medium hover:text-[#e82127] transition-colors"
                  >
                    Solar Roof & Powerwall 3
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehiclesHover(false);
                      navigateWithLoader("/ecosystem#robotics", "OPTIMUS GEN 2");
                    }}
                    className="block text-sm font-medium hover:text-[#e82127] transition-colors"
                  >
                    Optimus Humanoid Robotics
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehiclesHover(false);
                      navigateWithLoader("/flying-car", "MODEL AERO PRE-BOOK");
                    }}
                    className="block text-sm font-medium hover:text-[#e82127] transition-colors"
                  >
                    Flying Car Pre-Book &amp; Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehiclesHover(false);
                      navigateWithLoader("/giveaways", "GIVEAWAYS");
                    }}
                    className="block text-sm font-medium hover:text-[#e82127] transition-colors"
                  >
                    Free Vehicle Giveaways
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVehiclesHover(false);
                    navigateWithLoader(accountHref, "ACCOUNT");
                  }}
                  className="w-full py-2.5 rounded-[4px] bg-foreground text-background text-xs font-semibold tracking-wide uppercase hover:opacity-90 transition-opacity"
                >
                  Account Portal
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Side Drawer Menu */}
      <div
        className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <aside
          aria-label="Site directory"
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-background text-foreground p-6 sm:p-8 overflow-y-auto border-l border-border transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <TeslaShieldSvg className="w-5 h-5 text-[#e82127]" />
              <span className="font-display text-xs font-semibold tracking-[0.3em] uppercase">
                Trade Tesla
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 rounded-[4px] hover:bg-muted flex items-center justify-center"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-1">
            {drawerLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigateWithLoader(item.href, item.label.toUpperCase());
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-[4px] hover:bg-muted/70 transition-colors"
              >
                <div className="text-[14px] font-medium text-foreground">{item.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{item.note}</div>
              </button>
            ))}
          </div>

          <div className="mt-7 pt-5 border-t border-border space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigateWithLoader(accountHref, isLoggedIn ? "DASHBOARD" : "ACCOUNT");
              }}
              className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {isLoggedIn ? "Open Account Dashboard" : "Account"}
            </button>
            {isLoggedIn && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigateWithLoader("/account/deposit", "DEPOSIT");
                  }}
                  className="h-10 rounded-[4px] border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  Deposit Funds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigateWithLoader("/account/orders", "ORDERS");
                  }}
                  className="h-10 rounded-[4px] border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  My Orders
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
