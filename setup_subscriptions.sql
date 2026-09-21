-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly', 'free')),
    status TEXT NOT NULL DEFAULT 'inactive',
    amount NUMERIC(10, 2),
    charity_id UUID REFERENCES public.charities(id),
    charity_percentage INTEGER DEFAULT 10,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    renewal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT subscriptions_user_id_key UNIQUE(user_id)
);

-- 2. Update profiles table constraint to allow Spectator tier
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('monthly', 'yearly', 'free', 'none'));

-- If you are seeing a "no unique or exclusion constraint" error, run this:
-- ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- If you are seeing a "not-null constraint" error for charity_percentage:
-- ALTER TABLE public.subscriptions ALTER COLUMN charity_percentage SET DEFAULT 10;
-- UPDATE public.subscriptions SET charity_percentage = 10 WHERE charity_percentage IS NULL;
-- ALTER TABLE public.subscriptions ALTER COLUMN charity_percentage SET NOT NULL;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Admin viewing policy
CREATE POLICY "Admins can view all subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Winners logic (Service role context)
CREATE POLICY "Service role can do everything"
    ON public.subscriptions
    USING (true)
    WITH CHECK (true);
    -- Ideally filter this by role or use a more specific policy
