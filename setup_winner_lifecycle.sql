-- ============================================================
-- WINNER LIFECYCLE: Extend status model and add payout columns
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Extend draw_entries.winner_status to include new statuses
ALTER TABLE public.draw_entries DROP CONSTRAINT IF EXISTS draw_entries_winner_status_check;
ALTER TABLE public.draw_entries ADD CONSTRAINT draw_entries_winner_status_check
  CHECK (winner_status IN ('none', 'pending', 'pending_verification', 'approved', 'rejected', 'paid'));

-- 2. Add payout timestamp to draw_entries
ALTER TABLE public.draw_entries ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- 3. Ensure winner_proofs table exists with full columns
CREATE TABLE IF NOT EXISTS public.winner_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    review_note TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, draw_id) -- one proof per user per draw
);

-- 4. Enable RLS on winner_proofs
ALTER TABLE public.winner_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own proofs" ON public.winner_proofs;
DROP POLICY IF EXISTS "Users can insert their own proofs" ON public.winner_proofs;
DROP POLICY IF EXISTS "Admins can manage proofs" ON public.winner_proofs;

CREATE POLICY "Users can view their own proofs" ON public.winner_proofs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proofs" ON public.winner_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage proofs" ON public.winner_proofs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Add UPDATE policies (needed for upsert)
DROP POLICY IF EXISTS "Users can update their own proofs" ON public.winner_proofs;
CREATE POLICY "Users can update their own proofs" ON public.winner_proofs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Add UPDATE policies for draw_entries (Users need to change winner_status to pending_verification)
DROP POLICY IF EXISTS "Users can update their entry status" ON public.draw_entries;
CREATE POLICY "Users can update their entry status" ON public.draw_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Create Storage Bucket for Winner Proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage RLS Policies
DROP POLICY IF EXISTS "Public can view proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own proofs" ON storage.objects;

CREATE POLICY "Public can view proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'winner-proofs');

CREATE POLICY "Users can upload their own proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'winner-proofs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
