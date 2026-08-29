
-- 1. Kill metadata-based admin checks (privilege escalation)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.is_admin()
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.is_admin()
$$;

CREATE OR REPLACE FUNCTION public.is_portfolio_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.is_admin()
$$;

-- 2. Users must not be able to escalate their own profile role
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'user' AND NOT public.is_admin() THEN
      NEW.role := 'user';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_change ON public.user_profiles;
CREATE TRIGGER trg_prevent_self_role_change
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_change();

-- keep roles table in sync for existing admin profiles
INSERT INTO public.user_roles (user_id, role)
SELECT up.id, 'admin'::app_role FROM public.user_profiles up WHERE up.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. site_settings: hide operational/payment config from anonymous visitors
DROP POLICY IF EXISTS public_read_site_settings ON public.site_settings;
CREATE POLICY anon_read_public_site_settings ON public.site_settings
  FOR SELECT TO anon
  USING (key NOT IN ('crypto_wallets'));
CREATE POLICY authenticated_read_site_settings ON public.site_settings
  FOR SELECT TO authenticated
  USING (true);

-- 4. resumes bucket: scoped, non-overwritable uploads
DROP POLICY IF EXISTS resumes_public_upload ON storage.objects;
CREATE POLICY resumes_scoped_upload ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND name ~ '^applications/[0-9a-f-]{36}\.(pdf|doc|docx|rtf|txt)$'
  );
