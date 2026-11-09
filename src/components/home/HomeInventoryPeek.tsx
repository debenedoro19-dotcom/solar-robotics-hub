import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from '@/components/SmartLink';
import { Button } from '@/components/ui/button';
import CheckoutModal, { type CheckoutItem } from '@/components/inventory/CheckoutModal';
import { supabase } from '@/integrations/supabase/client';

type Listing = CheckoutItem & { id: string; badge: string; alt: string };

const UUID = /^[0-9a-f-]{36}$/i;

export default function HomeInventoryPeek() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id,name,price,badge,category,image_url,alt')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(8);

      if (cancelled) return;
      if (!error && data) {
        setListings(data.map((row) => ({
          id: String(row.id),
          name: row.name,
          price: String(row.price ?? ''),
          badge: String(row.badge ?? row.category ?? 'LISTING'),
          category: String(row.category ?? 'Listing'),
          image: String(row.image_url ?? ''),
          alt: String(row.alt ?? `${row.name} listing image`),
        })));
      }
      setLoading(false);
    }

    void loadListings();
    return () => { cancelled = true; };
  }, []);

  function scroll(direction: -1 | 1) {
    track.current?.scrollBy({ left: direction * 340, behavior: 'smooth' });
  }

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20" aria-labelledby="home-inventory-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="lux-label">Inventory</p>
            <h2 id="home-inventory-title" className="mt-2 text-3xl font-medium sm:text-4xl">Browse current listings</h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="outline" size="icon" aria-label="Scroll listings left" onClick={() => scroll(-1)}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Scroll listings right" onClick={() => scroll(1)}>
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button asChild variant="ghost" className="ml-2">
              <Link href="/inventory">View all listings</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading listings">
            {[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse bg-muted" />)}
          </div>
        ) : listings.length > 0 ? (
          <div ref={track} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3" aria-label="Current inventory listings">
            {listings.map((item) => (
              <article key={item.id} className="home-inventory-card w-[min(82vw,360px)] shrink-0 snap-start overflow-hidden border border-border bg-card sm:w-[340px]">
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Image unavailable</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="lux-label truncate">{item.category}</p>
                    <span className="max-w-32 truncate text-[10px] uppercase text-muted-foreground">{item.badge}</span>
                  </div>
                  <h3 className="mt-2 min-h-12 text-lg font-medium leading-snug">{item.name}</h3>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-sm font-medium tabular-nums">{item.price || 'Price on request'}</p>
                    <Button size="sm" onClick={() => setSelected(item)}>Buy Now</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-y border-border py-10 text-sm text-muted-foreground">
            Listings are not available right now. Visit the inventory page to check again.
          </div>
        )}

        <div className="mt-5 flex justify-center sm:hidden">
          <Button asChild variant="outline"><Link href="/inventory">View all listings</Link></Button>
        </div>
      </div>
      {selected && <CheckoutModal item={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}