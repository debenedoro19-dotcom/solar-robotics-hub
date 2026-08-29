DROP POLICY IF EXISTS session_bookings_admin ON public.session_bookings;
CREATE POLICY session_bookings_admin ON public.session_bookings
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());