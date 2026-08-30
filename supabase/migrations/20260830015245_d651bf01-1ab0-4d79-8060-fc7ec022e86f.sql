DROP POLICY IF EXISTS investment_plans_public_read ON public.investment_plans;

CREATE POLICY investment_plans_anon_read
ON public.investment_plans
FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY investment_plans_auth_read
ON public.investment_plans
FOR SELECT
TO authenticated
USING (is_active = true OR public.is_admin());