-- Migration: Enable direct inventory purchases and free giveaways with FedEx delivery claims
-- Date: 2026-11-09

-- 1. Giveaways updates: make giveaways 100% free, remove Bitcoin pool
UPDATE public.giveaways 
SET is_active = false 
WHERE title ILIKE '%bitcoin%' OR prize ILIKE '%bitcoin%' OR title ILIKE '%btc%';

UPDATE public.giveaways 
SET entry_fee = 0, badge = 'FREE CLAIM' 
WHERE is_active = true;

-- 2. Add delivery and FedEx tracking fields to giveaway_entries
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS full_name text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS address_line text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS city text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS state text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS postal_code text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS country text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS delivery_notes text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS tracking_number text DEFAULT '';
ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS courier text DEFAULT 'FedEx Express';

-- Grant authenticated users permission to insert giveaway claims
DROP POLICY IF EXISTS "Users insert own giveaway entries" ON public.giveaway_entries;
CREATE POLICY "Users insert own giveaway entries" ON public.giveaway_entries 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
GRANT INSERT ON public.giveaway_entries TO authenticated;

-- 3. Inventory Orders: allow direct purchases and external orders without rigid item_id check
DROP POLICY IF EXISTS "users_insert_external_orders" ON public.inventory_orders;
CREATE POLICY "users_insert_external_orders" ON public.inventory_orders 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id 
    AND payment_method = 'external' 
    AND order_status = 'pending_payment'
    AND tracking_number IS NULL 
    AND admin_notes IS NULL
  );
