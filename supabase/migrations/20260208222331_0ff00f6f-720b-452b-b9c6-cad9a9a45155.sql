-- Add missing fields for exact FIN affiliation form
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS referidor_cedula text,
ADD COLUMN IF NOT EXISTS referidor_nombre text,
ADD COLUMN IF NOT EXISTS referidor_telefono text,
ADD COLUMN IF NOT EXISTS telefono_otro text,
ADD COLUMN IF NOT EXISTS residencial_nombre text,
ADD COLUMN IF NOT EXISTS barrio_sector text,
ADD COLUMN IF NOT EXISTS paraje_seccion text,
ADD COLUMN IF NOT EXISTS ciudad text,
ADD COLUMN IF NOT EXISTS correo text;

-- Add comments
COMMENT ON COLUMN public.registrations.referidor_cedula IS 'Cédula de quien refiere al afiliado';
COMMENT ON COLUMN public.registrations.referidor_nombre IS 'Nombre completo de quien refiere';
COMMENT ON COLUMN public.registrations.referidor_telefono IS 'Teléfono de quien refiere';
COMMENT ON COLUMN public.registrations.correo IS 'Correo electrónico del afiliado';