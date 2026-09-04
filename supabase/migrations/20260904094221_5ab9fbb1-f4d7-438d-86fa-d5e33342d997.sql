CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
  _amount numeric,
  _method text,
  _wallet_address text DEFAULT NULL,
  _bank_name text DEFAULT NULL,
  _account_number text DEFAULT NULL,
  _account_name text DEFAULT NULL,
  _routing_number text DEFAULT NULL,
  _description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _name text;
  _avail numeric := 0;
  _req_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid amount');
  END IF;

  SELECT email, full_name INTO _email, _name FROM public.user_profiles WHERE id = _uid;

  INSERT INTO public.user_balance (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT available_balance INTO _avail FROM public.user_balance WHERE user_id = _uid;

  IF COALESCE(_avail, 0) < _amount THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount exceeds available balance');
  END IF;

  INSERT INTO public.withdrawal_requests
    (user_id, user_email, user_name, amount, bank_name, account_number, account_name, routing_number, payout_status, notes)
  VALUES
    (_uid,
     COALESCE(_email, ''),
     COALESCE(_name, 'Investor'),
     _amount,
     COALESCE(NULLIF(_bank_name, ''), CASE WHEN _method = 'crypto' THEN 'Crypto wallet' ELSE '' END),
     COALESCE(NULLIF(_account_number, ''), COALESCE(_wallet_address, '')),
     COALESCE(NULLIF(_account_name, ''), COALESCE(_name, 'Investor')),
     COALESCE(NULLIF(_routing_number, ''), ''),
     'pending',
     _description)
  RETURNING id INTO _req_id;

  INSERT INTO public.balance_transactions
    (user_id, type, amount, status, description, payment_method, wallet_address, bank_name, account_number, account_name, reference)
  VALUES
    (_uid, 'withdrawal', -_amount, 'pending',
     COALESCE(_description, 'Withdrawal request'),
     _method, _wallet_address, _bank_name, _account_number, _account_name, _req_id::text);

  RETURN jsonb_build_object('ok', true, 'request_id', _req_id);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_withdrawal_request(numeric, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_withdrawal_request(numeric, text, text, text, text, text, text, text) TO authenticated, service_role;

ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.deposit_records REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_records;