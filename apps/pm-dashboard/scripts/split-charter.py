#!/usr/bin/env python3
"""
split-charter.py — generate the project document family from a filled PRD.md.

Workflow this implements: a new project copies ENGINEERING_CHARTER.md in as
PRD.md and fills in every {{PLACEHOLDER}} in ONE coherent pass (so section 0's
answers stay consistent with what gets marked N/A in security/testing, rather
than drifting across separately-filled files). This script then generates the
project's whole backbone from that single filled document:

  architecture.md       <- PRD.md sections 6, 7, 7.1, 7.2
  security.md           <- PRD.md sections 8.1, 8.7, 8.8
  test-plan.md          <- PRD.md section 8.6
  rules.md              <- PRD.md sections 8.3 and 8.11, including coding
                            conventions answered during intake
  release-checklist.md  <- PRD.md sections 8.2, 8.4, 8.5, 8.10, and 9
  legal.md              <- PRD.md section 8.9
  PRD.md (rewritten)    <- the extracted sections replaced with short
                            pointers, so PRD.md and the backbone files don't
                            duplicate content that then drifts

Every 🔴/🟡/🟢 item that was anywhere in PRD.md's former section 8 or 9 ends
up in exactly one of the six files above — nothing from those sections is
left behind in PRD.md. What stays in PRD.md is sections 0-6 (applicability,
product, personas, brand, scope, data, trust boundaries) and 10-14 (evidence,
risk exceptions, metrics, open questions, AI handoff) — cross-cutting content
that applies across the whole family rather than belonging to one file.

...and copies AGENTS.md, CLAUDE.md, decisions.md, memory.md, and evidence.md.
tasks.md is optional (--with-tasks) when a project has no existing work board.

design.md: a PROJECT-LEVEL SEED is generated from templates/design.md, with
section 0 (brand source of truth) and the palette/typeface rows
of section 5 pre-filled from PRD.md section 3's answers, where those were
actually filled in. Everything else in design.md — the actual per-page
intake (headline, audience, layout, copy) — is NOT generated here, because
PRD.md's intake never asks it; that's a design skill's own per-page Q&A. The
seed is meant to be copied per page (docs/design/<page-slug>.md) and
completed there, or handed to an AI design platform to complete from the
pre-filled brand baseline.

Usage:
    scripts/split-charter.py path/to/PRD.md [output-dir] [--with-tasks]

Safety:
  - Refuses to run against a file literally named ENGINEERING_CHARTER.md or
    MASTER_PRD_TEMPLATE.md, since those are the standards-repo template
    itself, not a filled project copy — running this against the template
    would destroy it, not generate anything useful.
  - Refuses to run against a PRD.md that already looks split (contains a
    "[MOVED to" marker this script itself writes) — re-running against an
    already-split file has nothing left to extract and will otherwise fail
    confusingly partway through. If you need to regenerate the family, pull
    the original filled PRD.md back from version control first.
  - Refuses to overwrite any existing output file. Review collisions before
    retrying; no pre-existing AGENTS.md, tasks.md, or other project file is
    silently replaced.
"""

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

TEMPLATE_FILENAMES = {"ENGINEERING_CHARTER.md", "MASTER_PRD_TEMPLATE.md"}
ALREADY_SPLIT_MARKER = "[MOVED to "

STATIC_FILES = ["AGENTS.md", "CLAUDE.md", "decisions.md", "memory.md", "evidence.md"]
GENERATED_FILES = ["architecture.md", "security.md", "test-plan.md", "rules.md",
                   "release-checklist.md", "legal.md", "PRD.md"]
STANDARD_SCRIPTS = ["split-charter.py", "check-charter.sh", "check_charter.py",
                    "compare-standards.py", "bootstrap-project.py", "policy.py",
                    "propose-na.py"]
CONTROL_LINE = re.compile(r"^- \[[ xX]\] ([🔴🟡🟢]) \[([A-Z][A-Z0-9]*-\d{3})\]", re.MULTILINE)


def control_severities(text):
    return {control_id: severity for severity, control_id in CONTROL_LINE.findall(text)}


def standards_manifest(repo_root, intake_text):
    paths = [repo_root / "scripts" / name for name in STANDARD_SCRIPTS]
    paths += sorted(path for path in (repo_root / "templates").rglob("*") if path.is_file())
    files = {str(path.relative_to(repo_root)): hashlib.sha256(path.read_bytes()).hexdigest()
             for path in paths if path.is_file()}
    version = (repo_root / "templates" / "STANDARDS_VERSION").read_text().strip()
    severities = control_severities(intake_text)
    source_severities = json.loads((repo_root / "templates" / "control-baseline.json").read_text())
    return {"version": version, "files": files,
            "control_ids": sorted(severities),
            "source_control_ids": sorted(source_severities),
            "control_severities": severities}

