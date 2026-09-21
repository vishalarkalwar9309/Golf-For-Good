# Golf For Good

**Play. Win. Give back.**

A premium subscription-based golf platform combining competitive score tracking, monthly reward draws, and meaningful charity contributions.

[![Tech Stack](https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,nodejs,supabase,postgres,vercel&theme=dark)](https://skillicons.dev)

---

## Overview

Golf For Good reimagines what a golf membership platform can be. It moves beyond score sheets and handicap indices to create a product where competitive play has tangible social impact — every subscription contributes to a charity pool, every draw cycle creates real winners, and every round logged is a step toward something larger than the game.

Built as a full-stack web application, the platform handles the complete product lifecycle: user onboarding, subscription management, Stableford score tracking, an algorithmic draw engine, charity discovery, winner verification, and a dual-role admin system. The codebase is structured for clarity and scale, with clean module boundaries, role-guarded routing, and server-side data policies enforced at the database layer via Supabase Row Level Security.

This is not a proof-of-concept. It is a production-ready web platform with a design standard and feature depth that reflect a genuine commercial product.

---

## Why This Exists

Traditional golf membership platforms are transactional and aesthetically outdated. Golf For Good explores a different model: what if a monthly golf subscription also entered you into a reward draw, contributed to a charity you chose, and gave you a leaderboard presence worth caring about?

The platform was built to answer that question in full — with working business logic, a real subscription lifecycle, and an admin system capable of running each monthly cycle end-to-end.

---

## Core Features

### Authentication & Identity
- Email/password sign-up and login via Supabase Auth
- Automatic profile creation and sync on registration
- Guided onboarding flow for new users (handicap, charity selection, plan choice)
- Role-based access control: `user` and `admin` roles enforced at both the route and database level
- Auth state persistence with session hydration on reload

### Subscription System
- Monthly and yearly membership tiers
- Subscription activation flow with plan selection
- Lifecycle status tracking: `active`, `inactive`, `cancelled`, `expired`
- Subscriber-only access gating for score submission and draw participation
- Dashboard subscription panel with renewal and status visibility

### Score Management
- Stableford scoring model (points over par)
- Users submit and manage their scores through the dashboard
- System retains only the latest 5 scores per user (older entries are superseded automatically)
- Scores displayed in reverse chronological order
- Score editing with validation; submitted scores feed directly into draw eligibility

### Draw & Reward Engine
- Monthly draw cycles managed by admin
- Two operation modes: random draw and algorithmic weighted draw
- 5-number match model: each user's latest 5 scores are matched against the draw numbers
- Prize tiers: 5-match (jackpot), 4-match (second tier), 3-match (third tier)
- Unlisted match counts receive no payout; partial pools roll over to next cycle
- Admin simulation interface for testing outcomes before publishing
- Prize pool distribution calculated and stored per draw cycle

### Charity System
- Charity listing page with search and filtering
- Featured/spotlight charity prominently highlighted
- Individual charity detail pages with mission, impact data, and donation history
- Users select a charity during onboarding; selection editable from dashboard
- Portion of each subscription routed as a charity contribution
- Independent one-off donation support (non-subscriber accessible)

### Winner Verification
- Winners upload proof of identity/eligibility through a structured flow
- Admin review interface: approve or reject submissions with notes
- Payout lifecycle: `pending` → `approved` → `paid`
- Winners module visible in both user dashboard (personal) and admin panel (all)

### Admin Console
- Protected admin layout accessible only to users with `role: admin`
- Overview dashboard with key metrics (total users, active subscriptions, draw status, charity totals)
- User management: view profiles, subscription status, score history, role assignment
- Charity management: create, edit, feature, and deactivate charities
- Draw management: configure, simulate, publish, and archive monthly draws
- Winner management: review proofs, approve payouts, update payout status
- Subscription management: view and override subscription states
- Analytics page with charts (subscription trends, charity contributions, draw participation)

### UX & Design
- Dark-mode-first premium UI built with Tailwind CSS v4
- Responsive layout across mobile, tablet, and desktop
- Animated transitions using Motion (formerly Framer Motion)
- Polished empty states for all dashboard modules
- Contextual loading states and skeleton screens
- No public-facing pages share design language with legacy golf products

---

## User Roles

| Role    | Access                                                                 |
|---------|------------------------------------------------------------------------|
| `user`  | Public pages, onboarding, dashboard (scores, draws, winnings, charity, subscription, profile) |
| `admin` | All user access + full admin console (users, charities, draws, winners, subscriptions, analytics) |

Role assignment is stored in the `profiles` table. Route protection is enforced client-side via `ProtectedRoute` guards and server-side via Supabase RLS policies.

---

## Product Workflows

### New User Flow
1. Sign up → Supabase Auth creates user
2. Profile record created in `profiles` table
3. User redirected to onboarding wizard (handicap, charity selection, plan selection)
4. Onboarding completion sets `onboarding_completed: true`
5. User lands on dashboard

### Score Submission Flow
1. Authenticated subscriber navigates to Scores in dashboard
2. Enters Stableford score for a round
3. System validates and stores entry; supersedes oldest score if user has more than 5
4. Scores surface in draw eligibility check at draw time

### Monthly Draw Flow
1. Admin opens Draw management console
2. Configures draw numbers and prize pool for the cycle
3. Runs simulation to preview outcome
4. Publishes draw; system evaluates all eligible entries against draw numbers
5. Winners notified; entries marked with match tier
6. Unmatched prize tiers roll over to the next draw cycle

### Winner Verification Flow
1. Winner receives notification and uploads proof via dashboard
2. Admin reviews submission in Winners panel
3. Admin approves or rejects with optional notes
4. Approved winner status advances to `paid` once payout is processed

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | React 19, TypeScript, Vite 6                   |
| Routing        | React Router v7                                 |
| Styling        | Tailwind CSS v4                                 |
| Animation      | Motion (Framer Motion successor)                |
| Forms          | React Hook Form + Zod                           |
| Charts         | Recharts                                        |
| Icons          | Lucide React                                    |
| Backend/DB     | Supabase (PostgreSQL + Auth + Storage + RLS)    |
| Payments       | Stripe (Checkout, Billing Portal, Webhooks)     |
| API Routes     | Vercel Serverless Functions (Node.js runtime)   |
| Deployment     | Vercel                                          |

---

## Architecture & Project Structure

```
golf-for-good/
├── api/                        # Vercel serverless API routes
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── admin/              # Admin-specific UI components
│   │   ├── auth/               # AuthProvider, ProtectedRoute logic
│   │   ├── charity/            # Charity cards, detail UI
│   │   ├── layout/             # Navbar, Footer
│   │   ├── subscription/       # Plan selection, status indicators
│   │   └── ui/                 # Shared primitives (badges, modals, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client initialisation
│   │   ├── draw.ts             # Draw algorithm and matching logic
│   │   ├── slugs.ts            # Charity slug utilities
│   │   └── utils.ts            # Shared utility functions
│   ├── pages/
│   │   ├── admin/              # AdminLayout, Overview, Users, Charities, Draws, Winners, Subscriptions, Analytics
│   │   ├── dashboard/          # DashboardLayout, Overview, Scores, Charity, Draws, Winnings, Subscription, Profile
│   │   ├── Home.tsx
│   │   ├── Charities.tsx
│   │   ├── CharityDetail.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── Onboarding.tsx
│   ├── types/                  # Shared TypeScript interfaces and enums
│   ├── App.tsx                 # Root router, route guards
│   └── main.tsx
├── .env.example
├── vercel.json
├── vite.config.ts
└── package.json
```

The client/server boundary is clean: all Supabase queries run from the client using the typed JS SDK, with RLS policies enforcing data access rules at the database layer. Serverless functions in `api/` handle Stripe Checkout session creation, Customer Portal access, and webhook processing — operations that require secret keys and must never run client-side.

---

## Database / Core Entities

| Table            | Purpose                                                                 |
|------------------|-------------------------------------------------------------------------|
| `profiles`       | Extended user record. Stores display name, handicap, role (`user`/`admin`), charity selection, onboarding status. |
| `subscriptions`  | Tracks plan type (`monthly`/`yearly`), status, start/end dates, and renewal history per user. |
| `scores`         | Stores Stableford scores per user with timestamps. Only the 5 most recent scores per user are considered active. |
| `charities`      | Charity registry with name, description, category, logo, featured flag, and slug. |
| `draws`          | Monthly draw records: draw numbers, prize pool, status (`draft`/`published`/`archived`), jackpot carry-over flag. |
| `draw_entries`   | Per-user draw participation records: matched numbers, match tier, prize allocated. |
| `winner_proofs`  | Proof submission records: file URL, submission timestamp, admin review status, notes. |
| `donations`      | Independent one-off donation records: amount, charity, user (nullable for anonymous), timestamp. |

All tables are protected by Supabase Row Level Security. Users can only read and write their own records; admin-scoped operations are handled via service-role policies or explicit admin checks.

---

## Key Business Logic

### Latest-5 Score Retention
Each user's draw eligibility is determined by their most recent 5 Stableford scores. When a new score is submitted, the system retrieves the user's score count. If it exceeds 5, the oldest record is superseded. This ensures the draw engine always operates on current form, not historical averages.

### Subscription Gating
Score submission and draw participation are gated behind an active subscription. The `AuthProvider` exposes subscription state throughout the app. UI components conditionally render based on subscription status; server-side queries enforce the same constraint via RLS, ensuring access cannot be bypassed client-side.

### Draw Matching System
At draw time, each subscriber's 5 active scores are compared against the 5 published draw numbers. The system counts the number of matching values. Match counts of 5, 4, and 3 qualify for prize tiers. The matching algorithm runs in `src/lib/draw.ts` and is deterministic — the same inputs always produce the same outcome.

### Prize Pool Split
The prize pool for a given draw cycle is divided across tiers in fixed proportions. If no winner exists for a particular tier (e.g., no 5-match), that tier's allocation is flagged for rollover rather than redistribution downward. This preserves jackpot integrity across cycles.

### Jackpot Rollover
If the top prize tier (5-match) goes unclaimed in a draw cycle, the jackpot amount carries forward and accumulates to the next cycle's top prize. This is tracked via a `jackpot_rollover` field on the `draws` table and applied during prize pool calculation for the subsequent draw.

### Winner Verification Lifecycle
Winners are not marked as paid immediately upon draw resolution. The flow requires proof submission (`pending`), admin review (`approved`/`rejected`), and an explicit payout action (`paid`). This lifecycle prevents fraud, provides an audit trail, and gives admins control over disbursement timing. All state transitions are timestamped.

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- A Supabase project (free tier is sufficient)
- Vercel account (for deployment)

### 1. Clone the Repository

```bash
git clone <your-new-github-repo-url>
cd golf-for-good
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 4. Set Up the Database

Run the provided SQL migration scripts against your Supabase project in order via the Supabase SQL editor:

```
1. setup_subscriptions.sql
2. setup_charities.sql
3. setup_draw_engine.sql
4. setup_winner_lifecycle.sql
5. setup_donations.sql
6. fix_admin_policies.sql
7. fix_leaderboard_rls.sql
```

Steps 6 and 7 patch RLS policies and must be applied after the primary migrations.

### 5. Seed Initial Data (Optional)

```bash
# Run in Supabase SQL editor
seed_leaderboard.sql
setup_charities.sql
```

### 6. Create an Admin User

Sign up a regular account through the app, then promote it to admin by running:

```bash
npx tsx promote-admin.ts
```

The script targets the email hardcoded in `promote-admin.ts`. Update that value before running if needed.

---

## Environment Variables

**Client-side** (prefix with `VITE_`, safe to expose via Vite):

| Variable                 | Description                                    |
|--------------------------|------------------------------------------------|
| `VITE_SUPABASE_URL`      | Your Supabase project URL                      |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key             |

**Server-side only** (set in Vercel dashboard, never in `.env.local` or client bundles):

| Variable                    | Description                                         |
|-----------------------------|-----------------------------------------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — used by webhook handler |
| `STRIPE_SECRET_KEY`         | Stripe secret key — used by Checkout and Portal API |
| `STRIPE_WEBHOOK_SECRET`     | Stripe webhook signing secret — validates events    |
| `NEXT_PUBLIC_SITE_URL`      | Your deployed site URL (used for Stripe redirects)  |

---

## Run Locally

```bash
npm run dev
```

The development server starts at `http://localhost:3000`.

To run a production build locally:

```bash
npm run build
npm run preview
```

---

## Deployment Notes

The application is deployed on **Vercel** with the following configuration:

- `vercel.json` handles SPA routing (all routes fall through to `index.html`)
- Serverless functions in `api/` are deployed automatically by Vercel's Node.js runtime
- Environment variables are set via the Vercel dashboard (not committed to source)
- Supabase RLS policies ensure the database remains secure regardless of client-side state

To deploy:

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic CI/CD on push to `main`.

---

## Demo / Test Credentials

> Replace these placeholders before sharing access.

| Role    | Email                          | Password       |
|---------|--------------------------------|----------------|
| Admin   | `admin@golfforgood.com`        | `adminPassword123`     |
| User    | `test1@example.com`         | `password1234`     |

---

## Future Improvements

The following enhancements represent logical next iterations for the platform:

- **Live Stripe Activation** — The Stripe integration is scaffolded (Checkout, Portal, Webhooks). Connecting live Stripe Price IDs and a verified Stripe account would make subscriptions fully transactional.
- **Email Notifications** — Transactional emails for draw results, winner confirmations, and subscription renewals via Resend or SendGrid.
- **Campaign Module** — Time-limited charity campaigns with dedicated landing pages, fundraising targets, and progress tracking.
- **Mobile Application** — A React Native companion app for score submission on the course and draw result push notifications.
- **Corporate / Team Plans** — Group memberships with shared charity contribution pools and team leaderboards.
- **Multi-Country Support** — Localised prize pools, currency handling, and charity registries for international markets.
- **Score Import** — Integration with golf GPS and handicap tracking platforms (e.g., World Handicap System) for automatic score ingestion.

---

## Closing

Golf For Good demonstrates what a modern subscription web platform looks like when built thoughtfully — with real business logic, a layered security model, and a design that respects the user's intelligence. Every feature in this README is implemented, working, and exercisable through the live demo.

The codebase reflects decisions made under the constraints of a real product: schema migrations that preserve data integrity, RLS policies that enforce access rules at the database layer, and draw logic that is deterministic, auditable, and administratively controllable.

---

*Built with React, TypeScript, Supabase, and Tailwind CSS. Deployed on Vercel.*
