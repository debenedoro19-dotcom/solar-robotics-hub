ALTER TABLE public.deposit_records ADD COLUMN IF NOT EXISTS proof_url text;

CREATE POLICY "users_upload_own_deposit_proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'deposit-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "users_read_own_deposit_proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deposit-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "admins_read_deposit_proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deposit-proofs'
  AND public.is_admin()
);