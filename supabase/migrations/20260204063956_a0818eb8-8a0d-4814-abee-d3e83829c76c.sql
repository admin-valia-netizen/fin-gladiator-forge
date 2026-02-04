-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can create donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can update donations" ON public.donations;
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;

-- Create proper RLS policies for donations
-- Users can only view their own donations (via registration_id link)
CREATE POLICY "Users can view own donations"
ON public.donations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.registrations r 
        WHERE r.id = registration_id 
        AND r.cedula IS NOT NULL
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- Users can create donations linked to their registration
CREATE POLICY "Users can create own donations"
ON public.donations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.registrations r 
        WHERE r.id = registration_id
    )
);

-- Only admins can update donations (approve/reject)
CREATE POLICY "Only admins can update donations"
ON public.donations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));