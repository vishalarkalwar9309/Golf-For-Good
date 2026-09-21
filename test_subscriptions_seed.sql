-- ============================================================
-- TEST SUBSCRIPTIONS SEED
-- Run this in your Supabase SQL Editor
-- This ensures the Elite Seed users are considered "Active" by the Draw Engine
-- ============================================================

-- 1. Insert Active Subscriptions for Seed Users
-- The Draw Engine checks the `subscriptions` table for `status = 'active'`

INSERT INTO public.subscriptions (user_id, status, plan_type, amount, start_date)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'active', 'yearly', 250.00, now()),
  ('00000000-0000-0000-0000-000000000002', 'active', 'monthly', 25.00, now()),
  ('00000000-0000-0000-0000-000000000003', 'active', 'yearly', 250.00, now()),
  ('00000000-0000-0000-0000-000000000004', 'active', 'monthly', 25.00, now()),
  ('00000000-0000-0000-0000-000000000005', 'active', 'yearly', 250.00, now()),
  ('00000000-0000-0000-0000-000000000006', 'active', 'monthly', 25.00, now()),
  ('00000000-0000-0000-0000-000000000007', 'active', 'monthly', 25.00, now()),
  ('00000000-0000-0000-0000-000000000008', 'active', 'monthly', 25.00, now()),
  ('00000000-0000-0000-0000-000000000009', 'active', 'monthly', 25.00, now()),
  ('00000000-0000-0000-0000-000000000010', 'active', 'monthly', 25.00, now())
ON CONFLICT (user_id) DO UPDATE SET 
  status = EXCLUDED.status,
  plan_type = EXCLUDED.plan_type;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
