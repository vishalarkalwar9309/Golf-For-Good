# Phase 1 Audit

## 1. Architecture

### Overview
Golf For Good is a subscription-based golf performance and charity draw platform built with a modern React/TypeScript Single-Page Application (SPA) frontend and a Supabase (PostgreSQL, Auth, Storage) and Stripe backend.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
│  React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Motion   │
│  React Router v7 + React Hook Form + Zod + Recharts         │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
    Supabase JS Client SDK               REST / JSON
 (Direct DB queries via RLS)           (Serverless APIs)
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Supabase Platform       │ │  Vercel Serverless (Node)  │
│  - PostgreSQL 15+            │ │  - /api/create-checkout    │
│  - GoTrue Auth               │ │  - /api/create-portal      │
│  - Storage (winner-proofs)   │ │  - /api/webhook            │
│  - Row Level Security (RLS)  │ └─────────────┬──────────────┘
└──────────────────────────────┘               │
                                               ▼
                                 ┌────────────────────────────┐
                                 │       Stripe Engine        │
                                 │  - Checkout Sessions       │
                                 │  - Customer Portal         │
                                 │  - Webhook Events          │
                                 └────────────────────────────┘
```

### Frontend Entry Points
- [index.html](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/index.html): HTML5 application shell loading fonts and mounting `#root`.
- [src/main.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/main.tsx): React 19 root bootstrap mounting `<App />` and importing `index.css`.
- [src/App.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/App.tsx): Main router definition, route-level authorization guards (`ProtectedRoute`, `AuthCheck`), and shell layout.

### Backend / Serverless Functions
- [api/create-checkout.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/api/create-checkout.ts): Creates Stripe subscription checkout session.
- [api/create-portal.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/api/create-portal.ts): Generates Stripe customer billing portal session URL.
- [api/webhook.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/api/webhook.ts): Handles Stripe webhook events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) and syncs to Supabase with service role key.

---

## 2. Dependencies

| Package | Version | Type | Purpose | Assessment |
|---|---|---|---|---|
| `react` / `react-dom` | `^19.0.0` | Production | Core UI framework | Up-to-date modern React |
| `vite` | `^6.2.0` | Production/Dev | Build tool & dev server | Fast ESM dev server |
| `@supabase/supabase-js` | `^2.101.1` | Production | Supabase client SDK | Auth, database, storage |
| `stripe` | `^22.0.0` | Production | Stripe Node.js SDK | Serverless payment handling |
| `react-router-dom` | `^7.14.0` | Production | Client-side routing | Modern v7 nested routing |
| `@tailwindcss/vite` / `tailwindcss` | `^4.1.14` | Production/Dev | Styling | Tailwind CSS v4 integration |
| `motion` | `^12.23.24` | Production | Animations | Micro-interactions |
| `lucide-react` | `^0.546.0` | Production | Iconography | High-quality icon set |
| `recharts` | `^3.8.1` | Production | Data visualization | Admin analytics charts |
| `react-hook-form` | `^7.72.0` | Production | Form management | Robust form validation |
| `zod` | `^4.3.6` | Production | Schema validation | Runtime validation schemas |
| `@hookform/resolvers` | `^5.2.2` | Production | Hook form resolver | Zod binding for forms |
| `date-fns` | `^4.1.0` | Production | Date utilities | Formatting & calculations |
| `@vercel/node` | `^5.7.0` | Dev | Vercel runtime | Type definitions for API routes |
| `tsx` | `^4.21.0` | Dev | TypeScript runner | Running setup and admin scripts |
| `typescript` | `~5.8.2` | Dev | Language compiler | Static type checking |
| `@google/genai` | `^1.29.0` | Production | Google GenAI SDK | **Unused / Dead code** |
| `express` | `^4.21.2` | Production | Web framework | **Unused / Dead code** |

---

## 3. Environment Variables

### Client-Safe (Prefix: `VITE_`)
*Exposed in browser bundle by Vite.*

| Variable | Required | Description | Example / Fallback |
|---|---|---|---|
| `VITE_SUPABASE_URL` | YES | Supabase project REST & Auth URL | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | YES | Supabase public anonymous API key | `eyJhbGciOi...` |

### Server-Only (Secret)
*Must NEVER be prefixed with `VITE_` or included in frontend client bundles.*

