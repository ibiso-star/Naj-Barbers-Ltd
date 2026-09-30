#!/usr/bin/env python3
"""Report how a project differs from a newer engineering-standards checkout.

Read-only: it never overwrites a project's decisions or generated documents.
Usage: scripts/compare-standards.py /path/to/engineering-standards [project-dir]
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re


CONTROL = re.compile(r"^- \[[ xX]\] ([🔴🟡🟢]) \[([A-Z][A-Z0-9]*-\d{3})\]", re.MULTILINE)
BACKBONE = ("PRD.md", "architecture.md", "security.md", "test-plan.md",
            "rules.md", "release-checklist.md", "legal.md")


def digest(path: Path) -> str | None:
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def standard_paths(source: Path) -> list[Path]:
    scripts = [path for path in (source / "scripts").glob("*") if path.is_file()]
    templates = [path for path in (source / "templates").rglob("*") if path.is_file()]
    return sorted(scripts + templates)


def control_severities(paths: list[Path]) -> dict[str, str]:
    return {control_id: severity for path in paths if path.is_file()
            for severity, control_id in CONTROL.findall(path.read_text())}


def accept(source: Path, project: Path) -> str:
    """Record a reviewed migration after all source controls are carried over."""
    manifest_path = project / "standards-manifest.json"
    version_path = source / "templates" / "STANDARDS_VERSION"
    charter_path = source / "ENGINEERING_CHARTER.md"
    if not manifest_path.is_file() or not version_path.is_file() or not charter_path.is_file():
        raise ValueError("source charter/version or project standards manifest is missing")
    source_controls = control_severities([charter_path])
    project_controls = control_severities([project / name for name in BACKBONE])
    missing = sorted(source_controls.keys() - project_controls.keys())
    if missing:
        raise ValueError("project is missing source controls: " + ", ".join(missing))
    changed = sorted(control_id for control_id, severity in source_controls.items()
                     if project_controls[control_id] != severity)
    if changed:
        raise ValueError("project control severity differs from source: " + ", ".join(changed))
    source_baseline = json.loads((source / "templates" / "control-baseline.json").read_text())
    if source_baseline != source_controls:
        raise ValueError("source control baseline differs from source charter")
    version = version_path.read_text().strip()
    files = {str(path.relative_to(source)): digest(path)
             for path in standard_paths(source)}
    manifest_path.write_text(json.dumps({"version": version, "files": files,
                                         "control_ids": sorted(project_controls),
                                         "source_control_ids": sorted(source_controls),
                                         "control_severities": project_controls},
                                        indent=2, sort_keys=True) + "\n")
    (project / "STANDARDS_VERSION").write_text(version + "\n")
    return f"Accepted standards version {version}; run scripts/check-charter.sh next."


def compare(source: Path, project: Path) -> tuple[list[str], bool]:
    manifest_path = project / "standards-manifest.json"
    version_path = source / "templates" / "STANDARDS_VERSION"
    if not manifest_path.is_file():
        raise ValueError(f"missing {manifest_path}; this project predates version tracking")
    if not version_path.is_file():
        raise ValueError(f"missing {version_path}")
    manifest = json.loads(manifest_path.read_text())
    baseline: dict[str, str] = manifest["files"]
    old_version = manifest["version"]
    new_version = version_path.read_text().strip()
    messages = [f"Project standards version: {old_version}",
                f"Available standards version: {new_version}"]
    changed = old_version != new_version

    for relative, original_hash in sorted(baseline.items()):
        local_hash = digest(project / relative)
        upstream_hash = digest(source / relative)
        local_changed = local_hash != original_hash
        upstream_changed = upstream_hash != original_hash
        if not local_changed and not upstream_changed:
            continue
        changed = True
        if upstream_hash is None:
            status = "removed upstream"
        elif local_hash is None:
            status = "missing locally"
        elif local_changed and upstream_changed:
            status = "changed locally and upstream — manual merge needed"
        elif local_changed:
            status = "changed locally"
        else:
            status = "changed upstream"
        messages.append(f"{status}: {relative}")

    for path in standard_paths(source):
        relative = str(path.relative_to(source))
        if relative not in baseline:
            changed = True
            messages.append(f"new upstream file: {relative}")
    if not changed:
        messages.append("No standards changes detected.")
    else:
        messages.append("Review the source checkout's docs/UPGRADING.md; this report makes no edits.")
    return messages, changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="new engineering-standards checkout")
    parser.add_argument("project", nargs="?", type=Path, default=Path("."))
    parser.add_argument("--accept", action="store_true",
                        help="record the reviewed migration after all source controls are present")
    args = parser.parse_args()
    try:
        if args.accept:
            print(accept(args.source, args.project))
            return 0
        lines, changed = compare(args.source, args.project)
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        parser.error(str(exc))
    print("\n".join(lines))
    return 1 if changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
