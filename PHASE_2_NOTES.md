# Digital Heroes Platform — Phase 2 Implementation Notes

## 1. What Was Implemented

In Phase 2, the application was brought to a fully functional production-ready state strictly adhering to the **Digital Heroes PRD (Level 1)** as the single source of truth:

1. **Supabase Production Schema (`setup_production_schema.sql`)**:
   - A single, self-contained, idempotent SQL migration covering all 8 core tables: `profiles`, `charities`, `subscriptions`, `scores`, `draws`, `draw_entries`, `winner_proofs`, and `donations`.
   - Comprehensive PostgreSQL integrity constraints (`CHECK` on Stableford range `1–45`, `UNIQUE(user_id, date)` on `scores`, `UNIQUE(user_id)` on `subscriptions`, `UNIQUE(user_id, draw_id)` on `winner_proofs`).
   - PostgreSQL business logic triggers:
     - `on_auth_user_created` (`handle_new_user()`): Auto-provisions player profiles on Supabase Auth signup.
     - `tr_protect_profile_role` (`protect_profile_role()`): Prevents privilege escalation by disallowing non-admins from altering their role to `admin`.
     - `tr_score_retention` (`handle_score_retention()`): Strictly enforces the 5-score rolling retention rule, automatically pruning older scores whenever a 6th is submitted.
     - `tr_protect_draw_entries` (`protect_draw_entries()`): Guards draw entry results from client tampering.
     - `tr_donation_impact` (`handle_donation_impact()`): Automatically tallies global and personal charity contributions.
   - Elimination of RLS infinite recursion via `is_admin()` helper function with `SECURITY DEFINER`.

2. **Authentication & Multi-Role Authorization**:
   - Clean public visitor access (homepage, charity directory, charity detail profiles, how it works).
   - Role-gated and subscription-gated subscriber access (dashboard overview, scores management, charity selection, draws, winnings vault).
   - Protected administrator console guarded at the route level (`ProtectedRoute adminOnly`), API level, and database level (`public.is_admin()`).

