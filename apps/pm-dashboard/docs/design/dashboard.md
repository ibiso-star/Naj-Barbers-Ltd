# Design Brief — Keel app shell and dashboard

Copied from the project `design.md` seed. This surface is the signed-in
product, not a marketing page, so the `landing-page-design` skill's intake
does not apply; sections that only make sense for a landing page are marked
N/A rather than left looking like open decisions.

**Skill used:** none (app surface). Charts follow the dataviz method: form
first, colour by job, palette validated with its script.
**Date:** 2026-09-30
**Owner:** Ibiso (release owner, `PRD.md` §11)

## 0. Brand source of truth

- **Established brand:** yes, `PRD.md` §3. It takes precedence over any design default.
- **Logo:** none supplied; the working mark is `src/components/brand/KeelMark.tsx`. Sidebar and headers only, on dark surfaces.
- **Other assets:** none. Icons come from lucide-react (ISC licence).

## 1. Intake

N/A. There's no conversion goal, traffic source or offer. The product's
audiences and journeys are in `PRD.md` §1–2.

## 2. Layout and structure

- **Layout:** fixed left sidebar (collapsible to 52px, off-canvas below 768px), a sticky page header per view, and content that fills the rest. Everything the user acts on is one click from the sidebar. Other workspaces are one switcher away.
- **Overview order:** KPI row first (the four numbers a lead checks daily), then completion rate and velocity side by side (change over time), then the workload heatmap and the overdue list (who needs help, and what slipped). There are no decorative sections.
- **Tasks:** Board and List show the same filtered set. Filters sit in one row above the content. The drawer opens from the right so the board stays visible.
- **SEO/AEO:** noindex. The app is behind sign-in (`robots: noindex` in the root layout).

## 3. Copy decisions

Product UI copy only: sentence case, short labels, no exclamation marks.
Each empty state says what will appear there and offers the one action that
fills it. Errors say what happened and what to do next.

## 4. Proof and risk reversal

N/A. There are no claims, testimonials or metrics about the product. Demo
mode is labelled "Demo data" in the sidebar. The sample people and companies
are fictional and marked as such in `src/lib/data/seed.ts`.

## 5. Visual system resolution

| Element | Source | Value |
|---|---|---|
| Palette | `PRD.md` §3 | zinc neutrals, signal-blue accent, contrast measured |
| Typeface | `PRD.md` §3 | IBM Plex Sans / IBM Plex Mono |
| Chart series | dataviz reference palette, dark steps | #3987e5, #d95926, #199e70, #c98500. Validated against #111113, all checks pass |
| Heatmap | dataviz sequential blue ramp | #104281 → #9ec5f4. Empty cells use the surface colour |
| Spacing scale | Tailwind 4px scale | dense: 32px rows, 8px card gaps |
| Corner radius | deliberate | 6px controls and cards, 8px panels. Nothing is pill-shaped except avatars |
| Icon set | lucide-react plus custom status/priority glyphs | shape carries meaning, colour is secondary |
| Motion | purposeful only | 160–200ms overlay entry; honours `prefers-reduced-motion` |

Overrides: none. There's no shadcn/ui default look (PROD-013), no gradients,
no glass. Shadows appear only on overlays.

## 6. Ship requirements

- Loading, empty, error, permission-denied and recovery states exist for every view (`PRD.md` §2 journeys). Screens are in `docs/evidence/screens/`.
- Automated WCAG 2.2 AA scan passes on every view and on open overlays (`e2e/a11y.spec.ts`).
- Mobile: the sidebar goes off-canvas and the board scrolls horizontally.

## 7. Sign-off

| Area | Decision/evidence | Reviewer | Date |
|---|---|---|---|
| Brand precedence (section 0) | `docs/evidence/screens/` | pending — release owner | — |
| Copy and structure | this brief | pending — release owner | — |
| Visual system | palette validator output in `docs/evidence/README.md` | pending — release owner | — |
| Ship requirements | `docs/evidence/e2e.txt` | pending — release owner | — |
