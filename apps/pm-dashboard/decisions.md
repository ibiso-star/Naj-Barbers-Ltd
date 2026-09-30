# Decisions — Keel

ADR-style log of significant technical and product decisions, newest first.
Distinct from `PRD.md` §11 (accepted risks) and §13 (still-open questions).

## Format

```markdown
### YYYY-MM-DD — One-line decision title

**Status:** proposed / accepted / superseded by [later decision]
**Context:** … **Decision:** … **Alternatives considered:** … **Consequences:** … **Decided by:** …
```

## Log

### 2026-09-30 — D-007: Task activity is written by database triggers

**Status:** accepted

**Context:** The drawer's activity log has to be trustworthy: a client shouldn't be able to forge or erase history.

**Decision:** `task_activity` has no client INSERT/UPDATE/DELETE grant. `AFTER` triggers on `tasks` and `subtasks` write it as the definer, with `auth.uid()` as the actor.

**Alternatives considered:** Client-written activity rows, which can be forged and drift from the real change. An Edge Function, which adds a service and a second write path.

**Consequences:** Activity is always consistent with the row change. The demo repository reproduces the same trigger logic in TypeScript, so both must change together.

**Decided by:** Claude Code (agent) — pending owner review

### 2026-09-30 — D-006: Dark-first, no light theme in v1

**Status:** accepted

**Context:** The brief asked for a dark-mode-first Linear-style UI.

**Decision:** Ship one dark theme with measured contrast (`PRD.md` §3). `color-scheme: dark` is set globally.

**Alternatives considered:** A dual theme now. It doubles the contrast validation (charts included) for no v1 requirement.

**Consequences:** Adding a light theme later means defining light-mode tokens and re-validating the chart palette against a light surface.

**Decided by:** Claude Code (agent), from the owner's brief

### 2026-09-30 — D-005: Fractional ordering for board positions

**Status:** accepted

**Context:** Every drag has to persist, and realtime has to sync it cheaply.

**Decision:** `tasks.position` is a double. A move writes one row with the midpoint between its neighbours.

**Alternatives considered:** Integer ranks that renumber the column, which means many writes per move and noisy realtime. LexoRank strings, which cost more than v1's scale needs.

**Consequences:** Repeated inserts into the same gap exhaust precision after about 50 halvings (see `memory.md`). Ties are broken by task number.

**Decided by:** Claude Code (agent) — pending owner review

### 2026-09-30 — D-004: Hand-maintained database types until a project is linked

**Status:** accepted

**Context:** No Supabase project exists yet, so `supabase gen types` can't run.

**Decision:** `src/lib/data/database.types.ts` mirrors the migration by hand. Its Insert/Update types list only the granted columns.

**Alternatives considered:** Untyped `supabase-js`, which loses compile-time checks on column names.

**Consequences:** The file can drift from the SQL. Replace it with generated types once a project is linked, and keep the Insert/Update narrowing.

**Decided by:** Claude Code (agent) — pending owner review

### 2026-09-30 — D-003: Repository interface with a browser-local demo implementation

**Status:** accepted

**Context:** The brief asked for data that's "instantly ready for a Supabase one-click migration" and a UI that works immediately.

**Decision:** The UI talks only to a `Repository` interface. `SupabaseRepository` is production. `DemoRepository` stores the same rows in localStorage, syncs tabs over BroadcastChannel, and enforces the same role rules as RLS. Both are seeded from `src/lib/data/seed.ts`, which also generates `supabase/seed.sql`.

**Alternatives considered:** Mock JSON inside components, which can't exercise the permission paths. A local Supabase in Docker for every viewer, which is too heavy for a demo.

**Consequences:** Demo and production share IDs and shapes. Authorisation rules exist twice (SQL and TypeScript), and both are tested (`test:db`, unit tests).

**Decided by:** Claude Code (agent) — pending owner review

### 2026-09-30 — D-002: Supabase (PostgREST + RLS) instead of a FastAPI backend

**Status:** accepted, with the reference-stack deviation recorded in `architecture.md` §7

**Context:** The brief specified Supabase with realtime sync. The charter's reference stack routes everything through FastAPI (ARCH-003).

**Decision:** The browser calls Supabase's PostgREST and Realtime APIs with the user's JWT. RLS policies, column grants, CHECK constraints and triggers are the server-side authorisation and validation layer.

**Alternatives considered:** FastAPI in front of Postgres. It adds a service and hosting to build a realtime fan-out that Supabase already provides.

**Consequences:** ARCH-003's literal wording ("only through the FastAPI backend") isn't met, so the control stays open for the owner to accept or reject. Session cookies from `@supabase/ssr` are JS-readable, which leaves SEC-002 open. Moving writes behind Next.js route handlers would close both, at the cost of realtime latency and complexity.

**Decided by:** Owner's brief (Supabase); layering by Claude Code (agent) — pending owner review

### 2026-09-30 — D-001: Build Keel as a separate app inside the Naj-Barbers-Ltd repository

**Status:** accepted

**Context:** The Keel dashboard is a different product from the barbershop booking site this repository holds.

**Decision:** A self-contained Next.js app in `apps/pm-dashboard/` with its own package, lockfile, PRD family and CI job. The root app ignores `apps/` in lint and typecheck.

**Alternatives considered:** Routes inside the barber app, which mixes products and PRDs. Replacing the barber site, which is destructive.

**Consequences:** Moving Keel to its own repository later is a directory move (`PRD.md` §13 Q4).

**Decided by:** Owner (2026-09-30, in-session answer)
