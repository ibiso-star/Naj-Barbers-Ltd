#!/usr/bin/env python3
"""Validate a project's charter documents.

The default check is suitable for every PR: the document family must be
complete and internally consistent, while unfinished work may remain open.
Use --release for the release gate: every red control needs either evidence
of completion or a specific, approved, unexpired risk exception.
"""

from __future__ import annotations

import argparse
from datetime import date, timedelta
import hashlib
import json
from pathlib import Path
import re

from policy import FIRST_DEPLOY_DEFERRED, NEVER_EXCEPTION, N_A_ONLY, SPECIALIST_PREFIXES


BACKBONE = (
    "architecture.md",
    "security.md",
    "test-plan.md",
    "rules.md",
    "release-checklist.md",
    "legal.md",
)
POST_SPLIT = (*BACKBONE, "evidence.md", "AGENTS.md", "CLAUDE.md",
              "decisions.md", "memory.md", "design.md",
              "STANDARDS_VERSION", "standards-manifest.json",
              "templates/control-baseline.json")
PLACEHOLDER = re.compile(r"\{\{[A-Z][A-Z0-9_]*\}\}")
CONTROL = re.compile(r"^\s*-\s+\[([ xX])\]\s+([🔴🟡🟢])\s+\[([A-Z][A-Z0-9]*-\d{3})\]\s+")
CHECKLIST = re.compile(r"^\s*-\s+\[[ xX]\]\s+[🔴🟡🟢]\s+")
CONTROL_ID = re.compile(r"^[A-Z][A-Z0-9]*-\d{3}$")
SECTION_0 = re.compile(r"^## 0\.", re.MULTILINE)
NEXT_SECTION = re.compile(r"^## 12\.", re.MULTILINE)


def table_rows(text: str, header: str, end: re.Pattern[str], columns: int) -> tuple[list[list[str]], list[str]]:
    errors: list[str] = []
    start = re.search(header, text, re.MULTILINE)
    if not start:
        return [], [f"missing {header!r} section"]
    finish = end.search(text, start.end())
    section = text[start.end():finish.start() if finish else len(text)]
    rows: list[list[str]] = []
    found_header = False
    for line in section.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells and cells[0] == "Control ID":
            found_header = True
            if len(cells) != columns:
                errors.append(f"table under {header!r} needs {columns} columns")
            continue
        if not cells or all(set(cell) <= {"-", ":", " "} for cell in cells):
            continue
        if len(cells) != columns:
            errors.append(f"malformed table row: {line}")
        else:
            rows.append(cells)
    if not found_header:
        errors.append(f"table under {header!r} needs a Control ID header")
    return rows, errors


def live_prd(text: str) -> tuple[str, int]:
    """Skip explanatory examples above section 0 and copied changelog prose."""
    start = SECTION_0.search(text)
    offset = 0
    if start:
        offset = text[:start.start()].count("\n")
        text = text[start.start():]
    history = re.search(r"^## Version history", text, re.MULTILINE)
    return (text[:history.start()] if history else text, offset)


