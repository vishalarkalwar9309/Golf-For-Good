-- ============================================================
-- DIGITAL HEROES PLATFORM: COMPLETE PRODUCTION SCHEMA
-- Single Source of Truth conforming to the Digital Heroes PRD
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'lapsed')),
    subscription_tier TEXT NOT NULL DEFAULT 'none' CHECK (subscription_tier IN ('monthly', 'yearly', 'free', 'none')),
    selected_charity_id UUID,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    lifetime_winnings NUMERIC(12, 2) DEFAULT 0,
    total_impact NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. CHARITIES TABLE
CREATE TABLE IF NOT EXISTS public.charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,
    logo_url TEXT,
    image_url TEXT,
    website_url TEXT,
    category TEXT DEFAULT 'General',
    total_raised NUMERIC(12, 2) DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    upcoming_events JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'free')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'lapsed')),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
    charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL,
    charity_percentage INTEGER NOT NULL DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    renewal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT subscriptions_user_id_key UNIQUE(user_id)
);

-- 5. SCORES TABLE
-- PRD Requirement: Stableford range 1-45, date required, only one score per date per user.
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    date DATE NOT NULL,
    stableford_points INTEGER NOT NULL CHECK (stableford_points >= 1 AND stableford_points <= 45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT scores_user_date_key UNIQUE(user_id, date)
);

-- 6. DRAWS TABLE
-- PRD Requirement: 5-match, 4-match, 3-match, monthly cadence, rollover tracking
CREATE TABLE IF NOT EXISTS public.draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_month TEXT NOT NULL, -- YYYY-MM
    draw_year TEXT NOT NULL, -- YYYY
    draw_mode TEXT NOT NULL CHECK (draw_mode IN ('random', 'algorithmic')),
    winning_numbers INTEGER[] NOT NULL, -- 5 winning numbers in 1-45 range
    prize_pool NUMERIC(12, 2) NOT NULL,
    jackpot_rollover_amount NUMERIC(12, 2) DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'published')) DEFAULT 'pending',
    winners JSONB DEFAULT '[]'::jsonb,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. DRAW ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.draw_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_numbers INTEGER[] NOT NULL, -- user's latest 5 scores
    match_count INTEGER NOT NULL DEFAULT 0,
    prize_amount NUMERIC(12, 2) DEFAULT 0,
    winner_status TEXT NOT NULL CHECK (winner_status IN ('none', 'pending', 'pending_verification', 'approved', 'rejected', 'paid')) DEFAULT 'none',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT draw_entries_user_draw_key UNIQUE(draw_id, user_id)
);

-- 8. WINNER PROOFS TABLE
CREATE TABLE IF NOT EXISTS public.winner_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
    draw_entry_id UUID REFERENCES public.draw_entries(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    review_note TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT winner_proofs_user_draw_key UNIQUE(user_id, draw_id)
);

-- 9. INDEPENDENT DONATIONS TABLE
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    donation_type TEXT NOT NULL CHECK (donation_type IN ('independent', 'subscription_share')),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- INDICES FOR OPTIMAL PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON public.scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_draws_month ON public.draws(draw_month);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON public.draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_charities_slug ON public.charities(slug);

-- ============================================================
-- SECURITY DEFINER HELPER FUNCTION (PREVENTS RLS RECURSION)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DATABASE TRIGGERS & BUSINESS LOGIC ENFORCEMENT
-- ============================================================

-- A. Auto-create Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, subscription_status, subscription_tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user',
        'inactive',
        'none'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Prevent Privilege Escalation on Profiles Role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: only administrators can alter user roles.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- C. Score Retention Trigger: PRD Mandate
