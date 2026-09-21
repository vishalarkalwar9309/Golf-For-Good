-- ============================================================
-- FIX LEADERBOARD RLS POLICIES
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Elevate permissions on the `public.profiles` table
-- To allow public visibility of player names and impact for rankings

DROP POLICY IF EXISTS "Public profiles are visible for leaderboard" ON public.profiles;
CREATE POLICY "Public profiles are visible for leaderboard" ON public.profiles
  FOR SELECT USING (true);

-- Elevate permissions on the `public.scores` table
-- To allow public calculation of global averages

DROP POLICY IF EXISTS "Public scores are visible for leaderboard" ON public.scores;
CREATE POLICY "Public scores are visible for leaderboard" ON public.scores
  FOR SELECT USING (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
