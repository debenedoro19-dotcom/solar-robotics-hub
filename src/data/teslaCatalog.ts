export interface TeslaPaintOption {
  name: string;
  hex: string;
  price: number;
  image: string;
}

export interface TeslaWheelOption {
  name: string;
  price: number;
  rangeDelta: number;
}

export interface TeslaInteriorOption {
  name: string;
  swatch: string;
  price: number;
}

export interface TeslaTrimOption {
  name: string;
  price: number;
  range: string;
  zeroToSixty: string;
  topSpeed: string;
  drivetrain: string;
}

export interface TeslaVehicleModel {
  id: string;
  name: string;
  category: "Sedan" | "SUV" | "Truck" | "Autonomous & Future";
  tagline: string;
  price: number;
  leaseMonthly: number;
  rangeMiles: number;
  zeroToSixty: string;
  topSpeedMph: string;
  horsepower: string;
  seats: string;
  cargoCuFt: string;
  drivetrain: string;
  peakChargingKw: string;
  badge?: string;
  heroImage: string;
  description: string;
  paints: TeslaPaintOption[];
  wheels: TeslaWheelOption[];
  interiors: TeslaInteriorOption[];
  trims: TeslaTrimOption[];
}

export interface TeslaHeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  primaryCta: { label: string; href: string; actionType?: "configure" | "route"; modelId?: string };
  secondaryCta: { label: string; href: string };
  specs: Array<{ label: string; value: string }>;
}

export interface TeslaEnergyProduct {
  id: string;
  tag: string;
  name: string;
  category: "Solar" | "Storage" | "Charging" | "Robotics";
  headlineMetric: string;
  priceLabel: string;
  priceNumber: number;
  image: string;
  summary: string;
  specs: Array<{ label: string; value: string }>;
  href: string;
}

