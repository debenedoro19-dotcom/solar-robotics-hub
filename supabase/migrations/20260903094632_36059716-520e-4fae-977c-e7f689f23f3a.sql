ALTER TABLE public.user_investments
  ADD COLUMN IF NOT EXISTS last_accrued_at timestamp with time zone NOT NULL DEFAULT now();

UPDATE public.user_investments SET last_accrued_at = started_at WHERE last_accrued_at > started_at AND yield_earned = 0;

CREATE OR REPLACE FUNCTION public.accrue_investments(_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := COALESCE(_user_id, auth.uid());
  _inv public.user_investments%ROWTYPE;
  _elapsed_days numeric;
  _max_days numeric;
  _accrue_to timestamptz;
  _new_yield numeric;
  _accrued_total numeric := 0;
  _matured_total numeric := 0;
  _matured_count integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;
  IF _user_id IS NOT NULL AND _user_id <> auth.uid() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;

  FOR _inv IN
    SELECT * FROM public.user_investments
    WHERE user_id = _uid AND status = 'active'
    FOR UPDATE
  LOOP
    -- never accrue past maturity
    _accrue_to := LEAST(now(), _inv.matures_at);
    _elapsed_days := GREATEST(0, EXTRACT(EPOCH FROM (_accrue_to - _inv.last_accrued_at)) / 86400.0);
    _max_days := _inv.duration_days;

    _new_yield := ROUND(_inv.principal * (_inv.daily_roi / 100.0) * _elapsed_days, 2);

    -- cap total yield at the full-term value
    IF _inv.yield_earned + _new_yield > ROUND(_inv.principal * (_inv.daily_roi / 100.0) * _max_days, 2) THEN
      _new_yield := GREATEST(0, ROUND(_inv.principal * (_inv.daily_roi / 100.0) * _max_days, 2) - _inv.yield_earned);
    END IF;

    IF _new_yield > 0 THEN
      UPDATE public.user_investments
        SET yield_earned = yield_earned + _new_yield,
            last_accrued_at = _accrue_to,
            updated_at = now()
        WHERE id = _inv.id;
      _inv.yield_earned := _inv.yield_earned + _new_yield;
      _accrued_total := _accrued_total + _new_yield;
    ELSE
      UPDATE public.user_investments SET last_accrued_at = _accrue_to WHERE id = _inv.id;
    END IF;

    -- maturity: release principal + yield to the wallet
    IF now() >= _inv.matures_at THEN
      UPDATE public.user_investments
        SET status = 'completed', updated_at = now()
        WHERE id = _inv.id;

      INSERT INTO public.user_balance (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;

      UPDATE public.user_balance
        SET available_balance = available_balance + _inv.principal + _inv.yield_earned,
            total_returns = total_returns + _inv.yield_earned,
            total_profit = total_profit + _inv.yield_earned,
            updated_at = now()
        WHERE user_id = _uid;

      INSERT INTO public.balance_transactions (user_id, type, amount, status, description)
      VALUES (_uid, 'return', _inv.principal + _inv.yield_earned, 'completed',
              'Matured contract released: ' || _inv.plan_name);

      _matured_total := _matured_total + _inv.principal + _inv.yield_earned;
      _matured_count := _matured_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'accrued', _accrued_total,
                            'matured_count', _matured_count, 'released', _matured_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accrue_investments(uuid) TO authenticated;