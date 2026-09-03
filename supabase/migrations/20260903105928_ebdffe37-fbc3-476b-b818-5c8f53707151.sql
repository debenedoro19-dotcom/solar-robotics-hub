ALTER TABLE public.user_balance REPLICA IDENTITY FULL;
ALTER TABLE public.balance_transactions REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_balance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_balance;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'balance_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.balance_transactions;
  END IF;
END $$;