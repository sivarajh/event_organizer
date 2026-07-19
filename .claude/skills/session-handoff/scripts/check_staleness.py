#!/usr/bin/env python3
"""Assess whether a session handoff is still current.

Compares the handoff's recorded state against the live repository:
- Time elapsed since creation.
- Commits made since the handoff.
- Files changed since the handoff.
- Branch divergence (are we on the same branch?).
- Missing referenced files.

Usage:
    python check_staleness.py <file>
"""
from __future__ import annotations

import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def run_git(args: list[str]) -> str:
    try:
        out = subprocess.run(
            ["git", *args], capture_output=True, text=True, check=False
        )
        return out.stdout.strip()
    except FileNotFoundError:
        return ""


def extract(pattern: str, text: str) -> str | None:
    m = re.search(pattern, text)
    return m.group(1).strip() if m else None


def extract_block(heading: str, text: str) -> str:
    """Extract the fenced code block immediately following a bold label."""
    m = re.search(re.escape(heading) + r".*?```(.*?)```", text, re.DOTALL)
    return m.group(1).strip() if m else ""


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python check_staleness.py <file>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2

    text = path.read_text(encoding="utf-8")

    created_str = extract(r"\*\*Created:\*\*\s*(.+)", text)
    handoff_branch = extract(r"\*\*Git branch:\*\*\s*(.+)", text)

    signals: list[str] = []
    stale_points = 0

    # Time elapsed
    if created_str:
        try:
            created = datetime.strptime(created_str, "%Y-%m-%d %H:%M:%S")
            age = datetime.now() - created
            hours = age.total_seconds() / 3600
            signals.append(f"Age: {age.days}d {int(hours % 24)}h since creation.")
            if hours > 168:
                stale_points += 2
            elif hours > 48:
                stale_points += 1
        except ValueError:
            signals.append("Could not parse creation timestamp.")

    # Branch check
    current_branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    if handoff_branch and current_branch:
        if handoff_branch != current_branch:
            signals.append(
                f"Branch DIVERGED: handoff on '{handoff_branch}', now on '{current_branch}'."
            )
            stale_points += 2
        else:
            signals.append(f"Branch unchanged: '{current_branch}'.")

    # Commits since the newest commit recorded in the handoff
    recorded_commits = extract_block("Recent commits", text)
    top_hash = None
    if recorded_commits:
        first_line = recorded_commits.splitlines()[0].strip()
        top_hash = first_line.split()[0] if first_line else None

    if top_hash:
        count = run_git(["rev-list", "--count", f"{top_hash}..HEAD"])
        if count.isdigit():
            n = int(count)
            signals.append(f"Commits since handoff: {n}.")
            if n > 20:
                stale_points += 2
            elif n > 0:
                stale_points += 1
        else:
            signals.append(
                f"Recorded top commit '{top_hash}' not found in history (rebase/reset?)."
            )
            stale_points += 2

        # Files changed since handoff
        changed = run_git(["diff", "--name-only", f"{top_hash}..HEAD"])
        if changed:
            files = changed.splitlines()
            signals.append(f"Files changed since handoff: {len(files)}.")
            stale_points += 1 if len(files) <= 10 else 2

    # Missing referenced files (paths in inline code under Critical Files)
    crit = re.search(r"##\s+Critical Files(.*?)(?:\n##\s|\Z)", text, re.DOTALL)
    missing = []
    if crit:
        for token in re.findall(r"`([^`]+)`", crit.group(1)):
            ref = token.strip().split(":")[0]
            if ("/" in ref or ref.endswith((".py", ".ts", ".tsx", ".js", ".md", ".json"))):
                if not Path(ref).exists():
                    missing.append(ref)
    if missing:
        signals.append(f"Missing referenced files: {', '.join(missing)}.")
        stale_points += min(2, len(missing))

    if stale_points >= 4:
        verdict = "STALE — re-verify assumptions carefully before continuing."
    elif stale_points >= 2:
        verdict = "PARTIALLY STALE — some drift; spot-check key assumptions."
    else:
        verdict = "CURRENT — handoff looks up to date."

    print(f"Staleness check: {path}\n")
    for s in signals:
        print(f"  • {s}")
    print()
    print(f"Verdict: {verdict}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
