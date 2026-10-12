import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "@/components/SmartLink";
import InvestmentPackagesSection from "@/components/sections/InvestmentPackagesSection";
import FloatingSupport from "@/components/sections/FloatingSupport";
import ScrollAnimations from "@/components/ScrollAnimations";

type Panel = {
  label: string;
  title: string;
  sub: string;
  img: string;
  alt: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

const panels: Panel[] = [
  {
    label: "Electric Trucks",
    title: "Cybertruck",
    sub: "From $67,990 · Order with Trade Tesla",
    img: "/assets/images/tesla_vehicles_hero.webp",
    alt: "Tesla Cybertrucks in a studio setting",
    primary: { label: "Order Now", href: "/inventory" },
    secondary: { label: "View Inventory", href: "/inventory" },
  },
  {
    label: "Invest",
    title: "Invest in Tesla & SpaceX",
    sub: "Plans built around the Tesla and SpaceX ecosystems",
    img: "/assets/images/spacex_starship_launch.webp",
    alt: "Rocket launch at dusk",
    primary: { label: "Start Investing", href: "/register" },
    secondary: { label: "View Plans", href: "/invest" },
  },
  {
    label: "Energy Storage",
    title: "Powerwall & Megapack",
    sub: "Store energy. Power your future.",
    img: "/assets/images/tesla_energy_hero.webp",
    alt: "Tesla energy storage installation",
    primary: { label: "Shop Energy", href: "/inventory" },
    secondary: { label: "Learn More", href: "/ecosystem" },
  },
  {
    label: "Solar",
    title: "Solar Roof",
    sub: "Generate clean energy from your roof",
    img: "/assets/inventory/solar_roof.webp",
    alt: "Home with Tesla Solar Roof",
    primary: { label: "Order Now", href: "/inventory" },
    secondary: { label: "Learn More", href: "/ecosystem" },
  },
  {
    label: "Robotics",
    title: "Optimus",
    sub: "The future of robotics",
    img: "/assets/images/tesla_optimus_robotics.webp",
    alt: "Tesla Optimus humanoid robot",
    primary: { label: "Reserve Now", href: "/inventory" },
    secondary: { label: "Learn More", href: "/ecosystem" },
  },
];

function PanelSection({ p, first }: { p: Panel; first: boolean }) {
  return (
    <section className="tsla-panel">
      <img src={p.img} alt={p.alt} loading={first ? "eager" : "lazy"} decoding="async" />
      <div className="pt-28 sm:pt-32 px-6">
        <p className="lux-label tsla-rise" style={{ color: "var(--on-media)", opacity: 0.85 }}>{p.label}</p>
        <h2 className="tsla-rise tsla-rise-1 mt-3 text-5xl sm:text-6xl font-medium tracking-tight">{p.title}</h2>
        <p className="tsla-rise tsla-rise-2 mt-3 text-sm sm:text-base opacity-90">{p.sub}</p>
      </div>
      <div className="pb-16 px-6 flex flex-col sm:flex-row gap-3 sm:gap-6 w-full sm:w-auto tsla-rise tsla-rise-3">
        <Link href={p.primary.href} className="tsla-btn tsla-btn-solid">{p.primary.label}</Link>
        <Link href={p.secondary.href} className="tsla-btn tsla-btn-ghost">{p.secondary.label}</Link>
      </div>
    </section>
  );
}

function VideoInventoryPanel() {
  return (
    <section className="tsla-panel">
      <video
        src="/assets/video/inventory.mp4"
        poster="/assets/video/inventory-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={(e) => e.currentTarget.classList.add("is-playing")}
      />
      <div className="pt-28 sm:pt-32 px-6">
        <p className="lux-label tsla-rise" style={{ color: "var(--on-media)", opacity: 0.85 }}>Live Inventory</p>
        <h2 className="tsla-rise tsla-rise-1 mt-3 text-5xl sm:text-6xl font-medium tracking-tight">Drive Today</h2>
        <p className="tsla-rise tsla-rise-2 mt-3 text-sm sm:text-base opacity-90">Verified vehicles, energy and robotics — ready to order</p>
      </div>
      <div className="pb-10 px-6 w-full max-w-3xl tsla-rise tsla-rise-3">
        <div className="lux-metrics mb-8">
          <div><div className="text-2xl sm:text-3xl font-medium">20+</div><div className="lux-label" style={{ color: "var(--on-media)" }}>Models</div></div>
          <div><div className="text-2xl sm:text-3xl font-medium">1 Day</div><div className="lux-label" style={{ color: "var(--on-media)" }}>Specialist Contact</div></div>
          <div><div className="text-2xl sm:text-3xl font-medium">24/7</div><div className="lux-label" style={{ color: "var(--on-media)" }}>Support</div></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
          <Link href="/inventory" className="tsla-btn tsla-btn-solid">Shop Inventory</Link>
          <Link href="/register" className="tsla-btn tsla-btn-ghost">Start Investing</Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden tsla-snap">
      <Header />
      <h1 className="sr-only">Trade Tesla — vehicles, energy, solar, robotics and investing</h1>
      <VideoInventoryPanel />
      {panels.map((p) => (
        <PanelSection key={p.title} p={p} first={false} />
      ))}
      <InvestmentPackagesSection />
      <Footer />
      <FloatingSupport />
      <ScrollAnimations />
    </main>
  );
}
