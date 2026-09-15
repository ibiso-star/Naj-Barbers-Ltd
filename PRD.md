# Naj Barbers Ltd — Product Requirements & Guardrails

Status: **Living source of truth.** This file is the guardrail for the project from
start to finish. Any change in scope, stack, or business rules gets proposed as an
edit to this file first, then implemented — not the other way around.

Last updated: 2026-09-15

## 0. Decisions locked in (do not re-litigate without discussion)

| Area | Decision | Why |
|---|---|---|
| Platform (MVP) | **Mobile-first responsive website**, not native iOS/Android apps | Ships without app store review, one codebase, works on any phone browser immediately. Can be wrapped as a native shell (Capacitor) post-MVP without a rewrite. |
| Framework | **Next.js (App Router) + TypeScript + Tailwind CSS** | Server components for fast mobile loads, file-based routing, one deploy target. |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Realtime) | Managed Postgres fits relational booking/scheduling logic (no double-booking, buffers) better than a NoSQL store; built-in phone-OTP auth removes a whole integration. |
| Hosting | **Vercel** | Native Next.js support, zero-config CI/CD from git pushes. |
| Payments | **Stripe** (full payment online, Apple Pay/Google Pay via Stripe, pay-in-shop fallback) — **no deposits** | Best-documented, native wallet support. Decided 2026-09-11: no deposit option — customers pay in full online or in shop. |
| Notifications | Email via Supabase/Resend for MVP; SMS/push deferred to Phase 2 | Keeps MVP integration surface small. |
| Deliverables | **The running app + this PRD + schema/API docs living in the repo** — no separate Figma files or Word docs | Code in this repo is the single source of truth; the UI itself is the design artifact. |

## 1. Brand Identity

- **Business name:** Naj Barbers Ltd (Company No. 15508310)
- **Address:** 13 Mansel Street, Swansea SA1 5SF
- **Phone:** 07876 489900 · **Email:** info@najbarbers.com · **Instagram:** @najbarbers
- **Established:** 2024. Serves Swansea and the wider South Wales region.
- **Positioning statement** (approved, from the project description doc,
  2026-09-15): "Naj Barbers Ltd is a modern, inclusive barbershop in
  Swansea, providing expert barbering, Afro hair and grooming services for
  Afro-centric and Caucasian customers across Swansea and the wider South
  Wales region. Customers choose Naj Barbers because of our specialist
  expertise in diverse hair types, consistently high-quality cuts,
  personalised service and attention to detail, delivered in a
  professional, welcoming and contemporary environment where every
  customer feels valued and confident."
- **Vibe:** Premium, urban, community-focused barbershop — specialist in
  both Afro hair/grooming and classic/European barbering
- **Color palette:**
  - Deep navy `#0B1220` (primary background / dark sections, near-black)
  - Gold/amber accent `#C9A227` (CTAs, highlights, active states)
  - Clean white `#FFFFFF` / off-white `#FAF9F6` backgrounds
- **Typography:**
  - Headers: Fraunces (variable, editorial serif — distinct from the
    generic Inter/Poppins SaaS look; softer opsz axis at large display sizes)
  - Body: Manrope
- **Tone:** confident, welcoming, community-first, inclusive — not corporate

> Real logo and shop photography are still outstanding — the homepage uses a
> typographic monogram + texture treatment instead of stock/placeholder
> photos until real photography is supplied (see §7 Open Questions). The
> project description's brand-personality checklist (§7.1) was left
> unmarked in the source doc, so no specific selection from that list is
> treated as decided beyond what's stated above.

## 2. Core Features

