-- =============================================================
-- SECURITY FIX: Complete RLS and Storage Security Overhaul
-- =============================================================

-- STEP 1: Add user_id column to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);

-- =============================================================
-- STEP 2: Fix registrations RLS policies - Remove permissive policies
-- =============================================================

-- Drop all existing permissive policies
DROP POLICY IF EXISTS "Users can view own registration" ON public.registrations;
DROP POLICY IF EXISTS "Users can update own registration" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;

-- Create secure SELECT policy - users can only view their own registration
CREATE POLICY "Users can view own registration"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Create secure UPDATE policy - users can only update their own registration  
CREATE POLICY "Users can update own registration"
ON public.registrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create secure INSERT policy - authenticated users can only create registrations linked to themselves
CREATE POLICY "Authenticated users can register"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- STEP 3: Fix donations RLS policies - Add proper user ownership
-- =============================================================

-- Drop existing weak policies
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can create own donations" ON public.donations;

-- Create secure SELECT policy - users can only view donations linked to their registration
CREATE POLICY "Users can view own donations"
ON public.donations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r 
    WHERE r.id = donations.registration_id 
    AND r.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Create secure INSERT policy - users can only create donations for their own registration
CREATE POLICY "Users can create own donations"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registrations r 
    WHERE r.id = donations.registration_id 
    AND r.user_id = auth.uid()
  )
);

-- =============================================================
-- STEP 4: Fix storage bucket - Make private and add secure policies
-- =============================================================

-- Make the evidencias bucket private
UPDATE storage.buckets SET public = false WHERE id = 'evidencias';

-- Drop existing permissive storage policies
DROP POLICY IF EXISTS "Anyone can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Evidence is publicly readable" ON storage.objects;

-- Create secure storage INSERT policy - authenticated users upload to their own folder
CREATE POLICY "Authenticated users upload own evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create secure storage SELECT policy - users read their own files, admins read all
CREATE POLICY "Users read own evidence"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Create storage UPDATE policy for users to update their own files
CREATE POLICY "Users update own evidence"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencias'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage DELETE policy for users to delete their own files
CREATE POLICY "Users delete own evidence"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias'
  AND (storage.foldername(name))[1] = auth.uid()::text
);