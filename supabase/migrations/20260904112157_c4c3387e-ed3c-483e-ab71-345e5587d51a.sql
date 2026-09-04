-- ─────────────────────────────────────────────────────────────
-- 1. Remove the stale overload (ambiguous with the 9-arg version)
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.submit_withdrawal_request(numeric, text, text, text, text, text, text, text);

-- ─────────────────────────────────────────────────────────────
-- 2. Two-factor authentication (server-only secrets)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_2fa (
  user_id uuid PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  backup_codes text[] NOT NULL DEFAULT '{}',
  last_used_at timestamptz,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Secrets are never exposed to the browser: service_role only.
GRANT ALL ON public.user_2fa TO service_role;
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_manages_2fa" ON public.user_2fa FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_user_2fa_updated_at BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Safe status projection for the signed-in user (no secret material).
CREATE OR REPLACE FUNCTION public.get_2fa_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
        'enabled', enabled,
        'confirmed_at', confirmed_at,
        'backup_codes_left', COALESCE(array_length(backup_codes, 1), 0),
        'last_used_at', last_used_at)
     FROM public.user_2fa WHERE user_id = auth.uid()),
    jsonb_build_object('enabled', false, 'confirmed_at', null, 'backup_codes_left', 0, 'last_used_at', null)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.get_2fa_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_2fa_status() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 3. Known devices
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  device_hash text NOT NULL,
  label text NOT NULL DEFAULT 'Unknown device',
  browser text,
  os text,
  last_ip text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  trusted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_hash)
);

GRANT SELECT ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_devices" ON public.user_devices
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "service_role_manages_devices" ON public.user_devices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_user_devices_updated_at BEFORE UPDATE ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 4. Security / auth activity log
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email text,
  event_type text NOT NULL,
  ip text,
  user_agent text,
  device_label text,
  location text,
  new_device boolean NOT NULL DEFAULT false,
  success boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auth_events TO authenticated;
GRANT ALL ON public.auth_events TO service_role;
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_auth_events" ON public.auth_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "service_role_manages_auth_events" ON public.auth_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 5. Withdrawal email confirmation
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS confirmation_code_hash text,
  ADD COLUMN IF NOT EXISTS confirmation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_attempts integer NOT NULL DEFAULT 0;