### Customers
- Service browsing (haircuts, beard trims, cut+beard combos, hot towel shaves,
  skin fades, restyles, kids' cuts) with description, duration, price — see §7
  for the confirmed launch menu
- Real-time booking: service → barber → time slot → confirm
- Barber profiles: photo, specialties, rating, portfolio, years of experience
- Appointment management: upcoming/past, reschedule, cancel (policy-aware), add to
  calendar
- Waitlist for fully booked barbers (Phase 2 for push notification trigger)
- Loyalty digital stamp card (Phase 2)
- Payments: Stripe full payment online, or pay-in-shop (no deposits)
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
- Stripe payment (full payment online) with pay-in-shop fallback — no deposits
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
- **Cancellation:** free up to 4 hours before; late cancellation of a prepaid
  (full-payment) booking is non-refundable — there are no deposits (§0)
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
        ├── Stripe — checkout session for full payment, webhook confirms booking
        └── Email (Resend/Supabase) — confirmations + reminders
```

Roles: `customer` (default), `barber`, `admin` — enforced via Supabase RLS policies
keyed off `auth.uid()` and a `profiles.role` column.

## 7. Open Questions (fill in together — update this section as we decide)

- [ ] Final logo, brand photography, exact Pantone/hex sign-off
- [x] **Real shop address, phone, email, Instagram** (confirmed 2026-09-15
      from the project description doc): 13 Mansel Street, Swansea SA1 5SF ·
      07876 489900 · info@najbarbers.com · @najbarbers. Live in
      `src/lib/constants.ts` (`SHOP_SETTINGS`) and used across the header,
      footer, mobile action bar, and homepage. Google Maps location pin
      itself (verifying the address resolves correctly) still needs a manual
      check once the business confirms the listing.
- [x] **Number of barbers at launch: 4** (decided 2026-09-11). Names, specialties,
      years of experience, and photos are still TBD — `demo-data.ts`/`seed.sql`
      carry 3 named placeholder barbers (Naj, Marcus, Leo) plus a 4th generic
      "Barber 4 (name TBD)" seat to match the confirmed headcount.
- [x] **Service list + pricing** (decided 2026-09-11 — drafted by Claude since
      the business hadn't developed one yet, approved as-is): Classic Haircut
      £28 (30min), Skin Fade £32 (45min), Beard Trim £14 (15min), Cut + Beard
      Combo £38 (45min), Hot Towel Shave £25 (30min), Restyle Consultation £45
      (60min), Kids' Cut £16 (20min). Live in `demo-data.ts`/`seed.sql`. Still
      worth a gut-check against a real competitor/cost analysis before launch.
- [x] **Deposit policy: no deposits** (decided 2026-09-11). Customers pay in full
      online or pay in shop — the deposit payment option has been removed from
      the schema, booking flow, and Stripe checkout entirely.
- [x] **Barber-service mapping: every barber offers every service** (decided
      2026-09-11) — simplest for launch; can restrict per-barber later once
      real specialties are known.
- [ ] Who owns the Supabase + Vercel + Stripe accounts this deploys to
- [ ] Domain name for production
- [x] **Fabricated barber ratings/reviews removed** (2026-09-15): the
      placeholder barbers previously shipped with invented star ratings,
      review counts, and named customer quotes (e.g. "James O.", 4.9★/128
      reviews) displayed as if real. Since the shop has no real reviews yet
      (est. 2024, pre-launch), `rating`/`reviewCount` now default to 0 in
      `demo-data.ts`/`seed.sql`, `DEMO_REVIEWS` is empty, and the UI falls
      back to the existing "No reviews yet" empty state instead of showing
      fabricated numbers.

## 8. Deliverables (code-first interpretation of the original PRD ask)

1. ~~Figma UI/UX designs~~ → real coded screens in `src/app` (this repo)
2. Technical architecture → §6 above, expanded as needed in `ARCHITECTURE.md`
3. Database schema → `supabase/migrations/0001_init.sql`
4. API endpoints → Next.js Route Handlers under `src/app/api/*` + Server Actions,
   documented inline
5. Frontend component library → `src/components/*`
6. Testing plan → added alongside features as they're built
7. App Store / Play Store assets → deferred to Phase 2 (native shell decision)
