import modelYImg from '@/assets/inventory/model_y.webp';
import megapackImg from '@/assets/inventory/megapack.webp';
import solarRoofImg from '@/assets/inventory/solar_roof.webp';
import cybercabImg from '@/assets/inventory/cybercab.webp';

export { modelYImg, megapackImg, solarRoofImg, cybercabImg };

const BUNDLED_INVENTORY_IMAGES: Record<string, string> = {
  '/assets/inventory/model_y': modelYImg,
  '/assets/inventory/megapack': megapackImg,
  '/assets/inventory/solar_roof': solarRoofImg,
  '/assets/inventory/cybercab': cybercabImg,
};

/**
 * Normalizes legacy `/assets/inventory/*.jpg` paths seeded in earlier migrations
 * to the corresponding Vite-bundled `.webp` assets while preserving custom URLs
 * (such as admin-uploaded signed URLs or original Unsplash URLs).
 */
export function normalizeInventoryImageUrl(url: string | null | undefined): string {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\/assets\/inventory\/[a-z0-9_-]+)\.(jpg|jpeg|png|webp)(\?.*)?$/i);
  if (match) {
    const base = match[1].toLowerCase();
    if (BUNDLED_INVENTORY_IMAGES[base]) {
      return BUNDLED_INVENTORY_IMAGES[base];
    }
    return `${match[1]}.webp${match[3] ?? ''}`;
  }
  return trimmed;
}
