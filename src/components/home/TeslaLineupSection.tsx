import React, { useMemo, useState } from "react";
import { TESLA_VEHICLES, type TeslaVehicleModel } from "@/data/teslaCatalog";
import CheckoutModal from "@/components/inventory/CheckoutModal";
import { useTeslaLoader } from "@/components/TeslaLoader";
import { calculateOrderTotals, HEROES_DISCOUNT_AMOUNT } from "@/lib/orderPricing";

const CATEGORIES: Array<"All" | TeslaVehicleModel["category"]> = [
  "All",
  "Sedan",
  "SUV",
  "Truck",
  "Autonomous & Future",
];

function TeslaDesignStudioModal({
  model,
  onClose,
  onProceedOrder,
}: {
  model: TeslaVehicleModel;
  onClose: () => void;
  onProceedOrder: (configuredItem: {
    id: string;
    name: string;
    price: string;
    badge: string;
    category: string;
    image: string;
    heroesDiscount?: boolean;
  }) => void;
}) {
  const [trimIndex, setTrimIndex] = useState(0);
  const [paintIndex, setPaintIndex] = useState(0);
  const [wheelIndex, setWheelIndex] = useState(0);
  const [interiorIndex, setInteriorIndex] = useState(0);
  const [includeFsd, setIncludeFsd] = useState(false);
  const [applyHeroes, setApplyHeroes] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"cash" | "finance" | "lease">("cash");
  const { triggerLoader } = useTeslaLoader();

  const trim = model.trims[trimIndex] ?? model.trims[0];
  const paint = model.paints[paintIndex] ?? model.paints[0];
  const wheel = model.wheels[wheelIndex] ?? model.wheels[0];
  const interior = model.interiors[interiorIndex] ?? model.interiors[0];

  const totalPrice =
    trim.price + paint.price + wheel.price + interior.price + (includeFsd ? 8000 : 0);
  const pricing = calculateOrderTotals({
    assetPrice: totalPrice,
    category: "Vehicles",
    applyHeroesDiscount: applyHeroes,
  });
  const baseRangeNum = parseInt(trim.range, 10) || model.rangeMiles;
  const effectiveRange = Math.max(240, baseRangeNum + wheel.rangeDelta);
  const effectiveVehicleTotal = Math.max(0, totalPrice - pricing.heroesDiscount);
  const estFinance = Math.round((effectiveVehicleTotal * 0.88) / 60);
  const estLease = Math.max(229, Math.round(effectiveVehicleTotal * 0.0112));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 sm:p-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Configure ${model.name}`}
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[8px] border border-border bg-card text-foreground shadow-2xl lg:grid-cols-[1.15fr_1fr]"
      >
        {/* Left: Live Vehicle Preview + Key Verified Specs */}
        <div className="bg-muted/40 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Tesla Design Studio · Trade Tesla
              </span>
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden rounded-[4px] border border-border px-2.5 py-1 text-xs font-medium"
              >
                Close
              </button>
            </div>
            <h3 className="font-display mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
              {model.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{trim.name}</p>

            <div className="mt-5 overflow-hidden rounded-[6px] bg-black/10 aspect-[16/10]">
              <img
                src={paint.image}
                alt={`${model.name} in ${paint.name}`}
                className="h-full w-full object-cover transition-all duration-500"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
            <div>
              <div className="font-display text-xl sm:text-2xl font-semibold tabular">
                {effectiveRange} <span className="text-xs font-normal text-muted-foreground">mi</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Range (EPA)
              </div>
            </div>
            <div>
              <div className="font-display text-xl sm:text-2xl font-semibold tabular">
                {trim.topSpeed}
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Top Speed
              </div>
            </div>
            <div>
              <div className="font-display text-xl sm:text-2xl font-semibold tabular">
                {trim.zeroToSixty}
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                0–60 mph
              </div>
            </div>
          </div>
        </div>

        {/* Right: Trim, Paint, Wheels, Interior, FSD & Checkout */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="hidden lg:flex justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close configurator"
                className="h-8 w-8 rounded-[4px] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Trims */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                Select Trim & Drivetrain
              </label>
              <div className="space-y-2">
                {model.trims.map((t, idx) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTrimIndex(idx)}
                    className={`w-full flex items-center justify-between rounded-[4px] border px-4 py-3 text-left text-sm transition-all ${
                      idx === trimIndex
                        ? "border-foreground bg-muted/60 font-medium"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <div>
                      <div>{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {t.drivetrain} · {t.range}
                      </div>
                    </div>
                    <span className="tabular font-semibold">${t.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exterior Paint */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Exterior Paint
                </span>
                <span className="font-medium">
                  {paint.name} {paint.price === 0 ? "(Included)" : `+$${paint.price.toLocaleString()}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {model.paints.map((p, idx) => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    onClick={() => setPaintIndex(idx)}
                    className={`h-9 w-9 rounded-full border-2 transition-transform ${
                      idx === paintIndex
                        ? "border-foreground scale-110 ring-2 ring-foreground/25"
                        : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Wheels */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                Wheels
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {model.wheels.map((w, idx) => (
                  <button
                    key={w.name}
                    type="button"
                    onClick={() => setWheelIndex(idx)}
                    className={`rounded-[4px] border px-3 py-2 text-left text-xs transition-all ${
                      idx === wheelIndex
                        ? "border-foreground bg-muted/60 font-medium"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <div className="font-medium">{w.name}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {w.price === 0 ? "Included" : `+$${w.price.toLocaleString()}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interior */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Interior
                </span>
                <span className="font-medium">
                  {interior.name}{" "}
                  {interior.price === 0 ? "(Included)" : `+$${interior.price.toLocaleString()}`}
                </span>
              </div>
              <div className="flex gap-2.5">
                {model.interiors.map((i, idx) => (
                  <button
                    key={i.name}
                    type="button"
                    onClick={() => setInteriorIndex(idx)}
                    className={`h-8 w-8 rounded-full border-2 ${
                      idx === interiorIndex ? "border-foreground ring-2 ring-foreground/25" : "border-border"
                    }`}
                    style={{ backgroundColor: i.swatch }}
                    title={i.name}
                  />
                ))}
              </div>
            </div>

            {/* Full Self-Driving (Supervised) */}
            <label className="flex items-start justify-between gap-3 rounded-[4px] border border-border p-3.5 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={includeFsd}
                  onChange={(e) => setIncludeFsd(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-foreground"
                />
                <div>
                  <div className="text-sm font-medium">Full Self-Driving (Supervised)</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Navigate city streets, traffic lights, auto lane changes & Autopark.
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold tabular shrink-0">+$8,000</span>
            </label>

            {/* Our Heroes $2,000 Discount */}
            <label className="flex items-start justify-between gap-3 rounded-[4px] border border-border bg-muted/40 p-3.5 cursor-pointer hover:bg-muted/70 transition-colors">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={applyHeroes}
                  onChange={(e) => setApplyHeroes(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#171a20] dark:accent-white"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Our Heroes Discount (Military, First Responders &amp; Educators)
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Save ${HEROES_DISCOUNT_AMOUNT.toLocaleString()} instantly at checkout with service verification.
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground tabular shrink-0">
                -${HEROES_DISCOUNT_AMOUNT.toLocaleString()}
              </span>
            </label>
          </div>

          {/* Pricing + Order Action */}
          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-[4px] border border-border p-0.5 text-xs">
                {(["cash", "finance", "lease"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`px-3 py-1 rounded-[3px] capitalize transition-colors ${
                      paymentMode === mode ? "bg-foreground text-background font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-semibold tabular">
                  {paymentMode === "cash"
                    ? `$${pricing.totalDue.toLocaleString()}`
                    : paymentMode === "finance"
                    ? `$${estFinance.toLocaleString()}/mo`
                    : `$${estLease.toLocaleString()}/mo`}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {paymentMode === "cash"
                    ? `Incl. $${pricing.shippingFee.toLocaleString()} enclosed freight${pricing.heroesDiscount > 0 ? ` · -$${pricing.heroesDiscount.toLocaleString()} Heroes` : ""}`
                    : paymentMode === "finance"
                    ? "Est. 60-mo · 12% down"
                    : "Est. 36-mo · 10k mi/yr"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerLoader({
                  label: "INITIALIZING ORDER",
                  durationMs: 420,
                  onComplete: () => {
                    onProceedOrder({
                      id: `${model.id}-${trimIndex}`,
                      name: `${trim.name} (${paint.name}${includeFsd ? " + FSD" : ""})`,
                      price: `$${totalPrice.toLocaleString()}`,
                      badge: "NEW",
                      category: "Vehicles",
                      image: paint.image,
                      heroesDiscount: applyHeroes,
                    });
                  },
                });
              }}
              className="w-full h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Order Now · Direct Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeslaLineupSection({
  externalModelId,
  onClearExternalModel,
}: {
  externalModelId?: string | null;
  onClearExternalModel?: () => void;
}) {
  const [category, setCategory] = useState<"All" | TeslaVehicleModel["category"]>("All");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [detailModel, setDetailModel] = useState<TeslaVehicleModel | null>(null);
  const [configuringModel, setConfiguringModel] = useState<TeslaVehicleModel | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<{
    id: string;
    name: string;
    price: string;
    badge: string;
    category: string;
    image: string;
    heroesDiscount?: boolean;
  } | null>(null);
  const { triggerLoader } = useTeslaLoader();

  const activeExternalModel = useMemo(
    () => (externalModelId ? TESLA_VEHICLES.find((m) => m.id === externalModelId) ?? null : null),
    [externalModelId],
  );
  const modalModel = configuringModel ?? activeExternalModel;

  const filtered =
    category === "All"
      ? TESLA_VEHICLES
      : TESLA_VEHICLES.filter((v) => v.category === category);

  const compared = TESLA_VEHICLES.filter((v) => compareIds.includes(v.id));

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : [...prev.slice(1), id],
    );
  };

  return (
    <section id="lineup" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-10 bg-background">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Tesla Model Lineup · 2026
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Compare &amp; Configure Every Model
            </h2>
            <p className="mt-3 inline-flex items-center gap-2 rounded-[4px] border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e82127] shrink-0" />
              <span>$2,000 Off for Our Heroes · Military, Veterans, First Responders, Healthcare &amp; Educators</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-[4px] px-4 py-2 text-xs font-medium transition-colors ${
                  category === c
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Tray if >= 2 models selected */}
        {compared.length >= 2 && (
          <div id="compare-table" className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">
                Side-by-Side Specification Comparison
              </h3>
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear comparison
              </button>
            </div>
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pr-4">Metric</th>
                  {compared.map((c) => (
                    <th key={c.id} className="py-2.5 px-4 font-semibold text-foreground">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                <tr>
                  <td className="py-3 pr-4 text-muted-foreground">Starting Price</td>
                  {compared.map((c) => (
                    <td key={c.id} className="py-3 px-4 font-medium tabular">
                      ${c.price.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-muted-foreground">EPA Range</td>
                  {compared.map((c) => (
                    <td key={c.id} className="py-3 px-4 tabular">{c.rangeMiles} mi</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-muted-foreground">0–60 mph</td>
                  {compared.map((c) => (
                    <td key={c.id} className="py-3 px-4 tabular">{c.zeroToSixty}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-muted-foreground">Top Speed</td>
                  {compared.map((c) => (
                    <td key={c.id} className="py-3 px-4 tabular">{c.topSpeedMph}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-muted-foreground">Peak Power / System</td>
                  {compared.map((c) => (
                    <td key={c.id} className="py-3 px-4">{c.horsepower}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-muted-foreground">Seating / Cargo</td>
                  {compared.map((c) => (
                    <td key={c.id} className="py-3 px-4">{c.seats} seats · {c.cargoCuFt}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Vehicle Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => {
            const isComparing = compareIds.includes(v.id);
            return (
              <article
                key={v.id}
                className="group flex flex-col justify-between overflow-hidden rounded-[6px] border border-border bg-card transition-all duration-300 hover:border-foreground/30 hover:shadow-lg"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <button
                      type="button"
                      onClick={() => setDetailModel(v)}
                      aria-label={`Inspect ${v.name} specifications`}
                      className="h-full w-full block"
                    >
                      <img
                        src={v.heroImage}
                        alt={v.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </button>
                    {v.badge && (
                      <span className="absolute top-3 left-3 rounded-[3px] bg-black/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                        {v.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleCompare(v.id)}
                      className={`absolute top-3 right-3 rounded-[3px] px-2.5 py-1 text-[11px] font-medium backdrop-blur-md transition-colors ${
                        isComparing
                          ? "bg-white text-[#171a20]"
                          : "bg-[#171a20]/70 text-white/95 hover:bg-[#171a20]/90"
                      }`}
                    >
                      {isComparing ? "✓ Comparing" : "+ Compare"}
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-xl font-semibold tracking-tight">
                        {v.name}
                      </h3>
                      <span className="text-sm font-semibold tabular">
                        From ${v.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {v.tagline}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-2 border-y border-border/70 py-3 text-center">
                      <div>
                        <div className="font-display text-sm font-semibold tabular">
                          {v.rangeMiles} mi
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Range
                        </div>
                      </div>
                      <div className="border-x border-border/70">
                        <div className="font-display text-sm font-semibold tabular">
                          {v.zeroToSixty}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          0–60 mph
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-sm font-semibold tabular">
                          {v.topSpeedMph}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Top Speed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 px-6 pb-6">
                  <button
                    type="button"
                    onClick={() =>
                      triggerLoader({
                        label: `CONFIGURE ${v.name.toUpperCase()}`,
                        durationMs: 380,
                        onComplete: () => setConfiguringModel(v),
                      })
                    }
                    className="h-10 rounded-[4px] bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Order & Configure
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModel(v)}
                    className="h-10 rounded-[4px] border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Learn More
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Floating Compare Tray */}
      {compareIds.length > 0 && (
        <div className="fixed inset-x-4 bottom-5 z-[60] mx-auto flex w-fit max-w-[calc(100vw-32px)] items-center gap-3 rounded-full bg-foreground py-2 pl-5 pr-2 text-background shadow-2xl">
          <span className="text-xs font-medium tabular">
            {compareIds.length} / 3 selected
          </span>
          <button
            type="button"
            disabled={compareIds.length < 2}
            onClick={() =>
              document.getElementById("compare-table")?.scrollIntoView({ behavior: "smooth" })
            }
            className="rounded-full bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compare
          </button>
          <button
            type="button"
            onClick={() => setCompareIds([])}
            aria-label="Clear vehicle comparison"
            className="grid h-7 w-7 place-items-center rounded-full text-background/75 hover:bg-background/15 hover:text-background"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vehicle Quick-Detail Modal */}
      {detailModel && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
          onClick={() => setDetailModel(null)}
        >
          <div
            role="dialog"
            aria-label={`${detailModel.name} specifications`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card text-foreground shadow-2xl"
          >
            <div className="relative h-60 sm:h-72 overflow-hidden bg-muted">
              <img
                src={detailModel.heroImage}
                alt={detailModel.name}
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, transparent 35%, rgba(10,11,13,0.82) 100%)",
                }}
              />
              <button
                type="button"
                onClick={() => setDetailModel(null)}
                aria-label="Close specifications"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
              >
                ✕
              </button>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                  {detailModel.category} · Trade Tesla
                </p>
                <h3 className="font-display mt-1 text-3xl font-semibold">{detailModel.name}</h3>
                <p className="mt-1 text-xs text-white/80">{detailModel.tagline}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {detailModel.description}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "EPA Range", value: `${detailModel.rangeMiles} mi` },
                  { label: "0–60 mph", value: detailModel.zeroToSixty },
                  { label: "Top Speed", value: detailModel.topSpeedMph },
                  { label: "Peak Charging", value: detailModel.peakChargingKw },
                ].map((sp) => (
                  <div key={sp.label} className="rounded-lg border border-border bg-muted/35 p-3.5">
                    <p className="font-display text-lg font-semibold tabular">{sp.value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {sp.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 border-t border-border pt-5">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Exterior Finishes
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detailModel.paints.map((p) => (
                      <span
                        key={p.name}
                        title={p.name}
                        className="h-7 w-7 rounded-full border border-border"
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {detailModel.drivetrain} · {detailModel.seats} seats · {detailModel.cargoCuFt} cargo
                  </p>
                </div>

                <div className="flex flex-col justify-between items-start sm:items-end">
                  <div className="sm:text-right">
                    <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                      Starting From
                    </p>
                    <p className="font-display text-2xl font-semibold tabular">
                      ${detailModel.price.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Or ~${detailModel.leaseMonthly.toLocaleString()}/mo est. lease
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => {
                    const chosen = detailModel;
                    setDetailModel(null);
                    triggerLoader({
                      label: `CONFIGURE ${chosen.name.toUpperCase()}`,
                      durationMs: 380,
                      onComplete: () => setConfiguringModel(chosen),
                    });
                  }}
                  className="flex-1 h-11 rounded-[4px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Design & Order {detailModel.name}
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModel(null)}
                  className="h-11 rounded-[4px] border border-border px-6 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalModel && (
        <TeslaDesignStudioModal
          model={modalModel}
          onClose={() => {
            setConfiguringModel(null);
            onClearExternalModel?.();
          }}
          onProceedOrder={(item) => {
            setConfiguringModel(null);
            onClearExternalModel?.();
            setCheckoutItem(item);
          }}
        />
      )}

      {checkoutItem && (
        <CheckoutModal
          item={checkoutItem}
          initialHeroesDiscount={Boolean(checkoutItem.heroesDiscount)}
          onClose={() => setCheckoutItem(null)}
        />
      )}
    </section>
  );
}