export const TESLA_VEHICLES: TeslaVehicleModel[] = [
  {
    id: "model-s",
    name: "Model S",
    category: "Sedan",
    tagline: "Plaid engineering. 1,020 hp tri-motor flagship sedan.",
    price: 74990,
    leaseMonthly: 999,
    rangeMiles: 402,
    zeroToSixty: "1.99 s",
    topSpeedMph: "200 mph",
    horsepower: "1,020 hp",
    seats: "5",
    cargoCuFt: "28 cu ft",
    drivetrain: "Tri-Motor AWD",
    peakChargingKw: "250 kW",
    badge: "Flagship",
    heroImage: "/images/car-red.jpg",
    description:
      "Built for speed and ultra-long-distance grand touring with the lowest drag coefficient on earth (0.208 Cd), adaptive air suspension, and 17-inch cinematic touchscreen.",
    paints: [
      { name: "Ultra Red", hex: "#9b111e", price: 2500, image: "/images/car-red.jpg" },
      { name: "Pearl White Multi-Coat", hex: "#f4f5f7", price: 0, image: "/images/car-white.jpg" },
      { name: "Stealth Grey", hex: "#4a4e57", price: 0, image: "/images/car-suv.jpg" },
      { name: "Solid Black", hex: "#14161a", price: 1500, image: "/images/car-red.jpg" },
    ],
    wheels: [
      { name: '19" Tempest Wheels', price: 0, rangeDelta: 0 },
      { name: '21" Arachnid Forged Wheels', price: 4500, rangeDelta: -27 },
    ],
    interiors: [
      { name: "All Black Carbon Fiber", swatch: "#1a1c20", price: 0 },
      { name: "Black & White Slate", swatch: "#eaecef", price: 2000 },
      { name: "Cream Premium", swatch: "#d9ccb9", price: 2000 },
    ],
    trims: [
      {
        name: "Model S All-Wheel Drive",
        price: 74990,
        range: "402 mi EPA",
        zeroToSixty: "3.1 s",
        topSpeed: "130 mph",
        drivetrain: "Dual Motor AWD",
      },
      {
        name: "Model S Plaid",
        price: 89990,
        range: "359 mi EPA",
        zeroToSixty: "1.99 s",
        topSpeed: "200 mph",
        drivetrain: "Tri-Motor AWD",
      },
    ],
  },
  {
    id: "model-3",
    name: "Model 3",
    category: "Sedan",
    tagline: "Reengineered acoustic cabin, ambient wrap-around lighting, and 363-mile range.",
    price: 38990,
    leaseMonthly: 299,
    rangeMiles: 363,
    zeroToSixty: "2.9 s",
    topSpeedMph: "163 mph",
    horsepower: "510 hp",
    seats: "5",
    cargoCuFt: "24 cu ft",
    drivetrain: "RWD / Dual Motor AWD",
    peakChargingKw: "250 kW",
    badge: "Up to 363 mi",
    heroImage: "/images/car-white.jpg",
    description:
      "Completely refreshed aerodynamic body, ventilated front seats, 8-inch rear passenger touchscreen, and frequency-selective damping for whisper-quiet highway composure.",
    paints: [
      { name: "Pearl White Multi-Coat", hex: "#f4f5f7", price: 1000, image: "/images/car-white.jpg" },
      { name: "Stealth Grey", hex: "#4a4e57", price: 0, image: "/images/car-crossover.jpg" },
      { name: "Ultra Red", hex: "#9b111e", price: 2000, image: "/images/car-red.jpg" },
      { name: "Quicksilver", hex: "#9ca3af", price: 2000, image: "/images/car-white.jpg" },
    ],
    wheels: [
      { name: '18" Photon Aero Wheels', price: 0, rangeDelta: 0 },
      { name: '19" Nova Alloy Wheels', price: 1500, rangeDelta: -18 },
      { name: '20" Warp Forged (Performance)', price: 0, rangeDelta: -30 },
    ],
    interiors: [
      { name: "All Black Textile & Vegan Leather", swatch: "#1a1c20", price: 0 },
      { name: "Black & White", swatch: "#eceef2", price: 1000 },
    ],
    trims: [
      {
        name: "Long Range RWD",
        price: 42490,
        range: "363 mi EPA",
        zeroToSixty: "4.9 s",
        topSpeed: "125 mph",
        drivetrain: "Rear-Wheel Drive",
      },
      {
        name: "Long Range AWD",
        price: 47490,
        range: "341 mi EPA",
        zeroToSixty: "4.2 s",
        topSpeed: "125 mph",
        drivetrain: "Dual Motor AWD",
      },
      {
        name: "Performance AWD",
        price: 54990,
        range: "303 mi EPA",
        zeroToSixty: "2.9 s",
        topSpeed: "163 mph",
        drivetrain: "Performance Dual Motor",
      },
    ],
  },
  {
    id: "model-y",
    name: "Model Y",
    category: "SUV",
    tagline: "The world's best-selling electric SUV — refreshed lightbar & acoustic glass.",
    price: 44990,
    leaseMonthly: 399,
    rangeMiles: 337,
    zeroToSixty: "3.3 s",
    topSpeedMph: "155 mph",
    horsepower: "456 hp",
    seats: "Up to 7",
    cargoCuFt: "76 cu ft",
    drivetrain: "RWD / Dual Motor AWD",
    peakChargingKw: "250 kW",
    badge: "Best Seller",
    heroImage: "/images/car-crossover.jpg",
    description:
      "76 cubic feet of cargo space, HEPA Bioweapon Defense Mode filtration, panoramic UV-insulated glass roof, and 5-star NHTSA safety rating in every category.",
    paints: [
      { name: "Quicksilver", hex: "#8e949c", price: 2000, image: "/images/car-crossover.jpg" },
      { name: "Pearl White Multi-Coat", hex: "#f4f5f7", price: 1000, image: "/images/car-white.jpg" },
      { name: "Ultra Red", hex: "#9b111e", price: 2000, image: "/images/car-red.jpg" },
      { name: "Stealth Grey", hex: "#4a4e57", price: 0, image: "/images/car-suv.jpg" },
    ],
    wheels: [
      { name: '19" Crossflow Wheels', price: 0, rangeDelta: 0 },
      { name: '20" Helix 2.0 Wheels', price: 2000, rangeDelta: -19 },
    ],
    interiors: [
      { name: "All Black", swatch: "#1a1c20", price: 0 },
      { name: "Black & White", swatch: "#eaecef", price: 1000 },
    ],
    trims: [
      {
        name: "Long Range RWD",
        price: 44990,
        range: "337 mi EPA",
        zeroToSixty: "6.5 s",
        topSpeed: "135 mph",
        drivetrain: "Rear-Wheel Drive",
      },
      {
        name: "Long Range AWD",
        price: 48990,
        range: "327 mi EPA",
        zeroToSixty: "4.6 s",
        topSpeed: "135 mph",
        drivetrain: "Dual Motor AWD",
      },
      {
        name: "Performance AWD",
        price: 59990,
        range: "294 mi EPA",
        zeroToSixty: "3.3 s",
        topSpeed: "155 mph",
        drivetrain: "Performance Dual Motor",
      },
    ],
  },
  {
    id: "model-x",
    name: "Model X",
    category: "SUV",
    tagline: "Falcon Wing doors, panoramic windshield, and 5,000 lb towing capability.",
    price: 79990,
    leaseMonthly: 1099,
    rangeMiles: 335,
    zeroToSixty: "2.5 s",
    topSpeedMph: "163 mph",
    horsepower: "1,020 hp",
    seats: "Up to 7",
    cargoCuFt: "88 cu ft",
    drivetrain: "Dual / Tri-Motor AWD",
    peakChargingKw: "250 kW",
    badge: "Falcon Wing",
    heroImage: "/images/car-suv.jpg",
    description:
      "The highest-utility performance SUV ever built, combining automatic Falcon Wing rear doors, 22-speaker 960W audio, and supercar acceleration with up to 7-passenger seating.",
    paints: [
      { name: "Stealth Grey", hex: "#4a4e57", price: 0, image: "/images/car-suv.jpg" },
      { name: "Pearl White Multi-Coat", hex: "#f4f5f7", price: 1500, image: "/images/car-white.jpg" },
      { name: "Ultra Red", hex: "#9b111e", price: 2500, image: "/images/car-red.jpg" },
    ],
    wheels: [
      { name: '20" Cyberstream Wheels', price: 0, rangeDelta: 0 },
      { name: '22" Turbine Matte Black', price: 5500, rangeDelta: -22 },
    ],
    interiors: [
      { name: "All Black Carbon", swatch: "#1a1c20", price: 0 },
      { name: "Black & White", swatch: "#eaecef", price: 2000 },
      { name: "Cream", swatch: "#d9ccb9", price: 2000 },
    ],
    trims: [
      {
        name: "Model X All-Wheel Drive",
        price: 79990,
        range: "335 mi EPA",
        zeroToSixty: "3.8 s",
        topSpeed: "130 mph",
        drivetrain: "Dual Motor AWD",
      },
      {
        name: "Model X Plaid",
        price: 94990,
        range: "326 mi EPA",
        zeroToSixty: "2.5 s",
        topSpeed: "163 mph",
        drivetrain: "Tri-Motor AWD",
      },
    ],
  },
  {
    id: "cybertruck",
    name: "Cybertruck",
    category: "Truck",
    tagline: "Ultra-hard 30X cold-rolled stainless exoskeleton with steer-by-wire agility.",
    price: 79990,
    leaseMonthly: 899,
    rangeMiles: 325,
    zeroToSixty: "2.6 s",
    topSpeedMph: "130 mph",
    horsepower: "845 hp",
    seats: "5",
    cargoCuFt: "120.9 cu ft",
    drivetrain: "AWD / Cyberbeast Tri-Motor",
    peakChargingKw: "325 kW",
    badge: "Cyberbeast",
    heroImage: "/images/car-truck.jpg",
    description:
      "Built for any planet with 16 inches of adaptive air-suspension ground clearance, armored shatter-resistant glass, 11,000 lb towing, and 11.5 kW Powershare home backup export.",
    paints: [
      { name: "Raw Cold-Rolled Stainless", hex: "#9ca3af", price: 0, image: "/images/car-truck.jpg" },
      { name: "Satin Stealth Grey", hex: "#393c41", price: 6500, image: "/images/car-truck.jpg" },
      { name: "Satin Ceramic White Wrap", hex: "#e5e7eb", price: 6500, image: "/images/car-white.jpg" },
    ],
    wheels: [
      { name: '20" Cyber Wheels (All-Terrain)', price: 0, rangeDelta: 0 },
      { name: '20" Core Wheels (All-Season)', price: 0, rangeDelta: 15 },
    ],
    interiors: [
      { name: "Tactical Black Trim", swatch: "#1a1c20", price: 0 },
      { name: "White Accent Trim", swatch: "#f3f4f6", price: 0 },
    ],
    trims: [
      {
        name: "Cybertruck All-Wheel Drive",
        price: 79990,
        range: "325 mi est.",
        zeroToSixty: "4.1 s",
        topSpeed: "112 mph",
        drivetrain: "Dual Motor AWD",
      },
      {
        name: "Cyberbeast Tri-Motor",
        price: 99990,
        range: "320 mi est.",
        zeroToSixty: "2.6 s",
        topSpeed: "130 mph",
        drivetrain: "Tri-Motor AWD",
      },
    ],
  },
  {
    id: "cybercab",
    name: "Cybercab",
    category: "Autonomous & Future",
    tagline: "Purpose-built autonomous robotaxi with butterfly doors and wireless charging.",
    price: 30000,
    leaseMonthly: 249,
    rangeMiles: 290,
    zeroToSixty: "3.9 s",
    topSpeedMph: "115 mph",
    horsepower: "AI5 Autonomous",
    seats: "2",
    cargoCuFt: "38 cu ft",
    drivetrain: "Autonomous Unboxed RWD",
    peakChargingKw: "Inductive Wireless",
    badge: "Autonomy",
    heroImage: "/images/tesla/cybercab-studio.jpg",
    description:
      "Designed from the ground up with no steering wheel or pedals, driven by Tesla Vision and end-to-end neural networks, lowering cost-per-mile below mass transit.",
    paints: [
      { name: "Cyber Gold Metallic", hex: "#c6a355", price: 0, image: "/images/tesla/cybercab-studio.jpg" },
      { name: "Pearl Silver", hex: "#d1d5db", price: 0, image: "/images/tesla/cybercab-studio.jpg" },
    ],
    wheels: [
      { name: '19" Autonomous Aero Discs', price: 0, rangeDelta: 0 },
    ],
    interiors: [
      { name: "Minimalist Lounge 2-Seat", swatch: "#d1d5db", price: 0 },
    ],
    trims: [
      {
        name: "Cybercab Standard Allocation",
        price: 30000,
        range: "290 mi est.",
        zeroToSixty: "3.9 s",
        topSpeed: "115 mph",
        drivetrain: "Tesla Vision FSD",
      },
    ],
  },
  {
    id: "semi",
    name: "Semi",
    category: "Truck",
    tagline: "All-electric Class 8 long-haul freight · 500-mile loaded range.",
    price: 150000,
    leaseMonthly: 1850,
    rangeMiles: 500,
    zeroToSixty: "20 s (82k lb)",
    topSpeedMph: "70 mph",
    horsepower: "Tri-Motor Independent",
    seats: "Center Driver + Jump",
    cargoCuFt: "82,000 lb GCWR",
    drivetrain: "Tri-Motor Rear Axles",
    peakChargingKw: "1,000V MCS (70% in 30m)",
    badge: "Class 8 EV",
    heroImage: "/images/tesla/semi-studio.jpg",
    description:
      "Built for commercial fleets with under 1.7 kWh per mile efficiency, tri-motor independent rear axle propulsion, and center-cockpit visibility.",
    paints: [
      { name: "Quicksilver Metallic", hex: "#b8bdc4", price: 0, image: "/images/tesla/semi-studio.jpg" },
      { name: "Pearl White", hex: "#f4f5f7", price: 0, image: "/images/tesla/semi-studio.jpg" },
    ],
    wheels: [{ name: '22.5" Heavy Aero Steel', price: 0, rangeDelta: 0 }],
    interiors: [{ name: "Center-Command Fleet Cabin", swatch: "#1a1c20", price: 0 }],
    trims: [
      {
        name: "Semi 300-Mile Range",
        price: 150000,
        range: "300 mi est.",
        zeroToSixty: "20 s @ 82k lb",
        topSpeed: "70 mph",
        drivetrain: "Tri-Motor RWD",
      },
      {
        name: "Semi 500-Mile Range",
        price: 180000,
        range: "500 mi est.",
        zeroToSixty: "20 s @ 82k lb",
        topSpeed: "70 mph",
        drivetrain: "Tri-Motor RWD",
      },
    ],
  },
  {
    id: "roadster",
    name: "Roadster",
    category: "Autonomous & Future",
    tagline: "Next-gen all-electric hypercar · 1.9s 0–60 mph · 250+ mph.",
    price: 200000,
    leaseMonthly: 2450,
    rangeMiles: 620,
    zeroToSixty: "1.9 s",
    topSpeedMph: "250+ mph",
    horsepower: "10,000 Nm Wheel Torque",
    seats: "4 (2+2)",
    cargoCuFt: "Removable Glass Roof",
    drivetrain: "Tri-Motor AWD",
    peakChargingKw: "250+ kW",
    badge: "Founders",
    heroImage: "/images/car-red.jpg",
    description:
      "The fastest production car engineered by Tesla, featuring a 200 kWh battery pack, removable lightweight glass roof that stows in the trunk, and 620 miles of grand touring range.",
    paints: [
      { name: "Ultra Red Metallic", hex: "#9b111e", price: 0, image: "/images/car-red.jpg" },
      { name: "Pearl White Multi-Coat", hex: "#f4f5f7", price: 0, image: "/images/car-white.jpg" },
    ],
    wheels: [{ name: '21" Forged Aero Carbon', price: 0, rangeDelta: 0 }],
    interiors: [{ name: "Alcantara Carbon Sport", swatch: "#1a1c20", price: 0 }],
    trims: [
      {
        name: "Roadster Base Reservation",
        price: 200000,
        range: "620 mi est.",
        zeroToSixty: "1.9 s",
        topSpeed: "250+ mph",
        drivetrain: "Tri-Motor AWD",
      },
      {
        name: "Roadster Founders Series",
        price: 250000,
        range: "620 mi est.",
        zeroToSixty: "1.9 s",
        topSpeed: "250+ mph",
        drivetrain: "Tri-Motor AWD + Thruster Slot",
      },
    ],
  },
  {
    id: "model-aero",
    name: "Model Aero (Flying Car)",
    category: "Autonomous & Future",
    tagline: "Dual-mode electric hypercar with enclosed carbon-ducted VTOL flight.",
    price: 299000,
    leaseMonthly: 3290,
    rangeMiles: 350,
    zeroToSixty: "2.1 s",
    topSpeedMph: "215 mph Air",
    horsepower: "8-Rotor + Dual Drive",
    seats: "2 + Gear",
    cargoCuFt: "18 cu ft",
    drivetrain: "Road AWD + Enclosed VTOL",
    peakChargingKw: "350 kW V4",
    badge: "Pre-Book",
    heroImage: "/images/tesla/cybercab-studio.jpg",
    description:
      "Street-legal autonomous EV engineered with fold-flush enclosed ducted fans, fly-by-wire corridor guidance, and seamless 6.5-second transition from highway driving to vertical takeoff.",
    paints: [
      { name: "Obsidian Aerospace Satin", hex: "#14161a", price: 0, image: "/images/tesla/cybercab-studio.jpg" },
      { name: "Liquid Silver Flight Coat", hex: "#d1d5db", price: 4500, image: "/images/car-white.jpg" },
      { name: "Crimson Vector", hex: "#9b111e", price: 5000, image: "/images/car-red.jpg" },
    ],
    wheels: [
      { name: '20" Retractable Aero Shroud', price: 0, rangeDelta: 0 },
    ],
    interiors: [
      { name: "Carbon Cockpit 2-Seat", swatch: "#1a1c20", price: 0 },
      { name: "Light Aerospace Suede", swatch: "#eaecef", price: 3500 },
    ],
    trims: [
      {
        name: "Aero Dual-Mode Production",
        price: 299000,
        range: "350 mi Road · 110 mi Air",
        zeroToSixty: "2.1 s",
        topSpeed: "215 mph Air",
        drivetrain: "AWD + 8-Rotor VTOL",
      },
      {
        name: "Aero Founders VTOL Edition",
        price: 350000,
        range: "410 mi Road · 145 mi Air",
        zeroToSixty: "1.9 s",
        topSpeed: "235 mph Air",
        drivetrain: "Tri-Motor + Carbon Blades",
      },
    ],
  },
];

