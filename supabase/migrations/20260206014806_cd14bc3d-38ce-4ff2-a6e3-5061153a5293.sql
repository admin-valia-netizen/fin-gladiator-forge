-- Add province column to registrations table
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS provincia text;

-- Create table to track province progress for the "Compromiso 5,000" challenge
CREATE TABLE IF NOT EXISTS public.province_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  province_code text UNIQUE NOT NULL,
  province_name text NOT NULL,
  zone_type text NOT NULL CHECK (zone_type IN ('costera', 'agricola', 'urbana')),
  registration_count integer NOT NULL DEFAULT 0,
  target_count integer NOT NULL DEFAULT 5000,
  cidp_activated boolean NOT NULL DEFAULT false,
  cidp_activated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on province_counters
ALTER TABLE public.province_counters ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view province counters (public data)
CREATE POLICY "Anyone can view province counters"
ON public.province_counters
FOR SELECT
USING (true);

-- Only admins can modify province counters
CREATE POLICY "Only admins can update province counters"
ON public.province_counters
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert all 32 Dominican provinces with their zone types
INSERT INTO public.province_counters (province_code, province_name, zone_type) VALUES
-- Coastal provinces (GESEMA - maritime stations)
('01', 'Distrito Nacional', 'urbana'),
('02', 'Azua', 'agricola'),
('03', 'Baoruco', 'agricola'),
('04', 'Barahona', 'costera'),
('05', 'Dajabón', 'agricola'),
('06', 'Duarte', 'agricola'),
('07', 'Elías Piña', 'agricola'),
('08', 'El Seibo', 'agricola'),
('09', 'Espaillat', 'agricola'),
('10', 'Independencia', 'agricola'),
('11', 'La Altagracia', 'costera'),
('12', 'La Romana', 'costera'),
('13', 'La Vega', 'agricola'),
('14', 'María Trinidad Sánchez', 'costera'),
('15', 'Monte Cristi', 'costera'),
('16', 'Pedernales', 'costera'),
('17', 'Peravia', 'costera'),
('18', 'Puerto Plata', 'costera'),
('19', 'Hermanas Mirabal', 'agricola'),
('20', 'Samaná', 'costera'),
('21', 'San Cristóbal', 'urbana'),
('22', 'San Juan', 'agricola'),
('23', 'San Pedro de Macorís', 'costera'),
('24', 'Sánchez Ramírez', 'agricola'),
('25', 'Santiago', 'urbana'),
('26', 'Santiago Rodríguez', 'agricola'),
('27', 'Valverde', 'agricola'),
('28', 'Monseñor Nouel', 'agricola'),
('29', 'Monte Plata', 'agricola'),
('30', 'Hato Mayor', 'agricola'),
('31', 'San José de Ocoa', 'agricola'),
('32', 'Santo Domingo', 'urbana')
ON CONFLICT (province_code) DO NOTHING;

-- Create function to update province counter when registration is added/updated
CREATE OR REPLACE FUNCTION public.update_province_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- If province was added or changed
  IF TG_OP = 'INSERT' AND NEW.provincia IS NOT NULL THEN
    UPDATE public.province_counters 
    SET registration_count = registration_count + 1,
        updated_at = now()
    WHERE province_name = NEW.provincia;
  ELSIF TG_OP = 'UPDATE' AND OLD.provincia IS DISTINCT FROM NEW.provincia THEN
    -- Decrease old province if it existed
    IF OLD.provincia IS NOT NULL THEN
      UPDATE public.province_counters 
      SET registration_count = GREATEST(0, registration_count - 1),
          updated_at = now()
      WHERE province_name = OLD.provincia;
    END IF;
    -- Increase new province if set
    IF NEW.provincia IS NOT NULL THEN
      UPDATE public.province_counters 
      SET registration_count = registration_count + 1,
          updated_at = now()
      WHERE province_name = NEW.provincia;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for province counter updates
DROP TRIGGER IF EXISTS on_registration_province_change ON public.registrations;
CREATE TRIGGER on_registration_province_change
AFTER INSERT OR UPDATE OF provincia ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_province_counter();

-- Add trigger to update updated_at on province_counters
CREATE TRIGGER update_province_counters_updated_at
BEFORE UPDATE ON public.province_counters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for province_counters to show live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.province_counters;