3. **Stripe Test Mode Integration**:
   - Serverless checkout session creator (`api/create-checkout.ts`) supporting Monthly ($25) and Yearly ($250) plans.
   - Customer billing portal generator (`api/create-portal.ts`) allowing subscribers to manage payment methods and cancellations.
   - Webhook event consumer (`api/webhook.ts`) for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`, keeping `subscriptions` and `profiles` tables in real-time synchronization with Stripe status (`active`, `cancelled`, `lapsed`).
   - Zero frontend leaks: Stripe secret key, Supabase service-role key, and Stripe webhook secret are strictly confined to server-side environments.

4. **Charity Contribution Engine**:
   - Charity selection during onboarding and post-onboarding dashboard modification.
   - Enforced minimum contribution of 10% with user-controlled increase up to 100%.
   - Full charity directory with search, category filtering, and slug-based profile pages.
   - Independent one-time donation modal not tied to draw gameplay.

5. **Draw & Reward Engine (`src/lib/draw.ts`)**:
   - Monthly cadence with 5-match, 4-match, and 3-match tiers.
   - Strict Stableford value constraint (`1–45`).
   - Random standard lottery-style draw mode (uniform distribution).
   - PRD-compliant **Algorithmic mode (weighted by empirical score frequency)** with Laplace smoothing and roulette-wheel sampling without replacement.
   - Dynamic prize pool auto-calculation from active subscribers (50% fee allocation) + rollover.
   - Predefined prize pool splits: **5-match = 40%**, **4-match = 35%**, **3-match = 25%**.
   - Equal prize splitting among multiple winners in the same match tier.
   - 5-match jackpot rollover carrying forward to subsequent draws when unclaimed.

6. **Winner Verification Flow & Storage**:
   - Dedicated `winner-proofs` Supabase storage bucket with user directory isolation and admin review permissions.
   - Winner scorecard upload component (`ProofUpload.tsx`).
   - Complete winner lifecycle states: `pending` -> `pending_verification` -> `approved` / `rejected` -> `paid`.
   - Admin verification interface (`Winners.tsx`) with image inspection, approval, rejection, and "Mark Paid" actions.

7. **Admin Analytics**:
   - All static mock revenue numbers replaced with live Supabase database aggregations.
   - Live MRR calculation from active subscriptions.
   - Dynamic monthly revenue trajectory and growth metrics.
   - Verified winner payout tracking and charity impact distribution.

---

## 2. What Was Fixed

1. **Database Schema & RLS Recursion**:
   - Resolved infinite recursion error in `profiles` RLS policies by delegating admin checks to `public.is_admin()`.
   - Removed insecure global RLS backdoor on `subscriptions` (`USING (true)`).
   - Pointed all foreign keys to `public.profiles(id)` enabling PostgREST relational joins (e.g. `profiles(full_name)`).
   - Added missing `draw_entry_id` column to `public.winner_proofs`.

2. **Draw Engine Bugs**:
   - Fixed number generation bug where winning numbers ranged from `0–50` (Stableford is strictly `1–45`).
   - Replaced hardcoded `$175,000` constant with dynamic pool calculation based on active subscribers.
   - Implemented true empirical frequency-weighted roulette sampling for algorithmic mode.

3. **Admin Console Runtime Crashes**:
   - Fixed SQL column mismatch in `src/pages/admin/Winners.tsx` which queried `draws.month` instead of `draws.draw_month`.
   - Fixed charity creation failure in `src/pages/admin/Charities.tsx` caused by missing `slug` and mismatched `is_featured` column.
   - Replaced mock revenue array in `src/pages/admin/Analytics.tsx` with live database queries.

4. **Score Management Compliance**:
   - Added duplicate date validation preventing more than one score per date per player.
   - Added score edit interface allowing players to update course name, date, and points.
   - Standardized point validation to strictly 1–45 across all views.
   - Hardened 5-score rolling logic both in frontend and database triggers.

5. **Client / Server Secrets Isolation**:
   - Verified that `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are never referenced in client code.
   - Made Supabase client initialization resilient to both browser (`import.meta.env`) and Node.js (`process.env`) runtime contexts.

---

## 3. Database Setup Requirements

To deploy the database to a fresh Supabase project:
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Open `setup_production_schema.sql` from this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. The script creates:
   - Extensions: `uuid-ossp`
   - Tables: `profiles`, `charities`, `subscriptions`, `scores`, `draws`, `draw_entries`, `winner_proofs`, `donations`
   - Indexes on query paths
   - Functions & Triggers: `is_admin()`, `handle_new_user()`, `protect_profile_role()`, `handle_score_retention()`, `protect_draw_entries()`, `handle_donation_impact()`
   - RLS Policies on all 8 tables
   - Storage bucket `winner-proofs` with RLS policies
   - Default seed data for 6 British charities

---

## 4. Supabase Configuration

1. **Authentication Settings**:
   - In Supabase Dashboard -> **Authentication** -> **Providers** -> **Email**:
     - Enable Email signup.
     - (Optional for development) Disable "Confirm email" for immediate login without email verification.
   - In **URL Configuration**:
     - Site URL: `https://your-production-domain.vercel.app` (or `http://localhost:3000` locally)
     - Redirect URLs: `https://your-production-domain.vercel.app/**`, `http://localhost:3000/**`

2. **Storage Bucket**:
   - The bucket `winner-proofs` is created automatically by `setup_production_schema.sql`.
   - Ensure the bucket is marked as `public: true` (or use signed URLs for restricted access).

3. **Promoting First Administrator**:
   - After creating your account via the signup page, run the following SQL query in the Supabase SQL Editor:
     ```sql
     UPDATE public.profiles
     SET role = 'admin'
     WHERE email = 'your-admin-email@example.com';
     ```

---

## 5. Stripe Test Configuration

