# Memory — {{PROJECT_NAME}}

> New file — no prior charter section covered this. A running log of
> project-specific knowledge a fresh agent session shouldn't have to
> re-discover: gotchas, environment quirks, "this took three attempts before
> we found the real cause." **Not** a changelog (that's git log), **not** a
> decision log with rationale (that's `decisions.md`), **not** a task list
> (that's `tasks.md`). If an entry here starts explaining *why* a choice was
> made rather than *what to watch out for*, it probably belongs in
> `decisions.md` instead.

## Format

One entry per gotcha, newest first. Keep each to a few lines — this is a
lookup list, not a narrative.

```markdown
### {{DATE}} — {{short label}}

{{What to watch out for, and what happens if you don't. Concrete, specific
to this codebase — not a general best practice already covered in
security.md/rules.md.}}
```

## Log

### {{DATE}} — {{EXAMPLE}}

{{e.g. "The Stripe webhook handler needs the raw request body for signature
verification — if a JSON body-parsing middleware runs first, verification
silently fails. Mount the webhook route before any global body parser."}}
