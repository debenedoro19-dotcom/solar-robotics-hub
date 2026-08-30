DROP POLICY IF EXISTS resumes_scoped_upload ON storage.objects;
CREATE POLICY resumes_scoped_upload ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND name ~ '^applications/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx|rtf|txt)$'
  );