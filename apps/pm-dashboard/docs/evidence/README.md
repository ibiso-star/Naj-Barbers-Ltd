# Evidence index

Durable proof behind the checked 🔴 controls in `evidence.md`. Everything is
committed here, so nothing depends on a CI artifact that expires (`PRD.md` §10).

| File | What it shows |
|---|---|
| `db-tests.txt` | Migration applied to a real PostgreSQL 16, with RLS/grant/trigger/validation assertions T1–T11 and a seed-integrity check. Reproduce with `npm run test:db` |
| `unit-tests.txt` | Vitest: metrics, fuzzy filtering, ordering, reducer idempotency, schema allow-lists, demo-repository permission rules, seed integrity |
| `e2e.txt` | Playwright on the production build: journeys J1–J4 plus F2–F7, and axe WCAG 2.2 AA scans of every view |
| `static-checks.txt` | ESLint, `tsc --noEmit`, `next build` |
| `secret-scan.txt` | Pattern scan of the committed tree and full git history |
| `review-2026-09-30.md` | Manual review record for SEC-014, SEC-019, SEC-002 (left open), PROD-021/022, CODE-001/002 |
| `screens/` | Screenshots of every view at 1440×900, plus mobile at 390×844 |

## Chart palette validation (dataviz method)

```
$ node validate_palette.js "#3987e5,#d95926,#199e70,#c98500" --mode dark --surface "#111113"
  [PASS] Lightness band         all 4 inside L 0.48–0.67
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst adjacent #c98500↔#199e70 ΔE 8.4 (protan) · tritan 24.4
  [PASS] Normal-vision floor    worst adjacent #c98500↔#199e70 ΔE 19.8 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1
```

## Keyboard access (A11Y-001/002)

Automated in `e2e/journeys.spec.ts` (tests titled "A11Y keyboard"):

- On a board card, Enter opens the drawer. Space picks the card up, the arrow keys move it between columns, and Space drops it. Screen-reader announcements come from dnd-kit.
- In the list view, Enter on a row opens the drawer.
- `C` opens New task and `/` focuses search (J1 and F6 tests). Escape closes modals, drawers and popovers.

Two keyboard bugs turned up while writing these tests and are fixed (`memory.md`):
Enter used to reopen and immediately close the drawer, and the tilted drag overlay broke keyboard moves between columns.
