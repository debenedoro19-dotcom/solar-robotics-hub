INSERT INTO public.user_roles (user_id, role)
SELECT up.id, 'admin'::public.app_role
FROM public.user_profiles up
WHERE up.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::public.app_role
FROM auth.users au
WHERE au.raw_app_meta_data->>'role' = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$function$;

CREATE OR REPLACE FUNCTION public.touch_user_payout_methods()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS users_insert_own_deposits ON public.deposit_records;
CREATE POLICY users_insert_own_deposits ON public.deposit_records
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND deposit_status = 'pending'
  AND confirmed_at IS NULL
);

CREATE OR REPLACE FUNCTION public.protect_deposit_status_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.deposit_status := OLD.deposit_status;
  NEW.confirmed_at := OLD.confirmed_at;
  NEW.amount := OLD.amount;
  NEW.notes := OLD.notes;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_deposit_status_fields ON public.deposit_records;
CREATE TRIGGER trg_protect_deposit_status_fields
BEFORE UPDATE ON public.deposit_records
FOR EACH ROW EXECUTE FUNCTION public.protect_deposit_status_fields();