# FORGE

**Data-driven gym coaching that tells intermediate lifters exactly what to change each week.**

FORGE collects three daily signals — weight, calories, workout lifts — analyzes trends over rolling two-week windows, and outputs one clear recommendation: adjust calories up or down, maintain, or change training approach. No guesswork, no information overload, one action per week.

---

## The Problem

Intermediate lifters (6 months – 3 years) hit a wall. They don't know their real calorie needs, don't know when to adjust intake, and make random training changes out of frustration. The result is plateaus, spinning wheels, and wasted effort.

## The Solution

A rule-based decision engine that turns minimal daily inputs into weekly coaching decisions:

- **Weight trending flat?** → Add 200 cal/day
- **Weight climbing too fast?** → Cut 200 cal/day  
- **Weight + strength both up?** → Change nothing
- **Strength declining?** → Deload training
- **Not enough data?** → Keep logging, engine calibrates

The user's only job is to log consistently. FORGE handles the thinking.

---

## Architecture

```
┌─────────────┐
│   Next.js   │  ← Thin client. Displays state. Sends events.
└──────┬──────┘
       │ REST
┌──────▼──────┐
│   Express   │  ← Auth, validation, orchestration.
└──────┬──────┘
       │
  ┌────▼────┐
  │ Engine  │  ← Pure functions. No I/O. No DB. No HTTP.
  └────┬────┘
       │
┌──────▼──────┐
│  PostgreSQL │  ← Append-only logs. Immutable history.
└─────────────┘
```

Four rules that never break:

1. **Engine has zero infrastructure dependencies.** No database imports, no HTTP, no filesystem. Receives objects, returns objects. Tests and API import the same module.
2. **Frontend never runs business logic.** Calls API, renders response. Zero engine code in the browser.
3. **Database stores append-only logs.** No `current_weight` columns. Weight is derived from `weight_logs`. Everything is time-series.
4. **One recommendation per week.** Once locked, it doesn't change until next week.

---

## Tech Stack

| Layer     | Tech                                  |
|-----------|---------------------------------------|
| Frontend  | Next.js 14, Tailwind CSS, TanStack Query |
| Backend   | Express, TypeScript, Drizzle ORM, Zod |
| Database  | PostgreSQL 16                         |
| Auth      | JWT (custom, stateless)               |
| Engine    | Pure TypeScript, zero deps            |
| Tests     | Vitest (81 tests, 6 files)            |
| Monorepo  | npm workspaces                        |
| Local Dev | Docker Compose                        |

Not using: Redis, Turborepo, tRPC, Prisma, NextAuth, Supabase, GraphQL, WebSockets, ML/AI.

---

## Project Structure

```
forge/
├── packages/
│   └── engine/                        # THE CORE — pure recommendation engine
│       ├── src/
│       │   ├── types.ts               # All interfaces and type definitions
│       │   ├── tdee.ts                # BMR + activity → calorie target
│       │   ├── adherence.ts           # Logging consistency (days/week, streak)
│       │   ├── weight-trend.ts        # Week-over-week weight direction
│       │   ├── strength-trend.ts      # 1RM comparison across weeks
│       │   ├── lifts.ts              # Per-lift stall detection + suggestions
│       │   ├── confidence.ts          # Data quality → recommendation trust
│       │   ├── checkins.ts            # Sleep, stress, recovery, adherence signals
│       │   ├── recommend.ts           # Main orchestrator — assembles everything
│       │   └── index.ts              # Public exports
│       └── tests/
│           ├── scenarios.test.ts      # 50 scenarios across 8 categories
│           ├── tdee.test.ts
│           ├── weight-trend.test.ts
│           ├── strength-trend.test.ts
│           ├── lifts.test.ts
│           └── helpers.ts             # Test data builders
│
├── apps/
│   ├── api/                           # Express backend
│   │   └── src/
│   │       ├── config/env.ts          # Zod-validated environment
│   │       ├── db/
│   │       │   ├── schema.ts          # Drizzle schema (8 tables)
│   │       │   ├── migrations/        # SQL migrations
│   │       │   ├── seed.ts            # 14-day test data seeder
│   │       │   └── migrate.ts
│   │       ├── middleware/
│   │       │   ├── auth.ts            # JWT sign/verify
│   │       │   ├── validate.ts        # Zod request validation
│   │       │   ├── rate-limit.ts      # In-memory rate limiting
│   │       │   ├── async-handler.ts   # Catch unhandled promise rejections
│   │       │   └── errors.ts          # Global error handler
│   │       ├── modules/
│   │       │   ├── auth/              # Signup, login, logout, me
│   │       │   ├── users/             # Profile CRUD
│   │       │   ├── logs/              # Weight, calorie, workout logging + history
│   │       │   ├── checkins/          # Daily check-in questions
│   │       │   └── recommendations/   # Dashboard engine + lock + history
│   │       ├── app.ts                 # Express app assembly
│   │       └── server.ts
│   │
│   └── web/                           # Next.js frontend
│       ├── app/
│       │   ├── (auth)/                # Login + signup pages
│       │   ├── (app)/                 # Authenticated shell (header + nav)
│       │   │   ├── dashboard/         # Main recommendation view
│       │   │   ├── log/               # Weight / calorie / workout logging
│       │   │   ├── history/           # Entry list with filters + delete
│       │   │   └── settings/          # Profile display + logout
│       │   └── onboarding/            # 6-step profile setup
│       ├── components/
│       │   ├── dashboard/             # RecommendationCard, AdherenceRing, etc.
│       │   ├── logging/               # WeightForm, CalorieForm, WorkoutForm
│       │   ├── history/               # EntryList, EntryRow
│       │   ├── onboarding/            # OnboardingFlow
│       │   └── ui/                    # Badge, Ring, Chart, Nav, Button, Skeleton
│       ├── hooks/                     # useDashboard, useLog (TanStack Query)
│       ├── lib/                       # API client (JWT), utils
│       └── types/                     # Frontend type definitions
│
├── docker-compose.yml                 # Local Postgres
├── Dockerfile                         # API production image
├── package.json                       # Root workspace config
└── .env.example
```

