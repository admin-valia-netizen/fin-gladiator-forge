-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_referral_code ON public.registrations;
DROP FUNCTION IF EXISTS public.generate_referral_code();

-- Create new function that generates referral code based on cedula
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate referral code as FIN + cedula
  NEW.referral_code := 'FIN-' || NEW.cedula;
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-generate referral code on insert
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();