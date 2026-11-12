import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CheckoutModal, { type CheckoutItem } from "@/components/inventory/CheckoutModal";
import { supabase } from "@/integrations/supabase/client";
import { resolveInventoryImageUrl } from "@/lib/inventoryImages";
import { useTeslaLoader } from "@/components/TeslaLoader";

type Listing = CheckoutItem & { id: string; badge: string; alt: string; specs: string };

const FALLBACK_HOME_INVENTORY: Listing[] = [
  {
    id: "home-inv-1",
    name: "Model S Plaid",
    price: "$89,990",
    badge: "FLAGSHIP",
    category: "Vehicles",
    image: "/images/car-red.jpg",
    alt: "Tesla Model S Plaid 1,020 hp tri-motor flagship sedan",
    specs: "359 mi EPA · 0–60 in 1.99 s · 200 mph",
  },
  {
    id: "home-inv-2",
    name: "Model 3 Long Range AWD",
    price: "$47,490",
    badge: "NEW",
    category: "Vehicles",
    image: "/images/car-white.jpg",
    alt: "Tesla Model 3 Long Range AWD electric sedan",
    specs: "341 mi EPA · 0–60 in 4.2 s · Acoustic Cabin",
  },
  {
    id: "home-inv-3",
    name: "Model Y Long Range AWD",
    price: "$48,990",
    badge: "BEST SELLER",
    category: "Vehicles",
    image: "/images/car-crossover.jpg",
    alt: "Tesla Model Y Long Range AWD electric crossover SUV",
    specs: "327 mi EPA · 0–60 in 4.6 s · 76 cu ft Cargo",
  },
  {
    id: "home-inv-4",
    name: "Cybertruck Cyberbeast",
    price: "$99,990",
    badge: "CYBERBEAST",
    category: "Vehicles",
    image: "/images/car-truck.jpg",
    alt: "Tesla Cybertruck Cyberbeast tri-motor stainless pickup",
    specs: "320 mi Est. · 0–60 in 2.6 s · 845 hp",
  },
  {
    id: "home-inv-5",
    name: "Powerwall 3 – 13.5 kWh",
    price: "$11,500",
    badge: "ENERGY",
    category: "Energy",
    image: "/images/battery.jpg",
    alt: "Tesla Powerwall 3 13.5 kWh whole-home battery",
    specs: "13.5 kWh Usable · 11.5 kW Continuous Inverter",
  },
  {
    id: "home-inv-6",
    name: "Optimus Gen 2 – Studio Allocation",
    price: "$25,000",
    badge: "ROBOTICS",
    category: "Robotics",
    image: "/images/tesla/optimus-studio.jpg",
    alt: "Tesla Optimus Gen 2 humanoid robot",
    specs: "5'8\" · 125 lb · 28 Actuators · 11-DoF Hands",
  },
];

export default function HomeInventoryPeek() {
  const [listings, setListings] = useState<Listing[]>(FALLBACK_HOME_INVENTORY);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const { triggerLoader, navigateWithLoader } = useTeslaLoader();

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      try {
        const { data, error } = await supabase
          .from("inventory_items")
          .select("id,name,price,badge,category,image_url,alt")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(6);

        if (cancelled) return;
        if (!error && data && data.length > 0) {
          const seen = new Set(FALLBACK_HOME_INVENTORY.map((f) => f.name.toLowerCase()));
          const custom: Listing[] = [];
          for (const row of data) {
            const rawName = String(row.name ?? "").trim();
            const low = rawName.toLowerCase();
            if (!rawName || seen.has(low)) continue;
            if (low.startsWith("2025 ") || low.startsWith("2026 ") || low.startsWith("cpo ")) continue;
            custom.push({
              id: String(row.id),
              name: rawName,
              price: String(row.price ?? ""),
              badge: String(row.badge ?? row.category ?? "LISTING").toUpperCase(),
              category: String(row.category ?? "Listing"),
              image: resolveInventoryImageUrl(row.image_url, rawName, String(row.category ?? "")),
              alt: String(row.alt ?? `${rawName} listing image`),
              specs: `Official ${String(row.category ?? "Tesla")} Specification`,
            });
          }
          if (custom.length > 0) {
            setListings([...FALLBACK_HOME_INVENTORY, ...custom].slice(0, 8));
          }
        }
      } catch {
        /* keep canonical fallback listings */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadListings();
    return () => {
      cancelled = true;
    };
  }, []);

  function scroll(direction: -1 | 1) {
    track.current?.scrollBy({ left: direction * 360, behavior: "smooth" });
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 border-t border-border bg-background" aria-labelledby="home-inventory-title">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Immediate Delivery
            </p>
            <h2 id="home-inventory-title" className="font-display mt-1.5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Live Direct-Purchase Inventory
            </h2>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Scroll listings left"
              onClick={() => scroll(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Scroll listings right"
              onClick={() => scroll(1)}
              className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigateWithLoader("/inventory", "FULL INVENTORY")}
              className="ml-2 h-9 rounded-[4px] border border-border bg-card px-4 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              View All Inventory →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading listings">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-[6px] bg-muted" />
            ))}
          </div>
        ) : (
          <div
            ref={track}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3"
            aria-label="Current inventory listings"
          >
            {listings.map((item) => (
              <article
                key={item.id}
                className="w-[min(82vw,340px)] shrink-0 snap-start flex flex-col justify-between sm:w-[340px]"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] bg-[#f4f4f4] dark:bg-[#14161a] border border-border/60">
                    <img
                      src={item.image || "/images/car-white.jpg"}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                    <span className="absolute top-3 left-3 rounded-[3px] bg-[#171a20]/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                      {item.badge}
                    </span>
                  </div>
                  <div className="pt-3.5 pb-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-base font-semibold leading-snug text-foreground">
                        {item.name}
                      </h3>
                      <span className="font-display text-sm font-medium text-foreground/85 tabular shrink-0">
                        {item.price || "Price on request"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.specs}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      triggerLoader({
                        label: "OPENING CHECKOUT",
                        durationMs: 360,
                        onComplete: () => setSelected(item),
                      })
                    }
                    className="w-full h-9 rounded-[4px] bg-foreground px-4 text-xs font-medium text-background hover:opacity-90 transition-opacity"
                  >
                    Order Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={() => navigateWithLoader("/inventory", "FULL INVENTORY")}
            className="h-10 rounded-[4px] border border-border bg-card px-5 text-xs font-medium text-foreground"
          >
            View All Inventory →
          </button>
        </div>
      </div>

      {selected && <CheckoutModal item={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
