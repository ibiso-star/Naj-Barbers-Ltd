# Naj Barbers Ltd — Product Requirements & Guardrails

Status: **Living source of truth.** This file is the guardrail for the project from
start to finish. Any change in scope, stack, or business rules gets proposed as an
edit to this file first, then implemented — not the other way around.

Last updated: 2026-09-11

## 0. Decisions locked in (do not re-litigate without discussion)

| Area | Decision | Why |
|---|---|---|
| Platform (MVP) | **Mobile-first responsive website**, not native iOS/Android apps | Ships without app store review, one codebase, works on any phone browser immediately. Can be wrapped as a native shell (Capacitor) post-MVP without a rewrite. |
| Framework | **Next.js (App Router) + TypeScript + Tailwind CSS** | Server components for fast mobile loads, file-based routing, one deploy target. |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Realtime) | Managed Postgres fits relational booking/scheduling logic (no double-booking, buffers) better than a NoSQL store; built-in phone-OTP auth removes a whole integration. |
| Hosting | **Vercel** | Native Next.js support, zero-config CI/CD from git pushes. |
| Payments | **Stripe** (deposit or full payment, Apple Pay/Google Pay via Stripe, pay-in-shop fallback) | Best-documented, native wallet support. |
| Notifications | Email via Supabase/Resend for MVP; SMS/push deferred to Phase 2 | Keeps MVP integration surface small. |
| Deliverables | **The running app + this PRD + schema/API docs living in the repo** — no separate Figma files or Word docs | Code in this repo is the single source of truth; the UI itself is the design artifact. |

## 1. Brand Identity

- **Business name:** Naj Barbers Ltd
- **Vibe:** Premium, urban, community-focused barbershop
- **Color palette:**
  - Deep navy `#0B1220` (primary background / dark sections, near-black)
  - Gold/amber accent `#C9A227` (CTAs, highlights, active states)
  - Clean white `#FFFFFF` / off-white `#FAF9F6` backgrounds
- **Typography:**
  - Headers: bold, modern sans-serif — Poppins
  - Body: clean, readable — Inter
- **Tone:** confident, welcoming, community-first — not corporate

> Real logo, shop photography, and exact brand color approval are outstanding —
> placeholders are used until final assets are supplied (see §9 Open Questions).

## 2. Core Features

### Customers
- Service browsing (haircuts, beard trims, hot towel shaves, skin fades, restyles,
  kids' cuts) with description, duration, price
- Real-time booking: service → barber → time slot → confirm
- Barber profiles: photo, specialties, rating, portfolio, years of experience
- Appointment management: upcoming/past, reschedule, cancel (policy-aware), add to
  calendar
- Waitlist for fully booked barbers (Phase 2 for push notification trigger)
- Loyalty digital stamp card (Phase 2)
- Payments: Stripe deposit/full payment, pay-in-shop option
- Notifications: confirmation, 24h/1h reminders, promos
- Post-appointment reviews

### Barbers (staff portal)
- Schedule dashboard (day/week), block personal time, recurring availability
- Accept/decline/modify bookings, view client notes/history
- Client profiles: preferences, past styles, allergy notes
- Earnings tracker (daily/weekly/monthly, tips, commission)
- Break management that auto-blocks slots

### Admin (shop owner)
- Dashboard: daily bookings, revenue, occupancy, no-shows
- Staff management: add/remove barbers, commission rates, permissions
- Service configuration: pricing, duration, buffer time
- Analytics: peak hours, top services, barber performance, retention
- Promotions: discount codes, flash sales, off-peak pricing
- Shop settings: hours, holiday closures, location, multi-shop ready

## 3. MVP vs Phase 2

**MVP (this build):**
- Customer booking flow (service → barber → time → confirm), demo-data fallback
  when Supabase isn't configured
- Barber availability model + buffer/no-double-booking logic
- Basic admin dashboard (bookings, services, staff — read/manage)
- Stripe payment (deposit or full) with pay-in-shop fallback
- Email notifications (confirmation + reminder groundwork)

**Phase 2:**
- Loyalty program, referral system
- Product sales (merch/hair products)
- Multiple shop locations
- Walk-in waitlist + push notifications (FCM) + SMS (Twilio)
- AI hairstyle recommendation
- Native app shell (Capacitor) if still wanted after the web MVP proves out

## 4. Business Rules & Logic

- **Opening hours:** Tue–Sat 9am–7pm, Sun 10am–4pm, Mon closed
- **Cancellation:** free up to 4 hours before; late cancellation forfeits deposit
- **No-show policy:** 3 no-shows → account flagged prepay-only
- **Buffer time:** 15 minutes after each appointment
- **Slot duration:** per-service (e.g. skin fade 45 min, beard trim 15 min)
- **Double-booking:** prevented at the DB layer (one barber, one client, no overlap)
- **Walk-ins:** 20% of daily slots reserved for walk-ins (admin-configurable %)

## 5. Data Model (see `supabase/migrations/0001_init.sql` for the executable schema)

Core tables: `services`, `barbers`, `barber_services`, `barber_availability`,
`barber_time_off`, `customers`, `bookings`, `reviews`, `shop_settings`.

## 6. Technical Architecture

```
Next.js (App Router, TS, Tailwind) ── Vercel
        │
        ├── Supabase Postgres (RLS-secured) — services, barbers, bookings, customers
        ├── Supabase Auth — phone/email OTP for customers, email+password for staff/admin
        ├── Stripe — checkout session for deposits/full payment, webhook confirms booking
        └── Email (Resend/Supabase) — confirmations + reminders
```

Roles: `customer` (default), `barber`, `admin` — enforced via Supabase RLS policies
keyed off `auth.uid()` and a `profiles.role` column.

## 7. Open Questions (fill in together — update this section as we decide)

- [ ] Final logo, brand photography, exact Pantone/hex sign-off
- [ ] Real shop address, phone number, Google Maps location
- [ ] Number of barbers at launch + their real names/specialties/photos
- [ ] Actual service list + live pricing (placeholder pricing used until confirmed)
- [ ] Deposit amount/percentage policy
- [ ] Who owns the Supabase + Vercel + Stripe accounts this deploys to
- [ ] Domain name for production

## 8. Deliverables (code-first interpretation of the original PRD ask)

1. ~~Figma UI/UX designs~~ → real coded screens in `src/app` (this repo)
2. Technical architecture → §6 above, expanded as needed in `ARCHITECTURE.md`
3. Database schema → `supabase/migrations/0001_init.sql`
4. API endpoints → Next.js Route Handlers under `src/app/api/*` + Server Actions,
   documented inline
5. Frontend component library → `src/components/*`
6. Testing plan → added alongside features as they're built
7. App Store / Play Store assets → deferred to Phase 2 (native shell decision)