| Variable | Required | Description | Target Environment |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Supabase Service Role Secret Key (bypasses RLS for webhooks) | Vercel Serverless / Admin scripts |
| `STRIPE_SECRET_KEY` | YES | Stripe API Secret Key (test mode: `sk_test_...`) | Vercel Serverless |
| `STRIPE_WEBHOOK_SECRET` | YES | Stripe Webhook Signing Secret (`whsec_...`) | Vercel Serverless (`/api/webhook`) |
| `NEXT_PUBLIC_SITE_URL` | NO | Base URL for Stripe redirect callbacks | Production: `https://play-for-good.vercel.app`, Dev: `http://localhost:3000` |

---

## 4. Database

### Existing Schema Files
- [setup_subscriptions.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/setup_subscriptions.sql): Creates `public.subscriptions` table and initial RLS policies.
- [setup_charities.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/setup_charities.sql): Creates `public.charities` table, initial sample seeds, and RLS.
- [update_charities_schema.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/update_charities_schema.sql): Adds `slug`, `long_description`, `image_url`, `featured`, `upcoming_events`.
- [setup_draw_engine.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/setup_draw_engine.sql): Creates `public.draws` and `public.draw_entries`.
- [setup_winner_lifecycle.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/setup_winner_lifecycle.sql): Creates `public.winner_proofs` and storage bucket `winner-proofs`.
- [setup_donations.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/setup_donations.sql): Creates `public.donations` and trigger for charity totals and user impact.
- [setup_admin_scores.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/setup_admin_scores.sql): Grants admin RLS access on `public.scores`.
- [fix_admin_policies.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/fix_admin_policies.sql): Attempts to fix admin access on profiles/subscriptions.
- [fix_leaderboard_rls.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/fix_leaderboard_rls.sql): Sets `USING (true)` on profiles and scores for public read.
- [add_onboarding_column.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/add_onboarding_column.sql): Adds `onboarding_completed` flag to `public.profiles`.

### Core Tables & Foreign Keys
| Table | Primary Key | Foreign Keys | Status / Defect |
|---|---|---|---|
| `public.profiles` | `id UUID` | References `auth.users(id)` | Missing role lock constraint. |
| `public.subscriptions` | `id UUID` | `user_id -> auth.users(id)`, `charity_id -> charities(id)` | Lacks FK to `profiles(id)` needed for PostgREST joins. |
| `public.scores` | `id UUID` | `user_id -> auth.users(id)` | **Missing `UNIQUE(user_id, date)` constraint.** |
| `public.charities` | `id UUID` | None | Columns inconsistent with admin form (`is_featured` vs `featured`). |
| `public.draws` | `id UUID` | None | Column named `draw_month`, queried as `month` in `Winners.tsx`. |
| `public.draw_entries` | `id UUID` | `draw_id -> draws(id)`, `user_id -> auth.users(id)` | Users can update entire record under permissive RLS. |
| `public.winner_proofs` | `id UUID` | `user_id -> auth.users(id)`, `draw_id -> draws(id)` | Needs FK to `profiles(id)` for UI join queries. |
| `public.donations` | `id UUID` | `user_id -> auth.users(id)`, `charity_id -> charities(id)` | Properly configured with trigger. |

---

## 5. Authentication

- **Provider**: Supabase Auth (GoTrue) email and password.
- **Roles**: `'user'` and `'admin'`.
- **Flow**:
  1. Signup at `/signup` creates `auth.users` entry, then client-side upserts `public.profiles`.
  2. Redirects to `/onboarding` for charity selection and plan setup.
  3. `ProtectedRoute` verifies session hydration; if unauthenticated, redirects to `/login`.
  4. If user has `role === 'admin'`, route to `/admin`; if user has not completed onboarding, redirects to `/onboarding`.
- **Defects Identified**:
  - Uncaught exception on `supabase.auth.onAuthStateChange` in `AuthProvider.tsx` when client is null causes React app to crash to blank screen.
  - Client-side upsert on `public.profiles` allows any user to grant themselves `role: 'admin'` because the RLS policy lacks column-level enforcement or a security definer trigger.

---

## 6. Subscriptions

