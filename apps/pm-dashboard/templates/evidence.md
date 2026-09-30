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
