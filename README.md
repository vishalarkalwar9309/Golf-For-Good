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
| Payments       | Razorpay Test Mode (Subscriptions & Webhooks)   |
| API Routes     | Vercel Serverless Functions (Node.js runtime)   |
| Deployment     | Vercel                                          |

---

## Architecture & Project Structure

```
golf-for-good/
├── api/                        # Vercel serverless API routes (Checkout, Webhook, Cancellation)
├── public/                     # Static assets & brand graphics
├── scripts/                    # Diagnostic & PRD verification test suites
├── src/
│   ├── components/
│   │   ├── admin/              # Admin-specific management modals & tables
│   │   ├── auth/               # AuthProvider, role & subscription route guards
│   │   ├── charity/            # Charity cards, spotlight, and donation modals
│   │   ├── home/               # Interactive score story & educational calculator
│   │   ├── layout/             # Responsive Navbar, UserSidebar, AdminSidebar, Footer
│   │   ├── subscription/       # Plan selection & checkout confirmation modals
│   │   └── ui/                 # Shared design system (StatCards, Badges, ProofUpload)
│   ├── hooks/                  # Custom React hooks (useSubscription, usePageTitle)
│   ├── lib/
│   │   ├── supabase.ts         # Resilient Supabase client with graceful fallbacks
│   │   ├── draw.ts             # PRD-compliant draw engine & matching algorithm
│   │   ├── slugs.ts            # URL slug generation & sanitization
│   │   └── utils.ts            # Formatting (INR currency, dates, percentages)
│   ├── pages/
│   │   ├── admin/              # AdminLayout, Overview, Users, Charities, Draws, Winners, Subscriptions, Analytics
│   │   ├── dashboard/          # DashboardLayout, Overview, Scores, Charity, Draws, Winnings, Subscription, Profile
│   │   ├── Home.tsx            # Public landing with Play -> Win -> Give Back storytelling
│   │   ├── Charities.tsx       # Searchable directory with category filters
│   │   ├── CharityDetail.tsx   # Charity impact metrics & direct donation support
│   │   ├── HowItWorks.tsx      # Draw rules, prize pool splits, and FAQ
│   │   ├── Leaderboard.tsx     # Platform-wide score rankings
│   │   ├── Login.tsx           # Authentication with session recovery
│   │   ├── Signup.tsx          # Member registration
│   │   └── Onboarding.tsx      # 3-step wizard (handicap, charity selection, plan tier)
│   ├── types/                  # Shared TypeScript interfaces and enums
│   ├── App.tsx                 # Root application routing and route guards
│   └── main.tsx
├── .env.example
├── setup_production_schema.sql # Unified, idempotent production database schema
├── vercel.json
├── vite.config.ts
└── package.json
```

The client/server boundary is strict: all browser queries run via the typed Supabase JS SDK, with access control enforced at the PostgreSQL engine level through Row Level Security (RLS). Serverless functions in `api/` handle payment subscription creation, webhook event verification, and membership cancellations — operations requiring server-side secrets that are never exposed to the client.

---

## Database / Core Entities

| Table            | Purpose                                                                 |
|------------------|-------------------------------------------------------------------------|
| `profiles`       | Extended user profile (display name, handicap, role, charity selection, onboarding state). |
| `subscriptions`  | Membership records (plan tier, status, start/end dates, renewal dates). |
| `scores`         | Stableford scores (1–45 range constraint, unique date constraint per user, latest-5 retention). |
| `charities`      | Charity directory with category, description, featured status, and metrics. |
| `draws`          | Monthly draw cycles (winning numbers, prize pool, jackpot rollover, status). |
| `draw_entries`   | User draw entries per cycle (matched count, tier allocation, prize amount). |
| `winner_proofs`  | Winner verification records with uploaded scorecards/handicap certificates. |
| `donations`      | Independent donation records linked to chosen charities. |

All tables enforce Row Level Security. Users can read and write only their own records; admin operations are guarded by the `is_admin()` security definer function or server-side service-role execution.

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- A Supabase project (PostgreSQL + Auth + Storage)
- Razorpay account (Test Mode)

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

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate the variables in `.env.local` (kept strictly local and git-ignored).

### 4. Set Up the Database

Execute `setup_production_schema.sql` in your Supabase SQL Editor. This script is fully idempotent and provisions:
- All 8 required tables with foreign key relationships
- Row Level Security (RLS) policies for users, subscribers, and administrators
- Constraints: Stableford points range (1–45) and unique round dates per player
- Triggers: Automatic profile creation on signup and 5-score FIFO retention pruning
- Seed data: 6 default UK charity partners

### 5. Verify Database Integration

Run the automated integration audit to confirm remote database status:

```bash
npx tsx scripts/verify-supabase-integration.ts
```

### 6. Create an Admin User

Register a standard user account in the app, then elevate the account role to `admin` via the Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

---

## Environment Variables

**Client-side** (prefixed with `VITE_`, embedded in client bundle):

| Variable                 | Description                                    |
|--------------------------|------------------------------------------------|
| `VITE_SUPABASE_URL`      | Supabase project REST endpoint URL             |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous API key              |

**Server-side only** (configured in Vercel or local `.env.local`, never exposed to browser):

| Variable                    | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret key (bypasses RLS server-side) |
| `RAZORPAY_KEY_ID`           | Razorpay Test Mode Key ID (`rzp_test_...`)               |
| `RAZORPAY_KEY_SECRET`       | Razorpay Test Mode Secret Key                            |
| `RAZORPAY_WEBHOOK_SECRET`   | Secret string for verifying HMAC-SHA256 webhook signatures|
| `RAZORPAY_PLAN_MONTHLY`     | Razorpay Monthly Subscription Plan ID (`plan_...`)       |
| `RAZORPAY_PLAN_YEARLY`      | Razorpay Yearly Subscription Plan ID (`plan_...`)        |
| `NEXT_PUBLIC_SITE_URL`      | Base application URL for return redirects                |

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

## Testing & Verification

The platform includes comprehensive automated test suites covering PRD business logic, mathematical prize splits, security constraints, and live database connectivity:

```bash
# Typecheck validation (zero errors)
npm run lint

# Production bundle compilation
npm run build

# End-to-end PRD automated verification suite (15 checks: constraints, draw engine, 40/35/25 splits, rollover)
npx tsx scripts/e2e-verify.ts

# Live Supabase integration audit (21 checks: tables, seeds, storage bucket, RLS)
npx tsx scripts/verify-supabase-integration.ts
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

- **Live Payment Activation** — The Razorpay Subscriptions and Webhook adapter is implemented and verified in Test Mode (supporting INR ₹499/mo and ₹4,999/yr). Moving to live production requires switching to production Razorpay API keys and webhook secret.
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
