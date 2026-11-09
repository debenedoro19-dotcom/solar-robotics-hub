-- Suspend email verification requirements while mailbox service is inactive
-- Auto-confirm newly inserted users in auth.users

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public AS $$
BEGIN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, CURRENT_TIMESTAMP);
    NEW.confirmed_at := COALESCE(NEW.confirmed_at, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();

-- Also ensure any existing unconfirmed users are marked confirmed
UPDATE auth.users
SET email_confirmed_at = CURRENT_TIMESTAMP, confirmed_at = CURRENT_TIMESTAMP
WHERE email_confirmed_at IS NULL;
