# Release evidence

Record one row for each 🔴 control checked as verified. Link to a durable test
result, scan, screenshot, configuration diff, or review record. Set a finite
review date based on how quickly this proof can become stale. The checker
rejects overdue rows; a reviewer must assess whether the evidence supports
the claim. Unchecked controls with accepted exceptions are recorded in
`PRD.md` section 11 instead. Store sensitive details in a restricted location,
with a safe link here. GitHub Actions artifacts expire; see the project's
`PRD.md` section 10 retention policy before using one as evidence.

[GitHub's artifact retention guidance](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)
explains why a workflow artifact link alone may not remain available for the
whole life of a release.

## Verified controls

| Control ID | Evidence URL or path | Verified by | Verified on | Review by |
|---|---|---|---|---|
| ARCH-001 | AGENTS.md (project section: as-built layout, commands) | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-001 | docs/evidence/db-tests.txt (T2, T6, T7, T10); src/app/w/[workspace]/layout.tsx; docs/evidence/e2e.txt (J2) | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-003 | docs/evidence/db-tests.txt (T2, T6: foreign rows invisible, cross-tenant FK rejected) | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-004 | docs/evidence/db-tests.txt (T5); docs/evidence/unit-tests.txt (schemas SEC-004 allow-list) | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-013 | docs/evidence/db-tests.txt (T11 CHECK constraints); src/lib/data/schemas.ts | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-014 | docs/evidence/review-2026-09-30.md#sec-014 | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-018 | docs/evidence/secret-scan.txt | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-019 | docs/evidence/review-2026-09-30.md#sec-019; eslint.config.mjs no-console | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| SEC-020 | .env.example; docs/evidence/secret-scan.txt | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| TEST-001 | test-plan.md (coverage table); docs/evidence/e2e.txt; docs/evidence/unit-tests.txt; docs/evidence/db-tests.txt | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| A11Y-001 | docs/evidence/e2e.txt (a11y.spec.ts WCAG 2.2 AA, A11Y keyboard tests); docs/evidence/README.md | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| PROD-021 | docs/evidence/review-2026-09-30.md#prod-021--prod-022 | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| CODE-001 | docs/evidence/review-2026-09-30.md#code-001--code-002; docs/evidence/static-checks.txt | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
| CODE-002 | docs/evidence/review-2026-09-30.md#code-001--code-002 | Claude Code (agent); owner review pending | 2026-09-30 | 2026-12-29 |
