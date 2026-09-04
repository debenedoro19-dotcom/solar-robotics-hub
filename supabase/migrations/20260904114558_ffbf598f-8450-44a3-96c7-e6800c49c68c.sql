-- Tighten resume uploads: the UUID in the object path must be the id of an
-- existing job_applications row that has no resume attached yet (one-time write).
DROP POLICY IF EXISTS resumes_scoped_upload ON storage.objects;

CREATE POLICY resumes_scoped_upload
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND name ~ '^applications/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx|rtf|txt)$'
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.id = (substring(name from '^applications/([0-9a-f-]{36})\.'))::uuid
      AND ja.resume_path IS NULL
  )
);

-- RPC to attach the uploaded resume path to the application row (anon-safe,
-- validated, one-time).
CREATE OR REPLACE FUNCTION public.attach_resume_path(_application_id uuid, _path text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE _app public.job_applications%ROWTYPE;
BEGIN
  IF _application_id IS NULL OR _path IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing application or path');
  END IF;
  IF _path !~ ('^applications/' || _application_id::text || '\.(pdf|doc|docx|rtf|txt)$') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Resume path does not match this application');
  END IF;

  SELECT * INTO _app FROM public.job_applications WHERE id = _application_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Application not found'); END IF;
  IF _app.resume_path IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Resume already attached'); END IF;

  UPDATE public.job_applications SET resume_path = _path, updated_at = now() WHERE id = _application_id;
  RETURN jsonb_build_object('ok', true);
END;
$fn$;

REVOKE ALL ON FUNCTION public.attach_resume_path(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_resume_path(uuid, text) TO anon, authenticated;