---

## Engine

The engine is a pure function library. It takes structured data and returns a recommendation. No network calls, no database access, no side effects.

### How It Works

```
recommend(data: EngineInput) → Recommendation
```

The engine runs this pipeline every time the dashboard loads:

1. **Data gate** — Are there enough weigh-ins? (3 this week, 2 last week minimum.) If not → "Calibrating" mode with TDEE-based starting target.
2. **Adherence check** — Did the user log at least 50% of days? If not → "Low Adherence" block. No recommendation until they show up consistently.
3. **Weight trend** — Compare this week's average weight to last week's. Classify as `good_gain`, `flat`, `losing`, or `fast_gain` based on goal-specific thresholds.
4. **Strength trend** — Compare estimated 1RMs across weeks. Filter noise (changes under 5% ignored). Need 2+ exposures per lift per week.
5. **Confidence scoring** — How much to trust this recommendation. Weigh-in count, calorie log count, and self-reported adherence all factor in.
6. **Decision matrix** — Combine weight trend + strength trend + goal → specific calorie and training actions.

### Goal-Specific Thresholds

| Goal            | Good Gain Range | Too Fast Above | Calorie Surplus |
|-----------------|-----------------|----------------|-----------------|
| Lean Bulk       | 0.1% – 0.5%/wk | > 0.5%         | +250 cal        |
| Aggressive Bulk | 0.3% – 0.8%/wk | > 0.8%         | +450 cal        |
| Recomp          | -0.1% – 0.2%/wk| > 0.2%         | 0 (maintenance) |

### Test Coverage

81 tests across 6 files, covering 50 real-world scenarios in 8 categories:

- **A. Data Gates (1-8)** — Zero data, partial data, calibration mode, TDEE cold-start
- **B. Lean Bulk (9-18)** — All weight/strength combinations, boundary values
- **C. Aggressive Bulk (19-26)** — Higher thresholds, goal-specific behavior
- **D. Recomp (27-34)** — Tight weight range, flat = success
- **E. Adherence (35-39)** — Logging frequency gates, borderline cases
- **F. Confidence (40-43)** — Calorie log completeness, check-in downgrades
- **G. Strength Edge Cases (44-47)** — Noise filter, exposure minimums, multi-lift voting
- **H. TDEE (48-50)** — Cold-start calorie calculations for different profiles

---

## Database

8 tables. All logs are append-only and time-indexed.

| Table            | Purpose                                    |
|------------------|--------------------------------------------|
| `users`          | Auth credentials                           |
| `profiles`       | Goal, stats, training frequency            |
| `weight_logs`    | Daily weigh-ins (value + timestamp)        |
| `calorie_logs`   | Daily calorie estimates                    |
| `workout_logs`   | Workout sessions                           |
| `exercises`      | Individual lifts within a workout          |
| `checkins`       | Sleep, stress, recovery, adherence signals |
| `recommendations`| Locked weekly outputs (1 per user per week)|

Key design decisions:
- `logged_at` = when user says it happened. `created_at` = when row was inserted. Engine uses `logged_at`.
- `result_json` on recommendations stores full engine output as JSONB for debugging.
- `UNIQUE(user_id, week_key)` enforces one recommendation per user per week.
- No `current_weight` column. Weight is always derived from `weight_logs`.

---

## API

All endpoints are Zod-validated. Auth via JWT Bearer token. Rate-limited per category.

### Auth
```
POST   /api/auth/signup     { email, password }              → { user, token }
POST   /api/auth/login      { email, password }              → { user, token }
POST   /api/auth/logout                                      → { message }
GET    /api/auth/me                                          → { user }
```

### Profile
```
POST   /api/profile         { name, goal, experience, ... }  → { profile }
PUT    /api/profile         { ...partial }                   → { profile }
GET    /api/profile                                          → { profile }
```

