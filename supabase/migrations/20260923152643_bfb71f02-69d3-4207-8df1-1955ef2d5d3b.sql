CREATE TABLE public.inventory_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('TT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id uuid NOT NULL,
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  item_category text NOT NULL DEFAULT '',
  item_image text,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_proof_url text,
  tx_reference text,
  order_status text NOT NULL DEFAULT 'pending_payment',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  notes text,
  tracking_number text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.inventory_orders TO authenticated;
GRANT UPDATE ON public.inventory_orders TO authenticated;
GRANT ALL ON public.inventory_orders TO service_role;
ALTER TABLE public.inventory_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX inventory_orders_user_idx ON public.inventory_orders(user_id, created_at DESC);

CREATE POLICY "users_view_own_orders" ON public.inventory_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "users_insert_external_orders" ON public.inventory_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND payment_method = 'external' AND order_status = 'pending_payment'
    AND tracking_number IS NULL AND admin_notes IS NULL
    AND item_id IS NOT NULL
    AND amount = (SELECT nullif(regexp_replace(i.price,'[^0-9.]','','g'),'')::numeric FROM public.inventory_items i WHERE i.id = item_id AND i.is_active));
CREATE POLICY "admins_update_orders" ON public.inventory_orders FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER inventory_orders_updated BEFORE UPDATE ON public.inventory_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_inventory_order()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_method NOT IN ('wallet','external') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
  IF NEW.order_status NOT IN ('pending_payment','paid','processing','shipped','delivered','cancelled') THEN
    RAISE EXCEPTION 'Invalid order status'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER inventory_orders_validate BEFORE INSERT OR UPDATE ON public.inventory_orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_order();

CREATE OR REPLACE FUNCTION public.purchase_inventory_wallet(
  _item_id uuid, _full_name text, _phone text, _address_line text, _city text, _state text,
  _postal_code text, _country text, _notes text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _item public.inventory_items%ROWTYPE;
  _price numeric; _bal public.user_balance%ROWTYPE; _email text; _oid uuid; _num text; _recent int;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Not authenticated'); END IF;
  IF coalesce(trim(_full_name),'')='' OR coalesce(trim(_phone),'')='' OR coalesce(trim(_address_line),'')=''
     OR coalesce(trim(_city),'')='' OR coalesce(trim(_state),'')='' OR coalesce(trim(_postal_code),'')='' OR coalesce(trim(_country),'')='' THEN
    RETURN jsonb_build_object('ok',false,'error','Delivery details are incomplete'); END IF;
  SELECT count(*) INTO _recent FROM public.inventory_orders WHERE user_id=_uid AND created_at > now()-interval '1 hour';
  IF _recent >= 10 THEN RETURN jsonb_build_object('ok',false,'error','Too many orders. Please try again later.'); END IF;
  SELECT * INTO _item FROM public.inventory_items WHERE id=_item_id AND is_active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Item not available'); END IF;
  _price := nullif(regexp_replace(_item.price,'[^0-9.]','','g'),'')::numeric;
  IF _price IS NULL OR _price <= 0 THEN RETURN jsonb_build_object('ok',false,'error','Item price unavailable'); END IF;
  SELECT email INTO _email FROM public.user_profiles WHERE id=_uid;
  INSERT INTO public.user_balance (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO _bal FROM public.user_balance WHERE user_id=_uid FOR UPDATE;
  IF _bal.available_balance < _price THEN
    RETURN jsonb_build_object('ok',false,'error','Insufficient wallet balance','balance',_bal.available_balance,'required',_price); END IF;
  UPDATE public.user_balance SET available_balance = available_balance - _price, updated_at=now() WHERE user_id=_uid;
  INSERT INTO public.inventory_orders (user_id,item_id,item_name,item_category,item_image,amount,payment_method,order_status,
    full_name,email,phone,address_line,city,state,postal_code,country,notes)
  VALUES (_uid,_item.id,_item.name,_item.category,_item.image_url,_price,'wallet','paid',
    trim(_full_name),coalesce(_email,''),trim(_phone),trim(_address_line),trim(_city),trim(_state),trim(_postal_code),trim(_country),_notes)
  RETURNING id, order_number INTO _oid, _num;
  INSERT INTO public.balance_transactions (user_id,type,amount,status,description,reference)
  VALUES (_uid,'purchase',-_price,'completed','Inventory purchase: '||_item.name,_num);
  PERFORM public.log_txn_audit(_uid,'inventory.purchased','inventory_order',_oid,_price,'paid',jsonb_build_object('item',_item.name));
  RETURN jsonb_build_object('ok',true,'order_id',_oid,'order_number',_num,'amount',_price);
END $$;
REVOKE ALL ON FUNCTION public.purchase_inventory_wallet(uuid,text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_inventory_wallet(uuid,text,text,text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_inventory_order(_id uuid, _status text, _tracking text, _notes text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.inventory_orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RETURN jsonb_build_object('ok',false,'error','Forbidden'); END IF;
  SELECT * INTO _o FROM public.inventory_orders WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Order not found'); END IF;
  IF _o.order_status IN ('cancelled','delivered') AND _status <> _o.order_status THEN
    RETURN jsonb_build_object('ok',false,'error','Order is already closed'); END IF;
  IF _status='cancelled' AND _o.order_status <> 'cancelled' AND _o.payment_method='wallet' THEN
    UPDATE public.user_balance SET available_balance = available_balance + _o.amount, updated_at=now() WHERE user_id=_o.user_id;
    INSERT INTO public.balance_transactions (user_id,type,amount,status,description,reference)
    VALUES (_o.user_id,'refund',_o.amount,'completed','Refund: '||_o.item_name,_o.order_number);
  END IF;
  UPDATE public.inventory_orders SET order_status=_status, tracking_number=coalesce(nullif(_tracking,''),tracking_number),
    admin_notes=coalesce(_notes,admin_notes) WHERE id=_id;
  PERFORM public.log_txn_audit(_o.user_id,'inventory.status','inventory_order',_id,_o.amount,_status,'{}'::jsonb);
  RETURN jsonb_build_object('ok',true,'previous',_o.order_status);
END $$;
REVOKE ALL ON FUNCTION public.admin_update_inventory_order(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_inventory_order(uuid,text,text,text) TO authenticated;