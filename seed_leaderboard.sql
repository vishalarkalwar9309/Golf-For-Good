-- ============================================================
-- SEED LEADERBOARD DATA
-- Run this in your Supabase SQL Editor
-- This will populate the Global Leaderboard with Elite Mock Data
-- ============================================================

-- 1. Insert Mock Elite Users (Profiles)
-- Using hardcoded UUIDs for consistency in seeding

INSERT INTO public.profiles (id, full_name, role, total_impact, subscription_status, subscription_tier)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Alexander "Ace" Sterling', 'user', 12450.00, 'active', 'yearly'),
  ('00000000-0000-0000-0000-000000000002', 'Sophia "The Alchemist" Chen', 'user', 9820.50, 'active', 'monthly'),
  ('00000000-0000-0000-0000-000000000003', 'Julian "Fairway" Thorne', 'user', 7540.00, 'active', 'yearly'),
  ('00000000-0000-0000-0000-000000000004', 'Elena "Impact" Rodriguez', 'user', 6210.00, 'active', 'monthly'),
  ('00000000-0000-0000-0000-000000000005', 'Marcus "Par" Vane', 'user', 4890.25, 'active', 'yearly'),
  ('00000000-0000-0000-0000-000000000006', 'Clara "Catalyst" Moon', 'user', 3450.00, 'active', 'monthly'),
  ('00000000-0000-0000-0000-000000000007', 'Victor "Eagle" Draken', 'user', 2100.00, 'active', 'monthly'),
  ('00000000-0000-0000-0000-000000000008', 'Sarah "Birdie" Wells', 'user', 1850.50, 'active', 'monthly'),
  ('00000000-0000-0000-0000-000000000009', 'David "Matrix" Smith', 'user', 1200.00, 'active', 'monthly'),
  ('00000000-0000-0000-0000-000000000010', 'Zoe "Sovereign" Bell', 'user', 950.00, 'active', 'monthly')
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  total_impact = EXCLUDED.total_impact;

-- 2. Insert Scores for Alexander (Avg: ~42.0)
INSERT INTO public.scores (user_id, stableford_points, course_name, date)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 44, 'St Andrews Old Course', '2026-03-28'),
  ('00000000-0000-0000-0000-000000000001', 42, 'Royal Troon', '2026-03-20'),
  ('00000000-0000-0000-0000-000000000001', 40, 'Muirfield', '2026-03-15'),
  ('00000000-0000-0000-0000-000000000001', 45, 'Carnoustie Links', '2026-03-10'),
  ('00000000-0000-0000-0000-000000000001', 39, 'Turnberry', '2026-03-01');

-- 3. Insert Scores for Sophia (Avg: ~40.4)
INSERT INTO public.scores (user_id, stableford_points, course_name, date)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 41, 'Pebble Beach', '2026-03-25'),
  ('00000000-0000-0000-0000-000000000002', 39, 'Cypress Point', '2026-03-20'),
  ('00000000-0000-0000-0000-000000000002', 43, 'Shinnecock Hills', '2026-03-15'),
  ('00000000-0000-0000-0000-000000000002', 40, 'Oakmont CC', '2026-03-10'),
  ('00000000-0000-0000-0000-000000000002', 39, 'Merion Golf Club', '2026-03-05');

-- 4. Insert Scores for Julian (Avg: ~38.6)
INSERT INTO public.scores (user_id, stableford_points, course_name, date)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 38, 'Wentworth Club', '2026-03-27'),
  ('00000000-0000-0000-0000-000000000003', 40, 'Sunningdale Old', '2026-03-22'),
  ('00000000-0000-0000-0000-000000000003', 37, 'Walton Heath', '2026-03-18'),
  ('00000000-0000-0000-0000-000000000003', 39, 'Royal St Georges', '2026-03-12'),
  ('00000000-0000-0000-0000-000000000003', 39, 'Woodhall Spa', '2026-03-08');

-- 5. Insert Scores for Elena (Avg: ~37.2)
INSERT INTO public.scores (user_id, stableford_points, course_name, date)
VALUES 
  ('00000000-0000-0000-0000-000000000004', 36, 'Valderrama', '2026-03-29'),
  ('00000000-0000-0000-0000-000000000004', 38, 'PGA Catalunya', '2026-03-24'),
  ('00000000-0000-0000-0000-000000000004', 37, 'Finca Cortesin', '2026-03-19'),
  ('00000000-0000-0000-0000-000000000004', 35, 'La Reserva', '2026-03-14'),
  ('00000000-0000-0000-0000-000000000004', 40, 'Golf de Santander', '2026-03-09');

-- 6. Insert Scores for Marcus (Avg: ~35.4)
INSERT INTO public.scores (user_id, stableford_points, course_name, date)
VALUES 
  ('00000000-0000-0000-0000-000000000005', 35, 'Royal Melbourne', '2026-03-30'),
  ('00000000-0000-0000-0000-000000000005', 34, 'Kingston Heath', '2026-03-25'),
  ('00000000-0000-0000-0000-000000000005', 36, 'New South Wales', '2026-03-20'),
  ('00000000-0000-0000-0000-000000000005', 37, 'Victoria Golf Club', '2026-03-15'),
  ('00000000-0000-0000-0000-000000000005', 35, 'Metro GC', '2026-03-10');

-- 7. Add provisional users (fewer than 5 rounds)
INSERT INTO public.scores (user_id, stableford_points, course_name, date)
VALUES 
  ('00000000-0000-0000-0000-000000000006', 42, 'Le Golf National', '2026-03-30'),
  ('00000000-0000-0000-0000-000000000006', 44, 'Chateau de Chantilly', '2026-03-28'),
  ('00000000-0000-0000-0000-000000000007', 38, 'Emirates GC', '2026-03-25');

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
