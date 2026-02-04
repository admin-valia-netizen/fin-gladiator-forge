-- ================================================
-- SECURITY FIX: Remove unsafe views, use secure functions instead
-- ================================================

-- Drop the unsafe views since views cannot have RLS enabled directly
DROP VIEW IF EXISTS public.registrations_safe;
DROP VIEW IF EXISTS public.donations_safe;

-- Create secure function to get registration data (without sensitive URLs)
CREATE OR REPLACE FUNCTION public.get_registration_safe(p_registration_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  cedula text,
  user_id uuid,
  interest_area interest_area,
  user_level user_level,
  passport_level text,
  legal_accepted boolean,
  oath_accepted boolean,
  signature_confirmed boolean,
  referral_code text,
  referred_by text,
  qr_code text,
  donation_status text,
  vote_validated_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin') THEN
    -- Admin can see all registrations or specific one
    IF p_registration_id IS NOT NULL THEN
      RETURN QUERY
      SELECT r.id, r.full_name, r.phone, r.cedula, r.user_id, r.interest_area,
             r.user_level, r.passport_level, r.legal_accepted, r.oath_accepted,
             r.signature_confirmed, r.referral_code, r.referred_by, r.qr_code,
             r.donation_status, r.vote_validated_at, r.created_at, r.updated_at
      FROM registrations r WHERE r.id = p_registration_id;
    ELSE
      RETURN QUERY
      SELECT r.id, r.full_name, r.phone, r.cedula, r.user_id, r.interest_area,
             r.user_level, r.passport_level, r.legal_accepted, r.oath_accepted,
             r.signature_confirmed, r.referral_code, r.referred_by, r.qr_code,
             r.donation_status, r.vote_validated_at, r.created_at, r.updated_at
      FROM registrations r;
    END IF;
  ELSE
    -- Regular users can only see their own registration
    RETURN QUERY
    SELECT r.id, r.full_name, r.phone, r.cedula, r.user_id, r.interest_area,
           r.user_level, r.passport_level, r.legal_accepted, r.oath_accepted,
           r.signature_confirmed, r.referral_code, r.referred_by, r.qr_code,
           r.donation_status, r.vote_validated_at, r.created_at, r.updated_at
    FROM registrations r 
    WHERE r.user_id = auth.uid()
    AND (p_registration_id IS NULL OR r.id = p_registration_id);
  END IF;
END;
$$;

-- Create secure function to get donation data (without payment_proof_url)
CREATE OR REPLACE FUNCTION public.get_donations_safe(p_donation_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  registration_id uuid,
  amount numeric,
  status donation_status,
  cedula_confirmed text,
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin') THEN
    -- Admin can see all donations
    IF p_donation_id IS NOT NULL THEN
      RETURN QUERY
      SELECT d.id, d.registration_id, d.amount, d.status, d.cedula_confirmed,
             d.rejection_reason, d.reviewed_by, d.reviewed_at, d.created_at, d.updated_at
      FROM donations d WHERE d.id = p_donation_id;
    ELSE
      RETURN QUERY
      SELECT d.id, d.registration_id, d.amount, d.status, d.cedula_confirmed,
             d.rejection_reason, d.reviewed_by, d.reviewed_at, d.created_at, d.updated_at
      FROM donations d;
    END IF;
  ELSE
    -- Regular users can only see their own donations
    RETURN QUERY
    SELECT d.id, d.registration_id, d.amount, d.status, d.cedula_confirmed,
           d.rejection_reason, d.reviewed_by, d.reviewed_at, d.created_at, d.updated_at
    FROM donations d
    JOIN registrations r ON r.id = d.registration_id
    WHERE r.user_id = auth.uid()
    AND (p_donation_id IS NULL OR d.id = p_donation_id);
  END IF;
END;
$$;