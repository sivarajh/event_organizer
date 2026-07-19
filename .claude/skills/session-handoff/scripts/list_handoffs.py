#!/usr/bin/env python3
"""List available session handoffs, newest first.

Usage:
    python list_handoffs.py [path]

`path` defaults to `.claude/handoffs`.
"""
from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path

HANDOFFS_DIRNAME = ".claude/handoffs"
NAME_RE = re.compile(r"^(\d{4}-\d{2}-\d{2}-\d{6})-(.+)\.md$")


def parse_timestamp(name: str) -> datetime | None:
    m = NAME_RE.match(name)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1), "%Y-%m-%d-%H%M%S")
    except ValueError:
        return None


def main() -> int:
    base = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(HANDOFFS_DIRNAME)
    if not base.exists():
        print(f"No handoffs directory found at: {base}")
        return 0

    files = sorted(base.glob("*.md"), reverse=True)
    if not files:
        print(f"No handoffs found in: {base}")
        return 0

    print(f"Handoffs in {base} (newest first):\n")
    for f in files:
        ts = parse_timestamp(f.name)
        when = ts.strftime("%Y-%m-%d %H:%M:%S") if ts else "(unparsed)"
        slug = NAME_RE.match(f.name)
        label = slug.group(2) if slug else f.stem
        print(f"  {when}  {label}")
        print(f"      {f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
