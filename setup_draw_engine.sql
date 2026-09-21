-- Updated Draw Engine Schema

-- 1. Update existing draws table (or create if not exists)
CREATE TABLE IF NOT EXISTS public.draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_month TEXT NOT NULL, -- YYYY-MM
    draw_year TEXT NOT NULL, -- YYYY
    draw_mode TEXT CHECK (draw_mode IN ('random', 'algorithmic')),
    winning_numbers INTEGER[] NOT NULL, -- The 5 winning numbers
    prize_pool NUMERIC(10, 2) NOT NULL,
    jackpot_rollover_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'published')) DEFAULT 'pending',
    winners JSONB DEFAULT '[]'::jsonb, -- Cache of winning results for quick UI display
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create draw_entries table to track every participant's result
CREATE TABLE IF NOT EXISTS public.draw_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_numbers INTEGER[] NOT NULL, -- The user's latest 5 scores
    match_count INTEGER NOT NULL DEFAULT 0,
    prize_amount NUMERIC(10, 2) DEFAULT 0,
    winner_status TEXT CHECK (winner_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_draws_month_year ON public.draws(draw_month, draw_year);

-- Ensure RLS is enabled
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Draws: Everyone with an active account can view published draws
CREATE POLICY "Users can view published draws" 
    ON public.draws FOR SELECT 
    USING (status = 'published' OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

-- Draw Entries: Users can view their own entries
CREATE POLICY "Users can view their own draw entries" 
    ON public.draw_entries FOR SELECT 
    USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

-- Admin can do everything
CREATE POLICY "Admin full access for draws" 
    ON public.draws FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access for draw_entries" 
    ON public.draw_entries FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Helper view for latest rollover (Get the last published draw's new rollover)
CREATE OR REPLACE VIEW public.latest_draw_rollover AS
SELECT jackpot_rollover_amount
FROM public.draws
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 1;
