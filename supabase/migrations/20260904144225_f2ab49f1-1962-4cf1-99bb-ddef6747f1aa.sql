-- 1) Remove anon-callable SECURITY DEFINER helpers; resume uploads move server-side.
DROP POLICY IF EXISTS resumes_scoped_upload ON storage.objects;
DROP FUNCTION IF EXISTS public.resume_upload_slot_open(text);
DROP FUNCTION IF EXISTS public.attach_resume_path(uuid, text);

-- 2) site_settings: allow-list of public keys instead of excluding a single literal.
DROP POLICY IF EXISTS anon_read_public_site_settings ON public.site_settings;
DROP POLICY IF EXISTS authenticated_read_site_settings ON public.site_settings;

CREATE POLICY anon_read_public_site_settings
ON public.site_settings FOR SELECT
TO anon
USING (key IN ('crypto_wallets','platform','customer_care','giveaways','popup_cookie','popup_lead','popup_welcome','withdrawal_ticker'));

CREATE POLICY authenticated_read_site_settings
ON public.site_settings FOR SELECT
TO authenticated
USING (
  key IN ('crypto_wallets','platform','customer_care','giveaways','popup_cookie','popup_lead','popup_welcome','withdrawal_ticker')
  OR public.is_admin()
);