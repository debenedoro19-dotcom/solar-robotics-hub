CREATE OR REPLACE FUNCTION public.admin_approve_deposit(_deposit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _d public.deposit_records%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;

  SELECT * INTO _d FROM public.deposit_records WHERE id = _deposit_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Deposit not found');
  END IF;
  IF _d.deposit_status = 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Deposit already confirmed');
  END IF;
  IF _d.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Deposit has no linked user');
  END IF;

  UPDATE public.deposit_records
    SET deposit_status = 'confirmed', confirmed_at = now(), updated_at = now()
    WHERE id = _deposit_id;

  INSERT INTO public.user_balance (user_id) VALUES (_d.user_id) ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_balance
    SET available_balance = available_balance + _d.amount,
        total_deposited = total_deposited + _d.amount,
        updated_at = now()
    WHERE user_id = _d.user_id;

  INSERT INTO public.balance_transactions (user_id, type, amount, status, description, payment_method, reference)
  VALUES (_d.user_id, 'deposit', _d.amount, 'completed',
          'Deposit approved by admin', _d.payment_method, _d.tx_ref);

  RETURN jsonb_build_object('ok', true, 'amount', _d.amount, 'user_id', _d.user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_deposit(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_approve_deposit(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_wallet_balance(_user_id uuid, _available numeric, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old numeric := 0;
  _delta numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;
  IF _available IS NULL OR _available < 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid balance');
  END IF;

  INSERT INTO public.user_balance (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT available_balance INTO _old FROM public.user_balance WHERE user_id = _user_id FOR UPDATE;

  _delta := _available - COALESCE(_old, 0);

  UPDATE public.user_balance
    SET available_balance = _available, updated_at = now()
    WHERE user_id = _user_id;

  IF _delta <> 0 THEN
    INSERT INTO public.balance_transactions (user_id, type, amount, status, description)
    VALUES (_user_id, 'adjustment', _delta, 'completed',
            COALESCE(NULLIF(_note, ''), 'Balance adjusted by admin'));
  END IF;

  RETURN jsonb_build_object('ok', true, 'previous', COALESCE(_old, 0), 'balance', _available, 'delta', _delta);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_wallet_balance(uuid, numeric, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_set_wallet_balance(uuid, numeric, text) TO authenticated;