import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CheckoutModal, { type CheckoutItem } from "@/components/inventory/CheckoutModal";
import { supabase } from "@/integrations/supabase/client";
import { normalizeInventoryImageUrl } from "@/lib/inventoryImages";
import { useTeslaLoader } from "@/components/TeslaLoader";

type Listing = CheckoutItem & { id: string; badge: string; alt: string };

const FALLBACK_HOME_INVENTORY: Listing[] = [
  {
    id: "home-inv-1",
    name: "2026 Model S Plaid",
    price: "$89,990",
    badge: "NEW",
    category: "Vehicles",
    image: "/images/car-red.jpg",
    alt: "2026 Tesla Model S Plaid",
  },
  {
    id: "home-inv-2",
    name: "2026 Model 3 Long Range AWD",
    price: "$47,490",
    badge: "NEW",
    category: "Vehicles",
    image: "/images/car-white.jpg",
    alt: "2026 Tesla Model 3 Long Range",
  },
  {
    id: "home-inv-3",
    name: "2026 Cybertruck Cyberbeast",
    price: "$99,990",
    badge: "NEW",
    category: "Vehicles",
    image: "/images/car-truck.jpg",
    alt: "2026 Tesla Cybertruck Cyberbeast",
  },
  {
    id: "home-inv-4",
    name: "Powerwall 3 – 13.5 kWh System",
    price: "$11,500",
    badge: "ENERGY",
    category: "Energy",
    image: "/images/battery.jpg",
    alt: "Tesla Powerwall 3 System",
  },
  {
    id: "home-inv-5",
    name: "Tesla Solar Roof V3 – 10 kW",
    price: "$35,000",
    badge: "SOLAR",
    category: "Solar",
    image: "/images/solar-roof.jpg",
    alt: "Tesla Solar Roof V3",
  },
];

export default function HomeInventoryPeek() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
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
          .limit(8);

        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setListings(
            data.map((row) => ({
              id: String(row.id),
              name: row.name,
              price: String(row.price ?? ""),
              badge: String(row.badge ?? row.category ?? "LISTING"),
              category: String(row.category ?? "Listing"),
              image: normalizeInventoryImageUrl(row.image_url) || "/images/car-white.jpg",
              alt: String(row.alt ?? `${row.name} listing image`),
            })),
          );
        } else {
          setListings(FALLBACK_HOME_INVENTORY);
        }
      } catch {
        if (!cancelled) setListings(FALLBACK_HOME_INVENTORY);
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
            <h2 id="home-inventory-title" className="font-display mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Live Direct-Purchase Inventory
            </h2>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Scroll listings left"
              onClick={() => scroll(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border bg-card hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Scroll listings right"
              onClick={() => scroll(1)}
              className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border bg-card hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigateWithLoader("/inventory", "FULL INVENTORY")}
              className="ml-2 h-9 rounded-[4px] border border-border bg-card px-4 text-xs font-medium hover:bg-muted transition-colors"
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
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3"
            aria-label="Current inventory listings"
          >
            {listings.map((item) => (
              <article
                key={item.id}
                className="w-[min(82vw,340px)] shrink-0 snap-start overflow-hidden rounded-[6px] border border-border bg-card transition-all hover:border-foreground/30 hover:shadow-md sm:w-[330px] flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={item.image || "/images/car-white.jpg"}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 rounded-[3px] bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                      {item.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.category}
                    </p>
                    <h3 className="font-display mt-1.5 text-base font-semibold leading-snug line-clamp-2 min-h-[2.75rem]">
                      {item.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
                  <span className="font-display text-sm font-semibold tabular">
                    {item.price || "Price on request"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      triggerLoader({
                        label: "OPENING CHECKOUT",
                        durationMs: 360,
                        onComplete: () => setSelected(item),
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
        )}

        <div className="mt-6 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={() => navigateWithLoader("/inventory", "FULL INVENTORY")}
            className="h-10 rounded-[4px] border border-border bg-card px-5 text-xs font-medium"
          >
            View All Inventory →
          </button>
        </div>
      </div>

      {selected && <CheckoutModal item={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
