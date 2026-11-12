export const HEROES_DISCOUNT_AMOUNT = 2000;
export const HEROES_MIN_ORDER_AMOUNT = 5000;
export const GIVEAWAY_SHIPPING_FEE = 495;

export const HEROES_ELIGIBLE_ROLES = [
  "Active Duty Military",
  "Military Veteran",
  "First Responder (Police / Fire / EMS)",
  "Licensed Healthcare / Nurse",
  "Educator / Teacher",
] as const;

export type HeroRole = (typeof HEROES_ELIGIBLE_ROLES)[number];

/**
 * Deterministic freight / carrier delivery fee by inventory category & item value.
 * Used identically on the client configurator/checkout and server payment handler.
 */
export function getOrderShippingFee(category: string, assetPrice: number): number {
  const cat = category.trim().toLowerCase();
  const price = Math.max(0, Number(assetPrice) || 0);

  if (cat.includes("vehicle")) {
    return 1290;
  }
  if (cat.includes("solar")) {
    return 495;
  }
  if (cat.includes("robot")) {
    return price >= 100000 ? 1490 : 495;
  }
  if (cat.includes("energy")) {
    if (price < 1500) return 45;
    if (price < 50000) return 395;
    return 1490;
  }
  return price >= 50000 ? 1290 : price >= 5000 ? 395 : 95;
}

export function getShippingLabel(category: string, assetPrice: number): string {
  const cat = category.trim().toLowerCase();
  if (cat.includes("vehicle")) return "Enclosed Carrier Freight Delivery";
  if (cat.includes("solar")) return "Solar Freight & White-Glove Delivery";
  if (cat.includes("robot")) return "Climate-Controlled Crate Freight";
  if (assetPrice < 1500) return "Insured Courier Parcel Delivery";
  return "Priority Hardware Freight Delivery";
}

export function isHeroesDiscountEligible(assetPrice: number): boolean {
  return (Number(assetPrice) || 0) >= HEROES_MIN_ORDER_AMOUNT;
}

export function calculateOrderTotals({
  assetPrice,
  category,
  applyHeroesDiscount,
}: {
  assetPrice: number;
  category: string;
  applyHeroesDiscount?: boolean;
}) {
  const base = Math.max(0, Number(assetPrice) || 0);
  const shippingFee = base > 0 ? getOrderShippingFee(category, base) : 0;
  const heroesEligible = isHeroesDiscountEligible(base);
  const heroesDiscount = applyHeroesDiscount && heroesEligible ? HEROES_DISCOUNT_AMOUNT : 0;
  const totalDue = Math.max(0, base + shippingFee - heroesDiscount);

  return {
    assetPrice: base,
    shippingFee,
    shippingLabel: getShippingLabel(category, base),
    heroesEligible,
    heroesDiscount,
    totalDue,
  };
}