### Logging
```
POST   /api/logs/weight     { value }                        → { entry }
POST   /api/logs/calories   { value }                        → { entry }
POST   /api/logs/workout    { exercises: [...] }             → { entry }
DELETE /api/logs/:type/:id                                   → { deleted }
```

### Dashboard
```
GET    /api/dashboard                                        → { recommendation, weightChart, calorieChart, pastRecommendations }
```

Backend fetches 21 days of logs + 7 days of check-ins + profile + locked rec, transforms to `EngineInput`, calls `recommend()`, returns result.

### Check-ins
```
GET    /api/checkins/next                                    → { checkIn } | null
POST   /api/checkins        { type, value }                  → { entry }
```

### History
```
GET    /api/history?type=all&limit=60                        → { entries, count }
```

### Recommendations
```
GET    /api/recommendations                                  → { recommendations }
POST   /api/recommendations/lock                             → { recommendation }
```

### Rate Limits

| Category  | Limit          |
|-----------|----------------|
| Auth      | 20 / 15 min    |
| Logging   | 30 / min       |
| Dashboard | 60 / min       |

---

## Frontend

Mobile-first Next.js app. Thin client — displays state, sends events, runs zero business logic.

### Screens

1. **Login / Signup** — Email + password. JWT stored in localStorage.
2. **Onboarding** — 6-step flow: name → goal → experience → gender → stats → activity. Shows TDEE preview on final step.
3. **Dashboard** — The main screen. Recommendation card, adherence ring, weight/strength trend arrows, stat tiles, 14-day sparkline charts, past recommendations, daily check-in card.
4. **Log** — Three tabs (Weight / Cals / Lift). Quick-cal buttons around user's target. Exercise form with lift presets and real-time 1RM estimate.
5. **History** — Filterable entry list with inline delete (confirm pattern).
6. **Settings** — Profile display + logout.

### Data Fetching

TanStack Query for all server state. Dashboard auto-refreshes every 30 seconds. All mutations invalidate both dashboard and history caches.

### Design System

Dark theme. Two fonts: Anybody (display/headings), IBM Plex Mono (data/labels). Neon green accent (`#D4FF00`). Status colors: green (on track), red (off track), yellow (warning/calibrating).

---

## Quick Start

```bash
git clone https://github.com/Ritiksh0h/forge.git
cd forge
npm install

# Start Postgres
docker compose up -d

# Configure API
cp .env.example apps/api/.env

# Migrate + seed
npm run db:migrate
npm run db:seed

# Run (two terminals)
npm run dev:api       # → http://localhost:3001
npm run dev:web       # → http://localhost:3000
```

Test account: `test@forge.dev` / `testpass123` (14 days of seeded data)

### Available Scripts

| Script            | Description                    |
|-------------------|--------------------------------|
| `npm run dev:api` | Start API server (port 3001)   |
| `npm run dev:web` | Start Next.js frontend (port 3000) |
| `npm run test:engine` | Run all 81 engine tests    |
| `npm run db:migrate`  | Run database migrations    |
| `npm run db:seed`     | Seed test data             |

---

## Deploy

### Database

Any managed PostgreSQL: Railway, Neon, Supabase, Render. Run migrations against it:

```bash
DATABASE_URL=<production_url> npm run db:migrate
```

### API (Railway / Fly.io / Render)

Uses the `Dockerfile` at project root. Set environment variables:

| Variable       | Value                                    |
|----------------|------------------------------------------|
| `DATABASE_URL` | Production Postgres connection string    |
| `JWT_SECRET`   | 64+ character random string              |
| `CORS_ORIGIN`  | Frontend URL (e.g. `https://forge.vercel.app`) |
| `NODE_ENV`     | `production`                             |
| `PORT`         | `3001` (or platform default)             |

### Frontend (Vercel)

| Setting           | Value                              |
|-------------------|------------------------------------|
| Root directory    | `apps/web`                         |
| Framework         | Next.js                            |
| Build command     | `next build`                       |
| `NEXT_PUBLIC_API_URL` | Deployed API URL              |

---

## Call Flow

### Logging Weight

```
User taps "LOG WEIGHT"
  → Frontend POST /api/logs/weight { value: 175.5 }
  → Zod validates → INSERT weight_logs → 201
  → Frontend invalidates dashboard + history cache
```

### Dashboard Load

```
Frontend GET /api/dashboard
  → Backend queries: 21d weight_logs + 21d calorie_logs + 21d workout_logs
                     + 7d checkins + profile + locked rec for this week
  → Transforms to EngineInput
  → Calls recommend()
  → Returns { recommendation, weightChart, calorieChart, pastRecommendations }
  → Frontend renders cards, charts, badges
```

### Check-in

```
Frontend POST /api/checkins { type: "sleep", value: "4" }
  → INSERT checkins → 201
  → Frontend refetches dashboard (check-in affects next recommendation)
```
