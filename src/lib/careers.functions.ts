import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'rtf', 'txt'] as const
const MAX_BYTES = 10 * 1024 * 1024

const schema = z.object({
  applicationId: z.string().uuid(),
  ext: z.enum(ALLOWED_EXT),
  contentType: z.string().max(120).optional(),
  // base64-encoded file contents
  data: z.string().min(1).max(Math.ceil((MAX_BYTES * 4) / 3) + 1024),
})

/**
 * Attaches a resume to a pending job application. Uploading and writing the
 * path both happen here with trusted server credentials, so the browser never
 * needs write access to the resumes bucket.
 */
export const uploadApplicationResume = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const bytes = Buffer.from(data.data, 'base64')
    if (bytes.length === 0 || bytes.length > MAX_BYTES) {
      return { ok: false as const, error: 'Resume must be under 10MB.' }
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: app, error: appErr } = await supabaseAdmin
      .from('job_applications')
      .select('id, resume_path')
      .eq('id', data.applicationId)
      .maybeSingle()

    if (appErr) return { ok: false as const, error: 'Could not verify the application.' }
    if (!app) return { ok: false as const, error: 'Application not found.' }
    if (app.resume_path) return { ok: false as const, error: 'A resume is already attached.' }

    const path = `applications/${data.applicationId}.${data.ext}`
    const { error: upErr } = await supabaseAdmin.storage
      .from('resumes')
      .upload(path, bytes, { upsert: false, contentType: data.contentType || 'application/octet-stream' })
    if (upErr) return { ok: false as const, error: 'Could not upload the resume.' }

    const { error: updErr } = await supabaseAdmin
      .from('job_applications')
      .update({ resume_path: path, updated_at: new Date().toISOString() })
      .eq('id', data.applicationId)
      .is('resume_path', null)
    if (updErr) return { ok: false as const, error: 'Could not save the resume.' }

    return { ok: true as const }
  })
