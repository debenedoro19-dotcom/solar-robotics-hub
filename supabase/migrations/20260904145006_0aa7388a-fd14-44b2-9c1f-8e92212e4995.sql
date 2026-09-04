-- 1. user_balance: read-only for owners
DROP POLICY IF EXISTS users_manage_own_balance ON public.user_balance;
CREATE POLICY users_read_own_balance ON public.user_balance
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY users_bootstrap_own_balance ON public.user_balance
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND COALESCE(available_balance,0) = 0 AND COALESCE(total_deposited,0) = 0
    AND COALESCE(total_withdrawn,0) = 0 AND COALESCE(total_returns,0) = 0
    AND COALESCE(total_invested,0) = 0 AND COALESCE(total_profit,0) = 0
  );

-- 2. balance_transactions: read own; may only file a pending deposit request
DROP POLICY IF EXISTS users_manage_own_balance_transactions ON public.balance_transactions;
CREATE POLICY users_read_own_balance_transactions ON public.balance_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY users_request_own_deposit_transaction ON public.balance_transactions
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND type = 'deposit' AND status = 'pending' AND amount > 0
  );

-- 3. withdrawal_requests: no direct client inserts (must use submit_withdrawal_request RPC)
DROP POLICY IF EXISTS users_insert_own_withdrawals ON public.withdrawal_requests;

-- 4. session_bookings: create pending only, no self-updates
DROP POLICY IF EXISTS users_manage_own_session_bookings ON public.session_bookings;
CREATE POLICY users_read_own_session_bookings ON public.session_bookings
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY users_create_own_session_bookings ON public.session_bookings
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND payment_status = 'pending'
  );

-- 5. user_portfolios: owners read-only
DROP POLICY IF EXISTS users_insert_own_portfolio ON public.user_portfolios;
DROP POLICY IF EXISTS users_update_own_portfolio ON public.user_portfolios;

-- 6. kyc_submissions: owners submit/edit while pending, never review fields
DROP POLICY IF EXISTS users_manage_own_kyc ON public.kyc_submissions;
CREATE POLICY users_read_own_kyc ON public.kyc_submissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY users_insert_own_kyc ON public.kyc_submissions
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND COALESCE(kyc_status, 'pending') = 'pending'
    AND reviewed_at IS NULL AND reviewed_by IS NULL AND admin_notes IS NULL
  );
CREATE POLICY users_update_own_pending_kyc ON public.kyc_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND COALESCE(kyc_status, 'pending') IN ('pending', 'rejected'))
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_kyc_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  NEW.kyc_status := OLD.kyc_status;
  NEW.admin_notes := OLD.admin_notes;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.reviewed_by := OLD.reviewed_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_kyc_review_fields ON public.kyc_submissions;
CREATE TRIGGER trg_protect_kyc_review_fields
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.protect_kyc_review_fields();

CREATE OR REPLACE FUNCTION public.protect_session_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  NEW.payment_status := OLD.payment_status;
  NEW.amount := OLD.amount;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_session_payment_fields ON public.session_bookings;
CREATE TRIGGER trg_protect_session_payment_fields
  BEFORE UPDATE ON public.session_bookings
  FOR EACH ROW EXECUTE FUNCTION public.protect_session_payment_fields();