PART_II_REPLACEMENT_TEXT = """# Part II — Implementation & Release Plan

Former sections 7 through 9 have been generated into this project's backbone
documents per the Document Map above (`architecture.md`, `security.md`,
`test-plan.md`, `rules.md`, `release-checklist.md`, `legal.md`). Sections 10
through 14 below stay here because they're cross-cutting — evidence, risk
exceptions, metrics, open questions, and the AI handoff protocol apply across
the whole family, not to one file.

*(Former sections 8 and 9 — Baseline Standards and the Mobile App Store
Launch Checklist — generated into `security.md` (8.1, 8.7, 8.8), `rules.md`
(8.3, 8.11), `test-plan.md` (8.6), `release-checklist.md` (8.2, 8.4, 8.5,
8.10, and the mobile checklist), and `legal.md` (8.9) by
`scripts/split-charter.py`.)*

"""


def find_heading(lines, pattern, start=0):
    regex = re.compile(pattern)
    for i in range(start, len(lines)):
        if regex.match(lines[i]):
            return i
    raise ValueError(f"heading not found: {pattern!r} (searched from line {start + 1})")


def extract(lines, start_pattern, end_pattern, search_from=0):
    start = find_heading(lines, start_pattern, search_from)
    end = find_heading(lines, end_pattern, start + 1)
    return lines[start:end], start, end


def write_with_header(path, title, source_note, body_lines):
    header = f"# {title}\n\n> {source_note}\n\n"
    path.write_text(header + "".join(body_lines).rstrip() + "\n")


DESIGN_SEED_NOTE = """
> **This copy is a project-level seed, generated by scripts/split-charter.py.**
> Section 0 and part of section 5 below are pre-filled from PRD.md section 3's
> brand answers, where those were actually filled in — everything else
> (sections 1-4, 6-7, and the rest of section 5) is still open. For each
> actual landing page or major surface: copy this seed to
> `docs/design/<page-slug>.md` and complete it there via the matching design
> skill's intake, or hand it to an AI design platform to complete from this
> pre-filled brand baseline. Edits for a specific page happen in that copy,
> not in this seed. The splitter is a one-time bootstrap; when brand decisions
> change later, update PRD.md section 3, this seed, and affected page briefs.
"""


def extract_prd_field(text, label, end_marker=None):
    if end_marker:
        pattern = rf"\*\*{re.escape(label)}:\*\*\s*(.*?)\s*{re.escape(end_marker)}"
    else:
        pattern = rf"\*\*{re.escape(label)}:\*\*\s*(.*)"
    m = re.search(pattern, text)
    if not m:
        return None
    value = m.group(1).strip()
    return value if value and "{{" not in value else None


