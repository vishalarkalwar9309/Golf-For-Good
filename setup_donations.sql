-- ============================================================
-- INDEPENDENT DONATIONS SCHEMA & TRIGGERS
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Ensure the donations table has the correct columns
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    donation_type TEXT NOT NULL CHECK (donation_type IN ('independent', 'subscription_share')),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Delete old policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can insert their own donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;

-- Policies
CREATE POLICY "Users can view their own donations"
    ON public.donations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own donations"
    ON public.donations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all donations"
    ON public.donations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- IMPACT TRACKING TRIGGERS
-- Automatically update charity total_raised and user profile total_impact
-- ============================================================

-- Function to update totals
CREATE OR REPLACE FUNCTION public.handle_donation_impact()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Update Charity Total Raised
    UPDATE public.charities
    SET total_raised = total_raised + NEW.amount
    WHERE id = NEW.charity_id;

    -- 2. Update User Profile Total Impact
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET total_impact = total_impact + NEW.amount
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS tr_donation_impact ON public.donations;
CREATE TRIGGER tr_donation_impact
    AFTER INSERT ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_donation_impact();

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
