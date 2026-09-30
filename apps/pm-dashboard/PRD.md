# Engineering Charter

> **How to use this file:** Copy it into a new project as `PRD.md`. Complete section 0 first — it decides which control sections actually apply to this project's risk profile, before you fill in anything else. Fill in every `{{PLACEHOLDER}}` — that syntax is deliberate so this can be handed to an agent ("fill in the placeholders for a boxing/esports rivalry platform") instead of always being edited by hand. Sections marked `[FIXED STANDARD]` are the non-negotiable quality bar for every applicable project. If one genuinely doesn't apply, mark it "N/A — reason," never just delete it — that N/A mechanism is how a fixed standard flexes for a project type it wasn't written for, without weakening it for everyone else.
>
> **Fill this in contextually, never with a blind find-and-replace.** Read the project description and edit each live field individually. Historical notes now live in this standards repo's `CHANGELOG.md`, outside the project template.
>
> **Severity key:** 🔴 Release blocker · 🟡 Should-have · 🟢 Optional polish. An unchecked box means open work during intake/build; it does not make every PR fail. Check a box only after verification. A 🔴 item can reach release unchecked only where `templates/risk-policy.md` permits a specific, approved, time-bound section 11 exception keyed by its control ID. `scripts/check-charter.sh --release` enforces this gate and requires evidence for checked 🔴 items.

---

## Document Map `[NEW — 2026-09-20]`

This file is the single intake document — fill in every `{{PLACEHOLDER}}`
here, in one coherent pass, before running the split. Section 0's answers
determine what's mandatory elsewhere, so answering everything in one place
keeps that cascade consistent; answering it piecemeal across separate files
is exactly what this workflow is designed to avoid.

From the standards checkout, use
`python3 scripts/bootstrap-project.py /path/to/project` to copy this file as
`PRD.md` plus the required `scripts/` and `templates/` files. The bootstrap
refuses to overwrite existing project files. The splitter reads those copied
templates and must run from the project's own `scripts/` directory.

Once filled in, run `scripts/split-charter.py PRD.md` from inside the new
project. It generates every 🔴/🟡/🟢 item that was anywhere in this file's
former section 8 or 9 into exactly one of six backbone files — nothing from
those sections is left behind here:

| File | Source | Cardinality |
|---|---|---|
| `PRD.md` (rewritten) | This file, with extracted sections replaced by pointers | One per project |
| `architecture.md` | Generated from sections 6/7/7.1/7.2 | One per project |
| `security.md` | Generated from sections 8.1 (security baseline), 8.7 (deployment & operations), and 8.8 (incident response) | One per project |
| `test-plan.md` | Generated from section 8.6 | One per project |
| `rules.md` | Generated from sections 8.3 (code quality and coding conventions) and 8.11 (documentation) | One per project |
| `release-checklist.md` | Generated from sections 8.2 (anti-cliché/product-integrity), 8.4 (accessibility), 8.5 (performance), 8.10 (SEO), and 9 (mobile app store launch) | One per project |
| `legal.md` | Generated from section 8.9 | One per project |
| `AGENTS.md` / `CLAUDE.md` | Copied in as-is (project name substituted) | One per project |
| `decisions.md` / `memory.md` / `evidence.md` | Copied in as living logs | One per project |
| `tasks.md` | Optional work board (`--with-tasks`); use the existing issue tracker if one exists | At most one per project |
| `design.md` | Generated as a project-level *seed* (section 0 + palette/typeface pre-filled from section 3) — the rest comes from a design skill's own per-page intake (`skills/landing-page-design/`) or an AI design platform | One seed per project; copy per page/surface and complete there |
| `STANDARDS_VERSION` | Records which standards release started this project | One per project |
| `templates/control-baseline.json` | Copied source severity map; the splitter requires every source ID and the checker verifies its hash, IDs, and severities against the split manifest and living controls | One per project |

After the split, this document (now slimmed to product/scope/brand/
applicability/evidence/cross-cutting content — sections 0-6 and 10-14) and
the six generated backbone files are the living documents — don't keep
re-filling a separate master copy and re-running the split; edit the
generated files directly from here on. Run `scripts/check-charter.sh` during
intake and on every PR; run `scripts/check-charter.sh --release` before a
release. The latter requires every 🔴 control to have evidence or a specific
approved exception. For a static-site profile, `python3 scripts/propose-na.py`
can draft exact-ID N/A candidates after the split. Review each candidate
against the actual site and hosting; the proposal changes no control or
approval record.

