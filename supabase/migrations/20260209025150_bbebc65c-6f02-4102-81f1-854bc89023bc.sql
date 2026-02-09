-- Fix search_path for validate_cedula_format function
CREATE OR REPLACE FUNCTION public.validate_cedula_format(p_cedula text)
RETURNS boolean AS $$
DECLARE
  sum_val integer := 0;
  digit integer;
  multiplier integer;
  i integer;
BEGIN
  -- Check basic format: exactly 11 digits
  IF p_cedula IS NULL OR p_cedula !~ '^[0-9]{11}$' THEN
    RETURN false;
  END IF;
  
  -- Dominican cedula Luhn validation
  FOR i IN 1..10 LOOP
    digit := (substring(p_cedula, i, 1))::integer;
    IF i % 2 = 0 THEN
      multiplier := 2;
    ELSE
      multiplier := 1;
    END IF;
    
    digit := digit * multiplier;
    IF digit >= 10 THEN
      digit := (digit / 10) + (digit % 10);
    END IF;
    sum_val := sum_val + digit;
  END LOOP;
  
  RETURN ((10 - (sum_val % 10)) % 10) = (substring(p_cedula, 11, 1))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;