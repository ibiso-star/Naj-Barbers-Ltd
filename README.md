# Naj Barbers Ltd

Mobile-first booking website for Naj Barbers Ltd — Next.js (App Router) + Supabase +
Stripe. **Start with [`PRD.md`](./PRD.md)** — it's the living guardrails doc for this
project: decisions, brand, business rules, open questions.

## Stack

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS v4)
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Payments:** Stripe Checkout
- **Hosting:** Vercel

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs out of the box with
placeholder demo data (`src/lib/demo-data.ts`) even with no environment variables set,
so you can browse services/barbers and click through the booking flow immediately.

### Connecting Supabase (for real persistence, auth, and admin)

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/0001_init.sql` (SQL Editor or Supabase CLI),
   then optionally `supabase/seed.sql` for demo content.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. To get into `/admin`, sign in once via `/account` (magic link) to create an
   `auth.users` row, then insert a matching row into `profiles` with
   `role = 'admin'` for that user's id.

### Connecting Stripe (for online payments)

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env.local`, and point a
Stripe webhook at `/api/stripe/webhook` listening for `checkout.session.completed`.
Without these, full-payment bookings still complete — they just skip straight
to "confirmed" (pay-in-shop equivalent) instead of a real charge.

## Project structure

- `src/app` — routes (customer site, `/book` wizard, `/account`, `/admin`)
- `src/components` — shared UI (`ui/`, `booking/`, `layout/`, `admin/`)
- `src/lib` — data access (`data.ts`), Supabase clients, availability engine,
  Stripe, types, brand constants
- `supabase/` — SQL schema + seed data

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
