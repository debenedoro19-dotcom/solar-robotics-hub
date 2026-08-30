ALTER TABLE public.balance_transactions DROP CONSTRAINT balance_transactions_type_check;

ALTER TABLE public.balance_transactions ADD CONSTRAINT balance_transactions_type_check
  CHECK (type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'investment'::text, 'investment_debit'::text, 'investment_return'::text, 'giveaway'::text, 'admin_adjustment'::text]));