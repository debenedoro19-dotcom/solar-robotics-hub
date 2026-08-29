CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $function$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
)
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $function$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
)
$function$;

CREATE OR REPLACE FUNCTION public.is_portfolio_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles up
  WHERE up.id = auth.uid() AND up.role = 'admin'
)
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_portfolios_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_withdrawal_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$function$;

REVOKE EXECUTE ON FUNCTION public.is_admin_from_auth() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_portfolio_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin_from_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_portfolio_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;