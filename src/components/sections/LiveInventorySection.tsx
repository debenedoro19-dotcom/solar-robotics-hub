import React, { useEffect, useState } from "react";
import AppImage from "@/components/ui/AppImage";
import CheckoutModal from "@/components/inventory/CheckoutModal";
import { megapackImg, resolveInventoryImageUrl } from "@/lib/inventoryImages";
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
  specs: string;
}

const INVENTORY_CATALOG: InventoryItem[] = [
  // ── Vehicles (Official Tesla.com Lineup & CPO) ────────────────────────────
  {
    id: "ts-model-s-awd",
    name: "Model S All-Wheel Drive",
    price: "$74,990",
    badge: "NEW",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-red.jpg",
    alt: "Tesla Model S All-Wheel Drive flagship electric sedan",
    specs: "402 mi EPA · 3.1 s 0–60 mph · 130 mph · Dual Motor AWD",
  },
  {
    id: "ts-model-s-plaid",
    name: "Model S Plaid",
    price: "$89,990",
    badge: "FLAGSHIP",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-red.jpg",
    alt: "Tesla Model S Plaid 1,020 hp tri-motor flagship sedan",
    specs: "359 mi EPA · 1.99 s 0–60 mph · 200 mph · 1,020 hp Tri-Motor",
  },
  {
    id: "ts-model-3-rwd",
    name: "Model 3 Long Range RWD",
    price: "$42,490",
    badge: "NEW",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-white.jpg",
    alt: "Tesla Model 3 Long Range rear-wheel-drive electric sedan",
    specs: "363 mi EPA · 4.9 s 0–60 mph · 125 mph · 250 kW Supercharging",
  },
  {
    id: "ts-model-3-lr-awd",
    name: "Model 3 Long Range AWD",
    price: "$47,490",
    badge: "NEW",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-white.jpg",
    alt: "Tesla Model 3 Long Range all-wheel-drive sedan",
    specs: "341 mi EPA · 4.2 s 0–60 mph · Acoustic 360° Cabin · AWD",
  },
  {
    id: "ts-model-3-perf",
    name: "Model 3 Performance AWD",
    price: "$54,990",
    badge: "PERFORMANCE",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-white.jpg",
    alt: "Tesla Model 3 Performance all-wheel-drive sports sedan",
    specs: "303 mi EPA · 2.9 s 0–60 mph · 163 mph · 510 hp Track Mode V3",
  },
  {
    id: "ts-model-y-lr-rwd",
    name: "Model Y Long Range RWD",
    price: "$44,990",
    badge: "BEST SELLER",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-crossover.jpg",
    alt: "Tesla Model Y Long Range RWD electric crossover SUV",
    specs: "337 mi EPA · 6.5 s 0–60 mph · 76 cu ft Cargo · HEPA Filter",
  },
  {
    id: "ts-model-y-lr-awd",
    name: "Model Y Long Range AWD",
    price: "$48,990",
    badge: "NEW",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-crossover.jpg",
    alt: "Tesla Model Y Long Range AWD electric crossover",
    specs: "327 mi EPA · 4.6 s 0–60 mph · Dual Motor AWD · 5-Star Safety",
  },
  {
    id: "ts-model-y-perf",
    name: "Model Y Performance AWD",
    price: "$59,990",
    badge: "PERFORMANCE",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-crossover.jpg",
    alt: "Tesla Model Y Performance all-wheel-drive electric SUV",
    specs: "294 mi EPA · 3.3 s 0–60 mph · 155 mph · Adaptive Damping",
  },
  {
    id: "ts-model-x-awd",
    name: "Model X All-Wheel Drive",
    price: "$79,990",
    badge: "NEW",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-suv.jpg",
    alt: "Tesla Model X All-Wheel Drive full-size electric SUV",
    specs: "335 mi EPA · 3.8 s 0–60 mph · Falcon Wing Doors · 5,000 lb Tow",
  },
  {
    id: "ts-model-x-plaid",
    name: "Model X Plaid",
    price: "$94,990",
    badge: "PLAID",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-suv.jpg",
    alt: "Tesla Model X Plaid tri-motor performance SUV",
    specs: "326 mi EPA · 2.5 s 0–60 mph · 1,020 hp · 163 mph Top Speed",
  },
  {
    id: "ts-cybertruck-awd",
    name: "Cybertruck All-Wheel Drive",
    price: "$79,990",
    badge: "NEW",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-truck.jpg",
    alt: "Tesla Cybertruck All-Wheel Drive stainless-steel electric pickup",
    specs: "325 mi Est. · 4.1 s 0–60 mph · 11,000 lb Tow · 11.5 kW Powershare",
  },
  {
    id: "ts-cybertruck-beast",
    name: "Cybertruck Cyberbeast",
    price: "$99,990",
    badge: "CYBERBEAST",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-truck.jpg",
    alt: "Tesla Cybertruck Cyberbeast tri-motor performance pickup",
    specs: "320 mi Est. · 2.6 s 0–60 mph · 845 hp Tri-Motor · Steer-by-Wire",
  },
  {
    id: "ts-cybercab",
    name: "Tesla Cybercab – Autonomous",
    price: "$30,000",
    badge: "AUTONOMY",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/tesla/cybercab-studio.jpg",
    alt: "Tesla Cybercab two-passenger autonomous robotaxi coupe",
    specs: "290 mi Est. · AI5 End-to-End FSD · Inductive Wireless Charging",
  },
  {
    id: "ts-semi-300",
    name: "Tesla Semi – 300 Mile Range",
    price: "$150,000",
    badge: "COMMERCIAL",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/tesla/semi-studio.jpg",
    alt: "Tesla Semi 300-mile regional Class 8 electric tractor truck",
    specs: "300 mi Est. · 82,000 lb GCWR · 1,000V · <1.7 kWh / Mile",
  },
  {
    id: "ts-semi-500",
    name: "Tesla Semi – 500 Mile Range",
    price: "$180,000",
    badge: "COMMERCIAL",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/tesla/semi-studio.jpg",
    alt: "Tesla Semi 500-mile long-haul Class 8 electric tractor truck",
    specs: "500 mi Est. · 82,000 lb GCWR · Tri-Motor · 70% in 30 Min",
  },
  {
    id: "ts-roadster-base",
    name: "Roadster – Next-Gen Reservation",
    price: "$200,000",
    badge: "HYPERCAR",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-red.jpg",
    alt: "Next-Generation Tesla Roadster electric supercar",
    specs: "620 mi Est. · 1.9 s 0–60 mph · 250+ mph · 200 kWh Pack",
  },
  {
    id: "ts-roadster-founders",
    name: "Roadster Founders Series",
    price: "$250,000",
    badge: "LIMITED",
    badgeType: "new",
    category: "Vehicles",
    image: "/images/car-red.jpg",
    alt: "Tesla Roadster Founders Series priority production build",
    specs: "620 mi Est. · 1.9 s 0–60 mph · Tri-Motor AWD · Founders Allocation",
  },
  {
    id: "ts-cpo-s",
    name: "CPO Model S Long Range",
    price: "$64,990",
    badge: "CPO",
    badgeType: "cpo",
    category: "Vehicles",
    image: "/images/car-red.jpg",
    alt: "Certified pre-owned Tesla Model S Long Range electric sedan",
    specs: "405 mi EPA · Basic + 1-Yr / 10k mi Used Vehicle Warranty · AWD",
  },
  {
    id: "ts-cpo-3",
    name: "CPO Model 3 Long Range",
    price: "$34,990",
    badge: "CPO",
    badgeType: "cpo",
    category: "Vehicles",
    image: "/images/car-white.jpg",
    alt: "Certified pre-owned Tesla Model 3 Long Range electric sedan",
    specs: "341 mi EPA · 102-Point Tesla Inspection · Autopilot Included",
  },
  {
    id: "ts-cpo-y",
    name: "CPO Model Y Long Range",
    price: "$37,990",
    badge: "CPO",
    badgeType: "cpo",
    category: "Vehicles",
    image: "/images/car-crossover.jpg",
    alt: "Certified pre-owned Tesla Model Y Long Range SUV",
    specs: "330 mi EPA · Used Vehicle Warranty · 76 cu ft Cargo · AWD",
  },
  {
    id: "ts-cpo-x",
    name: "CPO Model X Long Range",
    price: "$68,990",
    badge: "CPO",
    badgeType: "cpo",
    category: "Vehicles",
    image: "/images/car-suv.jpg",
    alt: "Certified pre-owned Tesla Model X Long Range electric SUV",
    specs: "335 mi EPA · Falcon Wing Doors · Certified Multi-Point Inspected",
  },

  // ── Energy (Powerwall, Megapack, Charging) ────────────────────────────────
  {
    id: "ts-pw3-single",
    name: "Powerwall 3 – 13.5 kWh",
    price: "$11,500",
    badge: "ENERGY",
    badgeType: "energy",
    category: "Energy",
    image: "/images/battery.jpg",
    alt: "Tesla Powerwall 3 13.5 kWh whole-home battery mounted on wall",
    specs: "13.5 kWh Usable · 11.5 kW Continuous Inverter · NEMA 3R Flood",
  },
  {
    id: "ts-pw3-expansion",
    name: "Powerwall 3 Expansion Pack",
    price: "$8,200",
    badge: "ENERGY",
    badgeType: "energy",
    category: "Energy",
    image: "/images/battery.jpg",
    alt: "Tesla Powerwall 3 DC battery expansion unit",
    specs: "+13.5 kWh Stackable DC Storage · Expand Up to 40.5 kWh / Inverter",
  },
  {
    id: "ts-pw3-two",
    name: "Powerwall 3 – Two-Unit System",
    price: "$21,500",
    badge: "ENERGY",
    badgeType: "energy",
    category: "Energy",
    image: "/images/battery.jpg",
    alt: "Dual Tesla Powerwall 3 27 kWh whole-home backup installation",
    specs: "27.0 kWh Usable · 23.0 kW Output · Full HVAC & Whole-Home Backup",
  },
  {
    id: "ts-pw3-estate",
    name: "Powerwall 3 – Four-Unit Estate",
    price: "$41,000",
    badge: "ENERGY",
    badgeType: "energy",
    category: "Energy",
    image: "/images/battery.jpg",
    alt: "Four-unit Tesla Powerwall 3 54 kWh estate microgrid system",
    specs: "54.0 kWh Storage · 46.0 kW Surge · Storm Watch & Virtual Power Plant",
  },
  {
    id: "ts-gateway-2",
    name: "Backup Gateway 2 + Load Control",
    price: "$3,200",
    badge: "ENERGY",
    badgeType: "energy",
    category: "Energy",
    image: "/images/battery.jpg",
    alt: "Tesla Backup Gateway 2 automatic microgrid transfer switch",
    specs: "200A Automated Disconnect · Sub-Second Islanding · Utility Net Metering",
  },
  {
    id: "ts-megapack-2xl",
    name: "Megapack 2 XL – 3.9 MWh",
    price: "$1,200,000",
    badge: "UTILITY",
    badgeType: "energy",
    category: "Energy",
    image: megapackImg,
    alt: "Tesla Megapack 2 XL 3.9 MWh utility-scale battery storage container",
    specs: "3.9 MWh Unit · 1.9 MW Bi-Directional Inverter · Autobidder AI",
  },
  {
    id: "ts-megapack-array",
    name: "Megapack Array – 20 MWh Utility",
    price: "$6,400,000",
    badge: "UTILITY",
    badgeType: "energy",
    category: "Energy",
    image: megapackImg,
    alt: "20 MWh Tesla Megapack utility grid-scale energy facility",
    specs: "20 MWh Turnkey Deployment · Integrated Thermal & Fire Suppression",
  },
  {
    id: "ts-wall-connector",
    name: "Wall Connector Gen 3 – 48A",
    price: "$475",
    badge: "CHARGING",
    badgeType: "energy",
    category: "Energy",
    image: "/images/charger.jpg",
    alt: "Tesla Wall Connector Gen 3 NACS home charger",
    specs: "48A / 11.5 kW NACS · Up to 44 mi/hr · 24 ft Cable · Wi-Fi Updates",
  },
  {
    id: "ts-universal-wall-connector",
    name: "Universal Wall Connector",
    price: "$620",
    badge: "CHARGING",
    badgeType: "energy",
    category: "Energy",
    image: "/images/charger.jpg",
    alt: "Tesla Universal Wall Connector with integrated J1772 and NACS",
    specs: "Integrated NACS + J1772 · Powershare V2H Ready · 11.5 kW AC",
  },
  {
    id: "ts-supercharger-v4",
    name: "Supercharger V4 – Commercial Pack",
    price: "$95,000",
    badge: "COMMERCIAL",
    badgeType: "energy",
    category: "Energy",
    image: "/images/charger.jpg",
    alt: "Tesla Supercharger V4 fast-charging cabinet and stalls",
    specs: "Up to 350 kW V4 Peak · NACS Magic Dock · 99.97% Uptime SLA",
  },

  // ── Solar (Solar Roof & Panels) ───────────────────────────────────────────
  {
    id: "ts-solar-roof-10",
    name: "Tesla Solar Roof V3 – 10 kW",
    price: "$35,000",
    badge: "SOLAR",
    badgeType: "solar",
    category: "Solar",
    image: "/images/solar-roof.jpg",
    alt: "Tesla Solar Roof V3 tempered glass architectural roof tiles",
    specs: "Tempered Glass Tiles · 25-Yr Tile Warranty · Class 3 Hail Rated",
  },
  {
    id: "ts-solar-roof-16",
    name: "Tesla Solar Roof V3 – 16 kW",
    price: "$52,000",
    badge: "SOLAR",
    badgeType: "solar",
    category: "Solar",
    image: "/images/solar-roof.jpg",
    alt: "Large Tesla Solar Roof V3 installation for multi-EV homes",
    specs: "16 kW Active Roof + Non-Solar Matching Tiles · ASTM Wind Class F",
  },
  {
    id: "ts-solar-panels-48",
    name: "Tesla Solar Panels – 4.80 kW",
    price: "$13,500",
    badge: "SOLAR",
    badgeType: "solar",
    category: "Solar",
    image: "/images/energy-home.jpg",
    alt: "Tesla 4.80 kW all-black low-profile residential solar panel array",
    specs: "All-Black Low Profile · No Visible Mounting · Integrated Microinverters",
  },
  {
    id: "ts-solar-panels-81",
    name: "Tesla Solar Panels – 8.16 kW",
    price: "$22,000",
    badge: "SOLAR",
    badgeType: "solar",
    category: "Solar",
    image: "/images/energy-home.jpg",
    alt: "Tesla 8.16 kW residential clean energy solar installation",
    specs: "20x High-Efficiency 405W Panels · 30% Federal Tax Credit Eligible",
  },
  {
    id: "ts-solar-bundle",
    name: "Solar Panels + Powerwall 3 Bundle",
    price: "$32,500",
    badge: "BUNDLE",
    badgeType: "solar",
    category: "Solar",
    image: "/images/energy-home.jpg",
    alt: "Integrated Tesla solar array paired with Powerwall 3 battery",
    specs: "8.16 kW Array + 13.5 kWh Powerwall 3 · 96% Grid Independence",
  },
  {
    id: "ts-solar-commercial",
    name: "Commercial Solar Array – 100 kW",
    price: "$180,000",
    badge: "COMMERCIAL",
    badgeType: "solar",
    category: "Solar",
    image: "/images/solar-roof.jpg",
    alt: "100 kW commercial clean energy solar canopy system",
    specs: "100 kW Flat-Roof Ballasted Array · Commercial MACRS Accelerated Dep.",
  },

  // ── Robotics & AI Compute ─────────────────────────────────────────────────
  {
    id: "ts-optimus-gen2",
    name: "Optimus Gen 2 – Studio Allocation",
    price: "$25,000",
    badge: "ROBOTICS",
    badgeType: "robotics",
    category: "Robotics",
    image: "/images/tesla/optimus-studio.jpg",
    alt: "Tesla Optimus Gen 2 humanoid robot on white studio cyclorama",
    specs: "5'8\" · 125 lb · 28 Torque Actuators · 11-DoF Tactile Hands",
  },
  {
    id: "ts-optimus-industrial",
    name: "Optimus Gen 2 – Industrial Pack",
    price: "$45,000",
    badge: "ROBOTICS",
    badgeType: "robotics",
    category: "Robotics",
    image: "/images/tesla/optimus-studio.jpg",
    alt: "Tesla Optimus Gen 2 industrial manufacturing configuration",
    specs: "Dual 45 lb Lift Spec · FSD AI Computer · 2.3 kWh 52V Battery Pack",
  },
  {
    id: "ts-optimus-fleet",
    name: "Optimus Fleet – 10 Unit Deployment",
    price: "$420,000",
    badge: "FLEET",
    badgeType: "robotics",
    category: "Robotics",
    image: "/assets/images/tesla_optimus_robotics.webp",
    alt: "10-unit Tesla Optimus fleet deployment for autonomous logistics",
    specs: "10 Humanoid Units + Charging Docks + Fleet Neural Sync License",
  },
  {
    id: "ts-dojo-compute",
    name: "Dojo AI Training Tile – Allocation",
    price: "$300,000",
    badge: "AI COMPUTE",
    badgeType: "robotics",
    category: "Robotics",
    image: "/assets/images/tesla_optimus_robotics.webp",
    alt: "Tesla Dojo D1 exaFLOP neural training cabinet allocation",
    specs: "25 D1 Chips / Tile · 9 PFLOPS BF16 · End-to-End Video Neural Training",
  },
  {
    id: "ts-fsd-inference",
    name: "FSD AI4 / AI5 Fleet Module",
    price: "$65,000",
    badge: "AUTONOMY",
    badgeType: "robotics",
    category: "Robotics",
    image: "/assets/images/tesla_optimus_robotics.webp",
    alt: "Tesla Hardware 4 and AI5 autonomous vision inference compute bundle",
    specs: "Dual-Redundant Inference SoC · 5 MP 360° Vision · Commercial Fleet Pack",
  },
];

