import React, { useEffect, useRef, useState } from 'react';
import Link from '@/components/SmartLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase/client';
import { sendJobApplicationReceivedEmail } from '@/lib/emailService';
import { uploadApplicationResume } from '@/lib/careers.functions';
import type { JobPosting } from './careers';

const inputClass =
  'w-full px-3 py-2.5 rounded text-sm bg-background border border-border text-foreground placeholder-[#6B7280] focus:border-primary/50 focus:outline-none transition-colors';
const labelClass = 'block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5';

export default function CareerDetailPage({ slug }: { slug: string }) {
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', cover_note: '' });
  const [resume, setResume] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('job_postings')
        .select('id,title,slug,department,location,job_type,description,requirements')
        .eq('slug', slug)
        .eq('status', 'open')
        .maybeSingle();
      setJob((data as JobPosting) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    setStatus('saving');
    setErrorMsg('');
    try {
      // 1) Create the application first — its id owns the resume path.
      const { data: appRow, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          cover_note: form.cover_note || null,
          resume_path: null,
        })
        .select('id, resume_token')
        .single();
      if (error) throw error;

      // 2) Hand the resume to trusted server code, which stores it and links
      //    it to this application.
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
        if (!res.ok) throw new Error(res.error ?? 'Could not attach resume.');
      }
      void sendJobApplicationReceivedEmail().catch(() => {});
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-3xl mx-auto px-6 pt-32">
          <div className="h-8 w-2/3 rounded bg-card animate-pulse mb-4" />
          <div className="h-4 w-1/3 rounded bg-card animate-pulse" />
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-3xl mx-auto px-6 pt-40 text-center">
          <h1 className="text-2xl font-bold mb-2">Role not found</h1>
          <p className="text-sm text-muted-foreground mb-6">This position may have been filled or closed.</p>
          <Link href="/careers" className="px-6 py-2.5 tesla-btn-primary rounded text-sm font-semibold">View all roles</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <Link href="/careers" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mb-6">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          All roles
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{job.title}</h1>
        <p className="text-xs text-muted-foreground mb-8">{job.department} · {job.location} · {job.job_type}</p>

        <div className="rounded bg-card border border-border p-6 mb-10 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-foreground mb-2">About the role</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>
          {job.requirements && (
            <div>
              <h2 className="text-sm font-bold text-foreground mb-2">What we're looking for</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.requirements}</p>
            </div>
          )}
        </div>

        <div className="rounded bg-card border border-border p-6">
          <h2 className="text-lg font-bold mb-1">Apply for this role</h2>
          <p className="text-xs text-muted-foreground mb-6">We review every application and respond within 5 business days.</p>

          {status === 'done' ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00F59B" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <p className="text-sm font-semibold text-foreground">Application received</p>
              <p className="text-xs text-muted-foreground mt-1">We'll be in touch at {form.email}.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full name *</label>
                  <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="Jane Cooper" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+1 555 000 0000" />
              </div>
              <div>
                <label className={labelClass}>Cover note</label>
                <textarea rows={4} value={form.cover_note} onChange={(e) => setForm({ ...form, cover_note: e.target.value })} className={inputClass} placeholder="Tell us why you're a fit…" />
              </div>
              <div>
                <label className={labelClass}>Resume (PDF, max 10MB)</label>
                <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="w-full px-4 py-3 rounded border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left"
                >
                  {resume ? resume.name : 'Click to attach your resume…'}
                </button>
              </div>
              {status === 'error' && <p className="text-xs text-primary">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === 'saving'}
                className="w-full py-3 rounded tesla-btn-primary text-sm font-bold tracking-wide disabled:opacity-60"
              >
                {status === 'saving' ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
