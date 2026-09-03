REVOKE EXECUTE ON FUNCTION public.accrue_investments(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accrue_investments(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accrue_investments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accrue_investments(uuid) TO service_role;