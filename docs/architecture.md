# Golf Charity Subscription Platform Architecture

## 1. High-Level Architecture Diagram

```text
                         ┌──────────────────────────────┐
                         │           Client UI          │
                         │ Next.js App Router (React)   │
                         │ - Landing / Pricing          │
                         │ - User Dashboard             │
                         │ - Admin Dashboard            │
                         └──────────────┬───────────────┘
                                        │ HTTPS
                                        ▼
                         ┌──────────────────────────────┐
                         │      Next.js Server Layer    │
                         │ Route Handlers / Server      │
                         │ Actions / Middleware         │
                         │ - Auth guard                 │
                         │ - Input validation           │
                         │ - API orchestration          │
                         └───────┬───────────┬──────────┘
                                 │           │
                        JWT/Auth │           │ Stripe Webhooks
                                 ▼           ▼
                 ┌────────────────────┐   ┌────────────────────┐
                 │  Supabase Auth     │   │      Stripe        │
                 │ - signup/login     │   │ - subscriptions    │
                 │ - JWT/session      │   │ - checkout         │
                 └─────────┬──────────┘   │ - billing portal   │
                           │              │ - webhooks         │
                           ▼              └─────────┬──────────┘
                  ┌─────────────────────────────────────────────┐
                  │              Application Core               │
                  │ Services / Domain Modules                   │
                  │ - Subscription Service                      │
                  │ - Score Service                             │
                  │ - Draw Engine Service                       │
                  │ - Prize Pool Service                        │
                  │ - Charity Contribution Service              │
                  │ - Winner Verification Service               │
                  │ - Admin Reporting Service                   │
                  └──────────────────────┬──────────────────────┘
                                         │
                                         ▼
                         ┌──────────────────────────────┐
                         │      Supabase PostgreSQL     │
                         │ - users/subscriptions        │
                         │ - scores                     │
                         │ - draws/draw_results         │
                         │ - winnings/verification      │
                         │ - charities/payments         │
                         └──────────────────────────────┘
```

## 2. Production Folder Structure

```text
src/
├─ app/
│  ├─ (marketing)/
│  ├─ (auth)/
│  ├─ dashboard/
│  ├─ admin/
│  └─ api/
│     └─ v1/
│        ├─ auth/
│        ├─ subscriptions/
│        ├─ scores/
│        ├─ draws/
│        ├─ charities/
│        ├─ user-charity-selection/
│        ├─ winnings/
│        └─ admin/
├─ components/
│  ├─ ui/
│  ├─ marketing/
│  ├─ dashboard/
│  └─ admin/
├─ lib/
│  ├─ auth/
│  ├─ db/
│  ├─ stripe/
│  ├─ controllers/
│  ├─ services/
│  ├─ repositories/
│  ├─ validations/
│  ├─ domain/
│  ├─ types/
│  └─ utils/
└─ middleware.ts
```

## 3. Data Flow

### Subscription

```text
User clicks Subscribe
→ Frontend calls POST /api/v1/subscriptions
→ API creates Stripe Checkout Session
→ User completes payment on Stripe
→ Stripe webhook calls POST /api/v1/subscriptions/webhook
→ Subscription/payment tables are updated
→ Dashboard reads latest subscription state from API/DB
```

### Scores

```text
User submits score + played date
→ Frontend calls POST /api/v1/scores
→ API validates auth and score range
→ Score service inserts score
→ DB trigger/service keeps only latest 5 rows per user
→ API returns last 5 scores in descending order
→ UI refreshes score widget
```

### Draws

```text
Admin triggers simulate or run
→ Frontend calls /api/v1/draws/simulate or /api/v1/draws/run
→ Draw service loads active subscribers and latest scores
→ Draw engine generates numbers (random or algorithm)
→ Prize pool service calculates tier pools and rollover
→ Results are stored in draws, draw_results, winnings
→ Admin publishes
→ User dashboard shows winnings and status
```

### Charity Contribution

```text
User selects charity + contribution percent
→ Frontend calls /api/v1/user-charity-selection
→ API validates minimum 10%
→ Selection is stored in user_charity_selection
→ Payment and reporting services use this for charity allocation
→ Dashboard/admin reports display contribution totals
```

## 4. Key Services / Modules

- `Auth Service`
  Handles signup/login/session validation and role checks.
- `Subscription Service`
  Creates Stripe checkout sessions, reads status, cancels plans, and processes webhooks.
- `Score Service`
  Adds, edits, retrieves, and enforces the latest-5 Stableford score rule.
- `Draw Service`
  Orchestrates monthly simulation, execution, and publication.
- `Draw Engine`
  Contains random and algorithm-based draw strategies.
- `Prize Pool Service`
  Calculates gross pool, charity allocation, tier splits, and rollover values.
- `Charity Service`
  Manages charity directory CRUD and user charity selection.
- `Winnings Service`
  Exposes winnings history, payout status, and user-facing prize details.
- `Winner Verification Service`
  Stores proof uploads and admin review decisions.
- `Admin Reporting Service`
  Returns dashboards for users, subscriptions, pools, charity totals, and draw analytics.

## 5. Scalability Considerations

- Keep API routes stateless for horizontal scaling on Vercel.
- Use Supabase Postgres as the source of truth for draws, winnings, payouts, and subscriptions.
- Enforce auth in both API logic and Supabase RLS.
- Make Stripe webhook handling idempotent.
- Store draw metadata such as `mode`, `seed`, and `algorithm_version` for auditability.
- Use indexed read paths for score history, draw history, and admin summaries.
- Prefer service-layer domain logic so mobile apps or background jobs can reuse the same rules.
- Keep prize pool values snapshotted per draw instead of recalculating historical months.
