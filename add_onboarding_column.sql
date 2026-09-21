-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Ensure all current profiles are marked as completed if they existed before this change
-- (Optional: only if you want to skip onboarding for existing users)
UPDATE public.profiles SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL;

-- If you have a subscription with a charity already, you're definitely done with onboarding
UPDATE public.profiles p
SET onboarding_completed = TRUE
FROM public.subscriptions s
WHERE p.id = s.user_id AND s.charity_id IS NOT NULL;
