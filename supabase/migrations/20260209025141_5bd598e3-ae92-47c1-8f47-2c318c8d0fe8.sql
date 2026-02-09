-- Create trigger to connect province counter updates to registrations
CREATE TRIGGER tr_update_province_counter
AFTER INSERT OR UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_province_counter();

-- Create function to validate Dominican cedula using Luhn algorithm
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
  -- Multipliers for positions 1-10: 1,2,1,2,1,2,1,2,1,2
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
  
  -- Check digit is (10 - (sum mod 10)) mod 10
  RETURN ((10 - (sum_val % 10)) % 10) = (substring(p_cedula, 11, 1))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function for cedula validation with custom error
CREATE OR REPLACE FUNCTION public.check_cedula_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate cedula format with Luhn algorithm
  IF NOT validate_cedula_format(NEW.cedula) THEN
    RAISE EXCEPTION 'Formato de cédula inválido. Debe contener 11 dígitos numéricos válidos.';
  END IF;
  
  -- Check for duplicate cedula (excluding current row on update)
  IF EXISTS (
    SELECT 1 FROM public.registrations 
    WHERE cedula = NEW.cedula AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'Este Gladiador ya está inscrito en el FIN';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for cedula validation
CREATE TRIGGER tr_validate_cedula
BEFORE INSERT OR UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.check_cedula_before_insert();