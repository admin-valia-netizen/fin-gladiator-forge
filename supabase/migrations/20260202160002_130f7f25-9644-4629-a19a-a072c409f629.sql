-- Create enum for interest areas
CREATE TYPE public.interest_area AS ENUM ('emprendimiento', 'tecnologia', 'deporte', 'empleo_tecnico');

-- Create enum for user levels
CREATE TYPE public.user_level AS ENUM ('aspirante', 'gladiador', 'campeon');

-- Create registrations table
CREATE TABLE public.registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    cedula TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    interest_area public.interest_area,
    user_level public.user_level DEFAULT 'aspirante',
    oath_accepted BOOLEAN DEFAULT FALSE,
    legal_accepted BOOLEAN DEFAULT FALSE,
    cedula_front_url TEXT,
    cedula_back_url TEXT,
    selfie_url TEXT,
    qr_code TEXT,
    signature_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration)
CREATE POLICY "Anyone can register"
ON public.registrations
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own registration by cedula
CREATE POLICY "Users can view own registration"
ON public.registrations
FOR SELECT
USING (true);

-- Allow updates to own registration
CREATE POLICY "Users can update own registration"
ON public.registrations
FOR UPDATE
USING (true);

-- Create storage bucket for evidences
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', true);

-- Storage policies for evidencias bucket
CREATE POLICY "Anyone can upload evidence"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'evidencias');

CREATE POLICY "Evidence is publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'evidencias');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();