-- Add new affiliation fields to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS municipio text,
ADD COLUMN IF NOT EXISTS circunscripcion text,
ADD COLUMN IF NOT EXISTS distrito_municipal text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS zona text,
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'simpatizante' CHECK (categoria IN ('simpatizante', 'militante')),
ADD COLUMN IF NOT EXISTS apellidos text,
ADD COLUMN IF NOT EXISTS apodo text,
ADD COLUMN IF NOT EXISTS telefono_residencial text,
ADD COLUMN IF NOT EXISTS telefono_trabajo text,
ADD COLUMN IF NOT EXISTS calle text,
ADD COLUMN IF NOT EXISTS numero_casa text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS frente_sectorial text,
ADD COLUMN IF NOT EXISTS ocupacion text;

-- Add comments for documentation
COMMENT ON COLUMN public.registrations.categoria IS 'Tipo de afiliado: simpatizante o militante';
COMMENT ON COLUMN public.registrations.frente_sectorial IS 'Frente sectorial al que pertenece el afiliado';
COMMENT ON COLUMN public.registrations.circunscripcion IS 'Circunscripción electoral del afiliado';