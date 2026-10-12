ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS resume_token uuid NOT NULL DEFAULT gen_random_uuid();

DROP POLICY IF EXISTS job_applications_insert ON public.job_applications;
CREATE POLICY job_applications_insert ON public.job_applications FOR INSERT TO anon, authenticated WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 5 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

DROP POLICY IF EXISTS newsletter_leads_insert ON public.newsletter_leads;
CREATE POLICY newsletter_leads_insert ON public.newsletter_leads FOR INSERT TO anon, authenticated WITH CHECK (
  char_length(email) BETWEEN 5 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(source) BETWEEN 1 AND 40
);