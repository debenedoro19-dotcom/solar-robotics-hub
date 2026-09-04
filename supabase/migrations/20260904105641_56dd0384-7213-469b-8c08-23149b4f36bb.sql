-- 1. Audit log ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  amount numeric,
  status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.transaction_audit_log TO authenticated;
GRANT ALL ON public.transaction_audit_log TO service_role;

ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_audit" ON public.transaction_audit_log;
CREATE POLICY "users_read_own_audit" ON public.transaction_audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_txn_audit_user ON public.transaction_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_audit_entity ON public.transaction_audit_log (entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.log_txn_audit(
  _user_id uuid, _action text, _entity_type text, _entity_id uuid,
  _amount numeric DEFAULT NULL, _status text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO public.transaction_audit_log (user_id, actor_id, action, entity_type, entity_id, amount, status, metadata)
  VALUES (_user_id, auth.uid(), _action, _entity_type, _entity_id, _amount, _status, COALESCE(_metadata, '{}'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.log_txn_audit(uuid, text, text, uuid, numeric, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_txn_audit(uuid, text, text, uuid, numeric, text, jsonb) TO service_role;

-- 2. Background job state --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_state (
  key text PRIMARY KEY,
  paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  lease_until timestamptz,
  last_run_at timestamptz,
  last_error text,
  consecutive_failures integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_state TO authenticated;
GRANT ALL ON public.job_state TO service_role;
ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_read_job_state" ON public.job_state;
CREATE POLICY "admins_read_job_state" ON public.job_state
  FOR SELECT TO authenticated USING (public.is_admin());

INSERT INTO public.job_state (key) VALUES ('withdrawal_payouts') ON CONFLICT (key) DO NOTHING;

-- 3. Idempotency + queue columns ------------------------------------------
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS tx_code text,
  ADD COLUMN IF NOT EXISTS queue_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS queue_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS queue_lease_until timestamptz,
  ADD COLUMN IF NOT EXISTS queue_last_error text;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_withdrawal_idempotency
  ON public.withdrawal_requests (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_withdrawal_tx_code
  ON public.withdrawal_requests (tx_code) WHERE tx_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_withdrawal_queue ON public.withdrawal_requests (queue_status, queue_lease_until);

ALTER TABLE public.deposit_records
  ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_deposit_idempotency
  ON public.deposit_records (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 4. Withdrawal submission: locking, reservation, idempotency, rate limit --
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
  _amount numeric, _method text, _wallet_address text DEFAULT NULL, _bank_name text DEFAULT NULL,
  _account_number text DEFAULT NULL, _account_name text DEFAULT NULL, _routing_number text DEFAULT NULL,
  _description text DEFAULT NULL, _idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text; _name text; _avail numeric := 0; _req_id uuid; _tx text;
  _existing public.withdrawal_requests%ROWTYPE;
  _recent integer;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid amount'); END IF;
  IF _amount < 20 THEN RETURN jsonb_build_object('ok', false, 'error', 'Minimum withdrawal is $20'); END IF;
  IF _method IS NULL OR _method = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'Select a withdrawal method'); END IF;
  IF _method = 'crypto' AND COALESCE(_wallet_address, '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Destination wallet address is required');
  END IF;

  -- idempotency: same key returns the original request instead of a duplicate
  IF _idempotency_key IS NOT NULL THEN
    SELECT * INTO _existing FROM public.withdrawal_requests
      WHERE user_id = _uid AND idempotency_key = _idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', true, 'request_id', _existing.id, 'tx_code', _existing.tx_code, 'duplicate', true);
    END IF;
  END IF;

  -- rate limit: 5 withdrawal requests per rolling hour
  SELECT count(*) INTO _recent FROM public.withdrawal_requests
    WHERE user_id = _uid AND created_at > now() - interval '1 hour';
  IF _recent >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Too many withdrawal requests. Please try again later.');
  END IF;

  SELECT email, full_name INTO _email, _name FROM public.user_profiles WHERE id = _uid;

  INSERT INTO public.user_balance (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT available_balance INTO _avail FROM public.user_balance WHERE user_id = _uid FOR UPDATE;

  IF COALESCE(_avail, 0) < _amount THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount exceeds available balance');
  END IF;

  -- reserve the funds now so the same balance cannot be withdrawn twice
  UPDATE public.user_balance
    SET available_balance = available_balance - _amount, updated_at = now()
    WHERE user_id = _uid;

  _tx := 'TXW-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 10));

  INSERT INTO public.withdrawal_requests
    (user_id, user_email, user_name, amount, bank_name, account_number, account_name, routing_number,
     payout_status, notes, idempotency_key, tx_code, queue_status)
  VALUES
    (_uid, COALESCE(_email, ''), COALESCE(_name, 'Investor'), _amount,
     COALESCE(NULLIF(_bank_name, ''), CASE WHEN _method = 'crypto' THEN 'Crypto wallet' ELSE '' END),
     COALESCE(NULLIF(_account_number, ''), COALESCE(_wallet_address, '')),
     COALESCE(NULLIF(_account_name, ''), COALESCE(_name, 'Investor')),
     COALESCE(NULLIF(_routing_number, ''), ''),
     'pending', _description, _idempotency_key, _tx, 'none')
  RETURNING id INTO _req_id;

  INSERT INTO public.balance_transactions
    (user_id, type, amount, status, description, payment_method, wallet_address, bank_name, account_number, account_name, reference)
  VALUES
    (_uid, 'withdrawal', -_amount, 'pending', COALESCE(_description, 'Withdrawal request'),
     _method, _wallet_address, _bank_name, _account_number, _account_name, _tx);

  PERFORM public.log_txn_audit(_uid, 'withdrawal.requested', 'withdrawal_request', _req_id, _amount, 'pending',
    jsonb_build_object('method', _method, 'tx_code', _tx));

  RETURN jsonb_build_object('ok', true, 'request_id', _req_id, 'tx_code', _tx, 'duplicate', false);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_withdrawal_request(numeric, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_withdrawal_request(numeric, text, text, text, text, text, text, text, text) TO authenticated, service_role;

-- 5. Admin: enqueue an approved withdrawal --------------------------------
CREATE OR REPLACE FUNCTION public.admin_queue_withdrawal(_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _w public.withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authorized'); END IF;
  SELECT * INTO _w FROM public.withdrawal_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Withdrawal not found'); END IF;
  IF _w.payout_status IN ('paid', 'rejected') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Withdrawal already settled');
  END IF;

  UPDATE public.withdrawal_requests
    SET payout_status = 'processing', queue_status = 'queued', queue_last_error = NULL, updated_at = now()
    WHERE id = _id;

  PERFORM public.log_txn_audit(_w.user_id, 'withdrawal.queued', 'withdrawal_request', _id, _w.amount, 'processing', '{}'::jsonb);
  RETURN jsonb_build_object('ok', true, 'tx_code', _w.tx_code);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_queue_withdrawal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_queue_withdrawal(uuid) TO authenticated, service_role;

-- 6. Queue claim (single-flight lease, bounded batch, SKIP LOCKED) ---------
CREATE OR REPLACE FUNCTION public.claim_withdrawal_batch(_limit integer DEFAULT 10)
RETURNS SETOF public.withdrawal_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _n integer := LEAST(GREATEST(COALESCE(_limit, 10), 1), 25);
BEGIN
  RETURN QUERY
  UPDATE public.withdrawal_requests w
    SET queue_status = 'processing',
        queue_attempts = w.queue_attempts + 1,
        queue_lease_until = now() + interval '5 minutes',
        updated_at = now()
  WHERE w.id IN (
    SELECT id FROM public.withdrawal_requests
     WHERE queue_status = 'queued'
        OR (queue_status = 'processing' AND queue_lease_until < now())
     ORDER BY created_at
     LIMIT _n
     FOR UPDATE SKIP LOCKED
  )
  RETURNING w.*;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_withdrawal_batch(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_withdrawal_batch(integer) TO service_role;

-- 7. Settlement (idempotent): paid finalises, rejected refunds ------------
CREATE OR REPLACE FUNCTION public.settle_withdrawal(_id uuid, _status text, _notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _w public.withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() AND auth.uid() IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;
  IF _status NOT IN ('paid', 'rejected') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid settlement status');
  END IF;

  SELECT * INTO _w FROM public.withdrawal_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Withdrawal not found'); END IF;

  IF _w.payout_status IN ('paid', 'rejected') THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'status', _w.payout_status, 'tx_code', _w.tx_code);
  END IF;

  INSERT INTO public.user_balance (user_id) VALUES (_w.user_id) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.user_balance WHERE user_id = _w.user_id FOR UPDATE;

  IF _status = 'paid' THEN
    UPDATE public.user_balance
      SET total_withdrawn = total_withdrawn + _w.amount, updated_at = now()
      WHERE user_id = _w.user_id;
    UPDATE public.balance_transactions
      SET status = 'completed', updated_at = now()
      WHERE user_id = _w.user_id AND reference = _w.tx_code AND type = 'withdrawal';
  ELSE
    -- refund the reserved amount
    UPDATE public.user_balance
      SET available_balance = available_balance + _w.amount, updated_at = now()
      WHERE user_id = _w.user_id;
    UPDATE public.balance_transactions
      SET status = 'failed', updated_at = now()
      WHERE user_id = _w.user_id AND reference = _w.tx_code AND type = 'withdrawal';
  END IF;

  UPDATE public.withdrawal_requests
    SET payout_status = _status,
        queue_status = 'done',
        queue_lease_until = NULL,
        notes = COALESCE(_notes, notes),
        processed_at = now(),
        updated_at = now()
    WHERE id = _id;

  PERFORM public.log_txn_audit(_w.user_id, 'withdrawal.' || _status, 'withdrawal_request', _id, _w.amount, _status,
    jsonb_build_object('tx_code', _w.tx_code, 'notes', _notes));

  RETURN jsonb_build_object('ok', true, 'already', false, 'status', _status, 'tx_code', _w.tx_code,
                            'user_id', _w.user_id, 'amount', _w.amount, 'email', _w.user_email, 'name', _w.user_name);
END;
$$;
REVOKE ALL ON FUNCTION public.settle_withdrawal(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.settle_withdrawal(uuid, text, text) TO authenticated, service_role;

-- 8. Investment purchase: rate limit + audit ------------------------------
CREATE OR REPLACE FUNCTION public.purchase_investment_plan(_plan_id uuid, _amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _uid uuid := auth.uid();
  _plan public.investment_plans%ROWTYPE;
  _bal public.user_balance%ROWTYPE;
  _inv_id uuid;
  _recent integer;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid amount'); END IF;

  SELECT count(*) INTO _recent FROM public.user_investments
    WHERE user_id = _uid AND created_at > now() - interval '1 hour';
  IF _recent >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Too many purchases in a short period. Please try again later.');
  END IF;

  SELECT * INTO _plan FROM public.investment_plans WHERE id = _plan_id AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Plan not available'); END IF;
  IF _amount < _plan.min_deposit OR _amount > _plan.max_deposit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount outside plan limits');
  END IF;

  INSERT INTO public.user_balance (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
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

  PERFORM public.log_txn_audit(_uid, 'investment.purchased', 'user_investment', _inv_id, _amount, 'active',
    jsonb_build_object('plan', _plan.name));

  RETURN jsonb_build_object('ok', true, 'investment_id', _inv_id);
END;
$$;

-- 9. Deposit approval: audit ----------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_approve_deposit(_deposit_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _d public.deposit_records%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authorized'); END IF;

  SELECT * INTO _d FROM public.deposit_records WHERE id = _deposit_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Deposit not found'); END IF;
  IF _d.deposit_status = 'confirmed' THEN RETURN jsonb_build_object('ok', false, 'error', 'Deposit already confirmed'); END IF;
  IF _d.user_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Deposit has no linked user'); END IF;

  UPDATE public.deposit_records
    SET deposit_status = 'confirmed', confirmed_at = now(), updated_at = now()
    WHERE id = _deposit_id;

  INSERT INTO public.user_balance (user_id) VALUES (_d.user_id) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.user_balance WHERE user_id = _d.user_id FOR UPDATE;

  UPDATE public.user_balance
    SET available_balance = available_balance + _d.amount,
        total_deposited = total_deposited + _d.amount,
        updated_at = now()
    WHERE user_id = _d.user_id;

  INSERT INTO public.balance_transactions (user_id, type, amount, status, description, payment_method, reference)
  VALUES (_d.user_id, 'deposit', _d.amount, 'completed', 'Deposit approved by admin', _d.payment_method, _d.tx_ref);

  PERFORM public.log_txn_audit(_d.user_id, 'deposit.approved', 'deposit_record', _deposit_id, _d.amount, 'confirmed',
    jsonb_build_object('tx_ref', _d.tx_ref));

  RETURN jsonb_build_object('ok', true, 'amount', _d.amount, 'user_id', _d.user_id);
END;
$$;