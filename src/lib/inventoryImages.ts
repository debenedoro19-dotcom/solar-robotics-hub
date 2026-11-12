import modelYImg from '@/assets/inventory/model_y.webp';
import megapackImg from '@/assets/inventory/megapack.webp';
import solarRoofImg from '@/assets/inventory/solar_roof.webp';
import cybercabImg from '@/assets/inventory/cybercab.webp';

export { modelYImg, megapackImg, solarRoofImg, cybercabImg };

const BUNDLED_INVENTORY_IMAGES: Record<string, string> = {
  '/assets/inventory/model_y': '/images/car-crossover.jpg',
  '/assets/inventory/megapack': megapackImg,
  '/assets/inventory/solar_roof': '/images/solar-roof.jpg',
  '/assets/inventory/cybercab': '/images/tesla/cybercab-studio.jpg',
};

/**
 * Resolves the accurate Tesla studio/product image for any catalog or database item.
 * Rejects mismatched third-party stock photos (e.g. Unsplash semi trucks) and
 * ensures vehicle, energy, solar, and Optimus listings always show matching imagery.
 */
export function resolveInventoryImageUrl(
  url: string | null | undefined,
  name?: string,
  category?: string,
): string {
  const n = String(name ?? '').toLowerCase();
  const c = String(category ?? '').toLowerCase();
  const trimmed = String(url ?? '').trim();

  // Preserve verified custom admin-uploaded images stored outside Unsplash/legacy paths
  const isLegacyOrUnsplash =
    !trimmed ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('cybercab.webp') ||
    trimmed.includes('hero-road.jpg') ||
    trimmed.startsWith('/assets/inventory/');

  if (!isLegacyOrUnsplash && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/images/tesla/'))) {
    return trimmed;
  }

  // Deterministic Tesla model-to-studio-image matching
  if (n.includes('semi')) return '/images/tesla/semi-studio.jpg';
  if (n.includes('cyberbeast') || n.includes('cybertruck')) return '/images/car-truck.jpg';
  if (n.includes('aero') || n.includes('flying') || n.includes('evtol')) return '/images/tesla/cybercab-studio.jpg';
  if (n.includes('cybercab') || n.includes('robotaxi')) return '/images/tesla/cybercab-studio.jpg';
  if (n.includes('roadster')) return '/images/car-red.jpg';
  if (n.includes('model s')) return '/images/car-red.jpg';
  if (n.includes('model 3')) return '/images/car-white.jpg';
  if (n.includes('model y')) return '/images/car-crossover.jpg';
  if (n.includes('model x')) return '/images/car-suv.jpg';
  if (n.includes('optimus')) return '/images/tesla/optimus-studio.jpg';
  if (n.includes('dojo') || n.includes('fsd') || n.includes('inference') || c === 'robotics') {
    return '/assets/images/tesla_optimus_robotics.webp';
  }
  if (n.includes('wall connector') || n.includes('mobile connector') || n.includes('supercharger')) {
    return '/images/charger.jpg';
  }
  if (n.includes('powerwall') || n.includes('gateway')) return '/images/battery.jpg';
  if (n.includes('megapack') || n.includes('powerpack') || n.includes('grid') || n.includes('virtual power')) {
    return megapackImg;
  }
  if (n.includes('solar roof')) return '/images/solar-roof.jpg';
  if (n.includes('solar') || c === 'solar') return '/images/energy-home.jpg';
  if (c === 'energy') return '/images/battery.jpg';

  if (trimmed) {
    const match = trimmed.match(/^(\/assets\/inventory\/[a-z0-9_-]+)\.(jpg|jpeg|png|webp)(\?.*)?$/i);
    if (match) {
      const base = match[1].toLowerCase();
      if (BUNDLED_INVENTORY_IMAGES[base]) return BUNDLED_INVENTORY_IMAGES[base];
    }
    if (!trimmed.includes('unsplash.com')) return trimmed;
  }

  return '/images/car-white.jpg';
}

/**
 * Legacy helper kept backwards-compatible for single-argument callers.
 */
export function normalizeInventoryImageUrl(url: string | null | undefined, name?: string, category?: string): string {
  return resolveInventoryImageUrl(url, name, category);
}