-- New requests wait for the emailed code before they can be queued.
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
  _amount numeric, _method text, _wallet_address text DEFAULT NULL::text,
  _bank_name text DEFAULT NULL::text, _account_number text DEFAULT NULL::text,
  _account_name text DEFAULT NULL::text, _routing_number text DEFAULT NULL::text,
  _description text DEFAULT NULL::text, _idempotency_key text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF _idempotency_key IS NOT NULL THEN
    SELECT * INTO _existing FROM public.withdrawal_requests
      WHERE user_id = _uid AND idempotency_key = _idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', true, 'request_id', _existing.id, 'tx_code', _existing.tx_code,
                                'duplicate', true, 'requires_confirmation', _existing.confirmed_at IS NULL);
    END IF;
  END IF;

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

  UPDATE public.user_balance
    SET available_balance = available_balance - _amount, updated_at = now()
    WHERE user_id = _uid;

  _tx := 'TXW-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 10));

  INSERT INTO public.withdrawal_requests
    (user_id, user_email, user_name, amount, bank_name, account_number, account_name, routing_number,
     payout_status, notes, idempotency_key, tx_code, queue_status, confirmation_expires_at)
  VALUES
    (_uid, COALESCE(_email, ''), COALESCE(_name, 'Investor'), _amount,
     COALESCE(NULLIF(_bank_name, ''), CASE WHEN _method = 'crypto' THEN 'Crypto wallet' ELSE '' END),
     COALESCE(NULLIF(_account_number, ''), COALESCE(_wallet_address, '')),
     COALESCE(NULLIF(_account_name, ''), COALESCE(_name, 'Investor')),
     COALESCE(NULLIF(_routing_number, ''), ''),
     'awaiting_confirmation', _description, _idempotency_key, _tx, 'none', now() + interval '30 minutes')
  RETURNING id INTO _req_id;

  INSERT INTO public.balance_transactions
    (user_id, type, amount, status, description, payment_method, wallet_address, bank_name, account_number, account_name, reference)
  VALUES
    (_uid, 'withdrawal', -_amount, 'awaiting_confirmation', COALESCE(_description, 'Withdrawal request'),
     _method, _wallet_address, _bank_name, _account_number, _account_name, _tx);

  PERFORM public.log_txn_audit(_uid, 'withdrawal.requested', 'withdrawal_request', _req_id, _amount,
    'awaiting_confirmation', jsonb_build_object('method', _method, 'tx_code', _tx));

  RETURN jsonb_build_object('ok', true, 'request_id', _req_id, 'tx_code', _tx,
                            'duplicate', false, 'requires_confirmation', true);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.submit_withdrawal_request(numeric, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_withdrawal_request(numeric, text, text, text, text, text, text, text, text) TO authenticated, service_role;

-- Server-side only: store the hashed confirmation code.
CREATE OR REPLACE FUNCTION public.set_withdrawal_confirmation(_id uuid, _user_id uuid, _code_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _w public.withdrawal_requests%ROWTYPE;
BEGIN
  SELECT * INTO _w FROM public.withdrawal_requests WHERE id = _id AND user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Withdrawal not found'); END IF;
  IF _w.confirmed_at IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Already confirmed'); END IF;

  UPDATE public.withdrawal_requests
    SET confirmation_code_hash = _code_hash,
        confirmation_expires_at = now() + interval '30 minutes',
        confirmation_attempts = 0,
        updated_at = now()
    WHERE id = _id;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_withdrawal_confirmation(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_withdrawal_confirmation(uuid, uuid, text) TO service_role;

-- Server-side only: verify the hashed code and release the request to the queue.
CREATE OR REPLACE FUNCTION public.confirm_withdrawal_request(_id uuid, _user_id uuid, _code_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _w public.withdrawal_requests%ROWTYPE;
BEGIN
  SELECT * INTO _w FROM public.withdrawal_requests WHERE id = _id AND user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Withdrawal not found'); END IF;
  IF _w.confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'tx_code', _w.tx_code);
  END IF;
  IF _w.payout_status <> 'awaiting_confirmation' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This request can no longer be confirmed');
  END IF;
  IF _w.confirmation_expires_at IS NULL OR _w.confirmation_expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'The confirmation code has expired');
  END IF;
  IF _w.confirmation_attempts >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Too many incorrect codes. Request a new withdrawal.');
  END IF;
  IF _w.confirmation_code_hash IS DISTINCT FROM _code_hash THEN
    UPDATE public.withdrawal_requests SET confirmation_attempts = confirmation_attempts + 1 WHERE id = _id;
    RETURN jsonb_build_object('ok', false, 'error', 'Incorrect confirmation code');
  END IF;

  UPDATE public.withdrawal_requests
    SET confirmed_at = now(), payout_status = 'pending', confirmation_code_hash = NULL, updated_at = now()
    WHERE id = _id;

  UPDATE public.balance_transactions
    SET status = 'pending', updated_at = now()
    WHERE user_id = _user_id AND reference = _w.tx_code AND type = 'withdrawal';

  PERFORM public.log_txn_audit(_user_id, 'withdrawal.confirmed', 'withdrawal_request', _id, _w.amount, 'pending',
    jsonb_build_object('tx_code', _w.tx_code));

  RETURN jsonb_build_object('ok', true, 'tx_code', _w.tx_code);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.confirm_withdrawal_request(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_withdrawal_request(uuid, uuid, text) TO service_role;

-- Background cleanup: refund reserved funds for requests never confirmed.
CREATE OR REPLACE FUNCTION public.expire_unconfirmed_withdrawals(_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _w public.withdrawal_requests%ROWTYPE; _n integer := 0; _total numeric := 0;
BEGIN
  FOR _w IN
    SELECT * FROM public.withdrawal_requests
    WHERE payout_status = 'awaiting_confirmation'
      AND confirmation_expires_at IS NOT NULL
      AND confirmation_expires_at < now()
    ORDER BY confirmation_expires_at
    LIMIT GREATEST(1, LEAST(_limit, 200))
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.withdrawal_requests
      SET payout_status = 'expired', queue_status = 'none', confirmation_code_hash = NULL,
          processed_at = now(), updated_at = now()
      WHERE id = _w.id;

    UPDATE public.user_balance
      SET available_balance = available_balance + _w.amount, updated_at = now()
      WHERE user_id = _w.user_id;

    UPDATE public.balance_transactions
      SET status = 'expired', updated_at = now()
      WHERE user_id = _w.user_id AND reference = _w.tx_code AND type = 'withdrawal';

    PERFORM public.log_txn_audit(_w.user_id, 'withdrawal.expired', 'withdrawal_request', _w.id, _w.amount, 'expired',
      jsonb_build_object('tx_code', _w.tx_code, 'reason', 'confirmation not completed'));

    _n := _n + 1; _total := _total + _w.amount;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'expired', _n, 'refunded', _total);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.expire_unconfirmed_withdrawals(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_unconfirmed_withdrawals(integer) TO service_role;

-- Only confirmed requests may be queued for payout.
CREATE OR REPLACE FUNCTION public.admin_queue_withdrawal(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _w public.withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authorized'); END IF;
  SELECT * INTO _w FROM public.withdrawal_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Withdrawal not found'); END IF;
  IF _w.payout_status IN ('paid', 'rejected', 'expired') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Withdrawal already settled');
  END IF;
  IF _w.confirmed_at IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Investor has not confirmed this withdrawal by email yet');
  END IF;

  UPDATE public.withdrawal_requests
    SET payout_status = 'processing', queue_status = 'queued', queue_last_error = NULL, updated_at = now()
    WHERE id = _id;

  PERFORM public.log_txn_audit(_w.user_id, 'withdrawal.queued', 'withdrawal_request', _id, _w.amount, 'processing', '{}'::jsonb);
  RETURN jsonb_build_object('ok', true, 'tx_code', _w.tx_code);
END;
$function$;

-- ─────────────────────────────────────────────────────────────
-- 6. Indexes for pagination / dashboard / admin queries
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auth_events_user_created ON public.auth_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_created ON public.auth_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_seen ON public.user_devices (user_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_balance_tx_user_created ON public.balance_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_tx_status ON public.balance_transactions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created ON public.withdrawal_requests (payout_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON public.withdrawal_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_queue ON public.withdrawal_requests (queue_status, queue_lease_until);
CREATE INDEX IF NOT EXISTS idx_withdrawals_awaiting ON public.withdrawal_requests (confirmation_expires_at)
  WHERE payout_status = 'awaiting_confirmation';

CREATE INDEX IF NOT EXISTS idx_deposits_status_created ON public.deposit_records (deposit_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user_created ON public.deposit_records (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_investments_user_status ON public.user_investments (user_id, status);
CREATE INDEX IF NOT EXISTS idx_investments_active_matures ON public.user_investments (matures_at) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_audit_user_created ON public.transaction_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.transaction_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.transaction_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created ON public.support_tickets (ticket_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kyc_status_created ON public.kyc_submissions (kyc_status, created_at DESC);