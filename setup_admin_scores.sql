-- ============================================================
-- ADMIN SCORE MANAGEMENT
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Elevate permissions on the `public.scores` table for Admins

-- Drop existing admin policies if they exist (to prevent duplicates)
DROP POLICY IF EXISTS "Admins can update scores" ON public.scores;
DROP POLICY IF EXISTS "Admins can delete scores" ON public.scores;
DROP POLICY IF EXISTS "Admins can view all scores" ON public.scores;

-- Create policy allowing Admins to read all scores
CREATE POLICY "Admins can view all scores" ON public.scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create policy allowing Admins to update user scores
CREATE POLICY "Admins can update scores" ON public.scores
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create policy allowing Admins to delete user scores
CREATE POLICY "Admins can delete scores" ON public.scores
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
