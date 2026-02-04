-- Fix Function Search Path Mutable warning
-- Add SET search_path to the function that's missing it

CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot modify your own roles';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot modify your own roles';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;