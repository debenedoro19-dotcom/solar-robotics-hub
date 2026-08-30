-- 1) site_settings: hide crypto_wallets from ordinary authenticated users
DROP POLICY IF EXISTS authenticated_read_site_settings ON public.site_settings;
CREATE POLICY authenticated_read_site_settings ON public.site_settings
  FOR SELECT TO authenticated
  USING (key <> 'crypto_wallets' OR public.is_admin());

-- 2) resumes: explicit admin-only UPDATE policy (no overwrite path for applicants)
DROP POLICY IF EXISTS resumes_admin_update ON storage.objects;
CREATE POLICY resumes_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND public.is_admin())
  WITH CHECK (bucket_id = 'resumes' AND public.is_admin());

-- 3) resumes upload: keep unguessable uuid paths and block writing over an existing object
DROP POLICY IF EXISTS resumes_scoped_upload ON storage.objects;
CREATE POLICY resumes_scoped_upload ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND name ~ '^applications/[0-9a-f-]{36}\.(pdf|doc|docx|rtf|txt)$'
    AND NOT EXISTS (
      SELECT 1 FROM storage.objects o
      WHERE o.bucket_id = 'resumes' AND o.name = storage.objects.name
    )
  );

-- 4) drop unused SECURITY DEFINER wrapper callable by signed-in users
DROP FUNCTION IF EXISTS public.is_admin_user();