export const TESLA_HERO_SLIDES: TeslaHeroSlide[] = [
  {
    id: "hero-model-s",
    eyebrow: "Flagship Performance",
    title: "Model S Plaid",
    subtitle: "1,020 horsepower tri-motor torque vectoring. 0–60 mph in 1.99 seconds with up to 402 miles of EPA range.",
    badge: "Model S",
    image: "/images/car-red.jpg",
    primaryCta: { label: "Configure Model S", href: "/inventory", actionType: "configure", modelId: "model-s" },
    secondaryCta: { label: "Browse Live Inventory", href: "/inventory" },
    specs: [
      { label: "Range (EPA)", value: "402 mi" },
      { label: "0–60 mph", value: "1.99 s" },
      { label: "Peak Power", value: "1,020 hp" },
      { label: "Top Speed", value: "200 mph" },
    ],
  },
  {
    id: "hero-model-3",
    eyebrow: "Reengineered Sedan",
    title: "New Model 3",
    subtitle: "Ultra-aerodynamic Highland profile, acoustic 360-degree glass, and up to 363 miles on a single charge.",
    badge: "Model 3",
    image: "/images/car-white.jpg",
    primaryCta: { label: "Configure Model 3", href: "/inventory", actionType: "configure", modelId: "model-3" },
    secondaryCta: { label: "Free Model 3 Giveaway", href: "/giveaways" },
    specs: [
      { label: "Range (EPA)", value: "363 mi" },
      { label: "0–60 mph", value: "2.9 s" },
      { label: "Supercharging", value: "175 mi / 15m" },
      { label: "Drag Coeff.", value: "0.219 Cd" },
    ],
  },
  {
    id: "hero-cybertruck",
    eyebrow: "Exoskeleton Engineering",
    title: "Cybertruck",
    subtitle: "30X cold-rolled stainless steel body, steer-by-wire handling, 11,000 lb towing, and whole-home backup power.",
    badge: "Cybertruck",
    image: "/images/car-truck.jpg",
    primaryCta: { label: "Configure Cybertruck", href: "/inventory", actionType: "configure", modelId: "cybertruck" },
    secondaryCta: { label: "Claim Weekend Pass", href: "/giveaways" },
    specs: [
      { label: "Towing", value: "11,000 lbs" },
      { label: "0–60 mph", value: "2.6 s" },
      { label: "Powershare", value: "11.5 kW" },
      { label: "Range Est.", value: "325 mi" },
    ],
  },
  {
    id: "hero-energy",
    eyebrow: "Solar Roof + Powerwall 3",
    title: "Generate & Store Clean Energy",
    subtitle: "Architectural solar tiles paired with Powerwall 3 delivering 11.5 kW continuous backup and full blackout protection.",
    badge: "Tesla Energy",
    image: "/images/energy-home.jpg",
    primaryCta: { label: "Explore Energy Systems", href: "/ecosystem" },
    secondaryCta: { label: "Shop Storage Inventory", href: "/inventory" },
    specs: [
      { label: "Usable Storage", value: "13.5 kWh" },
      { label: "Continuous", value: "11.5 kW" },
      { label: "Tile Warranty", value: "25 Years" },
      { label: "Tax Credit", value: "30% Federal" },
    ],
  },
  {
    id: "hero-optimus",
    eyebrow: "Autonomous Humanoid Robotics",
    title: "Tesla Optimus",
    subtitle: "Powered by the same end-to-end neural networks and FSD silicon driving every Tesla vehicle across global factories.",
    badge: "Optimus Gen 2",
    image: "/assets/images/tesla_optimus_robotics.webp",
    primaryCta: { label: "Explore Robotics", href: "/ecosystem#robotics" },
    secondaryCta: { label: "Hardware Inventory", href: "/inventory" },
    specs: [
      { label: "Height / Mass", value: "5'8\" · 125 lb" },
      { label: "Actuators", value: "28 Torque" },
      { label: "Hands", value: "11-DoF Tactile" },
      { label: "Battery Pack", value: "2.3 kWh" },
    ],
  },
  {
    id: "hero-flying-car",
    eyebrow: "Pre-Book & Flight Demo",
    title: "Model Aero · Road & Sky",
    subtitle: "Dual-mode electric hypercar with enclosed VTOL lift rotors. Reserve your priority build slot or schedule a prototype test drive & flight simulator briefing.",
    badge: "Flying Car",
    image: "/images/tesla/cybercab-studio.jpg",
    primaryCta: { label: "Pre-Book Build Slot", href: "/flying-car", actionType: "route" },
    secondaryCta: { label: "Book Test Drive", href: "/flying-car?mode=test_drive" },
    specs: [
      { label: "Road / Air", value: "350 / 110 mi" },
      { label: "VTOL Shift", value: "6.5 s" },
      { label: "Air Cruise", value: "215 mph" },
      { label: "Pre-Book Due", value: "$0 Queue" },
    ],
  },
];