def named_field(text: str, label: str) -> str | None:
    match = re.search(rf"^- \*\*{re.escape(label)}:\*\*\s*(.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else None


def check_first_deploy_approval(project: Path, release_owner: str | None) -> list[str]:
    path = project / "docs" / "evidence" / "first-deployment-approval.md"
    if not path.is_file():
        return ["first deployment needs docs/evidence/first-deployment-approval.md"]
    text = path.read_text()
    fields = {label: named_field(text, label) for label in
              ("Status", "Approved by", "Approved on", "Expires on",
               "Approval record", "Deferred controls")}
    errors = []
    if fields["Status"] != "approved":
        errors.append("first-deployment approval status must be approved")
    if not release_owner or fields["Approved by"] != release_owner:
        errors.append("first-deployment approval must name the accountable release owner")
    try:
        approved_on = date.fromisoformat(fields["Approved on"] or "")
        if approved_on > date.today():
            errors.append("first-deployment approval date is in the future")
    except ValueError:
        errors.append("first-deployment approval needs an ISO date")
    try:
        expires_on = date.fromisoformat(fields["Expires on"] or "")
        if expires_on < date.today():
            errors.append("first-deployment approval has expired")
        if fields["Approved on"] and expires_on < date.fromisoformat(fields["Approved on"]):
            errors.append("first-deployment approval expires before approval")
        if fields["Approved on"] and expires_on > date.fromisoformat(fields["Approved on"]) + timedelta(days=7):
            errors.append("first-deployment approval window exceeds seven days")
    except ValueError:
        errors.append("first-deployment approval needs an ISO expiry date")
    record = fields["Approval record"]
    if (not record or record.lower() in {"none", "tbd", "unknown"}
            or PLACEHOLDER.search(record) or
            not (record.startswith("https://") or
                 (project / record.split("#", 1)[0]).is_file())):
        errors.append("first-deployment approval needs a real approval record")
    if fields["Deferred controls"] != "SEC-027, OPS-002":
        errors.append("first-deployment approval must identify SEC-027, OPS-002 exactly")
    return errors


def check(project: Path, release: bool, predeploy: bool = False) -> list[str]:
    errors: list[str] = []
    prd = project / "PRD.md"
    if not prd.is_file():
        return [f"missing {prd}"]
    prd_text = prd.read_text()
    release_owner = named_field(prd_text, "Accountable release owner")
    independent_reviewer = named_field(prd_text, "Independent risk reviewer")
    if not release_owner or release_owner.lower() in {"none", "tbd", "unknown"}:
        errors.append("PRD.md section 11 needs a named accountable release owner")
    if not independent_reviewer:
        errors.append("PRD.md section 11 needs an independent risk reviewer name or 'none'")
    profile = re.search(r"^- \*\*Starting profile:\*\*\s*(.+)$", prd_text, re.MULTILINE)
    if not profile:
        errors.append("PRD.md section 0 needs a starting profile")
    else:
        answer = profile.group(1).strip().lower()
        if not any(answer.startswith(value) for value in
                   ("static site", "web application", "marketplace", "native app", "other")):
            errors.append("PRD.md starting profile must name one of the applicability profiles")
    split = ("[MOVED to architecture.md]" in prd_text
             or (project / "standards-manifest.json").exists()
             or ("## 8. Baseline Standards" not in prd_text
                 and "## 11. Risk Exceptions" in prd_text))
    if release and not split:
        errors.append("release check requires a split PRD.md")
    if predeploy:
        errors.extend(check_first_deploy_approval(project, release_owner))
    if split:
        for name in POST_SPLIT:
            if not (project / name).is_file():
                errors.append(f"missing post-split file: {name}")
    files = [prd, *(project / name for name in BACKBONE if (project / name).is_file())]

    controls: dict[str, tuple[Path, int, bool, str]] = {}
    for path in files:
        text, offset = live_prd(path.read_text()) if path == prd else (path.read_text(), 0)
        for number, line in enumerate(text.splitlines(), offset + 1):
            for token in PLACEHOLDER.findall(line):
                if token != "{{PLACEHOLDER}}":
                    errors.append(f"{path.name}:{number}: unresolved {token}")
            if not CHECKLIST.match(line):
                continue
            match = CONTROL.match(line)
            if not match:
                errors.append(f"{path.name}:{number}: checklist item lacks a stable control ID")
                continue
            checked, severity, control_id = match.groups()
            if control_id in controls:
                errors.append(f"{path.name}:{number}: duplicate control ID {control_id}")
            else:
                controls[control_id] = (path, number, checked.lower() == "x", severity)

    if split:
        manifest_path = project / "standards-manifest.json"
        if manifest_path.is_file():
            try:
                manifest = json.loads(manifest_path.read_text())
                expected = set(manifest["control_ids"])
                actual = set(controls)
                severities = manifest.get("control_severities")
                source_ids = manifest.get("source_control_ids")
                if not isinstance(source_ids, list) or not all(
                        isinstance(control_id, str) and CONTROL_ID.fullmatch(control_id)
                        for control_id in source_ids) or len(set(source_ids)) != len(source_ids):
                    errors.append("standards-manifest.json needs valid source_control_ids")
                    source_ids = []
                if not isinstance(severities, dict) or set(severities) != expected:
                    errors.append("standards-manifest.json needs a complete control_severities baseline")
                else:
                    for control_id in sorted(expected & actual):
                        if severities[control_id] != controls[control_id][3]:
                            errors.append(f"{control_id} severity changed from its split baseline")
                    source_baseline_path = project / "templates" / "control-baseline.json"
                    if source_baseline_path.is_file():
                        baseline_bytes = source_baseline_path.read_bytes()
                        recorded_files = manifest.get("files")
                        recorded_hash = (recorded_files.get("templates/control-baseline.json")
                                         if isinstance(recorded_files, dict) else None)
                        if recorded_hash != hashlib.sha256(baseline_bytes).hexdigest():
                            errors.append("templates/control-baseline.json differs from the recorded standards copy")
                        source_baseline = json.loads(baseline_bytes)
                        if not isinstance(source_baseline, dict):
                            errors.append("templates/control-baseline.json needs an ID-to-severity map")
                        else:
                            if set(source_baseline) != set(source_ids):
                                errors.append("templates/control-baseline.json control IDs differ from the source baseline")
                            for control_id in sorted(source_baseline.keys() - expected):
                                errors.append(f"missing source control from standards manifest: {control_id}")
                            for control_id in sorted(expected & source_baseline.keys()):
                                if severities[control_id] != source_baseline[control_id]:
                                    errors.append(f"{control_id} severity differs from the standards source baseline")
                for control_id in sorted(expected - actual):
                    errors.append(f"missing control from split baseline: {control_id}")
                for control_id in sorted(actual - expected):
                    errors.append(f"new control {control_id} needs an updated standards manifest")
                version_path = project / "STANDARDS_VERSION"
                if version_path.is_file() and manifest["version"] != version_path.read_text().strip():
                    errors.append("STANDARDS_VERSION does not match standards-manifest.json")
            except (ValueError, KeyError, TypeError) as exc:
                errors.append(f"invalid standards-manifest.json: {exc}")

    risk_rows, table_errors = table_rows(prd_text, r"^## 11\. Risk Exceptions", NEXT_SECTION, 7)
    errors.extend(table_errors)
    exceptions: dict[str, list[str]] = {}
    for control_id, reason, mitigation, approver, reviewer, approval_record, expiry in risk_rows:
        if not CONTROL_ID.fullmatch(control_id):
            errors.append(f"risk exception has invalid control ID: {control_id}")
            continue
        if control_id in exceptions:
            errors.append(f"duplicate risk exception: {control_id}")
        exceptions[control_id] = [reason, mitigation, approver, reviewer, approval_record, expiry]
        if control_id not in controls:
            errors.append(f"risk exception references unknown control: {control_id}")
        elif controls[control_id][2]:
            errors.append(f"risk exception {control_id} refers to an already verified control")
        elif controls[control_id][3] != "🔴":
            errors.append(f"risk exception {control_id} is not a red control")
        if any(not value or PLACEHOLDER.search(value) for value in
               (reason, mitigation, approver, reviewer, approval_record, expiry)):
            errors.append(f"risk exception {control_id} has an empty or unresolved field")
        if control_id in NEVER_EXCEPTION:
            errors.append(f"{control_id} cannot be excepted; verify it with evidence before release")
        is_na = bool(re.match(r"^N/A\s*[—:-]\s*\S", reason, re.IGNORECASE))
        if reason.upper().startswith("N/A") and not is_na:
            errors.append(f"risk exception {control_id} needs a concrete N/A reason")
        if control_id in N_A_ONLY and not is_na:
            errors.append(f"{control_id} permits N/A only, not accepted risk")
        if not release_owner or approver != release_owner:
            errors.append(f"risk exception {control_id} must be approved by the named release owner")
        if approval_record.lower() in {"none", "n/a", "—", "-", "tbd", "unknown"}:
            errors.append(f"risk exception {control_id} needs a linked approval record")
        if reviewer not in {"—", "-", "none"} and reviewer != independent_reviewer:
            errors.append(f"risk exception {control_id} names an unauthorized independent reviewer")
        if control_id.split("-", 1)[0] in SPECIALIST_PREFIXES and not is_na:
            if (not independent_reviewer or independent_reviewer.lower() == "none"
                    or independent_reviewer == release_owner or reviewer != independent_reviewer):
                errors.append(f"risk exception {control_id} needs the named independent risk reviewer")
        try:
            if date.fromisoformat(expiry) < date.today():
                errors.append(f"risk exception {control_id} expired on {expiry}")
        except ValueError:
            errors.append(f"risk exception {control_id} needs an ISO expiry date (YYYY-MM-DD)")

    evidence: dict[str, list[str]] = {}
    evidence_path = project / "evidence.md"
    if evidence_path.is_file():
        evidence_rows, table_errors = table_rows(evidence_path.read_text(), r"^## Verified controls", re.compile(r"^## ", re.MULTILINE), 5)
        errors.extend(table_errors)
        for control_id, link, reviewer, verified_on, review_by in evidence_rows:
            if control_id in evidence:
                errors.append(f"duplicate evidence row: {control_id}")
            evidence[control_id] = [link, reviewer, verified_on, review_by]
            if control_id not in controls:
                errors.append(f"evidence references unknown control: {control_id}")
            elif not controls[control_id][2]:
                errors.append(f"evidence {control_id} refers to an open control")
            elif controls[control_id][3] != "🔴":
                errors.append(f"evidence {control_id} is not a red control")
            if not CONTROL_ID.fullmatch(control_id) or any(not value or PLACEHOLDER.search(value) for value in (link, reviewer, verified_on, review_by)):
                errors.append(f"evidence {control_id} has an invalid or empty field")
            try:
                verified_date = date.fromisoformat(verified_on)
                if verified_date > date.today():
                    errors.append(f"evidence {control_id} has a future verification date")
            except ValueError:
                errors.append(f"evidence {control_id} needs an ISO date (YYYY-MM-DD)")
                verified_date = None
            try:
                review_date = date.fromisoformat(review_by)
                if review_date < date.today():
                    errors.append(f"evidence {control_id} was due for review on {review_by}")
                if verified_date and review_date < verified_date:
                    errors.append(f"evidence {control_id} review date precedes verification")
            except ValueError:
                errors.append(f"evidence {control_id} needs an ISO review date (YYYY-MM-DD)")

    if release:
        for control_id, (path, number, checked, severity) in controls.items():
            if severity != "🔴":
                continue
            if predeploy and control_id in FIRST_DEPLOY_DEFERRED and not checked:
                continue
            if checked and control_id not in evidence:
                errors.append(f"{path.name}:{number}: verified blocker {control_id} lacks evidence.md row")
            if not checked and control_id in NEVER_EXCEPTION:
                errors.append(f"{path.name}:{number}: blocker {control_id} must be verified; exceptions are forbidden")
            elif not checked and control_id not in exceptions:
                errors.append(f"{path.name}:{number}: open blocker {control_id} lacks approved risk exception")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", nargs="?", type=Path, default=Path("."))
    parser.add_argument("--release", action="store_true", help="enforce red-control evidence or approved exception")
    parser.add_argument("--predeploy", action="store_true", help="first hosted deployment: defer only SEC-027 and OPS-002 with owner approval")
    args = parser.parse_args()
    if args.predeploy and args.release:
        parser.error("choose --predeploy or --release")
    errors = check(args.project, args.release or args.predeploy, args.predeploy)
    for error in errors:
        print(f"FAIL — {error}")
    mode = "predeploy" if args.predeploy else ("release" if args.release else "build")
    print(f"check-charter ({mode}): {'FAIL' if errors else 'PASS'}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
