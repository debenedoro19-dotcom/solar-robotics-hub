CREATE TABLE public.giveaways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  prize text NOT NULL DEFAULT '',
  image_url text,
  entry_fee numeric NOT NULL DEFAULT 0,
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  max_entries integer NOT NULL DEFAULT 1000,
  entries_count integer NOT NULL DEFAULT 0,
  badge text NOT NULL DEFAULT 'ENTRY',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.giveaways TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.giveaways TO authenticated;
GRANT ALL ON public.giveaways TO service_role;

ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active giveaways" ON public.giveaways
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage giveaways" ON public.giveaways
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_giveaways_updated_at BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.giveaway_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  giveaway_title text NOT NULL DEFAULT '',
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'entered',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_giveaway_entries_user ON public.giveaway_entries(user_id);
CREATE INDEX idx_giveaway_entries_giveaway ON public.giveaway_entries(giveaway_id);

GRANT SELECT ON public.giveaway_entries TO authenticated;
GRANT ALL ON public.giveaway_entries TO service_role;

ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own giveaway entries" ON public.giveaway_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage giveaway entries" ON public.giveaway_entries
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.enter_giveaway(_giveaway_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _g public.giveaways%ROWTYPE;
  _bal public.user_balance%ROWTYPE;
  _entry_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO _g FROM public.giveaways WHERE id = _giveaway_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Giveaway not available');
  END IF;

  IF _g.ends_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This giveaway has ended');
  END IF;

  IF _g.entries_count >= _g.max_entries THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This giveaway is full');
  END IF;

  INSERT INTO public.user_balance (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO _bal FROM public.user_balance WHERE user_id = _uid FOR UPDATE;

  IF _bal.available_balance < _g.entry_fee THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Insufficient wallet balance',
                              'balance', _bal.available_balance, 'required', _g.entry_fee);
  END IF;

  IF _g.entry_fee > 0 THEN
    UPDATE public.user_balance
      SET available_balance = available_balance - _g.entry_fee, updated_at = now()
      WHERE user_id = _uid;

    INSERT INTO public.balance_transactions (user_id, type, amount, status, description)
    VALUES (_uid, 'giveaway', -_g.entry_fee, 'completed', 'Giveaway entry: ' || _g.title);
  END IF;

  INSERT INTO public.giveaway_entries (giveaway_id, user_id, giveaway_title, amount_paid)
  VALUES (_g.id, _uid, _g.title, _g.entry_fee)
  RETURNING id INTO _entry_id;

  UPDATE public.giveaways SET entries_count = entries_count + 1, updated_at = now() WHERE id = _g.id;

  RETURN jsonb_build_object('ok', true, 'entry_id', _entry_id, 'amount', _g.entry_fee);
END;
$$;

INSERT INTO public.giveaways (title, description, prize, entry_fee, ends_at, max_entries, entries_count, badge, sort_order)
VALUES
  ('Win a 2025 Model 3 Long Range',
   '2025 Tesla Model 3 Long Range AWD. One winner selected after the campaign ends. Includes standard delivery within the continental US.',
   '2025 Tesla Model 3 Long Range AWD', 200, '2026-12-31', 5000, 1247, '$200 ENTRY', 1),
  ('Cybertruck Experience Weekend',
   'Win a full weekend with a Cybertruck Foundation Series plus a $2,000 platform credit toward any purchase.',
   'Cybertruck Foundation Series + $2,000 credit', 500, '2026-10-15', 2000, 683, '$500 ENTRY', 2);