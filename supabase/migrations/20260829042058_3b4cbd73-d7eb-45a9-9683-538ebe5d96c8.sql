REVOKE EXECUTE ON FUNCTION public.enter_giveaway(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.enter_giveaway(uuid) TO authenticated;