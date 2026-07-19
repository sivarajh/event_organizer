# Model Expectations

How a well-behaved agent should use the Session Handoff skill.

## Triggering
- Invokes the skill on explicit user cues ("save state", "create handoff",
  "resume from", "continue where we left off").
- Proactively **offers** a handoff — rather than silently continuing — when
  context is >80% full, after a major milestone, or after substantial work
  (5+ edits, complex debugging, an architecture decision). It offers; it does
  not force.
- Does **not** trigger for trivial, single-step tasks where a handoff adds no
  value.

## CREATE mode
- Runs `create_handoff.py` with a descriptive kebab-case slug.
- Fills every `[TODO: ...]` placeholder with specific, useful content.
- Writes concrete, ordered next steps that cite real files and line numbers —
  never vague goals.
- Documents the *why* behind decisions, not just the *what*.
- Runs `validate_handoff.py` and resolves all problems before finalizing.
- Never writes secrets into the document.
- Reports the final path and a short summary to the user.

## RESUME mode
- Lists handoffs and picks the right one (usually newest, or as the user
  specifies).
- Runs `check_staleness.py` and surfaces meaningful drift to the user.
- Reads the full document (and chain) before acting.
- Verifies branch, file existence, and assumptions per the resume checklist.
- Begins from the first "Immediate Next Steps" item.

## Anti-patterns (should NOT happen)
- Finalizing a handoff with a score < 70, remaining TODOs, or detected secrets.
- Producing vague next steps ("finish the feature").
- Ignoring a STALE verdict and proceeding as if nothing changed.
- Fabricating file paths or decisions that weren't actually made.
