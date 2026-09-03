ALTER POLICY "anon_read_public_site_settings"
  ON public.site_settings
  USING (key <> 'security');

ALTER POLICY "authenticated_read_site_settings"
  ON public.site_settings
  USING ((key <> 'security') OR public.is_admin());