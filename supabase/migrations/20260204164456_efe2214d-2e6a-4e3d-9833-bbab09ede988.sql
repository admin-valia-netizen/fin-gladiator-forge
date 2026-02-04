-- ================================================
-- SECURITY FIX: Lock down role_audit_log completely
-- ================================================

-- No one can insert directly (only through trigger with SECURITY DEFINER)
-- The trigger function uses SECURITY DEFINER so it bypasses RLS
CREATE POLICY "No direct insert to audit log"
ON public.role_audit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

-- No one can update audit logs (immutable)
CREATE POLICY "No updates to audit log"
ON public.role_audit_log
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- No one can delete audit logs (permanent record)
CREATE POLICY "No deletes from audit log"
ON public.role_audit_log
FOR DELETE
TO authenticated
USING (false);