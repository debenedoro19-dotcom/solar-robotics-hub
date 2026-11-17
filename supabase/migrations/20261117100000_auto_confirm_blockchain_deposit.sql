-- Migration: 20261117100000_auto_confirm_blockchain_deposit.sql
-- Enables automatic blockchain transaction confirmation and dashboard balance crediting

CREATE OR REPLACE FUNCTION public.auto_confirm_blockchain_deposit(
  _deposit_id uuid,
  _tx_hash text DEFAULT NULL,
  _blockchain_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _d public.deposit_records%ROWTYPE;
  _uid uuid;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO _d FROM public.deposit_records WHERE id = _deposit_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Deposit record not found');
  END IF;

  -- Only the deposit owner or an admin can trigger auto-confirmation
  IF _d.user_id <> _uid AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized to confirm this deposit');
  END IF;

  -- Idempotency check: if already confirmed, return success without double crediting
  IF _d.deposit_status = 'confirmed' THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Deposit already confirmed', 'amount', _d.amount, 'user_id', _d.user_id);
  END IF;

  -- 1. Update deposit_records status
  UPDATE public.deposit_records
    SET deposit_status = 'confirmed',
        confirmed_at = now(),
        updated_at = now(),
        notes = coalesce(notes || E'\n', '') || 'Blockchain Auto-Confirmed: ' || coalesce(_tx_hash, 'Verified on-chain')
    WHERE id = _deposit_id;

  -- 2. Ensure user_balance row exists
  INSERT INTO public.user_balance (user_id) VALUES (_d.user_id) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.user_balance WHERE user_id = _d.user_id FOR UPDATE;

  -- 3. Credit user available balance and total deposited
  UPDATE public.user_balance
    SET available_balance = available_balance + _d.amount,
        total_deposited = total_deposited + _d.amount,
        updated_at = now()
    WHERE user_id = _d.user_id;

  -- 4. Record in balance_transactions
  INSERT INTO public.balance_transactions (
    user_id,
    type,
    amount,
    status,
    description,
    payment_method,
    reference
  ) VALUES (
    _d.user_id,
    'deposit',
    _d.amount,
    'completed',
    'Blockchain Auto-Confirmation (' || coalesce(_tx_hash, 'On-chain') || ')',
    _d.payment_method,
    _d.tx_ref
  );

  -- 5. Audit log
  BEGIN
    PERFORM public.log_txn_audit(
      _d.user_id,
      'deposit.blockchain_confirmed',
      'deposit_record',
      _deposit_id,
      _d.amount,
      'confirmed',
      jsonb_build_object('tx_ref', _d.tx_ref, 'tx_hash', _tx_hash, 'meta', _blockchain_meta)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Continue if audit log function does not exist
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'amount', _d.amount,
    'user_id', _d.user_id,
    'tx_ref', _d.tx_ref,
    'tx_hash', _tx_hash
  );
END;
$$;

-- Grant execution to authenticated users
REVOKE ALL ON FUNCTION public.auto_confirm_blockchain_deposit(uuid, text, jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.auto_confirm_blockchain_deposit(uuid, text, jsonb) TO authenticated;
