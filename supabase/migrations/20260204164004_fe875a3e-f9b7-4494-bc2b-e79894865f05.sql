-- ================================================
-- SECURITY FIX: Protect Sensitive Personal Data
-- ================================================

-- 1. Create a secure view for registrations that hides sensitive fields
-- This view will be used for general queries, hiding document URLs
CREATE VIEW public.registrations_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  phone,
  cedula,
  user_id,
  interest_area,
  user_level,
  passport_level,
  legal_accepted,
  oath_accepted,
  signature_confirmed,
  referral_code,
  referred_by,
  qr_code,
  donation_status,
  vote_validated_at,
  created_at,
  updated_at
  -- Explicitly EXCLUDES: cedula_front_url, cedula_back_url, selfie_url, vote_selfie_url
FROM public.registrations;

-- 2. Create a secure function to get own document URLs (with validation)
-- This ensures only the owner or admin can access sensitive URLs
CREATE OR REPLACE FUNCTION public.get_own_document_urls(p_registration_id uuid)
RETURNS TABLE (
  cedula_front_url text,
  cedula_back_url text,
  selfie_url text,
  vote_selfie_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id for this registration
  SELECT r.user_id INTO v_user_id
  FROM registrations r
  WHERE r.id = p_registration_id;
  
  -- Only allow if user owns this registration or is admin
  IF v_user_id = auth.uid() OR has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT r.cedula_front_url, r.cedula_back_url, r.selfie_url, r.vote_selfie_url
    FROM registrations r
    WHERE r.id = p_registration_id;
  ELSE
    -- Return empty result if not authorized
    RETURN;
  END IF;
END;
$$;

-- 3. Create a secure view for donations that hides payment proof URLs
CREATE VIEW public.donations_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  registration_id,
  amount,
  status,
  cedula_confirmed,
  rejection_reason,
  reviewed_by,
  reviewed_at,
  created_at,
  updated_at
  -- Explicitly EXCLUDES: payment_proof_url
FROM public.donations;

-- 4. Create a secure function to get payment proof URL (with validation)
CREATE OR REPLACE FUNCTION public.get_payment_proof_url(p_donation_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_url text;
BEGIN
  -- Get the user_id for this donation through registration
  SELECT r.user_id, d.payment_proof_url INTO v_user_id, v_url
  FROM donations d
  JOIN registrations r ON r.id = d.registration_id
  WHERE d.id = p_donation_id;
  
  -- Only allow if user owns this donation or is admin
  IF v_user_id = auth.uid() OR has_role(auth.uid(), 'admin') THEN
    RETURN v_url;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- 5. Add audit logging for role changes
CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL CHECK (action IN ('assigned', 'removed', 'updated')),
  performed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view role audit logs"
ON public.role_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO role_audit_log (user_id, role, action, performed_by)
    VALUES (NEW.user_id, NEW.role, 'assigned', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO role_audit_log (user_id, role, action, performed_by)
    VALUES (OLD.user_id, OLD.role, 'removed', auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO role_audit_log (user_id, role, action, performed_by)
    VALUES (NEW.user_id, NEW.role, 'updated', auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER tr_log_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- 6. Prevent admins from modifying their own roles (security measure)
CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot modify your own roles';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot modify your own roles';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER tr_prevent_self_role_mod
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_modification();

-- 7. Create secure referral validation function (prevents user enumeration)
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only returns true/false, does not expose any user information
  RETURN EXISTS (
    SELECT 1 FROM registrations WHERE referral_code = p_code
  );
END;
$$;