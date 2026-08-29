REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_user_portfolios_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_withdrawal_requests_updated_at() FROM anon, authenticated, public;