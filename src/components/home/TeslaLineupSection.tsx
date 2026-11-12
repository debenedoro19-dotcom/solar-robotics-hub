import React, { useMemo, useState } from "react";
import { TESLA_VEHICLES, type TeslaVehicleModel } from "@/data/teslaCatalog";
import CheckoutModal from "@/components/inventory/CheckoutModal";
import { useTeslaLoader } from "@/components/TeslaLoader";

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
  }) => void;
}) {
  const [trimIndex, setTrimIndex] = useState(0);
  const [paintIndex, setPaintIndex] = useState(0);
  const [wheelIndex, setWheelIndex] = useState(0);
  const [interiorIndex, setInteriorIndex] = useState(0);
  const [includeFsd, setIncludeFsd] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"cash" | "finance" | "lease">("cash");
  const { triggerLoader } = useTeslaLoader();

  const trim = model.trims[trimIndex] ?? model.trims[0];
  const paint = model.paints[paintIndex] ?? model.paints[0];
  const wheel = model.wheels[wheelIndex] ?? model.wheels[0];
  const interior = model.interiors[interiorIndex] ?? model.interiors[0];

  const totalPrice =
    trim.price + paint.price + wheel.price + interior.price + (includeFsd ? 8000 : 0);
  const baseRangeNum = parseInt(trim.range, 10) || model.rangeMiles;
  const effectiveRange = Math.max(240, baseRangeNum + wheel.rangeDelta);
  const estFinance = Math.round((totalPrice * 0.88) / 60);
  const estLease = Math.max(229, Math.round(totalPrice * 0.0112));

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
                        ? "border-[#3e6ae1] scale-110 ring-2 ring-[#3e6ae1]/30"
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
                      idx === interiorIndex ? "border-[#3e6ae1] ring-2 ring-[#3e6ae1]/30" : "border-border"
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
                  className="mt-0.5 h-4 w-4 accent-[#3e6ae1]"
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
                    ? `$${totalPrice.toLocaleString()}`
                    : paymentMode === "finance"
                    ? `$${estFinance.toLocaleString()}/mo`
                    : `$${estLease.toLocaleString()}/mo`}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {paymentMode === "cash"
                    ? "Direct Purchase Total"
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
                    });
                  },
                });
              }}
              className="w-full h-11 rounded-[4px] bg-[#3e6ae1] text-white text-sm font-medium hover:bg-[#345ac7] transition-colors"
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
  const [configuringModel, setConfiguringModel] = useState<TeslaVehicleModel | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<{
    id: string;
    name: string;
    price: string;
    badge: string;
    category: string;
    image: string;
  } | null>(null);
  const { triggerLoader, navigateWithLoader } = useTeslaLoader();

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
              Compare & Configure Every Model
            </h2>
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
          <div className="mt-8 rounded-[6px] border border-border bg-card p-6 shadow-sm overflow-x-auto">
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
                    <img
                      src={v.heroImage}
                      alt={v.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
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
                          ? "bg-[#3e6ae1] text-white"
                          : "bg-black/55 text-white/90 hover:bg-black/75"
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
                    onClick={() => navigateWithLoader("/inventory", v.name.toUpperCase())}
                    className="h-10 rounded-[4px] border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Live Inventory
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

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
          onClose={() => setCheckoutItem(null)}
        />
      )}
    </section>
  );
}
