import React, { useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase/client';

export interface JobPosting {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  job_type: string;
  description: string;
  requirements: string;
  experience_level?: 'Entry-Level' | 'Mid-Level' | 'Senior' | 'All Levels';
  compensation?: string;
  is_entry_level?: boolean;
  featured?: boolean;
  training_provided?: boolean;
}

export const DEFAULT_JOBS: JobPosting[] = [
  // ── Entry-Level & Accessible Roles ─────────────────────────────────────────
  {
    id: '4a112f45-8c01-443b-81d0-6bc7185ebc01',
    title: 'Remote AI Data Specialist & Robotics Annotator',
    slug: 'remote-ai-data-specialist',
    department: 'Robotics & AI',
    location: 'Remote (Global)',
    job_type: 'Full-time',
    experience_level: 'Entry-Level',
    compensation: '$48,000 – $68,000 / yr + Equity',
    is_entry_level: true,
    featured: true,
    training_provided: true,
    description:
      'Help teach Tesla Optimus and Full Self-Driving neural networks how to perceive the physical world. In this accessible, remote entry-level role, you will annotate multi-camera video streams, label 3D lidar and sensor trajectories, and evaluate edge-case simulations. Complete training and hardware guidance provided.',
    requirements:
      '• No prior engineering or coding degree required.\n• Strong attention to visual detail and ability to work methodically.\n• Comfortable with modern web interfaces and computer navigation.\n• Reliable high-speed internet connection for remote data tools.\n• Passion for autonomous robotics, AI, and Tesla technology.',
  },
  {
    id: '4a112f45-8c01-443b-81d0-6bc7185ebc02',
    title: 'Solar & Energy Customer Onboarding Specialist',
    slug: 'solar-energy-customer-onboarding',
    department: 'Customer Care',
    location: 'Remote (US)',
    job_type: 'Full-time',
    experience_level: 'Entry-Level',
    compensation: '$52,000 – $72,000 / yr + Bonus',
    is_entry_level: true,
    featured: true,
    training_provided: true,
    description:
      'Be the welcoming voice guiding homeowners and business clients as they transition to clean energy. You will coordinate initial utility surveys, guide customers through the Powerwall 3 and Solar Roof installation timeline, and ensure their mobile app monitoring is set up seamlessly.',
    requirements:
      '• High school diploma or equivalent; zero years of solar experience needed (we train you!).\n• Warm, patient, and articulate written and verbal communication.\n• Empathy and eagerness to solve customer questions.\n• Ability to juggle schedules and communicate updates promptly.',
  },
  {
    id: '4a112f45-8c01-443b-81d0-6bc7185ebc03',
    title: 'Junior Field Solar Technician / Apprentice',
    slug: 'junior-field-solar-technician',
    department: 'Energy Operations',
    location: 'Austin, TX',
    job_type: 'Full-time',
    experience_level: 'Entry-Level',
    compensation: '$55,000 – $75,000 / yr + Tool Allowance',
    is_entry_level: true,
    featured: false,
    training_provided: true,
    description:
      'Launch your career in renewable energy with hands-on apprenticeship. Work side-by-side with master solar installers and electricians staging hardware, running conduit, assembling mounting structures, and commissioning residential Solar Roof systems.',
    requirements:
      '• Must be comfortable working outdoors and at heights with full safety harness gear.\n• Positive attitude, strong team work ethic, and eagerness to learn electrical fundamentals.\n• Valid driver’s license with a clean driving record.\n• All safety gear, specialized tools, and OSHA certification courses covered.',
  },
  {
    id: '4a112f45-8c01-443b-81d0-6bc7185ebc04',
    title: 'Virtual Tesla Sales & Delivery Advisor',
    slug: 'virtual-tesla-sales-advisor',
    department: 'Sales & Operations',
    location: 'Remote',
    job_type: 'Full-time',
    experience_level: 'Entry-Level',
    compensation: '$54,000 – $82,000 / yr (Base + Commission)',
    is_entry_level: true,
    featured: true,
    training_provided: true,
    description:
      'Connect directly with prospective Cybertruck, Model 3/Y, and Megapack investors. Guide them through online configuration, trade-ins, financing options, and trade settlement. You will handle chat, email, and scheduled virtual test consultation calls.',
    requirements:
      '• Energetic communication and genuine excitement for Tesla products.\n• Ability to explain technical electric vehicle and battery benefits in plain language.\n• Basic comfort with digital CRM systems (training provided).\n• Flexible schedule including occasional weekend consultation hours.',
  },
  {
    id: '4a112f45-8c01-443b-81d0-6bc7185ebc05',
    title: 'Logistics & Inventory Operations Associate',
    slug: 'logistics-inventory-associate',
    department: 'Supply Chain',
    location: 'Fremont, CA',
    job_type: 'Full-time',
    experience_level: 'Entry-Level',
    compensation: '$49,000 – $70,000 / yr + Shift Differential',
    is_entry_level: true,
    featured: false,
    training_provided: true,
    description:
      'Support the heartbeat of our Gigafactory supply chain. Receive, audit, and organize shipments of battery cells, charging posts, Powerwalls, and robotic actuator components. Maintain warehouse digital records and stage parts for dispatch.',
    requirements:
      '• Detail-oriented with ability to lift and stage hardware packages (up to 40 lbs).\n• Basic familiarity with inventory tracking or barcode scanners (training provided).\n• Forklift certification is a plus, or willingness to complete paid on-site certification.',
  },
  {
    id: '4a112f45-8c01-443b-81d0-6bc7185ebc06',
    title: 'Junior QA Analyst & Web Platform Tester',
    slug: 'junior-qa-platform-tester',
    department: 'Engineering',
    location: 'Remote',
    job_type: 'Full-time',
    experience_level: 'Entry-Level',
    compensation: '$58,000 – $84,000 / yr + Equity',
    is_entry_level: true,
    featured: false,
    training_provided: true,
    description:
      'Ensure every prospective investor and customer enjoys a flawless digital experience. Test new web releases, verify checkout modals, test crypto payment proof uploads, and document bug reports across mobile and desktop browsers.',
    requirements:
      '• Curiosity, sharp eye for user interface imperfections, and strong problem-solving skills.\n• Familiarity with modern web browsers and mobile devices.\n• Clear written communication when describing steps to reproduce bugs.\n• Background or bootcamp coursework in tech is a plus, but self-taught enthusiasts welcome!',
  },

  // ── Core Engineering & Specialized Roles ──────────────────────────────────
  {
    id: 'c25daa85-d3c9-4abf-a9cc-835da620c21f',
    title: 'Battery Systems Engineer',
    slug: 'battery-systems-engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    job_type: 'Full-time',
    experience_level: 'Senior',
    compensation: '$150,000 – $210,000 / yr + Stock Grants',
    is_entry_level: false,
    featured: true,
    training_provided: false,
    description:
      'Design, test, and validate next-generation Megapack and Powerwall battery systems for utility-scale energy storage deployments across North America and Europe.',
    requirements:
      '• 4+ years in battery systems, cell characterization, BMS architecture, or thermal management.\n• Experience with high-voltage DC architectures and grid-tie standards.\n• BS/MS in Electrical, Mechanical, or Chemical Engineering.',
  },
  {
    id: 'c624b751-dc88-4ac8-a95a-454b284b5c88',
    title: 'Robotics Software Engineer',
    slug: 'robotics-software-engineer',
    department: 'Robotics & AI',
    location: 'Palo Alto, CA',
    job_type: 'Full-time',
    experience_level: 'Senior',
    compensation: '$165,000 – $235,000 / yr + Stock Grants',
    is_entry_level: false,
    featured: true,
    training_provided: false,
    description:
      'Build real-time perception, spatial locomotion, and high-degree-of-freedom manipulation algorithms for the Tesla Optimus humanoid robotics project.',
    requirements:
      '• Expertise in modern C++ and Python in Linux environments.\n• Hands-on experience with kinematics, trajectory optimization, or learned sensorimotor policies.\n• Proven track record shipping software to physical robotic hardware.',
  },
  {
    id: 'ff81c9d3-b246-4a21-96d3-b2ebdf1f65b9',
    title: 'Solar Installation Lead',
    slug: 'solar-installation-lead',
    department: 'Energy Operations',
    location: 'Phoenix, AZ',
    job_type: 'Full-time',
    experience_level: 'Mid-Level',
    compensation: '$85,000 – $115,000 / yr + Completion Bonuses',
    is_entry_level: false,
    featured: false,
    training_provided: false,
    description:
      'Lead residential and commercial Solar Roof installation crews, upholding rigorous quality, safety, and interconnection schedule targets across the Southwest region.',
    requirements:
      '• NABCEP certification strongly preferred.\n• 3+ years in solar installation and roofing with at least 1 year directing job site crews.\n• Comprehensive understanding of NEC codes and rapid shutdown protocols.',
  },
  {
    id: '22895635-755a-477f-8012-b94f4d0c3f4e',
    title: 'Charging Infrastructure Planner',
    slug: 'charging-infrastructure-planner',
    department: 'Infrastructure',
    location: 'Los Angeles, CA',
    job_type: 'Full-time',
    experience_level: 'Mid-Level',
    compensation: '$90,000 – $130,000 / yr',
    is_entry_level: false,
    featured: false,
    training_provided: false,
    description:
      'Plan and coordinate Supercharger V4 site selection, permitting, municipal zoning approvals, and high-voltage grid interconnections with electric utilities.',
    requirements:
      '• Degree or experience in Civil Engineering, Urban Planning, or Utility Interconnection.\n• Experience negotiating site host leases and utility easement contracts.\n• Demonstrated success delivering commercial infrastructure projects on schedule.',
  },
  {
    id: '2137f067-8f26-4a39-8663-8021f8a27175',
    title: 'Investor Relations Associate',
    slug: 'investor-relations-associate',
    department: 'Finance',
    location: 'Remote',
    job_type: 'Full-time',
    experience_level: 'Mid-Level',
    compensation: '$80,000 – $110,000 / yr + Performance Bonus',
    is_entry_level: false,
    featured: false,
    training_provided: false,
    description:
      'Support our global investor community with onboarding, VIP allocations, portfolio questions, and platform education regarding our clean energy yield plans.',
    requirements:
      '• 2+ years in financial services, fintech, investment advisory, or client relations.\n• Polished, professional writing and clear phone presentation skills.\n• Familiarity with modern digital asset rails and traditional wire settlements.',
  },
  {
    id: 'ba4363b4-42ea-4239-8cf1-fbdfe367dbe0',
    title: 'Support Specialist',
    slug: 'support-specialist',
    department: 'Customer Care',
    location: 'Remote',
    job_type: 'Contract / Full-time',
    experience_level: 'Entry-Level',
    compensation: '$46,000 – $62,000 / yr',
    is_entry_level: true,
    featured: false,
    training_provided: true,
    description:
      'Provide rapid, first-class customer assistance for users registering accounts, verifying KYC credentials, initiating wallet deposits, and tracking physical orders.',
    requirements:
      '• Previous customer support or helpdesk experience is helpful but not strictly required.\n• Excellent written English and fast typing speed.\n• Patient demeanor and genuine commitment to helping users succeed.',
  },
];

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>(DEFAULT_JOBS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [loc, setLoc] = useState('All');
  const [level, setLevel] = useState('All');
  const [entryOnly, setEntryOnly] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('job_postings')
          .select('id,title,slug,department,location,job_type,description,requirements')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge database postings with the default rich catalog so newly added entry-level roles persist
          const dbSlugs = new Set(data.map((d: { slug: string }) => d.slug));
          const dbJobs: JobPosting[] = data.map((d: Record<string, string>) => {
            const match = DEFAULT_JOBS.find((def) => def.slug === d.slug);
            return {
              id: d.id,
              title: d.title,
              slug: d.slug,
              department: d.department,
              location: d.location,
              job_type: d.job_type,
              description: d.description,
              requirements: d.requirements,
              experience_level: match?.experience_level ?? 'All Levels',
              compensation: match?.compensation ?? '$65,000 – $95,000 / yr',
              is_entry_level: match?.is_entry_level ?? false,
              featured: match?.featured ?? false,
              training_provided: match?.training_provided ?? false,
            };
          });

          // Add any default entry-level roles that aren't yet in the database
          const extraDefaults = DEFAULT_JOBS.filter((def) => !dbSlugs.has(def.slug));
          setJobs([...dbJobs, ...extraDefaults]);
        }
      } catch {
        // Keep DEFAULT_JOBS
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const departments = useMemo(() => ['All', ...Array.from(new Set(jobs.map((j) => j.department)))], [jobs]);
  const locations = useMemo(() => ['All', ...Array.from(new Set(jobs.map((j) => j.location)))], [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        !search.trim() ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.department.toLowerCase().includes(search.toLowerCase()) ||
        j.description.toLowerCase().includes(search.toLowerCase()) ||
        j.location.toLowerCase().includes(search.toLowerCase());

      const matchDept = dept === 'All' || j.department === dept;
      const matchLoc = loc === 'All' || j.location.includes(loc) || (loc === 'Remote' && j.location.includes('Remote'));
      const matchLevel =
        level === 'All' ||
        (level === 'Entry-Level' && (j.is_entry_level || j.experience_level === 'Entry-Level')) ||
        j.experience_level === level;

      const matchEntrySwitch = !entryOnly || j.is_entry_level;

      return matchSearch && matchDept && matchLoc && matchLevel && matchEntrySwitch;
    });
  }, [jobs, search, dept, loc, level, entryOnly]);

  const entryCount = useMemo(() => jobs.filter((j) => j.is_entry_level).length, [jobs]);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header />

      {/* ── Tesla Hero Section ──────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 border-b border-border/60 overflow-hidden bg-gradient-to-b from-card/40 via-background to-background">
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden="true" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Careers // Accelerating The Transition
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1]">
            Build The Future of <br className="hidden sm:inline" />
            <span className="text-primary">Clean Energy & Robotics</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Join the teams powering vehicles, Solar Roof, Megapack storage, and Optimus humanoid robots.
            Explore open roles across all experience levels — with comprehensive on-the-job training for entry-level positions.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-border/40">
            <div className="p-3">
              <div className="text-2xl font-black text-foreground">12+</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Open Roles</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-primary">{entryCount}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Entry-Level Roles</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-foreground">&lt; 48h</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Review Time</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-foreground">100%</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Equity Eligible</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tesla Culture & Benefits Pillar Cards ────────────────────────────── */}
      <section className="py-14 px-6 border-b border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary mb-2">Why Trade Tesla</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">First-Principles Engineering & True Ownership</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-md mt-2 md:mt-0">
              We eliminate bureaucracy. Whether you are an entry-level annotator or a principal engineer, you work directly on mission-critical technologies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Equity & Stock Grants</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every full-time team member participates in equity options and performance grants tied directly to ecosystem growth.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Paid Apprenticeships</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero previous solar or robotics experience needed for entry roles. We provide 100% paid technical training and certifications.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Remote-First Flexibility</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Work from anywhere in the world across data annotation, customer care, QA, and investor relations with flexible schedules.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Full Healthcare & Perks</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Comprehensive medical, dental, vision coverage, 401(k) matching, and exclusive employee EV and clean energy discounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Roles Search & Directory ─────────────────────────────── */}
      <section id="open-roles" className="max-w-6xl mx-auto px-6 py-14">
        {/* Controls Toolbar */}
        <div className="space-y-4 mb-10">
          {/* Search bar */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role title, department, skills (e.g. 'remote', 'entry', 'robotics', 'solar')…"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none text-sm transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills & Selects */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Entry level toggle pill */}
              <button
                onClick={() => setEntryOnly((prev) => !prev)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  entryOnly
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Entry-Level & Accessible ({entryCount})
              </button>

              {/* Department pill filter */}
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-card border border-border text-foreground focus:border-primary focus:outline-none"
                aria-label="Filter by department"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    Department: {d}
                  </option>
                ))}
              </select>

              {/* Location filter */}
              <select
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-card border border-border text-foreground focus:border-primary focus:outline-none"
                aria-label="Filter by location"
              >
                {locations.map((l) => (
                  <option key={l} value={l}>
                    Location: {l}
                  </option>
                ))}
              </select>

              {/* Experience level filter */}
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-card border border-border text-foreground focus:border-primary focus:outline-none"
                aria-label="Filter by experience level"
              >
                <option value="All">Experience: All Levels</option>
                <option value="Entry-Level">Entry-Level / Accessible</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior / Principal</option>
              </select>
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              Showing <span className="font-bold text-foreground">{filtered.length}</span> role{filtered.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Job Listings Grid */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/40">
            <p className="text-sm text-foreground font-bold mb-1">No roles match your search filters</p>
            <p className="text-xs text-muted-foreground mb-4">Try clearing some filters or submitting an open talent application below.</p>
            <button
              onClick={() => {
                setSearch('');
                setDept('All');
                setLoc('All');
                setLevel('All');
                setEntryOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <Link
                key={job.id}
                href={`/careers/${job.slug}`}
                className="block group rounded-2xl bg-card border border-border/80 hover:border-primary/60 p-6 transition-all duration-300 hover:shadow-lg relative overflow-hidden"
              >
                {/* Left accent border on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {job.is_entry_level && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Entry-Level
                        </span>
                      )}
                      {job.training_provided && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          Full Training Provided
                        </span>
                      )}
                      {job.featured && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                          Featured
                        </span>
                      )}
                      <span className="text-xs font-semibold text-muted-foreground">{job.department}</span>
                    </div>

                    <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {job.title}
                    </h2>

                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-3xl leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>{job.job_type}</span>
                      {job.compensation && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-foreground/90">{job.compensation}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center md:self-center pt-2 md:pt-0">
                    <span className="px-5 py-2.5 rounded-xl bg-muted/60 text-foreground group-hover:bg-primary group-hover:text-primary-foreground text-xs font-bold tracking-wide transition-all inline-flex items-center gap-1.5 shadow-sm">
                      Apply Now
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Open Talent Application Box ────────────────────────────────────── */}
        <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-card to-card/60 border border-border/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-extrabold text-foreground">Don’t see the exact role you’re looking for?</h3>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              We are constantly opening new positions across solar installation, robotics telemetry, customer care, and logistics. Join our talent network and our recruiting team will review your application.
            </p>
          </div>
          <Link
            href="/careers/remote-ai-data-specialist"
            className="shrink-0 px-6 py-3 rounded-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-extrabold tracking-wider uppercase transition-colors"
          >
            Submit General Application
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
