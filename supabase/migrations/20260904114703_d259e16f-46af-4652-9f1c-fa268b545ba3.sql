CREATE OR REPLACE FUNCTION public.resume_upload_slot_open(_object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT _object_name ~ '^applications/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx|rtf|txt)$'
     AND EXISTS (
       SELECT 1 FROM public.job_applications ja
       WHERE ja.id = (substring(_object_name from '^applications/([0-9a-f-]{36})\.'))::uuid
         AND ja.resume_path IS NULL
     );
$fn$;

REVOKE ALL ON FUNCTION public.resume_upload_slot_open(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resume_upload_slot_open(text) TO anon, authenticated;

DROP POLICY IF EXISTS resumes_scoped_upload ON storage.objects;

CREATE POLICY resumes_scoped_upload
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND public.resume_upload_slot_open(name)
);