export const TESLA_ENERGY_SYSTEMS: TeslaEnergyProduct[] = [
  {
    id: "solar-roof",
    tag: "Solar Roof",
    name: "Solar Roof V3",
    category: "Solar",
    headlineMetric: "Tempered Solar Glass · 25-Year Warranty",
    priceLabel: "From $35,000",
    priceNumber: 35000,
    image: "/images/solar-roof.jpg",
    summary:
      "Seamless architectural glass solar tiles engineered for three times the hail impact resistance of standard slate roofing.",
    specs: [
      { label: "Warranty", value: "25 Years" },
      { label: "Weather Rating", value: "Class 3 Hail" },
      { label: "Wind Rating", value: "ASTM Class F" },
      { label: "Fire Rating", value: "Class A" },
    ],
    href: "/inventory",
  },
  {
    id: "powerwall-3",
    tag: "Home Storage",
    name: "Powerwall 3",
    category: "Storage",
    headlineMetric: "13.5 kWh Capacity · 11.5 kW Continuous",
    priceLabel: "From $11,500",
    priceNumber: 11500,
    image: "/images/battery.jpg",
    summary:
      "Compact all-in-one solar inverter and LFP home battery capable of starting heavy HVAC loads during extended grid outages.",
    specs: [
      { label: "Usable Energy", value: "13.5 kWh" },
      { label: "On-Grid Power", value: "11.5 kW AC" },
      { label: "Scalability", value: "Up to 4 Units" },
      { label: "Enclosure", value: "NEMA 3R Flood" },
    ],
    href: "/inventory",
  },
  {
    id: "megapack",
    tag: "Utility Grid",
    name: "Megapack 2 XL",
    category: "Storage",
    headlineMetric: "3.9 MWh Per Unit · Bi-Directional Inverter",
    priceLabel: "$1,200,000",
    priceNumber: 1200000,
    image: "/images/energy-home.jpg",
    summary:
      "Turnkey grid-scale battery storage with integrated thermal conditioning, fire mitigation, and real-time Autobidder dispatch.",
    specs: [
      { label: "Unit Capacity", value: "3.9 MWh" },
      { label: "AC Output", value: "1.9 MW (2h)" },
      { label: "Deployment", value: "Turnkey AC" },
      { label: "Control", value: "Autobidder AI" },
    ],
    href: "/ecosystem",
  },
  {
    id: "wall-connector",
    tag: "Home Charging",
    name: "Wall Connector Gen 3",
    category: "Charging",
    headlineMetric: "Up to 44 mi/hr · 48A / 11.5 kW NACS",
    priceLabel: "$475",
    priceNumber: 475,
    image: "/images/charger.jpg",
    summary:
      "Wi-Fi enabled home NACS charging solution with dynamic power sharing, automatic firmware updates, and scheduled off-peak charging.",
    specs: [
      { label: "Max Output", value: "48A / 11.5 kW" },
      { label: "Charge Speed", value: "Up to 44 mi/hr" },
      { label: "Cable Length", value: "24 ft (7.3 m)" },
      { label: "Connector", value: "NACS (SAE J3400)" },
    ],
    href: "/inventory",
  },
];

