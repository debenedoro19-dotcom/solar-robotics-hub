ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS state text;

CREATE OR REPLACE FUNCTION public.validate_kyc_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.state IS NOT NULL AND NEW.state <> '' THEN
    IF NEW.state NOT IN (
      'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
      'District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
      'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota',
      'Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
      'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon',
      'Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah',
      'Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
    ) THEN
      RAISE EXCEPTION 'Invalid U.S. state: %', NEW.state;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_kyc_state_trg ON public.kyc_submissions;
CREATE TRIGGER validate_kyc_state_trg
BEFORE INSERT OR UPDATE ON public.kyc_submissions
FOR EACH ROW EXECUTE FUNCTION public.validate_kyc_state();