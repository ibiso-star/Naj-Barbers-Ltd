# Keel — workspace project management

A dark-first, Linear-style project and task tracker for small B2B teams:
multi-tenant workspaces, an overview dashboard, a realtime Kanban and list
view, and a task drawer with subtasks and an activity log. It's built on
Next.js 16 and Supabase.

This app lives in `apps/pm-dashboard/` of the Naj-Barbers-Ltd repository and
is fully independent of the barbershop site at the root (`decisions.md` D-001).
It was built under the `ibiso-star/engineering-standards` charter. **Start with
`AGENTS.md`**, which indexes `PRD.md`, `architecture.md`, `security.md`,
`test-plan.md` and the rest.

## Run it

```bash
cd apps/pm-dashboard
npm install
npm run dev            # http://localhost:3000
```

With no environment variables the app runs in **demo mode**: fictional
sample workspaces stored in your browser, with changes synced between tabs.
It's labelled "Demo data" in the sidebar. Settings → Reset sample data
restores the original seed. The demo user is an admin in Atlas Studio, a
member in Beacon Labs, and not a member of Harbor Collective, so you can try
each permission path (`/w/harbor/overview` shows the no-access screen).

Keyboard: `C` new task · `/` search · `[` collapse the sidebar · on a card,
Enter opens it and Space picks it up so the arrow keys can move it.

## Connect Supabase

1. Create a Supabase project, preferably in an EU region (`PRD.md` §5).
2. Apply `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
3. Optional, for staging or preview only: run `supabase/seed.sql` to load the same sample data as the demo. **Never run it in production.**
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The app doesn't use the service-role key.
5. In Auth → URL configuration, add `http://localhost:3000/auth/callback`.
6. Sign in at `/login` and create a workspace. To join the seeded sample workspace instead:
   ```sql
   insert into public.workspace_members (workspace_id, user_id, role)
   select 'b0000000-0000-4000-8000-000000000001', id, 'admin' from auth.users where email = 'you@example.com';
   ```

Realtime is enabled for `tasks`, `projects`, `subtasks`, `task_activity` and
`workspace_members` by the migration. Every change is saved to Postgres and
pushed to every open browser in that workspace. RLS decides who receives it.

## Data model

`workspaces` · `workspace_members` (role `admin` | `member`) ·
`workspace_invitations` · `projects` · `tasks` · `subtasks` · `task_activity`
(written only by triggers) · `profiles`. Every tenant row carries
`workspace_id`, and RLS allows access only to members. Column-level grants
stop clients from writing server-owned fields.

## Checks

| Command | What it runs |
|---|---|
| `npm run lint` / `npm run typecheck` | ESLint, `next typegen` + `tsc` |
| `npm test` | Vitest unit tests (metrics, filters, ordering, reducer, schemas, permission rules, seed) |
| `npm run test:db` | Migration + RLS/grant/trigger/validation assertions + seed on a throwaway PostgreSQL 15+ |
| `npm run build && npm run test:e2e` | Playwright journeys and axe WCAG 2.2 AA scans against the production build |
| `npm run seed:generate` | Regenerates `supabase/seed.sql` from `src/lib/data/seed.ts` |
| `bash scripts/check-charter.sh [--release]` | Engineering-standards document and release gate |

CI runs all of these in the `pm-dashboard` job of `.github/workflows/ci.yml`.

## Deploy

On Vercel, set the project root to `apps/pm-dashboard` and add the two public
env vars. Before a real release, work through `docs/release-readiness.md`:
the release gate currently fails on 30 open 🔴 controls that need a live
project, legal documents or owner decisions.
