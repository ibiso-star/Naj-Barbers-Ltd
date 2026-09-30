# AGENTS.md — Keel

This file is the entry point for any coding agent touching this codebase,
including in a session that never saw the rest of this document family
directly. Read it first; it points to everything else rather than
restating it.

## Read before writing code

| File | Covers |
|---|---|
| `PRD.md` | Product, scope, brand, applicability profile |
| `architecture.md` | System design, trust boundaries, stack, repo structure, build order |
| `security.md` | Security controls, deployment safety, and incident response — read this before touching auth, input handling, anything crossing a trust boundary, or before deploying |
| `test-plan.md` | What needs test coverage and how |
| `rules.md` | Naming, error handling, commit/PR conventions, documentation expectations |
| `release-checklist.md` | Pre-launch gates — product integrity/anti-cliché, accessibility, performance, SEO, and (if shipping native) the mobile app store checklist |
| `legal.md` | Terms of Service, Privacy Policy, and other legal/compliance requirements |
| `evidence.md` | Durable proof for verified 🔴 controls, keyed by control ID |
| `decisions.md` | Why past technical choices were made — check before re-litigating one |
| `memory.md` | Known gotchas in this codebase — check before re-discovering one the hard way |
| `tasks.md` (if present) | Current work board; otherwise use the project's issue tracker |
| `design.md` | Brand-filled project seed; copy this for each page |
| `docs/design/*.md` (per page) | Completed briefs copied from the brand-filled `design.md` seed |

## Standing rules for this repo

- Follow the project-specific repository structure in `architecture.md`. Its reference backend layering table applies when this project has a backend; a feature that introduces a second, competing structure without a recorded decision is a defect.
- Follow the project-specific build order in `architecture.md`. The reference schema → repository → service → route → generated client → frontend order applies when those layers exist; never build frontend and backend against a shared guess in parallel.
- Treat every 🔴 item as a release gate. During build, leave unfinished items unchecked. Before release, provide an `evidence.md` row for each verified item or a specific, approved, unexpired `PRD.md` §11 exception for an open item.
- Before opening a PR: run `scripts/check-charter.sh` for document integrity. Before release: run `scripts/check-charter.sh --release` and review the actual evidence (`PRD.md` §10).
- For a first hosted deployment whose HTTPS and monitor evidence needs the real URL, use `--predeploy` only with the dated owner record described in `templates/first-deployment-approval.md`, then verify the host and run the full `--release` gate. A predeploy pass is not release approval.
- Follow `templates/risk-policy.md` for exception authority and non-exceptionable controls. Expired exceptions and evidence review dates need renewed decisions, not silent date changes.
- Follow `PRD.md` §3's logo, asset, and proof rules when using a design skill. Never fabricate social proof or performance claims.
- Summarize your understanding of the relevant file(s) back before writing code if anything is ambiguous — don't silently guess (`PRD.md` §14).

## Keel specifics

- **Layout and layering:** follow "Keel as built" at the end of `architecture.md`. Components never import `supabase-js` or name a table. Data access goes through `lib/data/repository.ts`.
- **Authorisation lives in SQL.** Any change to who can do what is a change to `supabase/migrations/` plus a new assertion in `supabase/tests/rls_test.sql`, and the matching rule in `demo-repository.ts` (`decisions.md` D-003).
- **Seed:** edit `src/lib/data/seed.ts`, run `npm run seed:generate`, and commit both files. CI fails if they drift apart.
- **Before a PR:** `npm run lint && npm run typecheck && npm test && npm run test:db && npm run build && npm run test:e2e && bash scripts/check-charter.sh`.
- **Next.js 16:** read `node_modules/next/dist/docs/` before using an unfamiliar API. `proxy.ts` replaces middleware, and `params` is a promise.
- Read `memory.md` before touching the board's drag-and-drop or the demo repository.

