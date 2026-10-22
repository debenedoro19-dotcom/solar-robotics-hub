import React, { useEffect, useRef, useState } from 'react';
import Link from '@/components/SmartLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase/client';
import { sendJobApplicationReceivedEmail } from '@/lib/emailService';
import { uploadApplicationResume } from '@/lib/careers.functions';
import { DEFAULT_JOBS, type JobPosting } from './careers';

// Fallback UUID that exists in public.job_postings table
const FALLBACK_DB_JOB_ID = 'ba4363b4-42ea-4239-8cf1-fbdfe367dbe0';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all shadow-sm';
const labelClass = 'block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5';

export default function CareerDetailPage({ slug }: { slug: string }) {
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin: '',
    experience_years: '0-1 years (Entry-Level)',
    cover_note: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('job_postings')
          .select('id,title,slug,department,location,job_type,description,requirements')
          .eq('slug', slug)
          .eq('status', 'open')
          .maybeSingle();

        if (!error && data) {
          const match = DEFAULT_JOBS.find((def) => def.slug === slug);
          setJob({
            id: data.id,
            title: data.title,
            slug: data.slug,
            department: data.department,
            location: data.location,
            job_type: data.job_type,
            description: data.description,
            requirements: data.requirements,
            experience_level: match?.experience_level ?? 'All Levels',
            compensation: match?.compensation ?? '$65,000 – $95,000 / yr',
            is_entry_level: match?.is_entry_level ?? false,
            training_provided: match?.training_provided ?? false,
          });
        } else {
          // Check local default catalog
          const localMatch = DEFAULT_JOBS.find((def) => def.slug === slug);
          setJob(localMatch ?? null);
        }
      } catch {
        const localMatch = DEFAULT_JOBS.find((def) => def.slug === slug);
        setJob(localMatch ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setResume(files[0]);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    setStatus('saving');
    setErrorMsg('');

    try {
      // Validate UUID format for job_id foreign key constraint in Postgres
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.id);
      const effectiveJobId = isUuid ? job.id : FALLBACK_DB_JOB_ID;

      const fullCoverNote = [
        `Applied Role: ${job.title} (${job.slug})`,
        `Experience: ${form.experience_years}`,
        form.linkedin ? `Profile: ${form.linkedin}` : null,
        form.cover_note ? `Note:\n${form.cover_note}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      // 1) Insert application row
      const { data: appRow, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: effectiveJobId,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          cover_note: fullCoverNote,
          resume_path: null,
          stage: 'new',
          notes: `Applied for: ${job.title} via web portal. Experience: ${form.experience_years}`,
        })
        .select('id, resume_token')
        .single();

      if (error) throw error;
      if (appRow?.id) setApplicationId(appRow.id);

      // 2) Upload resume if attached
      if (resume && appRow?.id) {
        const rawExt = (resume.name.split('.').pop() ?? 'pdf').toLowerCase();
        const ext = (['pdf', 'doc', 'docx', 'rtf', 'txt'] as const).includes(rawExt as 'pdf')
          ? (rawExt as 'pdf')
          : ('pdf' as const);

        if (resume.size > 10 * 1024 * 1024) throw new Error('Resume must be under 10MB.');
        const buffer = await resume.arrayBuffer();
        let binary = '';
        const view = new Uint8Array(buffer);
        for (let i = 0; i < view.length; i += 0x8000) {
          binary += String.fromCharCode(...view.subarray(i, i + 0x8000));
        }

        const res = await uploadApplicationResume({
          data: {
            applicationId: appRow.id,
            token: appRow.resume_token,
            ext,
            contentType: resume.type || undefined,
            data: btoa(binary),
          },
        });

        if (!res.ok) {
          console.warn('Resume upload issue:', res.error);
        }
      }

      // 3) Send confirmation email
      void sendJobApplicationReceivedEmail().catch(() => {});
      setStatus('done');
    } catch (err) {
      console.error('Application submission error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-4xl mx-auto px-6 pt-36">
          <div className="h-6 w-32 rounded-lg bg-card animate-pulse mb-4" />
          <div className="h-10 w-2/3 rounded-xl bg-card animate-pulse mb-6" />
          <div className="h-40 rounded-2xl bg-card animate-pulse" />
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-3xl mx-auto px-6 pt-40 pb-20 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h1 className="text-3xl font-extrabold mb-3">Role Not Found</h1>
          <p className="text-sm text-muted-foreground mb-8">
            This job listing may have been filled or moved. Explore our other open positions.
          </p>
          <Link href="/careers" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2">
            View All Open Roles
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header />

      {/* ── Breadcrumb & Top Bar ──────────────────────────────────────────────── */}
      <section className="pt-28 pb-10 px-6 border-b border-border/60 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{job.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {job.is_entry_level && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Entry-Level Friendly
              </span>
            )}
            {job.training_provided && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Full Paid Training Provided
              </span>
            )}
            <span className="text-xs font-semibold text-muted-foreground">{job.department}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <span className="font-bold text-foreground">{job.compensation}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Layout: 2 Columns ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Job Description & Details */}
          <div className="lg:col-span-7 space-y-8">
            {/* Quick summary banner for entry level */}
            {job.is_entry_level && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-foreground/90 leading-relaxed">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Accessible Role — No Prior Industry Degree Required
                </div>
                We evaluate candidates based on drive, attention to detail, and alignment with our mission. Comprehensive training and mentorship are provided from day one.
              </div>
            )}

            {/* About The Role */}
            <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-foreground tracking-tight border-b border-border/60 pb-3">
                About The Role
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line space-y-3">
                {job.description}
              </div>
            </div>

            {/* What We Are Looking For */}
            {job.requirements && (
              <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-foreground tracking-tight border-b border-border/60 pb-3">
                  Qualifications & What We Value
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line space-y-2">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* What We Offer / Benefits */}
            <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-foreground tracking-tight border-b border-border/60 pb-3">
                What We Offer
              </h2>
              <ul className="text-sm text-muted-foreground space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>Comprehensive Healthcare:</strong> Medical, dental, and vision with 100% premium coverage for employees.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>Equity & Stock Grants:</strong> Full eligibility in employee stock options and long-term ecosystem incentives.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>Paid Training & Growth:</strong> Direct mentorship from leads with clear promotional tracks every 6 months.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>Clean Tech Discount:</strong> Special employee purchase allocations on Tesla vehicles, Powerwalls, and Solar Roof.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Application Form */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="rounded-3xl bg-card border border-border/90 p-7 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

              <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-1">
                Apply For This Position
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                Applications are reviewed directly by our hiring team. Typical response within 48 business hours.
              </p>

              {status === 'done' ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">Application Received</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                      Thank you for applying for <strong>{job.title}</strong>. A confirmation has been sent to <strong>{form.email}</strong>.
                    </p>
                    {applicationId && (
                      <p className="text-[10px] font-mono text-muted-foreground/70 mt-3">
                        Reference ID: {applicationId.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/careers"
                    className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
                  >
                    Browse Other Roles
                  </Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                      required
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className={inputClass}
                      placeholder="Alex Morgan"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputClass}
                      placeholder="alex.morgan@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className={inputClass}
                        placeholder="+1 (555) 012-3456"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Experience Level</label>
                      <select
                        value={form.experience_years}
                        onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                        className={inputClass}
                      >
                        <option value="0-1 years (Entry-Level)">0 – 1 years (Entry-Level)</option>
                        <option value="1-3 years">1 – 3 years</option>
                        <option value="3-5 years">3 – 5 years</option>
                        <option value="5+ years">5+ years</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>LinkedIn / Portfolio / GitHub</label>
                    <input
                      type="url"
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      className={inputClass}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Cover Note / Tell Us About Yourself</label>
                    <textarea
                      rows={3}
                      value={form.cover_note}
                      onChange={(e) => setForm({ ...form, cover_note: e.target.value })}
                      className={inputClass}
                      placeholder="What excites you about this role and joining Trade Tesla?"
                    />
                  </div>

                  {/* Resume Upload Drag & Drop */}
                  <div>
                    <label className={labelClass}>Resume / CV (PDF, DOCX · Max 10MB)</label>
                    <input
                      ref={fileInput}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                    />
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInput.current?.click()}
                      className={`p-4 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-primary bg-primary/10'
                          : resume
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }`}
                    >
                      {resume ? (
                        <div className="flex items-center justify-between text-xs text-foreground px-2">
                          <span className="truncate max-w-[200px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {resume.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResume(null);
                            }}
                            className="text-muted-foreground hover:text-primary text-[11px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <svg className="w-5 h-5 mx-auto text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <div className="text-xs font-semibold text-foreground">Click to upload or drag & drop</div>
                          <div className="text-[10px] text-muted-foreground">PDF or Word documents up to 10MB</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {status === 'error' && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold tracking-wider uppercase hover:opacity-90 transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                  >
                    {status === 'saving' ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Submitting Application…
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    By submitting, you agree to our Terms of Employment and Privacy Policy.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
