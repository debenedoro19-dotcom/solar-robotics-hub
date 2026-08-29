DROP POLICY IF EXISTS "admin_full_access_user_balance" ON public.user_balance;
CREATE POLICY "admin_full_access_user_balance" ON public.user_balance
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_full_access_balance_transactions" ON public.balance_transactions;
CREATE POLICY "admin_full_access_balance_transactions" ON public.balance_transactions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_full_access_session_bookings" ON public.session_bookings;
CREATE POLICY "admin_full_access_session_bookings" ON public.session_bookings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());