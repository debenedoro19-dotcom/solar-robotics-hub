import React, { useEffect, useMemo, useState } from 'react';
import Link from '@/components/SmartLink';
import { supabase } from '@/lib/supabase/client';
import { sendJobApplicationStageChangedEmail } from '@/lib/emailService';

type Stage = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
const STAGES: Stage[] = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS: Record<Stage, string> = {
  new: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  screening: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  interview: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  offer: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  hired: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  rejected: 'bg-[#12131A] text-[#71717A] border-[#1E2027]',
};

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  job_type: string;
  description: string;
  requirements: string;
  status: string;
}

interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  resume_path: string | null;
  cover_note: string | null;
  stage: Stage;
  notes: string;
  created_at: string;
}

const EMPTY_JOB = { title: '', department: 'Engineering', location: 'Remote', job_type: 'Full-time', description: '', requirements: '' };
const inputClass = 'w-full px-3 py-2.5 rounded-xl text-sm bg-[#050507] border border-[#12131A] text-white placeholder-[#52525B] focus:border-primary/40 focus:outline-none transition-colors';
const labelClass = 'block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1.5';

export default function AdminCareersPage() {
  const [tab, setTab] = useState<'pipeline' | 'jobs'>('pipeline');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [savingJob, setSavingJob] = useState(false);

  async function loadAll() {
    const [{ data: j }, { data: a }] = await Promise.all([
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase.from('job_applications').select('*').order('created_at', { ascending: false }),
    ]);
    setJobs((j as Job[]) ?? []);
    setApps((a as Application[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const jobsById = useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs]);
  const filteredApps = jobFilter === 'all' ? apps : apps.filter((a) => a.job_id === jobFilter);
  const byStage = useMemo(() => {
    const map: Record<Stage, Application[]> = { new: [], screening: [], interview: [], offer: [], hired: [], rejected: [] };
    filteredApps.forEach((a) => map[a.stage]?.push(a));
    return map;
  }, [filteredApps]);

  async function setStage(app: Application, stage: Stage) {
    setApps((prev) => prev.map((x) => (x.id === app.id ? { ...x, stage } : x)));
    await supabase.from('job_applications').update({ stage }).eq('id', app.id);
  }

  async function saveNotes(app: Application) {
    await supabase.from('job_applications').update({ notes: notesDraft }).eq('id', app.id);
    setApps((prev) => prev.map((x) => (x.id === app.id ? { ...x, notes: notesDraft } : x)));
  }

  async function openResume(app: Application) {
    setResumeUrl(null);
    if (!app.resume_path) return;
    const { data } = await supabase.storage.from('resumes').createSignedUrl(app.resume_path, 300);
    if (data?.signedUrl) {
      setResumeUrl(data.signedUrl);
      window.open(data.signedUrl, '_blank', 'noopener');
    }
  }

  async function saveJob(e: React.FormEvent) {
    e.preventDefault();
    setSavingJob(true);
    const slug = (editingJob?.slug ?? jobForm.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (editingJob) {
      await supabase.from('job_postings').update({ ...jobForm }).eq('id', editingJob.id);
    } else {
      await supabase.from('job_postings').insert({ ...jobForm, slug });
    }
    setSavingJob(false);
    setEditingJob(null);
    setJobForm(EMPTY_JOB);
    await loadAll();
  }

  async function toggleJobStatus(job: Job) {
    const status = job.status === 'open' ? 'closed' : 'open';
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status } : j)));
    await supabase.from('job_postings').update({ status }).eq('id', job.id);
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="border-b border-[#12131A] bg-[#050507]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-[#71717A] hover:text-white transition-colors flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Admin
            </Link>
            <span className="text-[#1E2027]">|</span>
            <span className="text-xs text-primary tracking-widest uppercase font-semibold">Careers Pipeline</span>
          </div>
          <div className="flex gap-2">
            {(['pipeline', 'jobs'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-[10px] font-bold rounded-xl tracking-widest uppercase transition-all ${
                  tab === t ? 'bg-primary/20 border border-primary/40 text-primary' : 'bg-[#0D0E12] border border-[#12131A] text-[#71717A] hover:text-white'
                }`}
              >
                {t === 'pipeline' ? 'Applicants' : 'Job Postings'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-[#0D0E12] animate-pulse" />)}</div>
        ) : tab === 'pipeline' ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <label className={labelClass + ' mb-0'}>Role</label>
              <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs bg-[#0D0E12] border border-[#1E2027] text-white focus:outline-none">
                <option value="all">All roles ({apps.length})</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} ({apps.filter((a) => a.job_id === j.id).length})</option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-4">
              {STAGES.map((stage) => (
                <div key={stage} className="rounded-xl bg-[#050507] border border-[#12131A] p-3 min-h-[200px]">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-3 ${STAGE_COLORS[stage]}`}>
                    {stage} · {byStage[stage].length}
                  </div>
                  <div className="space-y-2">
                    {byStage[stage].map((app) => (
                      <div key={app.id} className="rounded-xl bg-[#0D0E12] border border-[#12131A] p-3">
                        <button
                          className="w-full text-left"
                          onClick={() => {
                            setExpanded(expanded === app.id ? null : app.id);
                            setNotesDraft(app.notes);
                          }}
                        >
                          <p className="text-xs font-bold text-white">{app.full_name}</p>
                          <p className="text-[10px] text-[#71717A] truncate">{jobsById[app.job_id]?.title ?? '—'}</p>
                          <p className="text-[10px] text-[#6B7280]">{new Date(app.created_at).toLocaleDateString()}</p>
                        </button>
                        {expanded === app.id && (
                          <div className="mt-3 pt-3 border-t border-[#12131A] space-y-2">
                            <p className="text-[10px] text-[#A1A1AA]">{app.email}{app.phone ? ` · ${app.phone}` : ''}</p>
                            {app.cover_note && <p className="text-[10px] text-[#71717A] leading-relaxed line-clamp-4">{app.cover_note}</p>}
                            {app.resume_path && (
                              <button onClick={() => openResume(app)} className="text-[10px] font-semibold text-primary hover:underline">
                                View resume
                              </button>
                            )}
                            <select
                              value={app.stage}
                              onChange={(e) => setStage(app, e.target.value as Stage)}
                              className="w-full px-2 py-1.5 rounded-xl text-[10px] bg-[#050507] border border-[#1E2027] text-white focus:outline-none"
                            >
                              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <textarea
                              rows={2}
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              placeholder="Internal notes…"
                              className="w-full px-2 py-1.5 rounded-xl text-[10px] bg-[#050507] border border-[#1E2027] text-white placeholder-[#52525B] focus:outline-none"
                            />
                            <button onClick={() => saveNotes(app)} className="w-full py-1.5 rounded-xl tesla-btn-primary text-[10px] font-bold">
                              Save notes
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white mb-2">Postings ({jobs.length})</h2>
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl bg-[#0D0E12] border border-[#12131A] p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">{job.title}</p>
                    <p className="text-[10px] text-[#71717A]">{job.department} · {job.location} · {job.job_type}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${job.status === 'open' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-[#71717A] border-[#1E2027]'}`}>
                      {job.status}
                    </span>
                    <button
                      onClick={() => { setEditingJob(job); setJobForm({ title: job.title, department: job.department, location: job.location, job_type: job.job_type, description: job.description, requirements: job.requirements }); }}
                      className="px-3 py-1.5 rounded-xl border border-[#1E2027] text-[10px] font-semibold text-[#A1A1AA] hover:text-white"
                    >
                      Edit
                    </button>
                    <button onClick={() => toggleJobStatus(job)} className="px-3 py-1.5 rounded-xl border border-[#1E2027] text-[10px] font-semibold text-[#A1A1AA] hover:text-white">
                      {job.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={saveJob} className="rounded-xl bg-[#0D0E12] border border-[#12131A] p-6 space-y-4 h-fit">
              <h2 className="text-sm font-bold text-white">{editingJob ? `Edit: ${editingJob.title}` : 'New job posting'}</h2>
              <div>
                <label className={labelClass}>Title *</label>
                <input required value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Department</label>
                  <input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={jobForm.job_type} onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })} className={inputClass}>
                    <option>Full-time</option><option>Part-time</option><option>Contract</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={4} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Requirements</label>
                <textarea rows={3} value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} className={inputClass} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingJob} className="flex-1 py-2.5 rounded-xl tesla-btn-primary text-xs font-bold disabled:opacity-60">
                  {savingJob ? 'Saving…' : editingJob ? 'Save changes' : 'Publish posting'}
                </button>
                {editingJob && (
                  <button type="button" onClick={() => { setEditingJob(null); setJobForm(EMPTY_JOB); }} className="px-4 py-2.5 rounded-xl border border-[#1E2027] text-xs font-semibold text-[#A1A1AA]">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