const CANONICAL_BY_NAME = new Map<string, InventoryItem>();
for (const item of INVENTORY_CATALOG) {
  CANONICAL_BY_NAME.set(item.name.toLowerCase(), item);
}

function getSpecLineForItem(name: string, category: string): string {
  const n = name.toLowerCase();
  const exact = CANONICAL_BY_NAME.get(n);
  if (exact) return exact.specs;
  if (n.includes("model s plaid")) return "359 mi EPA · 1.99 s 0–60 mph · 200 mph";
  if (n.includes("model s")) return "402 mi EPA · 3.1 s 0–60 mph · Dual AWD";
  if (n.includes("model 3") && n.includes("performance")) return "303 mi EPA · 2.9 s 0–60 mph · 163 mph";
  if (n.includes("model 3")) return "Up to 363 mi EPA · 250 kW Supercharging";
  if (n.includes("model x plaid")) return "326 mi EPA · 2.5 s 0–60 mph · 1,020 hp";
  if (n.includes("model x")) return "335 mi EPA · Falcon Wing Doors · Dual AWD";
  if (n.includes("model y") && n.includes("performance")) return "294 mi EPA · 3.3 s 0–60 mph · 155 mph";
  if (n.includes("model y")) return "Up to 337 mi EPA · 76 cu ft Cargo · 5-Star Safety";
  if (n.includes("cyberbeast")) return "320 mi Est. · 2.6 s 0–60 mph · 845 hp Tri-Motor";
  if (n.includes("cybertruck")) return "325 mi Est. · 11,000 lb Tow · Steer-by-Wire";
  if (n.includes("roadster")) return "620 mi Est. · 1.9 s 0–60 mph · 250+ mph";
  if (n.includes("semi")) return "82,000 lb GCWR · 1,000V · 70% in 30 min";
  if (n.includes("cybercab")) return "290 mi Est. · Full Autonomy · Inductive Charge";
  if (n.includes("powerwall")) return "13.5 kWh Usable · 11.5 kW Continuous Inverter";
  if (n.includes("megapack")) return "3.9 MWh Unit · Integrated Thermal & Autobidder";
  if (n.includes("wall connector")) return "48A / 11.5 kW NACS · Up to 44 mi/hr";
  if (n.includes("supercharger")) return "Up to 350 kW V4 Peak · NACS · 99.97% Uptime";
  if (n.includes("solar roof")) return "Tempered Solar Glass · 25-Yr Warranty · Class 3 Hail";
  if (n.includes("solar")) return "All-Black Array · 30% Federal Tax Credit Eligible";
  if (n.includes("optimus")) return "5'8\" · 125 lb · 28 Actuators · 11-DoF Hands";
  return `Official Tesla.com Spec · ${category} Allocation`;
}

