import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/sections/FloatingSupport";
import { useTeslaLoader } from "@/components/TeslaLoader";

const articles = [
  {
    id: 1,
    category: "Market Update",
    title: "Tesla Energy Deployments Accelerate — Utility Megapack Capacity Expands",
    excerpt:
      "Grid-scale Megapack 2 XL deliveries continue scaling rapidly alongside surging Cybertruck and Model 3 Highland customer deliveries.",
    time: "2 hours ago",
    readTime: "4 min read",
    tag: "TSLA",
    image: "/images/car-red.jpg",
    alt: "Tesla Model S Plaid on coastal highway",
    featured: true,
    href: "/inventory",
  },
  {
    id: 2,
    category: "Energy",
    title: "Megapack 2 XL Orders Surge Across 14 Regional Grid Operators",
    excerpt:
      "Utility-scale 3.9 MWh battery blocks replace fossil peaker plants with zero-emission turnkey Autobidder storage arrays.",
    time: "5 hours ago",
    readTime: "3 min read",
    tag: "Energy",
    image: "/images/energy-home.jpg",
    alt: "Tesla solar and Powerwall residential energy installation",
    featured: false,
    href: "/ecosystem",
  },
  {
    id: 3,
    category: "Robotics",
    title: "Optimus Gen 2 Enters Autonomous Factory Logistics Validation",
    excerpt:
      "Powered by FSD neural inference hardware and Dojo simulation, Optimus actuators handle delicate production sorting.",
    time: "1 day ago",
    readTime: "5 min read",
    tag: "Robotics",
    image: "/assets/images/tesla_optimus_robotics.webp",
    alt: "Tesla Optimus Gen 2 humanoid robot in factory setting",
    featured: false,
    href: "/ecosystem#robotics",
  },
  {
    id: 4,
    category: "Investment",
    title: "Clean Energy Asset Allocations Expand Across Solar & Charging",
    excerpt:
      "Investors gain structured exposure to Megapack deployments, solar arrays, and V4 Supercharger corridors.",
    time: "2 days ago",
    readTime: "3 min read",
    tag: "Programs",
    image: "/images/battery.jpg",
    alt: "Home and grid battery storage installation",
    featured: false,
    href: "/invest",
  },
  {
    id: 5,
    category: "Vehicles",
    title: "Cybertruck & New Model 3 Headline Direct-Checkout Fleet Availability",
    excerpt:
      "Steer-by-wire agility, cold-rolled stainless exoskeleton, and 363-mile acoustic sedan configurations ship with FedEx dispatch.",
    time: "3 days ago",
    readTime: "3 min read",
    tag: "Vehicles",
    image: "/images/car-truck.jpg",
    alt: "Tesla Cybertruck on open terrain",
    featured: false,
    href: "/inventory",
  },
  {
    id: 6,
    category: "Charging",
    title: "NACS Supercharger Network Surpasses 60,000 Fast-Charging Stalls",
    excerpt:
      "V4 cabinets deliver up to 350 kW peak power with 99.97% network uptime and plug-and-charge telemetry.",
    time: "4 days ago",
    readTime: "4 min read",
    tag: "Charging",
    image: "/images/charger.jpg",
    alt: "Tesla Supercharger network hardware",
    featured: false,
    href: "/ecosystem",
  },
];

const categories = ["All", "Market Update", "Energy", "Robotics", "Investment", "Vehicles", "Charging"];

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { navigateWithLoader } = useTeslaLoader();

  const visibleArticles =
    activeCategory === "All"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const featured = activeCategory === "All" ? visibleArticles.find((a) => a.featured) : null;
  const gridArticles = featured
    ? visibleArticles.filter((a) => a.id !== featured.id)
    : visibleArticles;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="border-b border-border pb-8 mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Trade Tesla Newsroom
            </span>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
              News &amp; Ecosystem Updates
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Dispatches across Tesla vehicles, Megapack utility storage, Optimus robotics, NACS
              charging, and platform milestones.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`h-9 rounded-[4px] px-4 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {featured && (
            <article className="mb-10 overflow-hidden rounded-[6px] border border-border bg-card transition-all hover:shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto min-h-[280px] overflow-hidden bg-muted">
                  <img
                    src={featured.image}
                    alt={featured.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                    <span className="rounded-[3px] bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                      {featured.tag}
                    </span>
                    <span>{featured.time}</span>
                    <span>· {featured.readTime}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-4">
                    {featured.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {featured.excerpt}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateWithLoader(featured.href, "EXPLORE")}
                    className="self-start text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-75 transition-opacity"
                  >
                    Explore Related Listings →
                  </button>
                </div>
              </div>
            </article>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridArticles.map((article) => (
              <article
                key={article.id}
                className="flex flex-col justify-between overflow-hidden rounded-[6px] border border-border bg-card transition-all hover:border-foreground/35 hover:shadow-md"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={article.image}
                      alt={article.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 text-[11px] text-muted-foreground">
                      <span className="rounded-[3px] border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                        {article.tag}
                      </span>
                      <span>{article.time}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold leading-snug text-foreground mb-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={() => navigateWithLoader(article.href, article.tag.toUpperCase())}
                    className="text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-75 transition-opacity"
                  >
                    View Section →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <Footer />
      <FloatingSupport />
    </main>
  );
}