def generate_design_seed(text, out_dir, project_name, repo_root):
    src = repo_root / "templates" / "design.md"
    if not src.is_file():
        print("split-charter: skipping design.md — templates/design.md not "
              "found", file=sys.stderr)
        return

    brand = {
        "logo": extract_prd_field(text, "Name/logo file(s)"),
        "logo_usage": extract_prd_field(text, "Logo usage", "— map each supplied variant"),
        "assets": extract_prd_field(text, "Other visual assets and rights", "— file paths"),
        "palette": extract_prd_field(text, "Color palette", "(primary, secondary, accent, neutrals"),
        "typography": extract_prd_field(text, "Typography", "(heading font, body font, and why)"),
        "tone": extract_prd_field(text, "Tone/voice"),
        "visual_refs": extract_prd_field(text, "Visual references", "— what you want"),
    }
    has_brand = any(brand.values())

    design = src.read_text()

    if has_brand:
        design = design.replace(
            "{{HAS_BRAND}} — yes (link `PRD.md` section 3 or a brand skill/guide) / no",
            "yes — extracted automatically from `PRD.md` section 3 at split time",
        )
        design = design.replace("{{BRAND_SOURCE_LINK}}", "`PRD.md` section 3")
        if brand["logo"]:
            design = design.replace("{{LOGO_FILES}}", brand["logo"])
        if brand["logo_usage"]:
            design = design.replace("{{LOGO_USAGE}}", brand["logo_usage"])
        if brand["assets"]:
            design = design.replace("{{VISUAL_ASSETS}}", brand["assets"])
        if brand["typography"]:
            design = design.replace(
                "| Typeface | {{TYPEFACE_SOURCE}} | {{TYPEFACE_VALUE}} |",
                f"| Typeface | brand (PRD.md §3) | {brand['typography']} |",
            )
        if brand["palette"]:
            design = design.replace(
                "| Color palette | {{PALETTE_SOURCE}} | {{PALETTE_VALUE}} |",
                f"| Color palette | brand (PRD.md §3) | {brand['palette']} |",
            )
        if brand["tone"]:
            design = design.replace("{{BRAND_VOICE}}", brand["tone"])
        if brand["visual_refs"]:
            design = design.replace("{{DESIGN_DIRECTION}}", brand["visual_refs"])
    else:
        design = design.replace(
            "{{HAS_BRAND}} — yes (link `PRD.md` section 3 or a brand skill/guide) / no",
            "no — PRD.md section 3 wasn't filled in at split time; the design "
            "skill's own defaults apply (see section 5)",
        )

    # Insert the seed-specific note right after the existing intro blockquote
    marker = "> placeholders looking like unmade decisions.\n"
    if marker in design:
        design = design.replace(marker, marker + DESIGN_SEED_NOTE, 1)

    if project_name != "{{PROJECT_NAME}}":
        design = design.replace("{{PAGE_OR_FEATURE_NAME}}", f"{project_name} (seed)")

    (out_dir / "design.md").write_text(design)
    print("split-charter: generated design.md seed (project-level — copy per "
          "page before completing further)")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("prd", type=Path)
    parser.add_argument("output_dir", nargs="?", type=Path)
    parser.add_argument("--with-tasks", action="store_true",
                        help="copy templates/tasks.md if this project has no existing work board")
    args = parser.parse_args()
    prd_path = args.prd
    out_dir = args.output_dir or prd_path.parent

    if prd_path.name in TEMPLATE_FILENAMES:
        print(
            f"split-charter: refusing to run against {prd_path.name} — that's "
            "the standards-repo template, not a filled project copy.",
            file=sys.stderr,
        )
        sys.exit(1)

    if not prd_path.is_file():
        print(f"split-charter: no such file: {prd_path}", file=sys.stderr)
        sys.exit(2)

    if not out_dir.is_dir():
        print(f"split-charter: output directory does not exist: {out_dir}", file=sys.stderr)
        sys.exit(2)

    repo_root = Path(__file__).resolve().parent.parent
    static_files = STATIC_FILES + (["tasks.md"] if args.with_tasks else [])
    required_templates = static_files + ["STANDARDS_VERSION", "design.md",
                                         "control-baseline.json", "static-site-na-candidates.md",
                                         "first-deployment-approval.md"]
    missing_templates = [name for name in required_templates
                         if not (repo_root / "templates" / name).is_file()]
    missing_scripts = [name for name in STANDARD_SCRIPTS
                       if not (repo_root / "scripts" / name).is_file()]
    if missing_templates or missing_scripts:
        print("split-charter: missing required standards files: "
              + ", ".join(missing_templates + missing_scripts),
              file=sys.stderr)
        sys.exit(1)
    destinations = GENERATED_FILES + static_files + ["STANDARDS_VERSION", "standards-manifest.json"]
    destinations.append("design.md")
    collisions = [name for name in destinations
                  if (out_dir / name).exists() and
                  not (name == "PRD.md" and prd_path.resolve() == (out_dir / name).resolve())]
    if collisions:
        print("split-charter: refusing to overwrite existing project files: "
              + ", ".join(collisions), file=sys.stderr)
        sys.exit(1)

    text = prd_path.read_text()

    baseline = json.loads((repo_root / "templates" / "control-baseline.json").read_text())
    intake_severities = control_severities(text)
    missing_controls = sorted(baseline.keys() - intake_severities.keys())
    if missing_controls:
        print("split-charter: missing source controls: "
              + ", ".join(missing_controls), file=sys.stderr)
        sys.exit(1)
    changed = [control_id for control_id, severity in intake_severities.items()
               if control_id in baseline and baseline[control_id] != severity]
    if changed:
        print("split-charter: control severity differs from the standards source: "
              + ", ".join(sorted(changed)), file=sys.stderr)
        sys.exit(1)

    if ALREADY_SPLIT_MARKER in text:
        print(
            f"split-charter: refusing to run — {prd_path} already looks split "
            f"(contains a {ALREADY_SPLIT_MARKER!r} marker). Nothing is left to "
            "extract, and re-running would fail partway through. If you need "
            "to regenerate the family, restore the original filled PRD.md "
            "from version control first.",
            file=sys.stderr,
        )
        sys.exit(1)

    lines = text.splitlines(keepends=True)

    project_name_match = re.search(r"\*\*Project name:\*\*\s*(.+)", text)
    project_name = (
        project_name_match.group(1).strip()
        if project_name_match and "{{" not in project_name_match.group(1)
        else "{{PROJECT_NAME}}"
    )

    # --- extract every range up front (all against the ORIGINAL, unmutated
    # `lines`) — order of extraction doesn't matter, only the order the
    # splices are later applied in does. -------------------------------------
    arch_body, arch_start, arch_end = extract(
        lines, r"^## 6\. Architecture", r"^## 8\. Baseline Standards"
    )
    sec81_body, sec81_start, sec81_end = extract(
        lines, r"^### 8\.1 Security baseline", r"^### 8\.2 "
    )
    sec82_body, sec82_start, sec82_end = extract(
        lines, r"^### 8\.2 ", r"^### 8\.3 Code quality"
    )
    rules83_body, rules83_start, rules83_end = extract(
        lines, r"^### 8\.3 Code quality", r"^### 8\.4 "
    )
    sec84_body, sec84_start, sec84_end = extract(
        lines, r"^### 8\.4 Accessibility", r"^### 8\.5 "
    )
    sec85_body, sec85_start, sec85_end = extract(
        lines, r"^### 8\.5 Performance", r"^### 8\.6 "
    )
    test_body, test_start, test_end = extract(
        lines, r"^### 8\.6 Testing baseline", r"^### 8\.7 "
    )
    sec87_body, sec87_start, sec87_end = extract(
        lines, r"^### 8\.7 Deployment", r"^### 8\.8 "
    )
    sec88_body, sec88_start, sec88_end = extract(
        lines, r"^### 8\.8 Incident response", r"^### 8\.9 "
    )
    legal_body, legal_start, legal_end = extract(
        lines, r"^### 8\.9 Legal", r"^### 8\.10 "
    )
    sec810_body, sec810_start, sec810_end = extract(
        lines, r"^### 8\.10 SEO", r"^### 8\.11 "
    )
    rules811_body, rules811_start, rules811_end = extract(
        lines, r"^### 8\.11 Documentation", r"^## 9\. "
    )
    sec9_body, sec9_start, sec9_end = extract(
        lines, r"^## 9\. ", r"^## 10\. "
    )

    # --- write the six backbone files ----------------------------------------
    # arch_body carries the original "# Part II" divider heading and its
    # "Sections 7-14 turn..." paragraph internally (they sat between former
    # sections 6 and 7) — that framing is now stale (this file only holds
    # 6/7/7.1/7.2, not 7-14) and is superseded by the note this script writes
    # into PRD.md's own stub, so it's stripped here rather than carried in.
    STALE_PART_II_BLOCK = (
        "# Part II — Implementation & Release Plan\n\n"
        "Sections 7–14 turn the product definition above into build, "
        "launch, and operational decisions. Apply controls according to "
        "section 0; they are not a claim that every project needs every "
        "vendor or production capability.\n\n"
    )
    arch_text = (
        "> **Read the project-specific decision first.** Section 0 in `PRD.md` "
        "defines applicability, and section 7 below records stack deviations. "
        "The reference stack, layout, and build order describe components "
        "only when this project actually uses them.\n\n"
        + "".join(arch_body).replace(STALE_PART_II_BLOCK, "")
    )
    write_with_header(
        out_dir / "architecture.md",
        f"Architecture — {project_name}",
        "Generated by scripts/split-charter.py from PRD.md sections 6 and 7 (including 7.1/7.2).",
        [arch_text],
    )

    write_with_header(
        out_dir / "security.md",
        f"Security — {project_name}",
        "Generated by scripts/split-charter.py from PRD.md sections 8.1 (security "
        "baseline), 8.7 (deployment & operations), and 8.8 (incident response) — "
        "the controls that keep this project safe to run and recoverable, not "
        "just safe to ship once.",
        sec81_body + ["\n"] + sec87_body + ["\n"] + sec88_body,
    )

    write_with_header(
        out_dir / "test-plan.md",
        f"Test Plan — {project_name}",
        "Generated by scripts/split-charter.py from PRD.md section 8.6. "
        "Consider expanding with contract-testing, test-data, and flaky-test "
        "policy sections — this extraction only carries over what PRD.md's "
        "intake originally asked.",
        test_body,
    )

    write_with_header(
        out_dir / "rules.md",
        f"Coding Rules — {project_name}",
        "Generated by scripts/split-charter.py from PRD.md sections 8.3 (code "
        "quality & cleanup) and 8.11 (documentation), plus a coding-conventions "
        "appendix PRD.md's intake never asked about.",
        rules83_body + ["\n"] + rules811_body,
    )

    write_with_header(
        out_dir / "release-checklist.md",
        f"Release Checklist — {project_name}",
        "Generated by scripts/split-charter.py from PRD.md sections 8.2 "
        "(anti-cliché/product-integrity), 8.4 (accessibility), 8.5 "
        "(performance), 8.10 (SEO), and 9 (mobile app store launch) — the "
        "gates checked before calling a release, or a native app submission, "
        "actually ready.",
        sec82_body + ["\n"] + sec84_body + ["\n"] + sec85_body + ["\n"] + sec810_body + ["\n"] + sec9_body,
    )

    write_with_header(
        out_dir / "legal.md",
        f"Legal & Compliance — {project_name}",
        "Generated by scripts/split-charter.py from PRD.md section 8.9. "
        "**Termly (or equivalent) is a baseline only** — see the item on that "
        "below; upgrade to real per-jurisdiction legal counsel where it applies.",
        legal_body,
    )

    # --- rewrite PRD.md with pointer stubs, bottom-up so earlier line ----
    # numbers stay valid as later ranges are spliced out first. Every range
    # extracted above gets exactly one entry here, sorted by start index
    # descending — this is what makes the order-independent extraction above
    # safe to splice.
    replacements = [
        (sec9_start, sec9_end, []),
        # The "## 8. Baseline Standards" umbrella heading and its "(Named
        # ..., it also covers legal/SEO/docs...)" framing paragraph sit
        # between arch_end and sec81_start, owned by neither extraction —
        # now-obsolete once every subsection has its own destination file,
        # so it's dropped rather than carried into any of them.
        (arch_end, sec81_start, []),
        (rules811_start, rules811_end, []),
        (sec810_start, sec810_end, []),
        (legal_start, legal_end, []),
        (sec88_start, sec88_end, []),
        (sec87_start, sec87_end, []),
        (test_start, test_end, []),
        (sec85_start, sec85_end, []),
        (sec84_start, sec84_end, []),
        (rules83_start, rules83_end, []),
        (sec82_start, sec82_end, []),
        (sec81_start, sec81_end, []),
        (arch_start, arch_end, [
            "## 6. Architecture & Trust Boundaries, Technical Stack, Repository Structure `[MOVED to architecture.md]`\n\n",
            "**Generated into `architecture.md`** by `scripts/split-charter.py` (this replaces the former sections 6, 7, 7.1, and 7.2).\n\n",
            PART_II_REPLACEMENT_TEXT,
        ]),
    ]
    # All ranges except arch's are inside what arch's replacement text above
    # already covers with one consolidated notice (PART_II_REPLACEMENT_TEXT) —
    # so every range other than arch's is simply deleted (replaced with
    # nothing), and only arch's replacement carries real stub text.
    replacements.sort(key=lambda r: r[0], reverse=True)
    for start, end, replacement in replacements:
        lines[start:end] = replacement

    (out_dir / "PRD.md").write_text("".join(lines))
    # --- copy static files, substituting {{PROJECT_NAME}} where easy -----
    for name in static_files:
        src = repo_root / "templates" / name
        if not src.is_file():
            print(f"split-charter: skipping {name} — not found in templates/",
                  file=sys.stderr)
            continue
        content = src.read_text()
        if project_name != "{{PROJECT_NAME}}":
            content = content.replace("{{PROJECT_NAME}}", project_name)
        (out_dir / name).write_text(content)

    generate_design_seed(text, out_dir, project_name, repo_root)

    version_file = repo_root / "templates" / "STANDARDS_VERSION"
    (out_dir / "STANDARDS_VERSION").write_text(version_file.read_text())
    (out_dir / "standards-manifest.json").write_text(
        json.dumps(standards_manifest(repo_root, text), indent=2, sort_keys=True) + "\n")

    print(f"split-charter: wrote architecture.md, security.md, test-plan.md, "
          f"rules.md, release-checklist.md, legal.md, rewrote PRD.md, and "
          f"copied {len(static_files)} static files into {out_dir}")


if __name__ == "__main__":
    main()