const PAGE_SIZE = 12;
const LOAD_STEP = 12;
const ORDER: Exclude<Category, "All">[] = ["Vehicles", "Energy", "Solar", "Robotics"];
const categories: Category[] = ["All", "Vehicles", "Energy", "Solar", "Robotics"];

export default function LiveInventorySection() {
  const [items, setItems] = useState<InventoryItem[]>(INVENTORY_CATALOG);
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

        // Keep authoritative Tesla.com catalog first and merge any custom admin listings
        // added in Supabase, normalizing images so legacy Unsplash / wrong vehicle photos never appear.
        const customRows: InventoryItem[] = [];
        const catalogNames = new Set(INVENTORY_CATALOG.map((c) => c.name.toLowerCase()));

        for (const r of data as Array<Record<string, string>>) {
          const rawName = String(r.name ?? "").trim();
          const low = rawName.toLowerCase();
          if (!rawName || catalogNames.has(low)) continue;
          if (low.includes("flying car") || low.includes("model aero") || low.includes("evtol")) continue;
          // Skip legacy stale seed duplicates that already exist in INVENTORY_CATALOG with corrected 2026 MSRP/imagery
          const isStaleSeed =
            low.startsWith("2025 ") ||
            low.startsWith("2026 ") ||
            low.includes("semi –") ||
            low.includes("cybercab –") ||
            low.includes("roadster gen 2") ||
            low.startsWith("cpo model ");
          if (isStaleSeed) continue;

          const category = (ORDER.includes(r.category as Exclude<Category, "All">)
            ? r.category
            : "Vehicles") as Exclude<Category, "All">;
          customRows.push({
            id: r.id,
            name: rawName,
            price: String(r.price || "$0"),
            badge: String(r.badge || "NEW").toUpperCase(),
            badgeType: (r.badge_type as InventoryItem["badgeType"]) || "new",
            category,
            image: resolveInventoryImageUrl(r.image_url, rawName, category),
            alt: r.alt || rawName,
            specs: getSpecLineForItem(rawName, category),
          });
        }

        if (customRows.length > 0) {
          setItems([...INVENTORY_CATALOG, ...customRows]);
        }
      } catch {
        /* keep canonical Tesla.com catalog */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (i: InventoryItem) =>
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.specs.toLowerCase().includes(q);

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
        {/* Tesla.com Monochrome Studio Header */}
        <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Official Tesla.com Lineup · Direct Allocation
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Vehicles, Energy, Solar &amp; Robotics
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Every Tesla vehicle, home battery, utility Megapack, solar system, and Optimus unit —
              complete with accurate EPA specifications and direct checkout settlement.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e82127] shrink-0" />
              <span>$2,000 Off for Our Heroes · Military, Veterans, First Responders, Healthcare &amp; Educators</span>
            </div>
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

        {/* Tesla Studio Inventory Grid (Matching Homepage Minimalist Model Cards) */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((item, idx) => (
            <article
              key={item.id}
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] bg-[#f4f4f4] dark:bg-[#14161a] border border-border/60">
                  <AppImage
                    src={item.image}
                    alt={item.alt}
                    fill
                    priority={idx < 3}
                    loading={idx < 6 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />
                  <span className="absolute top-3 left-3 rounded-[3px] bg-[#171a20]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    {item.badge}
                  </span>
                  <span className="absolute top-3 right-3 rounded-[3px] bg-[#171a20]/75 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>

                <div className="pt-3.5 pb-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-base font-semibold leading-snug text-foreground">
                      {item.name}
                    </h3>
                    <span className="font-display text-sm font-medium text-foreground/85 tabular shrink-0">
                      {item.price}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                    {item.specs}
                  </p>
                </div>
              </div>

              <div className="pt-1 pb-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    triggerLoader({
                      label: "INITIALIZING CHECKOUT",
                      durationMs: 360,
                      onComplete: () => setCheckoutItem(item),
                    })
                  }
                  className="flex-1 h-10 rounded-[4px] bg-foreground px-4 text-xs font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Order Now
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
