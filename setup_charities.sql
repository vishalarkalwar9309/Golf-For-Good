-- ============================================================
-- CHARITIES TABLE: Ensure RLS allows public read access
-- Run this in Supabase SQL Editor if charities aren't loading
-- ============================================================

-- Make sure the table exists (safe if already exists)
CREATE TABLE IF NOT EXISTS public.charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    category TEXT DEFAULT 'General',
    total_raised NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Public read access for charities" ON public.charities;
DROP POLICY IF EXISTS "Admins can manage charities" ON public.charities;
DROP POLICY IF EXISTS "Authenticated users can view charities" ON public.charities;

-- Allow ANYONE (including logged-in users on onboarding) to read charities
CREATE POLICY "Public read access for charities"
ON public.charities FOR SELECT
USING (true);

-- Allow admins to insert/update/delete
CREATE POLICY "Admins can manage charities"
ON public.charities FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
));

-- ============================================================
-- SEED: Insert sample charities if none exist
-- ============================================================
INSERT INTO public.charities (name, description, category, logo_url, website_url, total_raised)
SELECT * FROM (VALUES
    (
        'Macmillan Cancer Support',
        'We provide physical, financial, and emotional support to help people live life as fully as they can when affected by cancer.',
        'Health',
        'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Macmillan_Cancer_Support_logo.svg/320px-Macmillan_Cancer_Support_logo.svg.png',
        'https://www.macmillan.org.uk',
        12450.00
    ),
    (
        'British Heart Foundation',
        'The UK''s largest independent funder of cardiovascular research. Fighting heart and circulatory diseases.',
        'Health',
        'https://upload.wikimedia.org/wikipedia/en/thumb/b/bd/British_Heart_Foundation_Logo.svg/320px-British_Heart_Foundation_Logo.svg.png',
        'https://www.bhf.org.uk',
        9870.00
    ),
    (
        'Oxfam GB',
        'Fighting poverty and injustice around the world. Providing emergency relief and long-term development support.',
        'Humanitarian',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Oxfam-logo.svg/320px-Oxfam-logo.svg.png',
        'https://www.oxfam.org.uk',
        7320.00
    ),
    (
        'WWF UK',
        'Working to conserve nature and reduce the most pressing threats to the diversity of life on Earth.',
        'Environment',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/WWF_logo.svg/320px-WWF_logo.svg.png',
        'https://www.wwf.org.uk',
        5940.00
    ),
    (
        'RNLI',
        'The Royal National Lifeboat Institution saves lives at sea. Operating 24/7 around the UK and Irish coastline.',
        'Emergency Services',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/RNLI_logo.svg/320px-RNLI_logo.svg.png',
        'https://rnli.org',
        6120.00
    ),
    (
        'Age UK',
        'Supporting older people to live fulfilling lives. Providing information, friendship, advice and care locally and nationally.',
        'Community',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Age_UK_logo.svg/320px-Age_UK_logo.svg.png',
        'https://www.ageuk.org.uk',
        4350.00
    )
) AS new_charities(name, description, category, logo_url, website_url, total_raised)
WHERE NOT EXISTS (SELECT 1 FROM public.charities LIMIT 1);