1. **Create Products & Prices in Stripe Dashboard (Test Mode)**:
   - Monthly Plan:
     - Name: `Elite Monthly`
     - Price: `$25.00 USD / month` (Recurring)
     - Copy the Price ID (e.g. `price_1P...monthly`)
   - Yearly Plan:
     - Name: `Sovereign Yearly`
     - Price: `$250.00 USD / year` (Recurring)
     - Copy the Price ID (e.g. `price_1P...yearly`)

2. **Configure Customer Billing Portal**:
   - In Stripe Dashboard -> **Settings** -> **Customer Portal**:
     - Enable Customer Portal.
     - Allow customers to cancel subscriptions and update payment methods.

3. **Configure Stripe Webhooks**:
   - In Stripe Dashboard -> **Developers** -> **Webhooks**:
     - Add endpoint: `https://your-production-domain.vercel.app/api/webhook`
     - Select events:
       - `checkout.session.completed`
       - `customer.subscription.updated`
       - `customer.subscription.deleted`
     - Copy the Signing Secret (`whsec_...`).

---

## 6. Required Environment Variables

Create `.env.local` for local execution or configure in Vercel project settings:

```bash
# ==============================================================================
# CLIENT-SAFE ENVIRONMENT VARIABLES (VITE_)
# ==============================================================================
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==============================================================================
# SERVER-ONLY ENVIRONMENT VARIABLES (NEVER prefix with VITE_)
# ==============================================================================
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=https://<your-production-domain>.vercel.app
```

---

## 7. Draw Algorithm & Mathematical Specification

### Number Generation (`generateWinningNumbers`)
1. **Range**: Strictly Stableford integers `1–45`.
2. **Standard Random Mode**:
   - 5 unique numbers drawn with uniform probability $P(n) = \frac{1}{45}$.
   - Sorted in descending order.
3. **Algorithmic Mode (Weighted by Empirical Score Frequency)**:
   - **Histogram Construction**: Computes $f(n)$ = frequency of each score $n \in [1, 45]$ across all user scores in the database.
   - **Laplace / Baseline Smoothing**: Assigns weight $w(n) = f(n) + 1$ to ensure that even unplayed numbers retain a non-zero probability of being drawn.
   - **Roulette-Wheel Weighted Sampling Without Replacement**:
     Iteratively selects 5 distinct numbers. For step $k \in \{1, \dots, 5\}$:
     $$P(\text{select } i) = \frac{w(i)}{\sum_{j \in \text{available}} w(j)}$$
     A random threshold is drawn in $[0, \text{total available weight})$, accumulating weights to select $i$. Selected number $i$ is removed from available candidates.
   - Sorted in descending order (e.g. `[42, 38, 36, 31, 28]`).

---

## 8. Prize-Pool & Tier Calculation

- **Prize Pool Contribution**:
  $$\text{Contribution} = \sum_{s \in \text{active subs}} (\text{sub fee} \times 50\%)$$
  $$\text{Total Pool} = \max(\text{Contribution}, \$500) + \text{Rollover}$$
- **Tier Allocations (PRD § 07)**:
  - **5-Number Match**: 40% of Total Pool (Jackpot)
  - **4-Number Match**: 35% of Total Pool
  - **3-Number Match**: 25% of Total Pool
- **Winner Split**: Multiple winners in the same match tier receive an exact equal split:
  $$\text{Prize per Winner} = \frac{\text{Tier Pool}}{\text{Count of Tier Winners}}$$
- **Jackpot Rollover**: If 0 participants achieve a 5-match result, the entire 40% 5-match allocation carries forward as `jackpot_rollover_amount` to the subsequent draw. When at least 1 player wins the 5-match jackpot, rollover resets to 0.

---

## 9. Charity Contribution Calculation

- **Minimum Share**: 10% of monthly subscription fee ($2.50/mo on Monthly plan; $25.00/yr on Yearly plan).
- **Voluntary Increase**: Users can scale their contribution percentage from 10% to 100%.
- **Impact Separation**: Charity contributions are funded from subscription proceeds and do NOT deduct from or alter draw prize money.
- **One-off Donations**: Recorded in `donations` table, updating charity `total_raised` and user `total_impact`.