-- Enforces maximum 5 latest scores; automatically supersedes oldest when a 6th score is inserted
CREATE OR REPLACE FUNCTION public.handle_score_retention()
RETURNS TRIGGER AS $$
DECLARE
    score_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO score_count
    FROM public.scores
    WHERE user_id = NEW.user_id;

    IF score_count > 5 THEN
        DELETE FROM public.scores
        WHERE id IN (
            SELECT id FROM public.scores
            WHERE user_id = NEW.user_id
            ORDER BY date ASC, created_at ASC
            LIMIT (score_count - 5)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_score_retention ON public.scores;
CREATE TRIGGER tr_score_retention
    AFTER INSERT ON public.scores
    FOR EACH ROW EXECUTE FUNCTION public.handle_score_retention();

-- D. Draw Entries Integrity Protection
CREATE OR REPLACE FUNCTION public.protect_draw_entries()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        -- Non-admins cannot alter prize_amount, match_count, entry_numbers, or draw_id
        IF NEW.prize_amount <> OLD.prize_amount OR
           NEW.match_count <> OLD.match_count OR
           NEW.entry_numbers <> OLD.entry_numbers OR
           NEW.draw_id <> OLD.draw_id OR
           NEW.user_id <> OLD.user_id THEN
            RAISE EXCEPTION 'Unauthorized: draw match data cannot be altered by users.';
        END IF;
        -- Non-admins can only transition status to pending_verification
        IF NEW.winner_status NOT IN ('pending', 'pending_verification') THEN
            RAISE EXCEPTION 'Unauthorized status update.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_draw_entries ON public.draw_entries;
CREATE TRIGGER tr_protect_draw_entries
    BEFORE UPDATE ON public.draw_entries
    FOR EACH ROW EXECUTE FUNCTION public.protect_draw_entries();

-- E. Donations Impact Trigger
CREATE OR REPLACE FUNCTION public.handle_donation_impact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.charities
    SET total_raised = total_raised + NEW.amount
    WHERE id = NEW.charity_id;

    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET total_impact = total_impact + NEW.amount
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_donation_impact ON public.donations;
CREATE TRIGGER tr_donation_impact
    AFTER INSERT ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.handle_donation_impact();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are visible for leaderboard" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (public.is_admin());

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
    ON public.profiles FOR ALL 
    USING (public.is_admin());

-- 2. Charities Policies
DROP POLICY IF EXISTS "Public read access for charities" ON public.charities;
DROP POLICY IF EXISTS "Admins can manage charities" ON public.charities;

CREATE POLICY "Public read access for charities" 
    ON public.charities FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage charities" 
    ON public.charities FOR ALL 
    USING (public.is_admin());

-- 3. Subscriptions Policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can do everything" ON public.subscriptions;

CREATE POLICY "Users can view their own subscription" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
    ON public.subscriptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
    ON public.subscriptions FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
    ON public.subscriptions FOR ALL 
    USING (public.is_admin());

-- 4. Scores Policies
DROP POLICY IF EXISTS "Users can view their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can insert their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can update their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can delete their own scores" ON public.scores;
DROP POLICY IF EXISTS "Admins can manage all scores" ON public.scores;
DROP POLICY IF EXISTS "Public scores are visible for leaderboard" ON public.scores;

CREATE POLICY "Users can view their own scores" 
    ON public.scores FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores" 
    ON public.scores FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores" 
    ON public.scores FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scores" 
    ON public.scores FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all scores" 
    ON public.scores FOR ALL 
    USING (public.is_admin());

-- 5. Draws Policies
DROP POLICY IF EXISTS "Users can view published draws" ON public.draws;
DROP POLICY IF EXISTS "Admin full access for draws" ON public.draws;

CREATE POLICY "Users can view published draws" 
    ON public.draws FOR SELECT 
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admin full access for draws" 
    ON public.draws FOR ALL 
    USING (public.is_admin());

-- 6. Draw Entries Policies
DROP POLICY IF EXISTS "Users can view their own draw entries" ON public.draw_entries;
DROP POLICY IF EXISTS "Admin full access for draw_entries" ON public.draw_entries;
DROP POLICY IF EXISTS "Users can update their entry status" ON public.draw_entries;
DROP POLICY IF EXISTS "Users can update their own entry status" ON public.draw_entries;

CREATE POLICY "Users can view their own draw entries" 
    ON public.draw_entries FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their own entry status" 
    ON public.draw_entries FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access for draw_entries" 
    ON public.draw_entries FOR ALL 
    USING (public.is_admin());

-- 7. Winner Proofs Policies
DROP POLICY IF EXISTS "Users can view their own proofs" ON public.winner_proofs;
DROP POLICY IF EXISTS "Users can insert their own proofs" ON public.winner_proofs;
DROP POLICY IF EXISTS "Users can update their own proofs" ON public.winner_proofs;
DROP POLICY IF EXISTS "Admins can manage proofs" ON public.winner_proofs;

CREATE POLICY "Users can view their own proofs" 
    ON public.winner_proofs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proofs" 
    ON public.winner_proofs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proofs" 
    ON public.winner_proofs FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage proofs" 
    ON public.winner_proofs FOR ALL 
    USING (public.is_admin());

-- 8. Donations Policies
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can insert their own donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;

CREATE POLICY "Users can view their own donations" 
    ON public.donations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own donations" 
    ON public.donations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all donations" 
    ON public.donations FOR SELECT 
    USING (public.is_admin());

-- ============================================================
-- STORAGE BUCKET & POLICIES (WINNER PROOFS)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('winner-proofs', 'winner-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view winner proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can view proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all proofs" ON storage.objects;

-- Allow public / authorized direct reads of proofs
CREATE POLICY "Public can view winner proofs" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'winner-proofs');

-- Restrict uploads so authenticated users can only write to their own user_id directory
CREATE POLICY "Users can upload their own proofs" 
    ON storage.objects FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'winner-proofs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Restrict updates to file owners
CREATE POLICY "Users can update their own proofs" 
    ON storage.objects FOR UPDATE 
    TO authenticated
    USING (
        bucket_id = 'winner-proofs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Restrict deletes to file owners
CREATE POLICY "Users can delete their own proofs" 
    ON storage.objects FOR DELETE 
    TO authenticated
    USING (
        bucket_id = 'winner-proofs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins retain full administrative control over all objects in the bucket
CREATE POLICY "Admins can manage all proofs" 
    ON storage.objects FOR ALL 
    TO authenticated
    USING (
        bucket_id = 'winner-proofs' 
        AND public.is_admin()
    );

-- ============================================================
-- CHARITY DIRECTORY SEED DATA
-- ============================================================
INSERT INTO public.charities (name, slug, description, long_description, category, logo_url, image_url, website_url, featured, total_raised, upcoming_events)
VALUES
(
    'Macmillan Cancer Support',
    'macmillan-cancer-support',
    'We provide physical, financial, and emotional support to help people live life as fully as they can when affected by cancer.',
    'Macmillan Cancer Support is one of the largest British charities and provides specialist health care, information and financial support to people affected by cancer. It also looks at the social, emotional and practical impact cancer can have, and campaigns for better cancer care.',
    'Health',
    'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Macmillan_Cancer_Support_logo.svg/320px-Macmillan_Cancer_Support_logo.svg.png',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    'https://www.macmillan.org.uk',
    true,
    14500.00,
    '[{"title": "The World''s Biggest Coffee Morning", "date": "Sept 27, 2026", "location": "Nationwide / UK"}, {"title": "London Marathon Charity Wave", "date": "April 20, 2026", "location": "London, UK"}]'::jsonb
),
(
    'British Heart Foundation',
    'british-heart-foundation',
    'The UK''s largest independent funder of cardiovascular research. Fighting heart and circulatory diseases.',
    'The British Heart Foundation funds research, education, care and awareness campaigns aimed at preventing heart and circulatory diseases. Heart and circulatory diseases kill 1 in 4 people in the UK.',
    'Health',
    'https://upload.wikimedia.org/wikipedia/en/thumb/b/bd/British_Heart_Foundation_Logo.svg/320px-British_Heart_Foundation_Logo.svg.png',
    'https://images.unsplash.com/photo-1505751172107-573225a94501?auto=format&fit=crop&w=1200&q=80',
    'https://www.bhf.org.uk',
    true,
    11200.00,
    '[{"title": "London to Brighton Bike Ride", "date": "June 14, 2026", "location": "London / Brighton"}]'::jsonb
),
(
    'Oxfam GB',
    'oxfam-gb',
    'Fighting poverty and injustice around the world. Providing emergency relief and long-term development support.',
    'Oxfam is a global movement of millions of people working together to end the injustice of poverty. We provide immediate emergency relief and long-term development support to vulnerable communities.',
    'Humanitarian',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Oxfam-logo.svg/320px-Oxfam-logo.svg.png',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    'https://www.oxfam.org.uk',
    false,
    8450.00,
    '[]'::jsonb
),
(
    'WWF UK',
    'wwf-uk',
    'Working to conserve nature and reduce the most pressing threats to the diversity of life on Earth.',
    'WWF is the world''s leading independent conservation organization. Our mission is to create a world where people and wildlife can thrive together, preserving our forests, oceans, and endangered wildlife.',
    'Environment',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/WWF_logo.svg/320px-WWF_logo.svg.png',
    'https://images.unsplash.com/photo-1470058869958-2a77bd4469bc?auto=format&fit=crop&w=1200&q=80',
    'https://www.wwf.org.uk',
    true,
    9800.00,
    '[{"title": "Earth Hour 2026", "date": "March 28, 2026", "location": "Global"}]'::jsonb
),
(
    'RNLI',
    'rnli',
    'The Royal National Lifeboat Institution saves lives at sea. Operating 24/7 around the UK and Irish coastline.',
    'The RNLI charity saves lives at sea. Its volunteer lifeboat crews provide a 24-hour search and rescue service around the United Kingdom and Republic of Ireland coasts.',
    'Emergency Services',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/RNLI_logo.svg/320px-RNLI_logo.svg.png',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    'https://rnli.org',
    false,
    6920.00,
    '[]'::jsonb
),
(
    'Age UK',
    'age-uk',
    'Supporting older people to live fulfilling lives. Providing information, friendship, advice and care locally and nationally.',
    'Age UK believes that everyone should be able to love later life. We provide companionship, advice, support, and practical care for older people facing loneliness, illness, or financial hardship.',
    'Community',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Age_UK_logo.svg/320px-Age_UK_logo.svg.png',
    'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=1200&q=80',
    'https://www.ageuk.org.uk',
    false,
    5150.00,
    '[]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
