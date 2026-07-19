#!/usr/bin/env python3
"""Validate a session handoff document for completeness, quality, and secrets.

Checks:
- No incomplete `[TODO: ...]` placeholders remain.
- All required sections are present and non-empty.
- No obvious secrets (API keys, passwords, tokens).
- Referenced files (from the "Critical Files" section) exist.
- Produces a quality score (0-100).

Exit code is 0 when the handoff passes (score >= 70, no secrets, no TODOs),
1 otherwise.

Usage:
    python validate_handoff.py <file>
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_SECTIONS = [
    "Current State Summary",
    "Important Context",
    "Decisions Made",
    "Immediate Next Steps",
    "Pending Work",
    "Critical Files",
    "Key Patterns Discovered",
    "Potential Gotchas",
]

TODO_RE = re.compile(r"\[TODO:.*?\]", re.DOTALL)

# Heuristic secret patterns. Kept conservative to limit false positives.
SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key id"),
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "OpenAI-style secret key"),
    (re.compile(r"sk-ant-[A-Za-z0-9_\-]{20,}"), "Anthropic API key"),
    (re.compile(r"ghp_[A-Za-z0-9]{36}"), "GitHub personal access token"),
    (re.compile(r"gh[ousr]_[A-Za-z0-9]{20,}"), "GitHub token"),
    (re.compile(r"xox[baprs]-[A-Za-z0-9\-]{10,}"), "Slack token"),
    (re.compile(r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}"), "JWT"),
    (re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"), "private key"),
    (
        re.compile(
            r"(?i)(?:password|passwd|secret|api[_-]?key|token)\s*[:=]\s*['\"][^'\"]{6,}['\"]"
        ),
        "hardcoded credential",
    ),
]


def split_sections(text: str) -> dict[str, str]:
    """Return {heading: body} for level-2 (##) headings."""
    sections: dict[str, str] = {}
    current = None
    buf: list[str] = []
    for line in text.splitlines():
        m = re.match(r"^##\s+(.*)$", line)
        if m:
            if current is not None:
                sections[current] = "\n".join(buf).strip()
            current = m.group(1).strip()
            buf = []
        elif current is not None:
            buf.append(line)
    if current is not None:
        sections[current] = "\n".join(buf).strip()
    return sections


def find_referenced_files(critical_body: str) -> list[str]:
    # Grab inline-code tokens that look like paths.
    refs = []
    for token in re.findall(r"`([^`]+)`", critical_body):
        token = token.strip()
        if "/" in token or token.endswith((".py", ".ts", ".tsx", ".js", ".md", ".json")):
            # Strip line-number suffixes like path:42
            refs.append(token.split(":")[0])
    return refs


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python validate_handoff.py <file>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2

    text = path.read_text(encoding="utf-8")
    sections = split_sections(text)

    problems: list[str] = []
    warnings: list[str] = []
    score = 100

    # 1. TODO placeholders
    todos = TODO_RE.findall(text)
    if todos:
        problems.append(f"{len(todos)} unresolved [TODO: ...] placeholder(s) remain.")
        score -= min(40, 8 * len(todos))

    # 2. Required sections present and non-empty
    for name in REQUIRED_SECTIONS:
        body = sections.get(name)
        if body is None:
            problems.append(f"Missing required section: '{name}'.")
            score -= 8
        elif not body or TODO_RE.fullmatch(body.strip()):
            problems.append(f"Required section is empty: '{name}'.")
            score -= 8

    # 3. Secrets
    secrets_found = []
    for pattern, label in SECRET_PATTERNS:
        if pattern.search(text):
            secrets_found.append(label)
    if secrets_found:
        problems.append("Potential secret(s) detected: " + ", ".join(sorted(set(secrets_found))))
        score -= 50

    # 4. Referenced files exist
    critical = sections.get("Critical Files", "")
    for ref in find_referenced_files(critical):
        if not Path(ref).exists():
            warnings.append(f"Referenced file not found: {ref}")
            score -= 3

    score = max(0, min(100, score))

    print(f"Handoff validation: {path}")
    print(f"Quality score: {score}/100\n")

    if problems:
        print("Problems:")
        for p in problems:
            print(f"  ✗ {p}")
        print()
    if warnings:
        print("Warnings:")
        for w in warnings:
            print(f"  ! {w}")
        print()

    passed = score >= 70 and not secrets_found and not todos
    if passed:
        print("PASS — handoff meets quality standards.")
        return 0
    print("FAIL — do not finalize until problems above are resolved.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