---

## 0. Applicability Profile `[COMPLETE BEFORE THE REST OF THE PRD]`

This profile decides which implementation and release controls apply. It prevents a simple public site from inheriting production-SaaS obligations, while making the riskier work explicit for products that need it. For every answer, state the rationale and link the resulting applicable controls in sections 8–11. `N/A` means "not applicable to this project"; it is not a substitute for deciding.

**Each field takes exactly one answer, not a menu.** The list after each em dash below is the range of valid values, not a set of options to leave open — pick one. If you're genuinely uncertain, still commit to a single answer and mark the confidence, e.g. `public (low confidence — revisit after user testing)`, rather than leaving multiple live options for whoever reads this next to resolve themselves. If something is truly undecided rather than merely uncertain, write `UNKNOWN — not yet decided` instead of picking one of the listed examples as a stand-in — an example that looks like a decision is worse than an honestly flagged gap, because it gets built against.

Use `templates/applicability-profiles.md` to choose a starting profile, then
record any project-specific additions or exclusions here. The profile guides
which modules need detailed answers; it never silently deletes a control.

- **Starting profile:** web application — a multi-tenant B2B SaaS dashboard; no marketplace, no native app — static site, web application, marketplace, native app, or other; explain any hybrid

- **Product exposure:** private beta (medium confidence — currently a demo build; revisit before any public sign-up opens) — internal-only, private beta, or public
- **Delivery type:** web application (Next.js, dynamically rendered, backed by Supabase) — static site, web application, API/service, native mobile app, desktop app, or other
- **Accounts and authorisation:** multi-tenant organisations — users belong to one or more workspaces with a per-workspace role of `admin` or `member`; Supabase Auth magic-link sign-in — no accounts, user accounts, multi-tenant organisations, admin roles, or other
- **Privileged operations:** custom in-app workspace-admin actions only: rename workspace, invite members, change member roles, archive projects. These are tenant-scoped (a workspace admin, not platform staff) and are enforced by Postgres RLS. Platform-operator actions use the Supabase console; no custom platform-staff interface is built — none, platform console only, or a custom staff/admin interface; name the operators and permitted actions, and explain why existing platform tools are insufficient if building a custom interface
- **Data profile:** basic personal data — member names, email addresses, avatar initials, and free-text task content that may incidentally contain personal data. Jurisdictions: UK and EU (owner is UK-based) — no personal data, basic personal data, special-category/regulated data, children's data, financial data; list the jurisdictions served
- **Money and regulated activity:** payments/subscriptions planned but not built — the Billing page displays the plan and seat count only; no card data is collected and no Stripe integration exists in v1 — none, payments/subscriptions, marketplace, financial/medical/safety/other regulated activity
- **Automated or AI actions:** none — the product itself has no AI features. The codebase is AI-assisted (Claude Code); that is covered by review, not by SEC-037/038 product controls — none, assistive generation only, retrieval, tools/actions, or autonomous workflows
- **Availability and recovery target:** beta traffic under 50 concurrent users; best-effort availability (Supabase + Vercel managed SLAs); RPO 24h via Supabase daily backups, RTO 4h — expected traffic, uptime expectation, RPO/RTO if applicable
- **Applicable control sets:** 8.1 core web + multi-tenant controls (AI controls SEC-037/038/039 N/A — no AI features; SEC-015 N/A — no uploads; SEC-016 N/A until billing exists; SEC-035/036 N/A until webhooks/payments exist); 8.2–8.8, 8.10 (reduced: the app is behind sign-in, so only the sign-in page is indexable), 8.11; 8.9 UK/EU privacy; 9 N/A — web only, no native app — e.g. "8.1 core web controls; 8.9 UK/EU privacy; 9 iOS only"; list each N/A control set and why

---

## 1. Project Identity `[EDIT PER PROJECT]`

