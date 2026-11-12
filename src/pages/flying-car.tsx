import React, { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/sections/FloatingSupport";
import { useTeslaLoader } from "@/components/TeslaLoader";
import { submitAeroBooking } from "@/lib/inventory.functions";
import { supabase } from "@/integrations/supabase/client";

type BookingMode = "prebook" | "test_drive";

interface StoredAeroBooking {
  reservationCode: string;
  mode: BookingMode;
  vehicle: string;
  edition: string;
  fullName: string;
  email: string;
  phone: string;
  hub: string;
  preferredDate?: string;
  experienceType?: string;
  createdAt: string;
}

const PREBOOK_EDITIONS = [
  {
    id: "Aero Dual-Mode Production",
    price: "$299,000 Est. MSRP",
    roadRange: "350 mi Road",
    airRange: "110 mi VTOL Air",
    speed: "215 mph Cruise",
    note: "Carbon shroud 8-rotor lift + NACS 350 kW V4 Supercharging.",
  },
  {
    id: "Aero Founders VTOL Edition",
    price: "$350,000 Est. MSRP",
    roadRange: "410 mi Road",
    airRange: "145 mi VTOL Air",
    speed: "235 mph Cruise",
    note: "Tri-motor road torque vectoring, Titanium ducts & priority Q4 2026 queue.",
  },
];

const TEST_DRIVE_FLEET = [
  "Model Aero Prototype (Track + Flight Sim)",
  "Cybercab Autonomous Robotaxi",
  "Roadster Next-Gen Prototype",
  "Model S Plaid (1,020 hp)",
  "Cybertruck Cyberbeast",
  "Model 3 Highland Performance",
  "Model Y Long Range AWD",
];

const DELIVERY_HUBS = [
  "Austin, TX — Giga Texas Campus",
  "Hawthorne, CA — LA Design Studio",
  "San Francisco, CA — Downtown Hub",
  "Miami, FL — Brickell Clean Energy Hub",
  "New York, NY — Hudson Yards Showcase",
];

const STORAGE_KEY = "trade_tesla_aero_bookings";

export default function FlyingCarPage() {
  const [mode, setMode] = useState<BookingMode>("prebook");
  const [telemetryMode, setTelemetryMode] = useState<"flight" | "road">("flight");
  const [edition, setEdition] = useState(PREBOOK_EDITIONS[0].id);
  const [paintFinish, setPaintFinish] = useState("Obsidian Aerospace Satin");
  const [targetWindow, setTargetWindow] = useState("Q1 2027 Production");
  const [testVehicle, setTestVehicle] = useState(TEST_DRIVE_FLEET[0]);
  const [experienceType, setExperienceType] = useState("Street Track + VTOL Flight Sim");
  const [hub, setHub] = useState(DELIVERY_HUBS[0]);
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [preferredSlot, setPreferredSlot] = useState("10:30 AM Local");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<StoredAeroBooking[]>([]);
  const [latestPass, setLatestPass] = useState<StoredAeroBooking | null>(null);

  const bookFn = useServerFn(submitAeroBooking);
  const { navigateWithLoader } = useTeslaLoader();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "test_drive") {
      setMode("test_drive");
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredAeroBooking[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBookings(parsed);
          setLatestPass(parsed[0]);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Please enter your full legal name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.trim().length < 5) {
      setError("Please enter a valid SMS phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedVehicle = mode === "prebook" ? "Model Aero (Flying Car)" : testVehicle;
      const selectedEdition =
        mode === "prebook" ? `${edition} · ${paintFinish}` : `${testVehicle} Demo`;
      const dateStr =
        mode === "prebook" ? targetWindow : `${preferredDate} · ${preferredSlot}`;

      const res = await bookFn({
        data: {
          mode,
          vehicle: selectedVehicle,
          edition: selectedEdition,
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          hub,
          preferredDate: dateStr,
          experienceType: mode === "prebook" ? paintFinish : experienceType,
          notes: notes.trim() || undefined,
        },
      });

      try {
        await supabase.from("newsletter_leads").insert({
          email: cleanEmail,
          source: `${mode}:${res.reservationCode}:${hub.split("—")[0].trim()}`.slice(0, 64),
        });
      } catch {
        /* server alert already dispatched */
      }

      const pass: StoredAeroBooking = {
        reservationCode: res.reservationCode,
        mode,
        vehicle: selectedVehicle,
        edition: selectedEdition,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        hub,
        preferredDate: dateStr,
        experienceType: mode === "prebook" ? paintFinish : experienceType,
        createdAt: res.createdAt,
      };

      const nextList = [pass, ...bookings].slice(0, 6);
      setBookings(nextList);
      setLatestPass(pass);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
      } catch {
        /* ignore */
      }
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-[4px] border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none";

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header heroTransparent />

      {/* ── Dark Obsidian Flying Car Showcase Hero ───────────────────────── */}
      <section className="relative min-h-[78vh] w-full overflow-hidden bg-[#0a0b0d] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-10 flex items-center">
        <img
          src="/images/tesla/cybercab-studio.jpg"
          alt="Tesla Model Aero dual-mode flying vehicle aerospace studio view"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(95deg, rgba(10,11,13,0.92) 0%, rgba(10,11,13,0.72) 55%, rgba(10,11,13,0.45) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-[1440px] w-full grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#e82127] pulse-dot" />
              Model Aero · Dual-Mode eVTOL &amp; Prototype Demo
            </div>

            <h1 className="font-display text-4xl font-medium tracking-tight text-white sm:text-6xl leading-[1.02]">
              Built for the Highway.{" "}
              <span className="text-white/75 block sm:inline">Engineered to Lift Off.</span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-white/80">
              Reserve your zero-deposit priority production slot for the dual-mode{" "}
              <strong className="text-white">Model Aero Flying Vehicle</strong>, or book a private
              track drive and VTOL flight-simulator session at a Trade Tesla hub.
            </p>

            {/* Telemetry Toggle HUD */}
            <div className="rounded-[6px] border border-white/15 bg-black/45 p-5 backdrop-blur-md max-w-xl">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Live Architecture Mode
                </span>
                <div className="inline-flex rounded-[4px] border border-white/20 bg-white/5 p-0.5">
                  {(["flight", "road"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTelemetryMode(t)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-[3px] transition-colors ${
                        telemetryMode === t ? "bg-white text-[#171a20]" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {t === "flight" ? "VTOL Flight Mode" : "Highway Track Mode"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(telemetryMode === "flight"
                  ? [
                      { k: "Air Range", v: "110–145 mi" },
                      { k: "Cruise Speed", v: "215 mph" },
                      { k: "Propulsion", v: "8-Ducted Rotors" },
                      { k: "Shift Time", v: "6.5 Seconds" },
                    ]
                  : [
                      { k: "Road Range", v: "350–410 mi" },
                      { k: "0–60 mph", v: "1.9–2.1 s" },
                      { k: "Drivetrain", v: "Tri-Motor AWD" },
                      { k: "Supercharge", v: "350 kW V4" },
                    ]
                ).map((item) => (
                  <div key={item.k}>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">{item.k}</p>
                    <p className="font-display mt-1 text-base font-semibold text-white tabular">
                      {item.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#booking-studio"
                onClick={() => setMode("prebook")}
                className="inline-flex h-12 items-center justify-center rounded-[4px] bg-white px-7 text-xs font-semibold uppercase tracking-[0.12em] text-[#171a20] hover:bg-white/90 transition-colors"
              >
                Pre-Book Build Slot ($0 Queue)
              </a>
              <a
                href="#booking-studio"
                onClick={() => setMode("test_drive")}
                className="inline-flex h-12 items-center justify-center rounded-[4px] border border-white/35 bg-black/30 px-6 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                Schedule Test Drive / Flight Sim
              </a>
            </div>
          </div>

          {/* Right Aerospace Summary Card */}
          <div className="rounded-[8px] border border-white/15 bg-[#121418]/90 backdrop-blur-md p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  Allocation Program
                </p>
                <h2 className="font-display text-xl font-semibold text-white mt-0.5">
                  Priority Build &amp; Flight Briefing
                </h2>
              </div>
              <span className="rounded-[3px] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#171a20]">
                Open Now
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {PREBOOK_EDITIONS.map((ed) => (
                <div
                  key={ed.id}
                  className="rounded-[6px] border border-white/12 bg-white/[0.04] p-4 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-white">{ed.id}</p>
                    <p className="text-white/65 mt-1 leading-relaxed">{ed.note}</p>
                    <p className="text-white/80 font-medium mt-2 tabular">
                      {ed.roadRange} · {ed.airRange} · {ed.speed}
                    </p>
                  </div>
                  <span className="font-display font-semibold text-white whitespace-nowrap">
                    {ed.price}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-white/70">
              <span>Want immediate checkout on existing lineup?</span>
              <button
                type="button"
                onClick={() => navigateWithLoader("/inventory", "LIVE INVENTORY")}
                className="font-semibold text-white underline underline-offset-4 hover:opacity-80"
              >
                Open Inventory →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Booking & Test Drive Studio ──────────────────────── */}
      <section id="booking-studio" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-10 bg-background border-t border-border">
        <div className="mx-auto max-w-[1440px] grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Booking Form */}
          <div className="rounded-[8px] border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5 mb-6">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Trade Tesla Concierge Reservation
                </p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
                  {mode === "prebook"
                    ? "Pre-Book Your Model Aero Slot"
                    : "Schedule Prototype Test Drive"}
                </h2>
              </div>

              {/* Mode Switcher */}
              <div className="inline-flex rounded-[4px] border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("prebook");
                    setError("");
                  }}
                  className={`h-9 rounded-[3px] px-4 text-xs font-medium transition-colors ${
                    mode === "prebook"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Flying Car Pre-Book
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("test_drive");
                    setError("");
                  }}
                  className={`h-9 rounded-[3px] px-4 text-xs font-medium transition-colors ${
                    mode === "test_drive"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Test Drive &amp; Flight Sim
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "prebook" ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Select Flying Vehicle Configuration
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {PREBOOK_EDITIONS.map((ed) => (
                        <button
                          key={ed.id}
                          type="button"
                          onClick={() => setEdition(ed.id)}
                          className={`p-3.5 rounded-[6px] border text-left transition-all ${
                            edition === ed.id
                              ? "border-foreground bg-foreground/5"
                              : "border-border hover:border-foreground/35"
                          }`}
                        >
                          <p className="text-xs font-semibold text-foreground">{ed.id}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{ed.price}</p>
                          <p className="text-[11px] font-medium text-foreground mt-2">
                            {ed.roadRange} · {ed.airRange}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Exterior Studio Finish
                      </label>
                      <select
                        className={inputClass}
                        value={paintFinish}
                        onChange={(e) => setPaintFinish(e.target.value)}
                      >
                        <option>Obsidian Aerospace Satin</option>
                        <option>Liquid Silver Flight Coat</option>
                        <option>Crimson Vector Metallic</option>
                        <option>Stealth Raw Carbon Weave</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Target Production Window
                      </label>
                      <select
                        className={inputClass}
                        value={targetWindow}
                        onChange={(e) => setTargetWindow(e.target.value)}
                      >
                        <option>Q4 2026 Priority Batch</option>
                        <option>Q1 2027 Production</option>
                        <option>Q2 2027 Production</option>
                        <option>Q3 2027 Production</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Select Vehicle / Prototype
                      </label>
                      <select
                        className={inputClass}
                        value={testVehicle}
                        onChange={(e) => setTestVehicle(e.target.value)}
                      >
                        {TEST_DRIVE_FLEET.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Session Format
                      </label>
                      <select
                        className={inputClass}
                        value={experienceType}
                        onChange={(e) => setExperienceType(e.target.value)}
                      >
                        <option>Street Track + VTOL Flight Sim</option>
                        <option>Autonomous FSD Road Demo</option>
                        <option>Plaid Acceleration Closed Track</option>
                        <option>Private Executive Hub Briefing</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        className={inputClass}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Preferred Time Window
                      </label>
                      <select
                        className={inputClass}
                        value={preferredSlot}
                        onChange={(e) => setPreferredSlot(e.target.value)}
                      >
                        <option>09:00 AM Local</option>
                        <option>10:30 AM Local</option>
                        <option>01:30 PM Local</option>
                        <option>04:00 PM Local</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Regional Delivery / Experience Hub
                </label>
                <select
                  className={inputClass}
                  value={hub}
                  onChange={(e) => setHub(e.target.value)}
                >
                  {DELIVERY_HUBS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Full Name *
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Jordan Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    SMS Phone *
                  </label>
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="+1 (555) 010-2026"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Additional Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-[4px] border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                  placeholder="Pilot certification notes, fleet interest, or guest passengers..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && <p className="text-xs font-semibold text-[#e82127]">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-[4px] bg-foreground text-background text-xs font-semibold uppercase tracking-[0.14em] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting
                  ? "Generating Priority Pass…"
                  : mode === "prebook"
                    ? "Confirm Flying Car Pre-Book ($0 Due Today) →"
                    : "Confirm Prototype Test Drive →"}
              </button>
            </form>
          </div>

          {/* Right Column: Live Priority Boarding Pass + Saved Reservations */}
          <div className="space-y-6">
            {latestPass ? (
              <div className="rounded-[8px] border border-border bg-[#0a0b0d] text-white p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                      Confirmed Trade Tesla Pass
                    </p>
                    <p className="font-mono text-xl font-semibold text-white tracking-wider mt-1">
                      {latestPass.reservationCode}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#171a20]">
                    ✓ Registered
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-white/55 block text-[10px] uppercase">Program</span>
                    <span className="font-semibold text-white">
                      {latestPass.mode === "prebook" ? "Flying Car Pre-Book" : "Prototype Test Drive"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/55 block text-[10px] uppercase">Configuration</span>
                    <span className="font-semibold text-white">{latestPass.edition}</span>
                  </div>
                  <div>
                    <span className="text-white/55 block text-[10px] uppercase">Hub</span>
                    <span className="font-medium text-white">{latestPass.hub}</span>
                  </div>
                  <div>
                    <span className="text-white/55 block text-[10px] uppercase">Schedule / Batch</span>
                    <span className="font-medium text-white">{latestPass.preferredDate}</span>
                  </div>
                </div>

                <div className="rounded-[4px] border border-white/15 bg-white/[0.04] p-3.5 text-xs text-white/75 leading-relaxed">
                  Priority allocation logged for <strong className="text-white">{latestPass.fullName}</strong> (
                  {latestPass.email}). Our logistics and flight briefing team has received your pass ID.
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => navigateWithLoader("/inventory", "ORDER CHECKOUT")}
                    className="h-10 rounded-[4px] bg-white px-5 text-xs font-semibold text-[#171a20] hover:bg-white/90 transition-colors"
                  >
                    Proceed to Direct Order →
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateWithLoader("/giveaways", "GIVEAWAYS")}
                    className="h-10 rounded-[4px] border border-white/30 px-4 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    View Free Giveaways
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[8px] border border-border bg-muted/30 p-6 sm:p-7 space-y-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Instant Queue Pass
                </p>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Zero Deposit Today. Locked Production Position.
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Submitting this reservation issues an immediate priority boarding pass (`TT-AERO` or `TT-DRV`) with your build window or test-drive hub locked in — with full visibility in your browser and immediate confirmation dispatched to Trade Tesla Concierge.
                </p>
                <ul className="space-y-2.5 pt-2 border-t border-border text-xs text-foreground">
                  <li>• Enclosed 8-rotor VTOL transition in 6.5 seconds</li>
                  <li>• 350 mi road range + 110 mi aerial cruise corridor</li>
                  <li>• NACS V4 350 kW Supercharger compatible nationwide</li>
                  <li>• Priority invitation to Giga Texas flight-sim previews</li>
                </ul>
              </div>
            )}

            {bookings.length > 0 && (
              <div className="rounded-[8px] border border-border bg-card p-6 space-y-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Your Saved Passes ({bookings.length})
                </p>
                <div className="divide-y divide-border">
                  {bookings.map((b) => (
                    <div
                      key={b.reservationCode}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-mono font-semibold text-foreground">{b.reservationCode}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {b.edition} · {b.preferredDate}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLatestPass(b)}
                        className="text-xs font-medium text-foreground underline underline-offset-4 shrink-0"
                      >
                        View Pass
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingSupport />
    </main>
  );
}
