-- Add database constraints for input validation on registrations table
-- These enforce format validation at the database level to prevent bypass via direct API calls

-- Add check constraint for cedula format (must be exactly 11 digits)
ALTER TABLE public.registrations
  ADD CONSTRAINT chk_cedula_format 
    CHECK (cedula ~ '^\d{11}$');

-- Add check constraint for phone format (must be exactly 10 digits)
ALTER TABLE public.registrations
  ADD CONSTRAINT chk_phone_format 
    CHECK (phone ~ '^\d{10}$');

-- Add check constraint for full_name length (3-100 characters)
ALTER TABLE public.registrations
  ADD CONSTRAINT chk_name_length 
    CHECK (char_length(full_name) >= 3 AND char_length(full_name) <= 100);

-- Add URL validation constraints for document URLs (must be HTTPS if set)
ALTER TABLE public.registrations
  ADD CONSTRAINT chk_cedula_front_url 
    CHECK (cedula_front_url IS NULL OR cedula_front_url ~ '^https?://');

ALTER TABLE public.registrations
  ADD CONSTRAINT chk_cedula_back_url 
    CHECK (cedula_back_url IS NULL OR cedula_back_url ~ '^https?://');

ALTER TABLE public.registrations
  ADD CONSTRAINT chk_selfie_url 
    CHECK (selfie_url IS NULL OR selfie_url ~ '^https?://');

ALTER TABLE public.registrations
  ADD CONSTRAINT chk_vote_selfie_url 
    CHECK (vote_selfie_url IS NULL OR vote_selfie_url ~ '^https?://');