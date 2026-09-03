import React, { useEffect, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import modelYImg from '@/assets/inventory/model_y.jpg';
import megapackImg from '@/assets/inventory/megapack.jpg';
import solarRoofImg from '@/assets/inventory/solar_roof.jpg';
import cybercabImg from '@/assets/inventory/cybercab.jpg';

type Category = 'All' | 'Vehicles' | 'Energy' | 'Solar' | 'Robotics';

interface InventoryItem {
  id: number | string;
  name: string;
  price: string;
  badge: string;
  badgeType: 'new' | 'cpo' | 'energy' | 'solar' | 'robotics';
  category: Exclude<Category, 'All'>;
  image: string;
  alt: string;
  tag?: string;
}

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=65`;

const IMG = {
  cybertruck: U('photo-1715135755172-4605bd091ba2'),
  modelS: U('photo-1560958089-b8a1929cea89'),
  modelSAlt: U('photo-1554744512-d6c603f27c54'),
  model3: U('photo-1591628360686-06bc9367d09a'),
  model3Alt: U('photo-1655792290994-93437dc0482c'),
  modelX: U('photo-1650938777875-a375b33cd705'),
  modelY: modelYImg,
  modelYAlt: modelYImg,
  roadster: U('photo-1617788138017-80ad40651399'),
  semi: U('photo-1601584115197-04ecc0da31d7'),
  cybercab: cybercabImg,
  powerwall: U('photo-1706699778556-a9f9da002139'),
  megapack: megapackImg,
  gridStorage: megapackImg,
  charger: U('photo-1593941707882-a5bba14938c7'),
  supercharger: U('photo-1633158829585-23ba8f7c8caf'),
  cleanGrid: U('photo-1548337138-e87d889cc369'),
  solarRoof: solarRoofImg,
  solarPanels: U('photo-1613665813446-82a78c468a1d'),
  solarFarm: U('photo-1509391366360-2e959784a276'),
  optimus: '/assets/images/tesla_optimus_robotics.webp',
  optimusAlt: U('photo-1531746790731-6c087fecd65a'),
  roboArm: U('photo-1567789884554-0b844b597180'),
  aiCompute: U('photo-1558494949-ef010cbdcc31')
};

const inventory: InventoryItem[] = [
// ── Vehicles ──────────────────────────────────────────────────────────────
{ id: 1, name: '2025 Tesla Cybertruck AWD', price: '$79,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.cybertruck, alt: 'Tesla Cybertruck AWD stainless steel pickup parked on open road at dusk' },
{ id: 2, name: '2025 Cybertruck Cyberbeast', price: '$99,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.cybertruck, alt: 'Tesla Cybertruck Cyberbeast tri-motor edition on desert terrain' },
{ id: 3, name: '2025 Model S Plaid', price: '$89,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.modelS, alt: 'Tesla Model S Plaid electric sedan, sleek aerodynamic profile' },
{ id: 4, name: '2025 Model S Long Range', price: '$74,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.modelSAlt, alt: 'Tesla Model S Long Range luxury electric sedan side profile' },
{ id: 5, name: 'CPO Model S Long Range', price: '$69,990', badge: 'CPO', badgeType: 'cpo', category: 'Vehicles', image: IMG.modelSAlt, alt: 'Certified pre-owned Tesla Model S Long Range electric sedan' },
{ id: 6, name: '2025 Model 3 Highland Performance', price: '$54,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.model3, alt: 'Tesla Model 3 Highland Performance compact sport sedan' },
{ id: 7, name: '2025 Model 3 Highland Long Range AWD', price: '$47,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.model3Alt, alt: 'Tesla Model 3 Highland Long Range all-wheel-drive sedan' },
{ id: 8, name: '2025 Model 3 Highland RWD', price: '$38,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.model3Alt, alt: 'Tesla Model 3 Highland rear-wheel-drive sedan in urban setting' },
{ id: 9, name: 'CPO Model 3 2024', price: '$32,990', badge: 'CPO', badgeType: 'cpo', category: 'Vehicles', image: IMG.model3, alt: 'Certified pre-owned 2024 Tesla Model 3 compact electric sedan' },
{ id: 10, name: '2025 Model X Plaid', price: '$94,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.modelX, alt: 'Tesla Model X Plaid SUV with falcon wing doors' },
{ id: 11, name: '2025 Model X Long Range', price: '$84,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.modelX, alt: 'Tesla Model X Long Range full-size electric SUV' },
{ id: 12, name: 'CPO Model X Long Range', price: '$79,990', badge: 'CPO', badgeType: 'cpo', category: 'Vehicles', image: IMG.modelX, alt: 'Certified pre-owned Tesla Model X Long Range electric SUV' },
{ id: 13, name: '2025 Model Y Juniper Performance', price: '$59,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.modelY, alt: 'Tesla Model Y Juniper Performance electric crossover' },
{ id: 14, name: '2025 Model Y Juniper Long Range AWD', price: '$52,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.modelYAlt, alt: 'Tesla Model Y Juniper Long Range AWD compact SUV' },
{ id: 15, name: '2025 Model Y Juniper RWD', price: '$44,990', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.modelYAlt, alt: 'Tesla Model Y Juniper RWD electric crossover' },
{ id: 16, name: 'CPO Model Y 2024', price: '$36,990', badge: 'CPO', badgeType: 'cpo', category: 'Vehicles', image: IMG.modelY, alt: 'Certified pre-owned 2024 Tesla Model Y crossover' },
{ id: 17, name: 'Tesla Semi – 500 Mile Range', price: '$150,000', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.semi, alt: 'Tesla Semi electric long-haul truck on highway' },
{ id: 18, name: 'Tesla Semi – 300 Mile Range', price: '$120,000', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.semi, alt: 'Tesla Semi 300 mile regional electric freight truck' },
{ id: 19, name: 'Tesla Cybercab – Reservation', price: '$30,000', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.cybercab, alt: 'Tesla Cybercab autonomous robotaxi two-door concept vehicle' },
{ id: 20, name: 'Roadster Gen 2 – Founders Slot', price: '$250,000', badge: 'NEW', badgeType: 'new', category: 'Vehicles', image: IMG.roadster, alt: 'Next generation Tesla Roadster electric hypercar' },

// ── Energy ────────────────────────────────────────────────────────────────
{ id: 21, name: 'Powerwall 3 – 13.5 kWh', price: '$11,500', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.powerwall, alt: 'Tesla Powerwall 3 home battery mounted on exterior wall' },
{ id: 22, name: 'Powerwall 3 – Two-Unit System', price: '$21,500', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.powerwall, alt: 'Two Tesla Powerwall 3 home batteries installed side by side' },
{ id: 23, name: 'Powerwall 3 – Four-Unit Estate System', price: '$41,000', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.gridStorage, alt: 'Multi-unit Tesla Powerwall estate energy storage installation' },
{ id: 24, name: 'Backup Gateway 2 + Whole-Home Kit', price: '$3,200', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.cleanGrid, alt: 'Tesla Backup Gateway whole-home energy management hardware' },
{ id: 25, name: 'Megapack 2 XL – 3.9 MWh', price: '$1,200,000', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.megapack, alt: 'Tesla Megapack utility-scale battery storage unit' },
{ id: 26, name: 'Megapack Array – 20 MWh Utility', price: '$6,400,000', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.gridStorage, alt: 'Large Tesla Megapack array at a utility-scale storage site' },
{ id: 27, name: 'Powerpack Commercial – 232 kWh', price: '$185,000', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.megapack, alt: 'Tesla Powerpack commercial battery storage cabinets' },
{ id: 28, name: 'Wall Connector Gen 3 – 48A', price: '$475', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.charger, alt: 'Tesla Wall Connector home EV charger mounted in garage' },
{ id: 29, name: 'Supercharger V4 Cabinet – Host Package', price: '$95,000', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.supercharger, alt: 'Tesla Supercharger V4 charging station cabinet and stalls' },
{ id: 30, name: 'Virtual Power Plant – Grid Allocation', price: '$60,000', badge: 'ENERGY', badgeType: 'energy', category: 'Energy', image: IMG.cleanGrid, alt: 'Clean energy grid infrastructure for virtual power plant program' },

// ── Solar ─────────────────────────────────────────────────────────────────
{ id: 31, name: 'Tesla Solar Roof V3 – 10 kW', price: '$35,000', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarRoof, alt: 'Tesla Solar Roof tiles integrated into a modern home rooftop' },
{ id: 32, name: 'Tesla Solar Roof V3 – 16 kW', price: '$52,000', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarRoof, alt: 'Large Tesla Solar Roof tile installation on residential home' },
{ id: 33, name: 'Tesla Solar Panels – 4.80 kW', price: '$13,500', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarPanels, alt: 'Small Tesla solar panel array on a residential roof' },
{ id: 34, name: 'Tesla Solar Panels – 8.16 kW', price: '$22,000', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarPanels, alt: 'Tesla solar panel array on modern home roof under blue sky' },
{ id: 35, name: 'Tesla Solar Panels – 12.24 kW', price: '$30,000', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarFarm, alt: 'Large Tesla solar panel installation on building rooftop' },
{ id: 36, name: 'Solar + Powerwall 3 Bundle', price: '$44,500', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarPanels, alt: 'Tesla solar panels paired with Powerwall home battery system' },
{ id: 37, name: 'Commercial Solar Array – 100 kW', price: '$180,000', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarFarm, alt: 'Commercial scale solar array field generating clean power' },
{ id: 38, name: 'Solar Farm Participation – 1 MW Block', price: '$900,000', badge: 'SOLAR', badgeType: 'solar', category: 'Solar', image: IMG.solarFarm, alt: 'Utility scale solar farm with rows of photovoltaic panels' },

// ── Robotics ──────────────────────────────────────────────────────────────
{ id: 39, name: 'Optimus Gen 2 – Production Allocation', price: '$25,000', badge: 'ROBOTICS', badgeType: 'robotics', category: 'Robotics', image: IMG.optimus, alt: 'Tesla Optimus Gen 2 humanoid robot standing in modern facility' },
{ id: 40, name: 'Optimus Gen 2 – Industrial Pack', price: '$45,000', badge: 'ROBOTICS', badgeType: 'robotics', category: 'Robotics', image: IMG.optimusAlt, alt: 'Humanoid robot in industrial configuration performing a factory task' },
{ id: 41, name: 'Optimus Fleet – 10 Unit Deployment', price: '$420,000', badge: 'ROBOTICS', badgeType: 'robotics', category: 'Robotics', image: IMG.optimusAlt, alt: 'Fleet of humanoid robots deployed in a manufacturing facility' },
{ id: 42, name: 'Optimus End-Effector Toolkit', price: '$8,500', badge: 'ROBOTICS', badgeType: 'robotics', category: 'Robotics', image: IMG.roboArm, alt: 'Precision robotic hand and end-effector engineering components' },
{ id: 43, name: 'Autonomous Factory Robot Package', price: '$150,000', badge: 'ROBOTICS', badgeType: 'robotics', category: 'Robotics', image: IMG.roboArm, alt: 'Industrial robotic arm in an automated Gigafactory line' },
{ id: 44, name: 'Dojo AI Training Compute – Allocation', price: '$300,000', badge: 'ROBOTICS', badgeType: 'robotics', category: 'Robotics', image: IMG.aiCompute, alt: 'AI supercomputer training cluster hardware racks' },
{ id: 45, name: 'FSD Inference Module – Fleet Bundle', price: '$65,000', badge: 'ROBOTICS', badgeType: 'robotics', category: 'Robotics', image: IMG.aiCompute, alt: 'Autonomous driving inference compute modules for vehicle fleets' }];



const PAGE_SIZE = 8;
const LOAD_STEP = 8;
const ORDER: Exclude<Category, 'All'>[] = ['Vehicles', 'Energy', 'Solar', 'Robotics'];

const categories: Category[] = ['All', 'Vehicles', 'Energy', 'Solar', 'Robotics'];

const badgeClasses: Record<string, string> = {
  new: 'card-badge-new',
  cpo: 'card-badge-cpo',
  energy: 'card-badge-energy',
  solar: 'card-badge-solar',
  robotics: 'card-badge-robotics'
};

export default function LiveInventorySection() {
  // Static catalog paints instantly; the DB-managed catalog (editable from the
  // admin inventory editor) replaces it as soon as it arrives.
  const [items, setItems] = useState<InventoryItem[]>(inventory);
  const [active, setActive] = useState<Category>('All');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [inquiry, setInquiry] = useState<InventoryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data } = await supabase
          .from('inventory_items')
          .select('id,name,price,badge,badge_type,category,image_url,alt')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (cancelled || !data || data.length === 0) return;
        setItems(
          data.map((r: Record<string, string>) => ({
            id: r.id,
            name: r.name,
            price: r.price,
            badge: r.badge,
            badgeType: r.badge_type as InventoryItem['badgeType'],
            category: r.category as Exclude<Category, 'All'>,
            image: r.image_url,
            alt: r.alt,
          })),
        );
      } catch {
        /* keep the static catalog */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // "All" interleaves the categories so Energy, Solar and Robotics are visible
  // on the first screen instead of being buried behind 15 vehicles.
  const filtered = React.useMemo(() => {
    if (active !== 'All') return items.filter((i) => i.category === active);
    const buckets = ORDER.map((c) => items.filter((i) => i.category === c));
    const out: InventoryItem[] = [];
    for (let row = 0; out.length < items.length; row++) {
      for (const bucket of buckets) {
        const item = bucket[row];
        if (item) out.push(item);
      }
    }
    return out;
  }, [active, items]);

  const displayed = filtered.slice(0, visible);
  const remaining = filtered.length - displayed.length;

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { All: items.length };
    for (const c of ORDER) map[c] = items.filter((i) => i.category === c).length;
    return map;
  }, [items]);

  return (
    <section id="inventory" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="max-w-7xl mx-auto mb-12 section-reveal">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400 tracking-[0.25em] uppercase">Live Inventory</span>
            </div>
            <h2 className="text-section-title font-extrabold tracking-tighter text-foreground">
              Verified Tesla Assets,{' '}
              <span className="gradient-text-primary">Available Now</span>
            </h2>
          </div>
          <a href="#" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 self-start md:self-auto">
            View Full Catalog
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Inventory category filter">
          {categories.map((cat) =>
          <button
            key={cat}
            role="tab"
            aria-selected={active === cat}
            onClick={() => {setActive(cat);setVisible(PAGE_SIZE);}}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 min-h-[44px] ${
            active === cat ?
            'bg-primary text-primary-foreground shadow-lg' :
            'bg-muted/40 text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground'}`
            }
            style={active === cat ? { boxShadow: '0 0 20px rgba(0,212,255,0.25)' } : {}}>
            
              {cat}
              <span className="ml-2 opacity-60 text-xs">{counts[cat] ?? 0}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayed.map((item, idx) =>
        <article
          key={item.id}
          className="glass-card glass-card-hover rounded-3xl overflow-hidden group">

          
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-muted">
              <AppImage
              src={item.image}
              alt={item.alt}
              fill
              priority={idx < 4}
              loading={idx < 8 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
            
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-widest uppercase ${badgeClasses[item.badgeType]}`}>
                {item.badge}
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-1 leading-tight">{item.name}</h3>
              <div className="flex items-center justify-between mt-3">
                <span className="text-primary font-extrabold text-base">{item.price}</span>
                <button
                  onClick={() => setInquiry(item)}
                  className="px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-xl btn-shimmer hover:opacity-90 transition-all min-h-[36px]">
                  Inquire
                </button>
              </div>
            </div>
          </article>
        )}
      </div>

      {/* Load more */}
      {remaining > 0 &&
      <div className="max-w-7xl mx-auto mt-10 text-center">
          <button
          onClick={() => setVisible((v) => v + LOAD_STEP)}
          className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:border-primary/40 hover:bg-primary/5 text-sm transition-all duration-300 btn-shimmer min-h-[44px]">

            {`Load More (${remaining} remaining)`}
          </button>
        </div>
      }

      {inquiry && <InquiryModal item={inquiry} onClose={() => setInquiry(null)} />}
    </section>);

}

function InquiryModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { error } = await supabase.from('newsletter_leads').insert({
        email,
        source: `inventory:${item.name}${message ? ` — ${message.slice(0, 120)}` : ''}${name ? ` (${name})` : ''}`,
      });
      if (error) throw error;
      setStatus('done');
      setTimeout(onClose, 1800);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center fin-overlay px-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-2xl">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-widest uppercase mb-3 ${badgeClasses[item.badgeType]}`}>
          {item.badge}
        </span>
        <h3 className="text-lg font-extrabold text-foreground tracking-tight">{item.name}</h3>
        <p className="text-primary font-extrabold text-base mb-1">{item.price}</p>
        <p className="text-xs text-muted-foreground mb-5">Reserve an allocation or ask our team about this {item.category.toLowerCase()} asset.</p>

        {status === 'done' ? (
          <p className="text-sm font-semibold text-emerald-400 py-4">Inquiry received — our team will reach out shortly.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
            />
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Questions, financing, trade-in…"
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
            />
            {status === 'error' && <p className="text-xs text-primary">Could not send — please try again.</p>}
            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary btn-shimmer hover:opacity-90 transition-all disabled:opacity-60">
              {status === 'saving' ? 'Sending…' : 'Reserve Allocation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}