export interface SolarStateInfo {
  code: string;
  name: string;
  sun: number;
  rate: number;
}

export const US_SOLAR_STATES: SolarStateInfo[] = [
  { code: "CA", name: "California", sun: 1.0, rate: 0.31 },
  { code: "TX", name: "Texas", sun: 0.94, rate: 0.22 },
  { code: "FL", name: "Florida", sun: 0.96, rate: 0.23 },
  { code: "NY", name: "New York", sun: 0.79, rate: 0.26 },
  { code: "AZ", name: "Arizona", sun: 1.05, rate: 0.25 },
  { code: "CO", name: "Colorado", sun: 0.91, rate: 0.21 },
  { code: "WA", name: "Washington", sun: 0.74, rate: 0.19 },
  { code: "IL", name: "Illinois", sun: 0.8, rate: 0.2 },
];

export interface SuperchargerStation {
  name: string;
  area: string;
  distance: number;
  stalls: number;
  available: number;
  kw: number;
  amenities: string[];
  status: "Open" | "Busy";
}

export const TESLA_SUPERCHARGERS: SuperchargerStation[] = [
  {
    name: "Trade Tesla Downtown Hub",
    area: "San Francisco, CA",
    distance: 0.8,
    stalls: 24,
    available: 14,
    kw: 325,
    amenities: ["V4 Stalls", "Lounge", "Wi-Fi"],
    status: "Open",
  },
  {
    name: "Santa Monica Pier Plaza",
    area: "Los Angeles, CA",
    distance: 2.1,
    stalls: 40,
    available: 9,
    kw: 250,
    amenities: ["Café", "Solar Canopy"],
    status: "Busy",
  },
  {
    name: "Giga Texas Campus Supercharger",
    area: "Austin, TX",
    distance: 4.5,
    stalls: 36,
    available: 24,
    kw: 350,
    amenities: ["V4 Magic Dock", "Lounge", "Restrooms"],
    status: "Open",
  },
  {
    name: "Midtown Hudson Yards",
    area: "New York, NY",
    distance: 6.2,
    stalls: 18,
    available: 7,
    kw: 250,
    amenities: ["24/7 Access", "Wi-Fi"],
    status: "Open",
  },
  {
    name: "Brickell Clean Energy Hub",
    area: "Miami, FL",
    distance: 11.4,
    stalls: 28,
    available: 17,
    kw: 325,
    amenities: ["V4 Stalls", "Market"],
    status: "Open",
  },
];
