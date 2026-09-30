#!/usr/bin/env python3
"""Draft exact-ID static-site N/A candidates without approving or applying them."""

from __future__ import annotations

import argparse
from pathlib import Path
import re

from policy import NEVER_EXCEPTION


CONTROL = re.compile(r"^- \[ \] 🔴 \[([A-Z][A-Z0-9]*-\d{3})\]", re.MULTILINE)
BACKBONE = ("security.md", "test-plan.md", "rules.md", "release-checklist.md", "legal.md")


def propose(project: Path, output: Path) -> int:
    prd = project / "PRD.md"
    source = project / "templates" / "static-site-na-candidates.md"
    if not prd.is_file() or not source.is_file():
        raise ValueError("PRD.md and templates/static-site-na-candidates.md are required")
    if output.exists():
        raise ValueError(f"refusing to overwrite {output}")
    prd_text = prd.read_text()
    if not re.search(r"^- \*\*Starting profile:\*\*\s*static site\b", prd_text, re.MULTILINE | re.IGNORECASE):
        raise ValueError("N/A proposal requires a static-site starting profile")
    files = [prd, *(project / name for name in BACKBONE if (project / name).is_file())]
    open_red = {control_id for path in files for control_id in CONTROL.findall(path.read_text())}
    rows = []
    for line in source.read_text().splitlines():
        if not line.startswith("| "):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) == 3 and cells[0] in open_red and cells[0] not in NEVER_EXCEPTION:
            rows.append(line)
    if not rows:
        raise ValueError("no open red static-site N/A candidates found")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        "# Proposed static-site N/A decisions — UNAPPROVED\n\n"
        "These are candidates based on a starting profile, not verified facts or "
        "release exceptions. Check each capability and hosting behavior. The "
        "release owner must approve each applicable exact ID in `PRD.md` section "
        "11 with a real approval record and expiry date. This file changes no "
        "control status and cannot clear the release gate.\n\n"
        "| Control ID | Candidate reason to verify | Reopen trigger / mitigation |\n"
        "|---|---|---|\n" + "\n".join(rows) + "\n\n"
        "Hosting, privacy, accessibility, content integrity, and operational "
        "controls remain applicable unless separately reviewed.\n"
    )
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", nargs="?", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    output = args.output or args.project / "docs" / "proposed-na.md"
    try:
        count = propose(args.project, output)
    except ValueError as exc:
        parser.error(str(exc))
    print(f"Wrote {count} unapproved candidates to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
