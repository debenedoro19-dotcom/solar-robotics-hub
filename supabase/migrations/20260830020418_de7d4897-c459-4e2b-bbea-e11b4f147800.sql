DROP POLICY IF EXISTS anon_read_public_site_settings ON public.site_settings;
DROP POLICY IF EXISTS authenticated_read_site_settings ON public.site_settings;

CREATE POLICY anon_read_public_site_settings ON public.site_settings
  FOR SELECT TO anon
  USING (key <> 'security_settings');

CREATE POLICY authenticated_read_site_settings ON public.site_settings
  FOR SELECT TO authenticated
  USING (key <> 'security_settings' OR is_admin());