GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_from_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_portfolio_admin() TO authenticated;

DROP POLICY IF EXISTS admin_write_site_settings ON public.site_settings;
CREATE POLICY admin_write_site_settings ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_full_access_deposits ON public.deposit_records;
CREATE POLICY admin_full_access_deposits ON public.deposit_records
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.site_settings (key, value) VALUES
  ('platform', '{"siteName":"Tesla Trade","supportEmail":"support@tradeenergy.app","minDeposit":100,"maxDeposit":1000000,"withdrawalFeePercent":1.5,"maintenanceMode":false,"registrationOpen":true}'::jsonb),
  ('security', '{"twoFactorRequired":false,"sessionTimeoutMinutes":60,"passwordMinLength":8,"adminPasswordLastChanged":null}'::jsonb),
  ('customer_care', '{"phone":"+1 (888) 555-0142","email":"support@tradeenergy.app","whatsapp":"","telegram":"","liveChatEnabled":true,"hours":"24/7"}'::jsonb),
  ('email', '{"senderName":"Tesla Trade","senderEmail":"noreply@tradeenergy.app","welcomeSubject":"Welcome to Tesla Trade","welcomeBody":"Your account is ready. Fund your wallet to start investing.","kycApprovedSubject":"Your KYC has been approved","kycApprovedBody":"Your identity verification is complete. You now have full platform access.","withdrawalSubject":"Your withdrawal has been processed","withdrawalBody":"Your withdrawal request has been processed successfully."}'::jsonb)
ON CONFLICT (key) DO NOTHING;