- **Project name:** Keel
- **One-line description:** A fast, keyboard-friendly project and task tracker for small B2B teams, organised around workspaces.
- **Problem statement:** Small agencies and product teams juggle several clients or products at once. General tools either blur client data together or are too heavy to keep up to date, so status lives in chat threads and managers cannot see overdue work or who is overloaded. — what's broken or missing today, for whom
- **Why now:** The owner needs a reference-quality multi-tenant SaaS build that exercises the engineering-standards workflow end to end (tenancy, RLS, realtime) before using it on client work. — what makes this the right time to build it
- **Proposed solution:** A workspace-scoped dashboard: an overview of velocity, overdue work and team workload; a projects list; a realtime Kanban and list view of tasks with fuzzy search and filters; a task drawer for description, subtasks and activity; and member/role management — all persisted in Supabase with row-level security per workspace.
- **Target audience:** Team leads and individual contributors at 3–30 person agencies and product teams who currently use spreadsheets, Trello or Linear-style tools; comfortable with web apps and keyboard shortcuts. — demographics, behaviors, existing alternatives they use today
- **Category/vertical:** B2B SaaS — project management / productivity
- **Success looks like:** In beta, a workspace of 5+ members moves at least 20 tasks per week on the board, and two concurrent browsers see each other's changes in under 2 seconds. — a metric, a behavior, a milestone, not a vague feeling

## 2. Personas & User Journeys `[EDIT PER PROJECT]`