- **Plans**: Monthly ($25) and Yearly ($250, discounted rate).
- **Payment Gateway**: Stripe Checkout (`/api/create-checkout`) and Stripe Customer Portal (`/api/create-portal`).
- **Gating**: Score submission, draw participation, and winnings viewing are gated behind an active subscription.
- **Defects Identified**:
  - `useSubscription.ts` implements a simulated `activateMembership()` fallback that writes directly to `public.subscriptions`, bypassing Stripe entirely.
  - Code introduces an unapproved "free" / "Spectator" plan tier not present in the PRD.
  - Changing plan resets `charity_percentage` back to 10% hardcoded.
  - In local development (`vite dev`), `/api` calls are not proxied to serverless handlers.

---

## 7. Scores

- **PRD Requirements**:
  - Format: Stableford points only (range 1–45).
  - Date required: Yes.
  - Frequency: Maximum 1 score per date. Duplicate scores for the same date must be rejected.
  - Retention: Maximum 5 latest scores. Submitting a 6th score automatically replaces the oldest score.
  - Display: Reverse chronological order (most recent first).
  - Score modification: Existing scores may be edited or deleted.
- **Defects Identified**:
  - `DashboardOverview.tsx` validates range 1–50 instead of 1–45, omits date input (uses `new Date().toISOString()`), and fails to prune scores > 5.
  - Neither `Scores.tsx` nor the database checks for duplicate scores on the same date.
  - **No score editing functionality exists** in `Scores.tsx` (only delete was implemented).
  - The UI incorrectly describes draw eligibility as "calculated based on average of scores" instead of matching 5 numbers.

---

## 8. Draw Engine

- **PRD Requirements**:
  - Monthly cadence: Yes.
  - Draw Modes: Random lottery-style OR algorithmic weighted-by-score-frequency.
  - Match Tiers & Pool Shares:
    - 5-number match: 40% (rolls over if unclaimed)
    - 4-number match: 35% (no rollover)
    - 3-number match: 25% (no rollover)
  - Winner Prize Calculation: Equal split among multiple winners in the same tier.
  - Prize Pool Source: Calculated automatically from active subscribers.
  - Administration: Admin simulation before publishing; admin publishing.
- **Defects Identified**:
  - **Invalid number range**: `src/lib/draw.ts` generates numbers `0–50` (`Math.floor(Math.random() * 51)`). Stableford scores can only be `1–45`! Numbers 0 and 46–50 can never match any user score.
  - **Hardcoded prize pool**: `draw.ts` hardcodes `DEFAULT_PRIZE_POOL = 175000` instead of calculating based on active subscriber count as required by PRD § 07.
  - `Draws.tsx` UI copy states "with minimum 1 valid score" whereas the draw engine enforces 5 scores.

---

## 9. Charity

- **PRD Requirements**:
  - Charity selected at signup / onboarding: Yes.
  - Minimum contribution: 10% of subscription fee.
  - Increase contribution percentage: Supported (up to 100%).
  - Contribution independent of draw winnings: Yes.
  - Directory with search, filter, and detail profiles: Yes.
  - Featured charities on homepage: Yes.
- **Defects Identified**:
  - `AdminCharities.tsx` crashes on insert because `slug` is NOT NULL in database schema but absent from the form, and uses `is_featured` / `is_active` instead of schema column `featured`.

---

## 10. Winners

- **PRD Requirements**:
  - Eligibility: Applies to winners only.
  - Proof upload: Screenshot of scores from golf platform.
  - Admin review: Approve or reject submission.
  - Payment states: `pending` -> `paid`.
  - Visibility: Winner and payment status visible to user.
- **Defects Identified**:
  - [src/pages/admin/Winners.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin/Winners.tsx) line 50 executes `.select('id, month, prize_pool')` on `draws`, but the column is `draw_month`, throwing a runtime error that prevents winner verification from loading.
  - RLS policy on `draw_entries` allows any user to update their own entry without column restrictions, allowing malicious alteration of `prize_amount`.

---

## 11. Admin

- **PRD Surfaces**:
  1. Users: View/edit user profiles, edit golf scores, manage subscriptions.
  2. Draws: Configure draw logic (random vs algorithm), run simulations, publish results.
  3. Charities: Add, edit, delete charities, manage content and media.
  4. Winners: View winners, verify proofs, mark payouts as completed.
  5. Reports & Analytics: Total users, total prize pool, charity contributions, draw statistics.
