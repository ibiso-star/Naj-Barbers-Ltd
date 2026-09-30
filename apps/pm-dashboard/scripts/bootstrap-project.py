#!/usr/bin/env python3
"""Copy the standards intake and tooling into a project without overwriting files.

Usage: python3 scripts/bootstrap-project.py /path/to/project
"""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil


def bootstrap(source: Path, target: Path) -> list[str]:
    charter = source / "ENGINEERING_CHARTER.md"
    if not charter.is_file():
        raise ValueError(f"missing {charter}")
    sources = [(charter, target / "PRD.md")]
    for folder in ("scripts", "templates"):
        sources.extend((path, target / path.relative_to(source))
                       for path in sorted((source / folder).rglob("*"))
                       if path.is_file() and "__pycache__" not in path.parts
                       and path.suffix != ".pyc")
    collisions = [str(destination.relative_to(target))
                  for _, destination in sources if destination.exists()]
    if collisions:
        raise ValueError("refusing to overwrite existing files: " + ", ".join(collisions))
    for original, destination in sources:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(original, destination)
    return [str(destination.relative_to(target)) for _, destination in sources]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", type=Path)
    args = parser.parse_args()
    try:
        files = bootstrap(Path(__file__).resolve().parent.parent, args.project)
    except ValueError as exc:
        parser.error(str(exc))
    print(f"Copied {len(files)} standards files into {args.project}; complete PRD.md next.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