- **Primary persona(s):** (1) Workspace admin / team lead — sets up projects, invites the team, watches overdue items and workload; admin role. (2) Member / contributor — picks up tasks, moves them across the board, adds subtasks and notes; member role. (3) Multi-workspace consultant — belongs to several client workspaces and must never see one client's data in another's view. — who they are, what they're trying to do, what they know coming in; include staff/operators if privileged workflows exist
- **Critical user journeys:** (J1) Create and move a task — normal: Add Task modal → card appears in Todo → drag to In Progress → persisted and visible in other browsers. Failure: the save fails → the card snaps back and an error toast explains it. Permission-denied: a user who is not a workspace member gets the no-access screen, never another workspace's tasks. Empty: a new workspace shows an empty board with a single create prompt. Recovery: retry from the toast or reload; the server state is authoritative. (J2) Switch workspace — normal: switcher lists only the user's workspaces and every view re-filters by the active workspace ID. Failure: the workspace cannot load → an error state with retry. Permission-denied: a typed URL for a workspace you do not belong to → the no-access screen. Empty: a user with no workspaces → a prompt explaining they need an invite. Recovery: switch back through the switcher. (J3) Edit a task in the drawer — status, assignee, description, subtasks; each field saves on change with the same failure/recovery behaviour as J1; members can edit tasks, only admins can delete projects or change roles. (J4) Invite a teammate — admins only; members see the button disabled with an explanation, and the database rejects member-issued invites regardless of UI. — for each one, map all five paths, not just the happy one:
  - Normal path (everything works)
  - Failure path (something breaks mid-flow — what does the user see?)
  - Permission-denied path (they try something they're not allowed to)
  - Empty path (no data yet — first-run experience)
  - Recovery path (how do they get back on track after 2 or 3?)
- **Flow diagram / sitemap:** `docs/flows.md` (Mermaid diagram in the repo; no FigJam file per the owner's code-is-the-design-artifact convention) — a FigJam (or equivalent) link showing how screens connect and where each journey path above actually leads; a described journey without a diagram stays abstract

## 3. Brand & Design `[EDIT PER PROJECT]`

- **Name/logo file(s):** none supplied — an inline SVG keel mark in `src/components/brand/KeelMark.tsx` (typographic placeholder until a logo is commissioned)
- **Logo usage:** mark + wordmark in the expanded sidebar header; mark only in the collapsed sidebar and favicon; on dark surfaces only (the product is dark-first); minimum 16px — map each supplied variant to its intended surface and background (header/footer, light/dark, compact/icon), with minimum size and clear space where known
- **Other visual assets and rights:** none — no photography or illustrations; icons from lucide-react (ISC licence) — file paths, intended placement, source/permission, and whether an image is real product proof or illustrative
- **Color palette:** Neutrals: zinc scale — canvas #09090B, surface #111113, raised #18181B, hairline border #27272A, strong border #3F3F46, text primary #FAFAFA (19.1:1 on canvas), secondary #A1A1AA (7.8:1), muted #8E8E97 (6.1:1 on canvas, 5.5:1 on raised, 4.6:1 on the hover/line greys — raised from #71717A after the axe scan found it under 4.5:1 on raised surfaces). Accent: signal blue #3987E5 (5.5:1 on canvas; white text on it is only 3.6:1, so primary buttons use a #1C5CAB fill with white text, 6.6:1). Chart series and status colours come from the validated dataviz reference palette (dark steps). Status: good #0CA30C, warning #FAB219, serious #EC835A, critical #D03B3B — always paired with an icon or label (primary, secondary, accent, neutrals — hex codes) — contrast-check against WCAG AA *now*, at definition time, not later in 8.4 after everything's already built around it
- **Typography:** IBM Plex Sans for UI (neutral, engineered, legible at 12–14px, and distinct from the Inter/Geist default) and IBM Plex Mono for task identifiers and numeric columns (tabular figures) (heading font, body font, and why)
- **Tone/voice:** plain, terse and exact — like good engineering tooling. Sentence case, short labels, no exclamation marks, no marketing language inside the product
- **Visual references:** want: Linear's density, hairline borders, restrained colour and speed; keyboard shortcuts. Don't want: purple-to-blue gradients, glassmorphism, glowing orbs, heavy drop shadows, rounded-everything cards, or a pastel light theme — what you want, and what you explicitly don't want
- **Anti-cliché check-in:** apply section 8.2's anti-cliché list now, as a design constraint, not only as the pre-launch verification it's written for — picking a distinct direction here is what makes 8.2 a formality later instead of a rewrite.
- **Per-page design briefs:** this section holds the project's brand decisions once. A specific landing page or major surface gets its own `design.md` copy (see `skills/` for the design skills that produce one, e.g. `landing-page-design`) — the brand decided here always takes precedence over a design skill's own defaults; `design.md` section 0 records that explicitly, and `scripts/split-charter.py` generates a project-level seed of it pre-filled from the answers above.

## 4. Scope `[EDIT PER PROJECT]`

- **MVP feature list:** (F1) Workspaces — Given a user in two workspaces, when they switch workspace, then every view shows only that workspace's projects, tasks and members. (F2) Overview — Given tasks with due and completion dates, when the overview loads, then it shows Total Projects, Completed Tasks, Active Budget, a 6-month completion-rate line, weekly velocity, overdue items and a member × status workload heatmap, each chart with hover tooltips. (F3) Projects — Given an admin or member, when they submit the New Project modal with a name, then the project appears in the list and in project filters. (F4) Kanban — Given the Tasks view, when a user drags a card to another column, then its status and position are saved and other open browsers update without reload. (F5) Add Task — Given the Add Task modal with a title, priority and due date, when submitted, then the task appears at the bottom of Todo. (F6) Filters — Given a search term or priority/assignee selections, when typed or toggled, then the board and list re-filter instantly with fuzzy matching on title, identifier and description. (F7) Task drawer — Given a task card, when clicked, then a right-hand drawer opens where status, assignee, priority, due date, description and subtasks can be edited and the activity log is shown. (F8) Team — Given an admin, when they invite an email with a role, then a pending invitation is recorded; a member cannot. (F9) Demo mode — Given no Supabase environment variables, when the app starts, then it runs on clearly labelled sample data persisted in the browser and synced across tabs. — for each feature, write acceptance criteria as Given/When/Then, not just a title. "Given a logged-in user with an expired card, when they try to buy a ticket, then they see a clear payment-failure message and their cart is preserved" is testable; "ticket purchase" is not.
- **Explicitly out of scope for v1:** Real billing/Stripe checkout, email delivery of invitations, file attachments, comments/mentions, notifications, custom workflows/statuses, public API, SSO/SAML, native apps
- **Phase 2+ ideas:** Stripe subscriptions with seat billing; invitation emails via Resend; cycles/sprints; command palette; comments with @mentions; GitHub PR linking; CSV import

## 5. Data Inventory & Domain Model `[EDIT PER PROJECT]`

- **Core entities:** profiles (1:1 auth.users), workspaces, workspace_members (profile × workspace with role), workspace_invitations, projects (belong to a workspace), tasks (belong to a workspace and optionally a project; optional assignee who must be a member), subtasks (belong to a task), task_activity (append-only log per task) — the nouns of the system and how they relate
- **Ownership:** A workspace owns all of its projects, tasks, subtasks, activity and invitations. Any member can create and edit projects, tasks and subtasks; only admins can rename the workspace, invite, change roles, remove members or delete projects. Activity rows are written by a database trigger, never by clients. A profile is owned and edited by its user — who/what owns each entity, who can modify it
- **Sensitivity classification:** profiles.email and full_name — PII; workspace_invitations.email — PII; task title/description — business-confidential free text that may contain PII; everything else is non-personal business data. No financial, medical or special-category data — flag anything that's PII, financial, medical, or otherwise sensitive per entity
- **Processing purposes, lawful basis & ROPA:** (P1) Account and authentication — data subjects: users; categories: email, name; lawful basis: contract; recipients: Supabase (processor, EU region); retention: life of account. (P2) Collaboration content — users; task/project content and activity; lawful basis: contract with the customer workspace; the customer is controller, Keel is processor; retention: until the workspace deletes it. (P3) Invitations — invitees; email; lawful basis: legitimate interest of the inviting customer; retention: 30 days or until accepted. No analytics or marketing processing in v1 — for every processing activity/purpose (not per entity — the same field can have different lawful bases depending on which purpose is using it), record the data subjects and categories, lawful basis (and any special-category/criminal-data condition), recipients/data transfers, retention, controller/processor role, and justification
- **Retention, deletion & rights requests:** Accounts retained while active; erasure on request within one month by deleting the auth user (cascades to profile and memberships; authored tasks keep the content but set creator/assignee to null). Workspaces are deleted by an admin on request, cascading all child rows. Invitations expire after 30 days. Supabase backups roll off after 7 days (Pro plan). Access and portability requests are fulfilled by an SQL export of the user's rows. No tax or fraud retention exceptions apply until billing exists — how long each entity type is retained; how access, correction, objection, portability, and erasure requests are handled; and the legal, contractual, fraud-prevention, security, or tax-retention exceptions that require restricted retention instead of deletion
- **Tenant/account boundaries:** Shared database, row-level isolation: every tenant table carries workspace_id; Postgres RLS allows access only where `is_workspace_member(workspace_id)` (and `is_workspace_admin` for admin actions). The client additionally filters every query and realtime subscription by the active workspace ID, but that filter is for performance and UX — RLS is the boundary — if multiple users/orgs share the system, how is their data isolated from each other

## 6. Architecture & Trust Boundaries, Technical Stack, Repository Structure `[MOVED to architecture.md]`

**Generated into `architecture.md`** by `scripts/split-charter.py` (this replaces the former sections 6, 7, 7.1, and 7.2).

# Part II — Implementation & Release Plan

Former sections 7 through 9 have been generated into this project's backbone
documents per the Document Map above (`architecture.md`, `security.md`,
`test-plan.md`, `rules.md`, `release-checklist.md`, `legal.md`). Sections 10
through 14 below stay here because they're cross-cutting — evidence, risk
exceptions, metrics, open questions, and the AI handoff protocol apply across
the whole family, not to one file.

*(Former sections 8 and 9 — Baseline Standards and the Mobile App Store
Launch Checklist — generated into `security.md` (8.1, 8.7, 8.8), `rules.md`
(8.3, 8.11), `test-plan.md` (8.6), `release-checklist.md` (8.2, 8.4, 8.5,
8.10, and the mobile checklist), and `legal.md` (8.9) by
`scripts/split-charter.py`.)*

## 10. Release Evidence & Sign-off `[FIXED STANDARD]`
A checked box is a claim, not proof. Record each verified 🔴 control by ID in
`evidence.md`, with a durable test result, scan, screenshot, configuration diff,
or review record and a date by which it must be rechecked. A reviewer must
assess whether the evidence is sufficient. Avoid using a link to a short-lived
CI artifact as the only copy of release evidence; archive what must outlive it.

- **Evidence store and custodian:** `evidence.md` plus `docs/evidence/` in this repository; custodian: the release owner
- **Evidence retention and deletion policy:** kept in git history for the life of the project; screenshots and reports committed, never linked only to short-lived CI artifacts
- **Evidence review owner and cadence:** release owner, at every release and at least every 90 days

`scripts/check-charter.sh` checks document structure, placeholders, stable IDs,
and exact exception references during intake and build. Open work is allowed.
`scripts/check-charter.sh --release` also requires every checked 🔴 control to
have an `evidence.md` row, and every unchecked 🔴 control to have a valid
section 11 exception. Do not use the build check as a release sign-off.
If hosted HTTPS (`SEC-027`) and live monitoring (`OPS-002`) need a real URL,
`scripts/check-charter.sh --predeploy` permits a first hosted deployment only
with a dated approval record from the accountable release owner in
`docs/evidence/first-deployment-approval.md`. It defers only those two controls
for up to seven days; every other release control still applies. Verify the
hosted URL and monitoring after deployment, record evidence, and run the full
`--release` gate. Approval expiry blocks another first deployment; it does
not automatically unpublish an existing site. The release owner must close
the two controls or withdraw the site before the approved window ends.

## 11. Risk Exceptions `[EDIT PER PROJECT]`
Any place this project deliberately accepts a risk or declares a 🔴 control
inapplicable instead of closing it. Use the exact control ID on the checklist
line; specify a mitigation, named approver, approval record, and ISO
review/expiry date. `templates/risk-policy.md` lists controls that cannot be
excepted and those that permit only a specific N/A. The release owner is
accountable for each exception. An actual accepted risk in security, incident
response, legal/privacy, or mobile store controls also needs an independent
reviewer. A name here does not prove authority or qualification; release
reviewers confirm both. Use `none` for the independent reviewer until one is
designated; no specialist risk can be accepted in that state. Leave the table
with only its header if there are no exceptions.

- **Accountable release owner:** Ibiso (repository owner, ibiso-star)
- **Independent risk reviewer:** none

| Control ID | Risk or N/A reason | Mitigation in place | Approved by | Reviewed by | Approval record | Review/expiry date |
|---|---|---|---|---|---|---|

## 12. Success Metrics `[EDIT PER PROJECT]`

Weekly active workspaces; tasks moved per workspace per week (target 20+); median realtime propagation latency between two browsers (target under 2s); share of tasks overdue (lower is better); error-toast rate per 100 writes (target under 1) — name the specific numbers you'll actually look at, not vague categories.

- **Review cadence:** weekly during beta — how often these numbers actually get looked at (weekly/monthly/at each release), not defined once at launch and forgotten

## 13. Open Questions / Risks `[EDIT PER PROJECT]`

(Q1) Product name 'Keel' is a working name — check trademark before public launch. (Q2) Budget currency is GBP only; multi-currency is undecided. (Q3) Invitation acceptance flow (email delivery + token) is not built; invitations are recorded only. (Q4) Should this app move to its own repository before beta? (Q5) Legal documents (ToS/Privacy) are not written — LEGAL-001/002 are open release blockers

- **Review cadence:** at every release and monthly during beta — a risk written down once and never revisited isn't being managed, it's being filed

---

## 14. AI Handoff Protocol `[FIXED STANDARD]`
Two distinct moments this applies to:

**Filling in this document (before the split):**
1. Summarize your understanding of the plan back before writing anything, surfacing any material ambiguity rather than silently guessing
2. Ask about anything genuinely unclear in sections 1–6 before starting, rather than inventing an interpretation
3. Fill in every `{{PLACEHOLDER}}` in one coherent pass — don't leave section 0's answers inconsistent with what gets marked N/A elsewhere

**Working in the project after the split (reading `AGENTS.md`, `architecture.md`, `security.md`, `test-plan.md`, `rules.md`, `release-checklist.md`, `legal.md`, `decisions.md`, `memory.md`):**
4. Implement authorization/validation controls server-side by construction, not as an afterthought pass
5. Run the test suite per `test-plan.md` and report actual results, not assumed success
6. Inspect responsive/empty/error states visually where feasible, not just the happy path
7. Report incomplete or skipped work honestly and explicitly — a partially-done item marked as done is worse than an honestly-flagged gap
8. For any 🔴 item in `security.md`, `test-plan.md`, `rules.md`, `release-checklist.md`, or `legal.md` claimed complete, record the evidence per section 10 — a checked box without evidence is a claim, not proof
9. Log any significant technical decision made along the way in `decisions.md`, and any non-obvious gotcha discovered in `memory.md`

---
