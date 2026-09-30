# Release readiness — Keel

`bash scripts/check-charter.sh` (build) **passes**.
`bash scripts/check-charter.sh --release` **fails with 30 open 🔴 controls**
as of 2026-09-30. That's expected for a demo build: none of them can be
closed honestly without a real Supabase project, hosting, legal documents,
or a decision only the release owner can make. Nothing below has been
excepted or marked N/A on the owner's behalf.

## 1. Proposed N/A: owner approval needed (`PRD.md` §11)

These capabilities don't exist in Keel. Each needs a §11 row with the owner's
name, an approval record and an expiry date. `templates/risk-policy.md` allows
N/A for all of them.

| Control | Proposed reason |
|---|---|
| MOB-001–004, MOB-008–010 | N/A — web only, no native app (`PRD.md` §0) |
| SEC-015 | N/A — no file uploads exist |
| SEC-016 | N/A — nothing is priced or charged; budgets are informational numbers entered by members |
| SEC-037, SEC-038 | N/A — the product has no LLM, agent or automated-action features |
| LEGAL-007 | N/A — no analytics or non-essential cookies; only the Supabase auth cookie, which is strictly necessary |

## 2. Needs a linked Supabase project and a hosted deployment

| Control | What closes it |
|---|---|
| SEC-027 | Deploy on Vercel and verify HTTPS-only. `--predeploy` is available for the first deployment (`docs/PILOTING.md` in the standards repo) |
| SEC-028 | Confirm Supabase encryption at rest for the database and backups (plan and region settings) |
| SEC-029 | Confirm no service-role key is used anywhere (true in code) and review Supabase role grants in the dashboard |
| SEC-030 | Set Supabase Auth rate limits (magic-link sends per hour, per IP) and record the thresholds |
| OPS-001 | Create a staging Supabase project with seed data only, never production data |
| OPS-002 | Add error monitoring (Sentry was deferred in `PRD.md` §7) and an uptime alert |
| OPS-003 | Enable backups on the Pro plan and **perform and record a test restore** |
| PROD-022 | Verify the production build runs in Supabase mode with no seed applied. This control can't be excepted |
| TEST-002 | Turn on branch protection so the `pm-dashboard` CI job is required before merge |

## 3. Needs a design decision

| Control | Gap | Options |
|---|---|---|
| ARCH-003 | The browser talks to Supabase PostgREST/Realtime directly, not through a backend (`decisions.md` D-002) | Accept as a time-bound exception, since RLS is the tested boundary, or add Next.js route handlers in front of writes |
| SEC-002 | `@supabase/ssr` session cookies are not httpOnly (`docs/evidence/review-2026-09-30.md`) | Same choice as ARCH-003: route data access server-side to use httpOnly cookies, or accept with a CSP as mitigation |
| SEC-005 | Workspace admins can change roles and invite without MFA | Require Supabase MFA (TOTP) for admin actions, enforced in RLS via `auth.jwt() ->> 'aal' = 'aal2'` |
| SEC-012 | There's no self-service account or workspace deletion | Add "Delete workspace" (admin) and "Delete my account" flows; the schema already cascades |

## 4. Needs legal work

LEGAL-001 (Terms), LEGAL-002 (Privacy Policy), PROD-029, LEGAL-008 (a
working DSAR and erasure process within one month) and LEGAL-009 (counsel
review for UK/EU B2B processing and the DPA).

## Also open, but not blocking

- CODE-008: the board loads up to 2,000 tasks per workspace in one query, with no paging beyond that.
- SEC-022: CI actions are pinned to version tags, not commit SHAs (matching the existing repository workflow).
- A Content-Security-Policy header isn't set yet.
- Invitations are recorded but no email is sent, and there's no acceptance flow (`PRD.md` §13 Q3).
