import React, { useEffect, useState } from "react";
import AppImage from "@/components/ui/AppImage";
import CheckoutModal from "@/components/inventory/CheckoutModal";
import {
  cybercabImg,
  megapackImg,
  modelYImg,
  normalizeInventoryImageUrl,
  solarRoofImg,
} from "@/lib/inventoryImages";
import { useTeslaLoader } from "@/components/TeslaLoader";

type Category = "All" | "Vehicles" | "Energy" | "Solar" | "Robotics";

interface InventoryItem {
  id: number | string;
  name: string;
  price: string;
  badge: string;
  badgeType: "new" | "cpo" | "energy" | "solar" | "robotics";
  category: Exclude<Category, "All">;
  image: string;
  alt: string;
  tag?: string;
}

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=65`;

const IMG = {
  cybertruck: U("photo-1715135755172-4605bd091ba2"),
  modelS: U("photo-1560958089-b8a1929cea89"),
  modelSAlt: U("photo-1554744512-d6c603f27c54"),
  model3: U("photo-1591628360686-06bc9367d09a"),
  model3Alt: U("photo-1655792290994-93437dc0482c"),
  modelX: U("photo-1650938777875-a375b33cd705"),
  modelY: modelYImg,
  modelYAlt: modelYImg,
  roadster: U("photo-1617788138017-80ad40651399"),
  semi: U("photo-1601584115197-04ecc0da31d7"),
  cybercab: cybercabImg,
  powerwall: U("photo-1706699778556-a9f9da002139"),
  megapack: megapackImg,
  gridStorage: megapackImg,
  charger: U("photo-1593941707882-a5bba14938c7"),
  supercharger: U("photo-1633158829585-23ba8f7c8caf"),
  cleanGrid: U("photo-1548337138-e87d889cc369"),
  solarRoof: solarRoofImg,
  solarPanels: U("photo-1613665813446-82a78c468a1d"),
  solarFarm: U("photo-1509391366360-2e959784a276"),
  optimus: "/assets/images/tesla_optimus_robotics.webp",
  optimusAlt: U("photo-1531746790731-6c087fecd65a"),
  roboArm: U("photo-1567789884554-0b844b597180"),
  aiCompute: U("photo-1558494949-ef010cbdcc31"),
};

const inventory: InventoryItem[] = [
  // ── Vehicles ──────────────────────────────────────────────────────────────
  { id: 1, name: "2026 Tesla Cybertruck AWD", price: "$79,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.cybertruck, alt: "Tesla Cybertruck AWD stainless steel pickup parked on open road at dusk" },
  { id: 2, name: "2026 Cybertruck Cyberbeast", price: "$99,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.cybertruck, alt: "Tesla Cybertruck Cyberbeast tri-motor edition on desert terrain" },
  { id: 3, name: "2026 Model S Plaid", price: "$89,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.modelS, alt: "Tesla Model S Plaid electric sedan, sleek aerodynamic profile" },
  { id: 4, name: "2026 Model S Long Range", price: "$74,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.modelSAlt, alt: "Tesla Model S Long Range luxury electric sedan side profile" },
  { id: 5, name: "CPO Model S Long Range", price: "$69,990", badge: "CPO", badgeType: "cpo", category: "Vehicles", image: IMG.modelSAlt, alt: "Certified pre-owned Tesla Model S Long Range electric sedan" },
  { id: 6, name: "2026 Model 3 Highland Performance", price: "$54,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.model3, alt: "Tesla Model 3 Highland Performance compact sport sedan" },
  { id: 7, name: "2026 Model 3 Highland Long Range AWD", price: "$47,490", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.model3Alt, alt: "Tesla Model 3 Highland Long Range all-wheel-drive sedan" },
  { id: 8, name: "2026 Model 3 Highland RWD", price: "$38,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.model3Alt, alt: "Tesla Model 3 Highland rear-wheel-drive sedan in urban setting" },
  { id: 9, name: "CPO Model 3 2024", price: "$32,990", badge: "CPO", badgeType: "cpo", category: "Vehicles", image: IMG.model3, alt: "Certified pre-owned 2024 Tesla Model 3 compact electric sedan" },
  { id: 10, name: "2026 Model X Plaid", price: "$94,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.modelX, alt: "Tesla Model X Plaid SUV with falcon wing doors" },
  { id: 11, name: "2026 Model X Long Range", price: "$79,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.modelX, alt: "Tesla Model X Long Range full-size electric SUV" },
  { id: 12, name: "CPO Model X Long Range", price: "$74,990", badge: "CPO", badgeType: "cpo", category: "Vehicles", image: IMG.modelX, alt: "Certified pre-owned Tesla Model X Long Range electric SUV" },
  { id: 13, name: "2026 Model Y Juniper Performance", price: "$59,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.modelY, alt: "Tesla Model Y Juniper Performance electric crossover" },
  { id: 14, name: "2026 Model Y Juniper Long Range AWD", price: "$48,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.modelYAlt, alt: "Tesla Model Y Juniper Long Range AWD compact SUV" },
  { id: 15, name: "2026 Model Y Juniper RWD", price: "$44,990", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.modelYAlt, alt: "Tesla Model Y Juniper RWD electric crossover" },
  { id: 16, name: "CPO Model Y 2024", price: "$36,990", badge: "CPO", badgeType: "cpo", category: "Vehicles", image: IMG.modelY, alt: "Certified pre-owned 2024 Tesla Model Y crossover" },
  { id: 17, name: "Tesla Semi – 500 Mile Range", price: "$150,000", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.semi, alt: "Tesla Semi electric long-haul truck on highway" },
  { id: 18, name: "Tesla Semi – 300 Mile Range", price: "$120,000", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.semi, alt: "Tesla Semi 300 mile regional electric freight truck" },
  { id: 19, name: "Tesla Cybercab – Reservation", price: "$30,000", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.cybercab, alt: "Tesla Cybercab autonomous robotaxi two-door concept vehicle" },
  { id: 20, name: "Roadster Gen 2 – Founders Slot", price: "$250,000", badge: "NEW", badgeType: "new", category: "Vehicles", image: IMG.roadster, alt: "Next generation Tesla Roadster electric hypercar" },

  // ── Energy ────────────────────────────────────────────────────────────────
  { id: 21, name: "Powerwall 3 – 13.5 kWh", price: "$11,500", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.powerwall, alt: "Tesla Powerwall 3 home battery mounted on exterior wall" },
  { id: 22, name: "Powerwall 3 – Two-Unit System", price: "$21,500", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.powerwall, alt: "Two Tesla Powerwall 3 home batteries installed side by side" },
  { id: 23, name: "Powerwall 3 – Four-Unit Estate System", price: "$41,000", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.gridStorage, alt: "Multi-unit Tesla Powerwall estate energy storage installation" },
  { id: 24, name: "Backup Gateway 2 + Whole-Home Kit", price: "$3,200", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.cleanGrid, alt: "Tesla Backup Gateway whole-home energy management hardware" },
  { id: 25, name: "Megapack 2 XL – 3.9 MWh", price: "$1,200,000", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.megapack, alt: "Tesla Megapack utility-scale battery storage unit" },
  { id: 26, name: "Megapack Array – 20 MWh Utility", price: "$6,400,000", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.gridStorage, alt: "Large Tesla Megapack array at a utility-scale storage site" },
  { id: 27, name: "Powerpack Commercial – 232 kWh", price: "$185,000", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.megapack, alt: "Tesla Powerpack commercial battery storage cabinets" },
  { id: 28, name: "Wall Connector Gen 3 – 48A", price: "$475", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.charger, alt: "Tesla Wall Connector home EV charger mounted in garage" },
  { id: 29, name: "Supercharger V4 Cabinet – Host Package", price: "$95,000", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.supercharger, alt: "Tesla Supercharger V4 charging station cabinet and stalls" },
  { id: 30, name: "Virtual Power Plant – Grid Allocation", price: "$60,000", badge: "ENERGY", badgeType: "energy", category: "Energy", image: IMG.cleanGrid, alt: "Clean energy grid infrastructure for virtual power plant program" },

  // ── Solar ─────────────────────────────────────────────────────────────────
  { id: 31, name: "Tesla Solar Roof V3 – 10 kW", price: "$35,000", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarRoof, alt: "Tesla Solar Roof tiles integrated into a modern home rooftop" },
  { id: 32, name: "Tesla Solar Roof V3 – 16 kW", price: "$52,000", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarRoof, alt: "Large Tesla Solar Roof tile installation on residential home" },
  { id: 33, name: "Tesla Solar Panels – 4.80 kW", price: "$13,500", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarPanels, alt: "Small Tesla solar panel array on a residential roof" },
  { id: 34, name: "Tesla Solar Panels – 8.16 kW", price: "$22,000", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarPanels, alt: "Tesla solar panel array on modern home roof under blue sky" },
  { id: 35, name: "Tesla Solar Panels – 12.24 kW", price: "$30,000", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarFarm, alt: "Large Tesla solar panel installation on building rooftop" },
  { id: 36, name: "Solar + Powerwall 3 Bundle", price: "$44,500", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarPanels, alt: "Tesla solar panels paired with Powerwall home battery system" },
  { id: 37, name: "Commercial Solar Array – 100 kW", price: "$180,000", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarFarm, alt: "Commercial scale solar array field generating clean power" },
  { id: 38, name: "Solar Farm Participation – 1 MW Block", price: "$900,000", badge: "SOLAR", badgeType: "solar", category: "Solar", image: IMG.solarFarm, alt: "Utility scale solar farm with rows of photovoltaic panels" },

  // ── Robotics ──────────────────────────────────────────────────────────────
  { id: 39, name: "Optimus Gen 2 – Production Allocation", price: "$25,000", badge: "ROBOTICS", badgeType: "robotics", category: "Robotics", image: IMG.optimus, alt: "Tesla Optimus Gen 2 humanoid robot standing in modern facility" },
  { id: 40, name: "Optimus Gen 2 – Industrial Pack", price: "$45,000", badge: "ROBOTICS", badgeType: "robotics", category: "Robotics", image: IMG.optimusAlt, alt: "Humanoid robot in industrial configuration performing a factory task" },
  { id: 41, name: "Optimus Fleet – 10 Unit Deployment", price: "$420,000", badge: "ROBOTICS", badgeType: "robotics", category: "Robotics", image: IMG.optimusAlt, alt: "Fleet of humanoid robots deployed in a manufacturing facility" },
  { id: 42, name: "Optimus End-Effector Toolkit", price: "$8,500", badge: "ROBOTICS", badgeType: "robotics", category: "Robotics", image: IMG.roboArm, alt: "Precision robotic hand and end-effector engineering components" },
  { id: 43, name: "Autonomous Factory Robot Package", price: "$150,000", badge: "ROBOTICS", badgeType: "robotics", category: "Robotics", image: IMG.roboArm, alt: "Industrial robotic arm in an automated Gigafactory line" },
  { id: 44, name: "Dojo AI Training Compute – Allocation", price: "$300,000", badge: "ROBOTICS", badgeType: "robotics", category: "Robotics", image: IMG.aiCompute, alt: "AI supercomputer training cluster hardware racks" },
  { id: 45, name: "FSD Inference Module – Fleet Bundle", price: "$65,000", badge: "ROBOTICS", badgeType: "robotics", category: "Robotics", image: IMG.aiCompute, alt: "Autonomous driving inference compute modules for vehicle fleets" },
];

function getSpecLineForItem(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes("model s plaid")) return "359 mi EPA · 1.99s 0–60 · 200 mph";
  if (n.includes("model s")) return "402 mi EPA · 3.1s 0–60 · Dual AWD";
  if (n.includes("model 3") && n.includes("performance")) return "303 mi EPA · 2.9s 0–60 · 163 mph";
  if (n.includes("model 3") && n.includes("long range")) return "363 mi EPA · 4.2s 0–60 · Acoustic Cabin";
  if (n.includes("model 3")) return "Up to 363 mi · 250 kW Supercharging";
  if (n.includes("model x plaid")) return "326 mi EPA · 2.5s 0–60 · 1,020 hp";
  if (n.includes("model x")) return "335 mi EPA · Falcon Wing Doors · AWD";
  if (n.includes("model y") && n.includes("performance")) return "294 mi EPA · 3.3s 0–60 · 155 mph";
  if (n.includes("model y")) return "Up to 337 mi · 76 cu ft Cargo · 5-Star Safety";
  if (n.includes("cyberbeast")) return "320 mi Est. · 2.6s 0–60 · 845 hp Tri-Motor";
  if (n.includes("cybertruck")) return "325 mi Est. · 11,000 lb Towing · Steer-by-Wire";
  if (n.includes("roadster")) return "620 mi Est. · 1.9s 0–60 · 250+ mph";
  if (n.includes("semi")) return "82,000 lb GCWR · 1,000V · 70% in 30 min";
  if (n.includes("cybercab")) return "290 mi Est. · Full Autonomy · Inductive Charge";
  if (n.includes("powerwall 3")) return "13.5 kWh / unit · 11.5 kW Continuous Inverter";
  if (n.includes("megapack")) return "3.9 MWh Unit · Integrated Thermal & Autobidder";
  if (n.includes("wall connector")) return "48A / 11.5 kW · Up to 44 mi/hr · 24 ft Cable";
  if (n.includes("supercharger")) return "Up to 350 kW V4 Peak · NACS · 99.97% Uptime";
  if (n.includes("solar roof")) return "Tempered Solar Glass · 25-Yr Warranty · Class 3 Hail";
  if (n.includes("solar")) return "Monocrystalline Array · 30% Tax Credit Eligible";
  if (n.includes("optimus")) return "5'8\" · 125 lb · 28 Actuators · 11-DoF Hands";
  if (n.includes("dojo") || n.includes("fsd")) return "End-to-End Neural Compute · ExaFLOP Cluster";
  return `Verified ${category} Hardware Allocation`;
}

const PAGE_SIZE = 12;
const LOAD_STEP = 12;
const ORDER: Exclude<Category, "All">[] = ["Vehicles", "Energy", "Solar", "Robotics"];
const categories: Category[] = ["All", "Vehicles", "Energy", "Solar", "Robotics"];

export default function LiveInventorySection() {
  const [items, setItems] = useState<InventoryItem[]>(inventory);
  const [active, setActive] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [checkoutItem, setCheckoutItem] = useState<InventoryItem | null>(null);
  const { triggerLoader } = useTeslaLoader();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const { data } = await supabase
          .from("inventory_items")
          .select("id,name,price,badge,badge_type,category,image_url,alt")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (cancelled || !data || data.length === 0) return;

        const staticNameMap = new Map<string, string>();
        for (const item of inventory) {
          const key = item.name.toLowerCase().trim();
          staticNameMap.set(key, item.image);
          staticNameMap.set(key.replace(/^2026\b/, "2025"), item.image);
        }
        staticNameMap.set("2026 model y premium rear-wheel drive", modelYImg);
        staticNameMap.set("2026 model y premium all-wheel drive", modelYImg);

        setItems(
          data.map((r: Record<string, string>) => {
            const normalizedDbImg = normalizeInventoryImageUrl(r.image_url);
            const fallbackImg =
              staticNameMap.get(String(r.name ?? "").toLowerCase().trim()) ?? "";

            return {
              id: r.id,
              name: r.name,
              price: r.price,
              badge: r.badge,
              badgeType: r.badge_type as InventoryItem["badgeType"],
              category: r.category as Exclude<Category, "All">,
              image: normalizedDbImg || fallbackImg,
              alt: r.alt || r.name,
            };
          }),
        );
      } catch {
        /* keep static catalog */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (i: InventoryItem) =>
      !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);

    if (active !== "All") return items.filter((i) => i.category === active && match(i));
    const buckets = ORDER.map((c) => items.filter((i) => i.category === c && match(i)));
    const out: InventoryItem[] = [];
    for (let row = 0; out.length < items.length; row++) {
      let pushed = false;
      for (const bucket of buckets) {
        const item = bucket[row];
        if (item) {
          out.push(item);
          pushed = true;
        }
      }
      if (!pushed) break;
    }
    return out;
  }, [active, items, query]);

  const displayed = filtered.slice(0, visible);
  const remaining = filtered.length - displayed.length;

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { All: items.length };
    for (const c of ORDER) map[c] = items.filter((i) => i.category === c).length;
    return map;
  }, [items]);

  return (
    <section id="inventory" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-10 bg-background">
      <div className="mx-auto max-w-[1440px]">
        {/* Tesla.com Studio Header */}
        <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#0e9f6e] pulse-dot" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0e9f6e]">
                Live Direct-Purchase Inventory
              </span>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Vehicles, Energy, Solar &amp; Robotics
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Select any in-stock vehicle or clean energy system for direct online checkout via wallet
              balance, wire, or digital asset settlement.
            </p>
          </div>

          <div className="w-full md:w-72">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search Model S, Cybertruck, Powerwall..."
              aria-label="Search inventory"
              className="h-10 w-full rounded-[4px] border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          className="mt-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Inventory category filter"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={active === cat}
              onClick={() => {
                setActive(cat);
                setVisible(PAGE_SIZE);
              }}
              className={`h-10 rounded-[4px] px-4 text-xs font-medium transition-colors ${
                active === cat
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}{" "}
              <span className="ml-1.5 opacity-60 tabular">{counts[cat] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Inventory Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayed.map((item, idx) => (
            <article
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-[6px] border border-border bg-card transition-all duration-300 hover:border-foreground/35 hover:shadow-lg"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <AppImage
                    src={item.image}
                    alt={item.alt}
                    fill
                    priority={idx < 4}
                    loading={idx < 8 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute top-3 left-3 rounded-[3px] bg-black/75 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    {item.badge}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.category}
                  </p>
                  <h3 className="font-display mt-1 text-base font-semibold leading-snug text-foreground">
                    {item.name}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {getSpecLineForItem(item.name, item.category)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
                <span className="font-display text-base font-semibold text-foreground tabular">
                  {item.price}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    triggerLoader({
                      label: "INITIALIZING CHECKOUT",
                      durationMs: 360,
                      onComplete: () => setCheckoutItem(item),
                    })
                  }
                  className="h-9 rounded-[4px] bg-[#3e6ae1] px-4 text-xs font-medium text-white hover:bg-[#345ac7] transition-colors"
                >
                  Buy Now
                </button>
              </div>
            </article>
          ))}
        </div>

        {displayed.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No matching inventory items found.
          </div>
        )}

        {remaining > 0 && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + LOAD_STEP)}
              className="h-11 rounded-[4px] border border-border bg-card px-8 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Load More ({remaining} remaining)
            </button>
          </div>
        )}
      </div>

      {checkoutItem && (
        <CheckoutModal item={checkoutItem} onClose={() => setCheckoutItem(null)} />
      )}
    </section>
  );
}