- **Defects Identified**:
  - `AdminCharities.tsx` fails on insert/update due to schema column mismatches and missing slug generation.
  - `Winners.tsx` fails due to column name mismatch (`month` vs `draw_month`).
  - `Analytics.tsx` contains hardcoded mock revenue data instead of aggregating real subscription and draw records.

---

## 12. Build/Test Status

- **Package Installation**: Succeeded with zero missing packages.
- **Vite Production Build (`npm run build`)**: Succeeded (exit code 0).
- **TypeScript Typecheck (`npm run lint` / `tsc --noEmit`)**:
  - Failed initially with 8 errors located in `tmp/` (`check_anon_profiles.ts`, `check_auth_roles.ts`, `force_admin.ts`, `Home_backup.tsx`, `reset_admin.ts`).
  - Cause: `tsconfig.json` lacked `exclude` rules for `tmp/`.
  - Files in `src/` and `api/` have 0 compiler syntax errors.
- **Automated Tests**: No unit/integration test runner (e.g. Vitest/Jest) configured in `package.json`.

---

## 13. Security Findings

1. **Catastrophic RLS Policy on `subscriptions`**:
   `setup_subscriptions.sql` contains:
   ```sql
   CREATE POLICY "Service role can do everything" ON public.subscriptions USING (true) WITH CHECK (true);
   ```
   Because no role is specified, this policy applies to all roles including unauthenticated `anon`. Anyone with the anon key can read, modify, and delete all user subscriptions.
2. **Infinite Recursion in Profiles RLS**:
   `fix_admin_policies.sql` queries `public.profiles` from within a `public.profiles` policy, causing PostgreSQL to trigger an infinite recursion error.
3. **Privilege Escalation via Profile Update**:
   Users can update their own row in `public.profiles` to set `role: 'admin'`, granting them complete access to admin console routes and admin RLS permissions.
4. **Unauthenticated Serverless Endpoints**:
   `/api/create-checkout` and `/api/create-portal` accept user IDs and customer IDs from `req.body` without validating user JWT authentication headers.
5. **Permissive `draw_entries` Update Policy**:
   Users can update their own `draw_entries` rows via client SDK, allowing modification of `prize_amount` and `match_count`.
6. **Data Leakage via Leaderboard Policy**:
   `fix_leaderboard_rls.sql` sets `public.profiles FOR SELECT USING (true)`, exposing private email addresses and financial data to unauthenticated visitors.

---

## 14. PRD Compliance Matrix

