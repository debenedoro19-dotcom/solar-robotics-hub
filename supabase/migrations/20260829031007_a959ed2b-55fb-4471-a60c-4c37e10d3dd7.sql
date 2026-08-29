-- ============ ROLES ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
     OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
$$;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS user_roles_admin_manage ON public.user_roles;
CREATE POLICY user_roles_admin_manage ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ SUPPORT TICKETS ============
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ticket_number text NOT NULL DEFAULT ('TT-' || upper(substr(md5(random()::text), 1, 8))),
  subject text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  ticket_status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  admin_reply text,
  admin_notes text,
  user_email text NOT NULL DEFAULT '',
  user_name text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_own ON public.support_tickets;
CREATE POLICY support_tickets_own ON public.support_tickets
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS support_tickets_admin ON public.support_tickets;
CREATE POLICY support_tickets_admin ON public.support_tickets
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVESTMENT PLANS ============
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Solar Megapack',
  description text NOT NULL DEFAULT '',
  daily_roi numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  min_deposit numeric NOT NULL DEFAULT 0,
  max_deposit numeric NOT NULL DEFAULT 1000000,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.investment_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_plans TO authenticated;
GRANT ALL ON public.investment_plans TO service_role;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS investment_plans_public_read ON public.investment_plans;
CREATE POLICY investment_plans_public_read ON public.investment_plans
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS investment_plans_admin ON public.investment_plans;
CREATE POLICY investment_plans_admin ON public.investment_plans
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_investment_plans_updated_at BEFORE UPDATE ON public.investment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER INVESTMENTS ============
CREATE TABLE IF NOT EXISTS public.user_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.investment_plans(id) ON DELETE SET NULL,
  plan_name text NOT NULL DEFAULT '',
  plan_category text NOT NULL DEFAULT '',
  principal numeric NOT NULL DEFAULT 0,
  daily_roi numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  yield_earned numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  matures_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_investments TO authenticated;
GRANT ALL ON public.user_investments TO service_role;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_investments_own ON public.user_investments;
CREATE POLICY user_investments_own ON public.user_investments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_investments_admin ON public.user_investments;
CREATE POLICY user_investments_admin ON public.user_investments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_user_investments_updated_at BEFORE UPDATE ON public.user_investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ WALLET COLUMNS ============
ALTER TABLE public.user_balance
  ADD COLUMN IF NOT EXISTS total_invested numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_profit numeric NOT NULL DEFAULT 0;

-- ============ ATOMIC PLAN PURCHASE ============
CREATE OR REPLACE FUNCTION public.purchase_investment_plan(_plan_id uuid, _amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _plan public.investment_plans%ROWTYPE;
  _bal public.user_balance%ROWTYPE;
  _inv_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid amount');
  END IF;

  SELECT * INTO _plan FROM public.investment_plans WHERE id = _plan_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Plan not available');
  END IF;

  IF _amount < _plan.min_deposit OR _amount > _plan.max_deposit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount outside plan limits');
  END IF;

  INSERT INTO public.user_balance (user_id) VALUES (_uid)
    ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _bal FROM public.user_balance WHERE user_id = _uid FOR UPDATE;

  IF _bal.available_balance < _amount THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Insufficient wallet balance',
                              'balance', _bal.available_balance, 'required', _amount);
  END IF;

  UPDATE public.user_balance
    SET available_balance = available_balance - _amount,
        total_invested = total_invested + _amount,
        updated_at = now()
    WHERE user_id = _uid;

  INSERT INTO public.user_investments
    (user_id, plan_id, plan_name, plan_category, principal, daily_roi, duration_days, matures_at)
  VALUES
    (_uid, _plan.id, _plan.name, _plan.category, _amount, _plan.daily_roi, _plan.duration_days,
     now() + (_plan.duration_days || ' days')::interval)
  RETURNING id INTO _inv_id;

  INSERT INTO public.balance_transactions (user_id, type, amount, status, description)
  VALUES (_uid, 'investment', -_amount, 'completed', 'Plan purchase: ' || _plan.name);

  RETURN jsonb_build_object('ok', true, 'investment_id', _inv_id);
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_investment_plan(uuid, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.purchase_investment_plan(uuid, numeric) TO authenticated;