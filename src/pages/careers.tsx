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
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState('All');
  const [loc, setLoc] = useState('All');
  const [type, setType] = useState('All');

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('job_postings')
        .select('id,title,slug,department,location,job_type,description,requirements')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setJobs((data as JobPosting[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const departments = useMemo(() => ['All', ...Array.from(new Set(jobs.map((j) => j.department)))], [jobs]);
  const locations = useMemo(() => ['All', ...Array.from(new Set(jobs.map((j) => j.location)))], [jobs]);
  const types = useMemo(() => ['All', ...Array.from(new Set(jobs.map((j) => j.job_type)))], [jobs]);

  const filtered = jobs.filter(
    (j) =>
      (dept === 'All' || j.department === dept) &&
      (loc === 'All' || j.location === loc) &&
      (type === 'All' || j.job_type === type),
  );

  const selectClass =
    'px-3 py-2.5 rounded-lg text-xs font-semibold bg-[#111111] border border-[#2A2A2A] text-white focus:border-primary/50 focus:outline-none';

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Header />
      <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
        <div className="max-w-5xl mx-auto relative">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary mb-3">Careers at Tesla Trade</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Build the future of <span className="gradient-text-primary">clean energy</span>
          </h1>
          <p className="text-sm text-[#999999] max-w-xl leading-relaxed">
            Join the team behind vehicles, energy systems, solar and robotics — and the investment platform
            connecting our community to all of it.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-3 mb-8">
          <select value={dept} onChange={(e) => setDept(e.target.value)} className={selectClass} aria-label="Filter by department">
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={loc} onChange={(e) => setLoc(e.target.value)} className={selectClass} aria-label="Filter by location">
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass} aria-label="Filter by type">
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
          <span className="ml-auto text-xs text-[#555555] self-center">
            {filtered.length} open role{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#111111] border border-[#1A1A1A] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#2A2A2A] rounded-xl">
            <p className="text-sm text-[#666666]">No open roles match your filters right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <Link
                key={job.id}
                href={`/careers/${job.slug}`}
                className="block group rounded-xl bg-[#111111] border border-[#1A1A1A] hover:border-primary/40 p-6 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{job.title}</h2>
                    <p className="text-xs text-[#777777] mt-1">
                      {job.department} · {job.location} · {job.job_type}
                    </p>
                    <p className="text-sm text-[#999999] mt-3 line-clamp-2 max-w-2xl">{job.description}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    Apply
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
