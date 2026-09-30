<!--
Copy to .github/PULL_REQUEST_TEMPLATE.md in a new project.
Ties this PR to PRD.md section 10 (Release Evidence & Sign-off): a checked
box is a claim, not proof — link the evidence, don't just tick it.
-->

## What changed and why

{{SUMMARY}}

## Evidence (PRD.md section 10)

For every 🔴 item in security.md/test-plan.md/rules.md/release-checklist.md/
legal.md this PR touches or claims complete, link the actual evidence — a
test result, scan output, screenshot, config diff, or review comment. Not
required for items this PR doesn't affect.

| 🔴 item touched | Evidence |
|---|---|
| {{ITEM}} | {{LINK_OR_NOTE}} |

## Checklist

- [ ] `scripts/check-charter.sh` passes (complete document family, resolved
      intake fields, unique control IDs, valid exception references)
- [ ] If this is a release PR, `scripts/check-charter.sh --release` passes;
      each verified 🔴 control has an `evidence.md` row and each open one has
      an approved, unexpired `PRD.md` §11 exception
- [ ] If this is the first hosted deployment, `--predeploy` passes with the
      dated owner approval record; hosted HTTPS and monitoring evidence will
      be verified before the final `--release` gate
- [ ] Lint → typecheck → tests → build all pass in CI
- [ ] No new dead code, TODOs, or `console.log`/debug prints left in (8.2/8.3)
- [ ] This PR doesn't introduce a second, competing structure to `AGENTS.md`'s
      layout (e.g. business logic inside a route handler)
- [ ] If this PR changes brand/visual decisions, `PRD.md` §3, the project
      `design.md` seed, and affected `docs/design/*.md` briefs agree

## Risk exceptions

For a release PR, each remaining open 🔴 item needs a permitted row in
`PRD.md` section 11 keyed by its control ID, with the named release owner,
an approval record, and an expiry. Sensitive risk acceptances also need the
named independent reviewer. Link the specific rows here. Ordinary build PRs
may leave work open without accepting release risk:

{{RISK_EXCEPTION_LINK_OR_NA}}
