---
name: session-handoff
description: Create and resume comprehensive session handoff documents so a fresh agent can continue long-running work with zero ambiguity. Use when the user says "save state", "create handoff", "I need to pause", "load handoff", "resume from", "continue where we left off", or "context is getting full" — and proactively when the context window is >80% full, a major milestone is done, or a session is ending after substantial work (5+ edits, complex debugging, architecture decisions).
---

# Session Handoff

Create durable handoff documents that let a fresh agent pick up complex,
multi-session work exactly where the previous agent left off — preserving
state, decisions, rationale, and next steps.

## Modes

This skill has two modes. Decide which one applies from the user's request.

- **CREATE** — the user is pausing, wrapping up, or context is filling. Produce
  a new handoff document.
- **RESUME** — the user is starting fresh, or asking to continue prior work.
  Load an existing handoff and begin from its next steps.

## When to use

**User-triggered (CREATE):** "save state", "create handoff", "I need to pause",
"save this for later", "context is getting full".

**User-triggered (RESUME):** "load handoff", "resume from", "continue where we
left off", "what was I doing".

**Agent-triggered (CREATE, proactive):** context window >80% full; a major
milestone just completed; a work session is ending with meaningful progress;
after substantial work (5+ file edits, complex debugging, an architecture
decision); before switching to an unrelated task. When you hit one of these,
offer to create a handoff — don't silently skip it.

## CREATE mode

1. **Scaffold.** Run the create script with a short kebab-case slug describing
   the work. It pre-fills metadata (timestamp, git branch, recent commits,
   modified/unstaged files) and, if continuing prior work, links the chain.

   ```bash
   python .claude/skills/session-handoff/scripts/create_handoff.py implementing-user-auth
   # continuation:
   python .claude/skills/session-handoff/scripts/create_handoff.py auth-part-2 \
     --continues-from .claude/handoffs/2024-01-15-143022-auth.md
   ```

   The script prints the path of the created file.

2. **Complete the document.** Open the created file and replace every
   `[TODO: ...]` placeholder. Prioritize the sections a new agent cannot
   reconstruct on its own:
   - **Current State Summary** — what is happening right now, in plain language.
   - **Important Context** — facts the next agent must know that aren't obvious
     from the code.
   - **Decisions Made** — the *why* behind each architectural choice, not just
     the *what*.
   - **Immediate Next Steps** — concrete, ordered, actionable first steps. Not
     vague goals. Reference specific files and line numbers.
   - **Pending Work**, **Critical Files**, **Key Patterns**, **Gotchas**.

   See [references/handoff-template.md](references/handoff-template.md) for the
   full structure and per-section guidance.

3. **Validate.** Run the validator and fix anything it flags.

   ```bash
   python .claude/skills/session-handoff/scripts/validate_handoff.py <file>
   ```

   Do **not** finalize if: score < 70, secrets detected, any `[TODO: ...]`
   remains, or a required section is empty.

4. **Confirm.** Tell the user the handoff path and a one-paragraph summary of
   what it captures.

## RESUME mode

1. **Find handoffs.**

   ```bash
   python .claude/skills/session-handoff/scripts/list_handoffs.py
   ```

2. **Check staleness** of the chosen handoff.

   ```bash
   python .claude/skills/session-handoff/scripts/check_staleness.py <file>
   ```

   If it reports significant drift (many new commits, changed/missing files,
   branch divergence), flag it to the user before proceeding and re-verify the
   affected assumptions.

3. **Load the document completely** — and, if it links a predecessor via the
   Handoff Chain, read back through the chain for full context.

4. **Verify context** using
   [references/resume-checklist.md](references/resume-checklist.md): confirm the
   branch, that referenced files still exist, and that stated assumptions still
   hold.

5. **Begin work** from the first item in "Immediate Next Steps".

## Storage

Handoffs live in `.claude/handoffs/`, named `YYYY-MM-DD-HHMMSS-[slug].md`.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/create_handoff.py` | Generate a new handoff with smart scaffolding. `[slug] [--continues-from <file>]` |
| `scripts/list_handoffs.py` | List available handoffs. `[path]` |
| `scripts/validate_handoff.py` | Check completeness, quality, and secrets. `<file>` |
| `scripts/check_staleness.py` | Assess whether a handoff is still current. `<file>` |

## Quality standards

- Write specific next steps, not vague goals.
- Document the *why* behind decisions.
- Include code snippets for critical patterns; cite file paths and line numbers.
- Never leave `[TODO: ...]` placeholders in a finalized handoff.
- Never include secrets — the validator scans for them, but don't rely on it.

## References

- [references/handoff-template.md](references/handoff-template.md) — full template with guidance.
- [references/resume-checklist.md](references/resume-checklist.md) — verification checklist for resuming.
- [evals/model-expectations.md](evals/model-expectations.md) — expected model behavior.
- [evals/test-scenarios.md](evals/test-scenarios.md) — test cases.