---

## 10. Winner Lifecycle State Machine

$$\text{none} \xrightarrow{\text{draw published}} \text{pending} \xrightarrow{\text{proof uploaded}} \text{pending\_verification} \xrightarrow{\text{admin review}} \begin{cases} \text{approved} \xrightarrow{\text{admin payout}} \text{paid} \\ \text{rejected} \xrightarrow{\text{re-upload}} \text{pending\_verification} \end{cases}$$

- **User**: Views winning draw in Winnings Vault, uploads official club scorecard screenshot, monitors verification status.
- **Admin**: Inspects proof in Admin Verification Console, clicks **Approve** or **Reject**, and clicks **Mark Paid** once funds are disbursed (recording `paid_at` timestamp).

---

## 11. Remaining Manual Setup

To connect live production services:
1. **Supabase**:
   - Create a fresh Supabase project at [supabase.com](https://supabase.com).
   - Run `setup_production_schema.sql` in the SQL Editor.
   - Note project URL and anon key.
2. **Stripe Test Mode**:
   - Create Monthly ($25) and Yearly ($250) prices.
   - Configure Customer Portal.
   - Add webhook endpoint pointing to `/api/webhook`.
3. **Deployment (Vercel)**:
   - Import repository to Vercel.
   - Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`).
   - Deploy.

---

## 12. E2E Test Results

The test suite in `scripts/e2e-verify.ts` was executed:

| Test ID | Checklist Item | Result | Verification Detail |
|---|---|---|---|
| **CHECK-A1** | Duplicate score per date constraint | **PASS** | `UNIQUE(user_id, date)` defined on `scores` |
| **CHECK-A2** | Stableford 1–45 point constraint | **PASS** | `CHECK (stableford_points >= 1 AND <= 45)` enforced |
| **CHECK-A3** | 5-score rolling retention trigger | **PASS** | `handle_score_retention()` trims scores beyond 5 |
| **CHECK-A4** | Admin authorization & RLS security | **PASS** | `is_admin()` SECURITY DEFINER eliminates recursion |
| **CHECK-A5** | Role privilege escalation prevention | **PASS** | `protect_profile_role()` rejects role updates |
| **CHECK-A6** | Storage bucket & upload policies | **PASS** | `winner-proofs` bucket configured with user directory RLS |
| **CHECK-B1** | Duplicate date frontend rejection | **PASS** | Second score on same date correctly detected & blocked |
| **CHECK-B2** | 6th score oldest pruning | **PASS** | Oldest score removed, leaving 5 latest chronologically |
| **CHECK-C1** | Random draw number specification | **PASS** | 5 unique numbers drawn in 1–45, sorted descending |
| **CHECK-D1** | Algorithmic frequency-weighted selection | **PASS** | High-frequency scores drawn at significantly higher rates |
| **CHECK-E1** | Tier splits (40% / 35% / 25%) | **PASS** | Exact PRD mathematical allocations confirmed |
| **CHECK-E2** | Multiple winner equal split | **PASS** | Winners in tier receive exact equal portions |
| **CHECK-E3** | 5-match jackpot rollover | **PASS** | Carries forward 40% to next draw on 0 winners |
| **CHECK-F1** | Charity contribution calculations | **PASS** | 10% min and voluntary % calculated without touching prizes |
| **CHECK-G1** | Winner state transitions | **PASS** | All valid states verified in lifecycle |

**Total: 15 / 15 Passed (0 Failures)**.

---

## 13. Known Limitations

1. **Vite Local Serverless API Execution**:
   - Vite dev server (`npm run dev`) does not execute Node.js files in `/api`. For local checkout and webhook simulation, use `vercel dev` or the built-in simulated membership activation.
2. **Real-Money Payouts**:
   - In accordance with assignment instructions, real-money banking payout infrastructure (e.g. Stripe Connect custom accounts) is intentionally omitted and handled in demo/test mode.
