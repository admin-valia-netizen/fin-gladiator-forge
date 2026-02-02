-- Add columns for vote validation and golden passport
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS vote_selfie_url TEXT,
ADD COLUMN IF NOT EXISTS vote_validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS passport_level TEXT DEFAULT 'bronce' CHECK (passport_level IN ('bronce', 'dorado'));