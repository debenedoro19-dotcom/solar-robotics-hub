CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL DEFAULT 'Engineering',
  location TEXT NOT NULL DEFAULT 'Remote',
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL ON public.job_postings TO service_role;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_postings_public_read_open" ON public.job_postings FOR SELECT TO anon, authenticated USING (status = 'open' OR public.is_admin());
CREATE POLICY "job_postings_admin_all" ON public.job_postings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_job_postings_updated_at BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_path TEXT,
  cover_note TEXT,
  stage TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT INSERT ON public.job_applications TO anon;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_applications_insert" ON public.job_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "job_applications_admin_all" ON public.job_applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.newsletter_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'popup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_leads TO authenticated;
GRANT ALL ON public.newsletter_leads TO service_role;
ALTER TABLE public.newsletter_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter_leads_insert" ON public.newsletter_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "newsletter_leads_admin_read" ON public.newsletter_leads FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "newsletter_leads_admin_update" ON public.newsletter_leads FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "newsletter_leads_admin_delete" ON public.newsletter_leads FOR DELETE TO authenticated USING (public.is_admin());

INSERT INTO public.site_settings (key, value) VALUES
  ('popup_welcome', '{"enabled": true, "title": "Welcome to Tesla Trade", "body": "Explore vehicles, energy, solar and robotics — plus investor packages with daily yield.", "ctaLabel": "Explore Inventory", "ctaHref": "/#inventory", "delaySeconds": 8, "cooldownHours": 24}'),
  ('popup_lead', '{"enabled": true, "title": "Get Tesla Trade Updates", "body": "Join our list for new inventory, plan launches and giveaways.", "ctaLabel": "Subscribe", "exitIntent": true, "delaySeconds": 30, "cooldownHours": 72}'),
  ('popup_cookie', '{"enabled": true, "body": "We use cookies to improve your experience and analyze traffic."}'),
  ('withdrawal_ticker', '{"enabled": true, "intervalSeconds": 22, "minAmount": 1200, "maxAmount": 48000}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.job_postings (title, slug, department, location, job_type, description, requirements) VALUES
  ('Battery Systems Engineer', 'battery-systems-engineer', 'Engineering', 'Austin, TX', 'Full-time', 'Design and validate next-generation Megapack battery systems for utility-scale energy storage deployments.', '5+ years in battery systems or power electronics. Experience with cell characterization, BMS, and thermal design.'),
  ('Solar Installation Lead', 'solar-installation-lead', 'Energy Operations', 'Phoenix, AZ', 'Full-time', 'Lead residential and commercial Solar Roof installation crews, ensuring quality, safety, and schedule targets.', 'NABCEP certification preferred. 4+ years solar installation, 2+ years leading crews.'),
  ('Robotics Software Engineer', 'robotics-software-engineer', 'Robotics', 'Palo Alto, CA', 'Full-time', 'Build perception and motion-planning software for the Optimus humanoid robot program.', 'Strong C++/Python. Experience with ROS, real-time control, or learned manipulation.'),
  ('Investor Relations Associate', 'investor-relations-associate', 'Finance', 'Remote', 'Full-time', 'Support our investor community with onboarding, portfolio questions, and platform education.', '2+ years in fintech, brokerage, or client service. Excellent written communication.'),
  ('Charging Infrastructure Planner', 'charging-infrastructure-planner', 'Infrastructure', 'Los Angeles, CA', 'Full-time', 'Plan and coordinate Supercharger site selection, permitting, and grid interconnection across the Southwest.', 'Experience with utility interconnection, permitting, or civil site development.'),
  ('Support Specialist', 'support-specialist', 'Customer Care', 'Remote', 'Contract', 'Provide front-line support to Tesla Trade members on deposits, withdrawals, KYC, and inventory inquiries.', '1+ year customer support in fintech or e-commerce. Crypto familiarity a plus.')
ON CONFLICT (slug) DO NOTHING;

CREATE POLICY "resumes_public_upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "resumes_admin_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND public.is_admin());
CREATE POLICY "resumes_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes' AND public.is_admin());