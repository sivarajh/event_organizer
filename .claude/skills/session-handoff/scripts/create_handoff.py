#!/usr/bin/env python3
"""Generate a new session handoff document with smart scaffolding.

Pre-fills metadata (timestamp, git branch, recent commits, modified/unstaged
files) and, when continuing prior work, links the handoff chain. The agent then
fills in the remaining [TODO: ...] sections.

Usage:
    python create_handoff.py <slug> [--continues-from <file>] [--dir <handoffs_dir>]
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HANDOFFS_DIRNAME = ".claude/handoffs"


def run_git(args: list[str]) -> str:
    try:
        out = subprocess.run(
            ["git", *args],
            capture_output=True,
            text=True,
            check=False,
        )
        return out.stdout.strip()
    except FileNotFoundError:
        return ""


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "handoff"


def git_metadata() -> dict[str, str]:
    branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"]) or "(unknown)"
    commits = run_git(["log", "--oneline", "-5"]) or "(no commits)"
    modified = run_git(["diff", "--name-only", "HEAD"])
    staged = run_git(["diff", "--name-only", "--cached"])
    untracked = run_git(["ls-files", "--others", "--exclude-standard"])
    return {
        "branch": branch,
        "commits": commits,
        "modified": modified or "(none)",
        "staged": staged or "(none)",
        "untracked": untracked or "(none)",
    }


def build_document(slug: str, meta: dict[str, str], continues_from: str | None) -> str:
    now = datetime.now()
    chain_line = (
        f"- **Continues from:** `{continues_from}`"
        if continues_from
        else "- **Continues from:** (none — this is the first handoff in the chain)"
    )
    return f"""# Handoff: {slug}

## Metadata

- **Created:** {now.strftime("%Y-%m-%d %H:%M:%S")}
- **Project path:** {Path.cwd()}
- **Git branch:** {meta["branch"]}
{chain_line}

### Recent commits
```
{meta["commits"]}
```

### Working tree at handoff time
- **Modified (unstaged) files:**
```
{meta["modified"]}
```
- **Staged files:**
```
{meta["staged"]}
```
- **Untracked files:**
```
{meta["untracked"]}
```

## Current State Summary
[TODO: In plain language, describe what is happening RIGHT NOW. What is the
overall goal, and where in that goal are we?]

## Important Context
[TODO: Facts the next agent must know that are NOT obvious from reading the
code — external constraints, requirements, prior conversations, environment
quirks.]

## Decisions Made
[TODO: List each significant decision and the RATIONALE. Format:
- **Decision:** ...  **Why:** ...  **Alternatives considered:** ...]

## Immediate Next Steps
[TODO: Ordered, concrete, actionable steps. The next agent should be able to
start work from step 1 without guessing. Cite file paths and line numbers.
1. ...
2. ...]

## Pending Work
[TODO: Remaining tasks beyond the immediate next steps, with rough priority.]

## Critical Files
[TODO: Important files and what each is for. Format:
- `path/to/file` — purpose / what to know about it.]

## Key Patterns Discovered
[TODO: Conventions, idioms, and approaches used in this codebase that the next
agent should follow. Include short code snippets where helpful.]

## Potential Gotchas
[TODO: Known issues, footguns, flaky behavior, and their workarounds.]

## Handoff Chain
{chain_line}
- **Continued by:** (fill in when a successor handoff is created)
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a session handoff document.")
    parser.add_argument("slug", help="Short kebab-case description of the work.")
    parser.add_argument(
        "--continues-from",
        default=None,
        help="Path to the predecessor handoff this one continues from.",
    )
    parser.add_argument(
        "--dir",
        default=HANDOFFS_DIRNAME,
        help=f"Handoffs directory (default: {HANDOFFS_DIRNAME}).",
    )
    args = parser.parse_args()

    if args.continues_from and not Path(args.continues_from).exists():
        print(
            f"warning: --continues-from path does not exist: {args.continues_from}",
            file=sys.stderr,
        )

    slug = slugify(args.slug)
    meta = git_metadata()
    now = datetime.now()
    handoffs_dir = Path(args.dir)
    handoffs_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{now.strftime('%Y-%m-%d-%H%M%S')}-{slug}.md"
    path = handoffs_dir / filename
    path.write_text(build_document(slug, meta, args.continues_from), encoding="utf-8")

    print(str(path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