| Requirement | Current Implementation | Status | File(s) | Notes |
|---|---|---|---|---|
| **Public Visitor Role** | Browsing homepage, charity directory, charity detail, how it works | COMPLIANT | [src/pages/Home.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/Home.tsx), [Charities.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/Charities.tsx) | Clean public access |
| **Subscriber Role** | Dashboard with scores, charity, draws, winnings, subscription | PARTIAL | [src/pages/dashboard/](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard) | Gating works, but score edit missing |
| **Administrator Role** | Admin layout and 7 management subpages | PARTIAL | [src/pages/admin/](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin) | Broken queries in Winners and Charities |
| **Monthly & Yearly Plans** | Monthly ($25) and Yearly ($250) configured | COMPLIANT | [src/pages/dashboard/Subscription.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/Subscription.tsx) | Plans and pricing conform to PRD |
| **PCI-Compliant Gateway** | Stripe Checkout & Portal via serverless API | COMPLIANT | [api/create-checkout.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/api/create-checkout.ts) | Stripe test mode supported |
| **Real-time Subscription Verification** | Checked on requests via `useSubscription` hook | COMPLIANT | [src/hooks/useSubscription.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/hooks/useSubscription.ts) | Real-time subscription state |
| **Stableford Score Range (1–45)** | `Scores.tsx` enforces 1–45; `DashboardOverview.tsx` allows 1–50 | PARTIAL | [src/pages/dashboard/Scores.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/Scores.tsx), [DashboardOverview.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/DashboardOverview.tsx) | Discrepancy between pages |
| **One Score per Date** | No duplicate date check in frontend or database | NON-COMPLIANT | [src/pages/dashboard/Scores.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/Scores.tsx) | Missing unique constraint |
| **Latest 5 Scores Retention** | Automatically supersedes oldest when >= 5 exist | COMPLIANT | [src/pages/dashboard/Scores.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/Scores.tsx) | Correctly prunes in `Scores.tsx` |
| **Reverse Chronological Score Display** | Displayed descending by date | COMPLIANT | [src/pages/dashboard/Scores.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/Scores.tsx) | Correctly sorted |
| **Score Editing** | Only Delete was implemented; Edit interface is missing | MISSING | [src/pages/dashboard/Scores.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/Scores.tsx) | Edit form needed |
| **Draw Cadence & Monthly Cycle** | Monthly draws with `draw_month` | COMPLIANT | [src/lib/draw.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/lib/draw.ts), [setup_draw_engine.sql](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/setup_draw_engine.sql) | Stored and formatted by month |
| **Draw Number Range (1–45)** | Engine produces numbers 0–50 | NON-COMPLIANT | [src/lib/draw.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/lib/draw.ts) | Must be constrained to 1–45 |
| **Random & Algorithmic Draw Modes** | Both selectable and functional | COMPLIANT | [src/lib/draw.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/lib/draw.ts), [src/pages/admin/Draws.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin/Draws.tsx) | Both modes implemented |
| **Prize Tier Split (40% / 35% / 25%)** | 5-match: 40%, 4-match: 35%, 3-match: 25% | COMPLIANT | [src/lib/draw.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/lib/draw.ts) | Exact percentage splits enforced |
| **5-Match Jackpot Rollover** | Unclaimed 5-match pool carries forward | COMPLIANT | [src/lib/draw.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/lib/draw.ts) | Accumulates to next draw |
| **Prize Pool Auto-Calculation** | Currently hardcoded to $175,000 | NON-COMPLIANT | [src/lib/draw.ts](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/lib/draw.ts) | Must calculate from active subscribers |
| **Admin Draw Simulation & Publishing** | Implemented with preview and confirm | COMPLIANT | [src/pages/admin/Draws.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin/Draws.tsx) | Full simulation UI |
| **Charity Selected at Signup** | Step 1 of onboarding selects charity | COMPLIANT | [src/pages/Onboarding.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/Onboarding.tsx) | Required in flow |
| **Minimum 10% Contribution** | Slider minimum set to 10% | COMPLIANT | [src/pages/Onboarding.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/Onboarding.tsx), [Charity.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/Charity.tsx) | Enforced in UI and schema |
| **Charity Directory & Search** | Full directory with categories, search, slug pages | COMPLIANT | [src/pages/Charities.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/Charities.tsx), [CharityDetail.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/CharityDetail.tsx) | Responsive and functional |
| **Independent Donation Option** | One-off donation modal independent of draw | COMPLIANT | [src/components/charity/DonationModal.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/components/charity/DonationModal.tsx) | Dedicated donation record |
| **Featured Charities on Homepage** | Grid of featured charities rendered | COMPLIANT | [src/pages/Home.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/Home.tsx) | Conforms to PRD |
| **Winner Proof Screenshot Upload** | File upload to Supabase storage bucket | COMPLIANT | [src/components/ui/ProofUpload.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/components/ui/ProofUpload.tsx) | Uploads and registers record |
| **Admin Review & Approve/Reject** | Interface with status update actions | PARTIAL | [src/pages/admin/Winners.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin/Winners.tsx) | Broken due to `month` column query |
| **Payment States (Pending -> Paid)** | Pending, Approved, Rejected, Paid supported | COMPLIANT | [src/pages/admin/Winners.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin/Winners.tsx) | State transitions present |
| **User Dashboard Modules** | Subscription, scores, charity %, draws, winnings | COMPLIANT | [src/pages/dashboard/DashboardOverview.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/dashboard/DashboardOverview.tsx) | All 5 modules present |
| **Admin Charity CRUD** | Create, edit, toggle featured, delete | PARTIAL | [src/pages/admin/Charities.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin/Charities.tsx) | Form breaks on missing `slug` and column naming |
| **Admin Analytics** | Total users, prize pool, charity totals, draw stats | PARTIAL | [src/pages/admin/Analytics.tsx](file:///c:/Users/visha/OneDrive/Desktop/personal/internship/Digital%20Heroes/play-for-good-main/play-for-good-main/src/pages/admin/Analytics.tsx) | Revenue history uses mocked data |

---

## 15. Critical Issues

1. **`tsconfig.json` Missing Exclude**: Typechecking compiles `tmp/`, failing `npm run lint`.
2. **`AuthProvider.tsx` Uncaught Crash**: When Supabase is not configured or in loading state, `onAuthStateChange` throws uncaught error, causing a white screen.
3. **`AdminWinners.tsx` Column Error**: Queries `draws.month` instead of `draws.draw_month`, breaking the admin winner verification page.
4. **`AdminCharities.tsx` Missing Slug & Field Name Mismatch**: Creates charities without `slug` and uses `is_featured` instead of `featured`, triggering SQL errors on save.
5. **`src/lib/draw.ts` Number Range Mismatch**: Generates winning numbers 0–50 instead of 1–45.
6. **`src/lib/draw.ts` Hardcoded Prize Pool**: Uses $175,000 constant rather than calculating dynamically from active subscribers.
7. **Score Management Missing Edit & Duplicate Date Check**: Lacks score editing interface and allows duplicate entries on the same date.
8. **Catastrophic Subscriptions RLS Backdoor**: `setup_subscriptions.sql` permits all operations to anyone.
9. **Profiles RLS Recursive Query**: Subquery on `profiles` during policy evaluation crashes Postgres with infinite recursion.

---

## 16. Recommended Fix Order

1. **Tooling & Build Stabilization**:
   - Update `tsconfig.json` to include `["src/**/*", "api/**/*"]` and exclude `["node_modules", "dist", "tmp"]`.
   - Verify `npm run lint` and `npm run build` pass cleanly with 0 errors.
2. **Frontend Crash Prevention & Resilience**:
   - Wrap `AuthProvider.tsx` `onAuthStateChange` in safe guard to prevent runtime white screens when Supabase is initializing.
   - Fix `src/pages/admin/Winners.tsx` column query (`month` -> `draw_month`).
   - Fix `src/pages/admin/Charities.tsx` form handling (`featured` column name and slug generation).
3. **PRD Business Logic Conformity**:
   - Fix `src/lib/draw.ts` winning number generation range to strictly 1–45.
   - Update `src/lib/draw.ts` prize pool calculation to dynamically compute active subscriber count * subscription contribution + rollover.
   - Update `src/pages/dashboard/Scores.tsx` to add score editing and enforce date uniqueness (one score per date).
   - Align `DashboardOverview.tsx` score validation to 1–45 and enforce date uniqueness.
4. **Database & RLS Hardening**:
   - Create a consolidated, clean SQL migration (`setup_production_schema.sql`) that:
     - Defines all tables with proper constraints (`UNIQUE(user_id, date)` on `scores`).
     - Uses a `SECURITY DEFINER` function for admin checks (`public.is_admin()`) to eliminate RLS recursion.
     - Removes the open `Service role can do everything` policy from `subscriptions`.
     - Adds foreign keys to `public.profiles(id)` for seamless PostgREST joins.
5. **Environment Configuration**:
   - Maintain a complete `.env.example` documenting all client-safe and server-only keys.

---

## 17. Ambiguities Requiring Interpretation

1. **Prize Pool Contribution Percentage per Subscription**:
   - PRD § 07 states: *"A fixed portion of each subscription contributes to the prize pool. Auto-calculation of each pool tier based on active subscriber count."*
   - Standard interpretation: If charity minimum is 10% and platform operations take a portion, typically 50% of the active subscription fees (e.g. $12.50/month per active member) feed into the prize pool + rollover jackpot.
2. **Draw Eligibility Score Count**:
   - PRD § 05 states users must enter their last 5 scores, and the draw matches 5 numbers against their scores. If a new user only has 3 scores logged, are they eligible for 3-match prizes or must they complete all 5 scores to enter?
   - Engine requires 5 scores; dashboard UI copy should clearly reflect that all 5 scores are required for draw eligibility.
3. **Spectator / Free Plan**:
   - Existing codebase implemented a "Spectator Node" with free access. PRD only defines Monthly ($25) and Yearly ($250) paid subscriber plans, with non-subscribers restricted to public visitor features.
   - Recommended resolution: Maintain paid Monthly and Yearly subscription models as primary, treating users without an active subscription as non-subscribers.
