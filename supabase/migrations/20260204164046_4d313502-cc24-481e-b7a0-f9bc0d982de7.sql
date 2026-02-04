-- ================================================
-- SECURITY FIX: Add RLS to views and DELETE policies
-- ================================================

-- 1. Enable RLS on registrations_safe view (views need RLS too)
-- Note: Views with security_invoker=on inherit RLS from base table
-- But we need to add explicit policies to the base tables for DELETE

-- 2. Add DELETE policies for registrations (only admins, and preserve audit)
CREATE POLICY "Only admins can delete registrations"
ON public.registrations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3. Add DELETE policies for donations (only admins, and preserve audit)
CREATE POLICY "Only admins can delete donations"
ON public.donations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 4. Add RLS policies to role_audit_log for INSERT (system only through trigger)
-- The trigger runs as SECURITY DEFINER so it can insert
-- No direct INSERT policy needed for users

-- 5. Ensure the views work correctly with RLS
-- Since views use security_invoker=on, they inherit the base table's RLS
-- The registrations_safe and donations_safe views will respect the 
-- underlying table policies automatically