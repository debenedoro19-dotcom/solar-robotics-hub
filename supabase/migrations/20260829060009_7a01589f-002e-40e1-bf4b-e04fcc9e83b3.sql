
REVOKE ALL ON FUNCTION public.prevent_self_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_from_auth() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_portfolio_admin() FROM anon, authenticated;
