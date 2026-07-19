# Handoff Template

This is the complete structure a handoff document should follow. The
`create_handoff.py` script scaffolds this automatically and pre-fills the
Metadata section; the agent fills in the rest. Each section below includes
guidance on what "good" looks like.

---

## Metadata
Auto-filled by the scaffold. Timestamp, project path, git branch, recent
commits, and the working-tree state at handoff time (modified, staged,
untracked files). Do not edit unless something is wrong.

## Current State Summary
One or two paragraphs, in plain language, describing what is happening **right
now**. State the overall goal and where within that goal the work currently
sits. A new agent should understand the situation from this section alone.

Good: "We're migrating the event list from local state to Supabase. The read
path is done and verified; the write path is half-built — `createEvent` works
but `updateEvent` isn't wired to the UI yet."

Bad: "Working on Supabase stuff."

## Important Context
Facts the next agent **cannot infer from the code**: external requirements,
product constraints, decisions from prior conversation, environment quirks, API
limits, credentials location (never the credentials themselves).

## Decisions Made
Each significant decision with its rationale. Use:
- **Decision:** what was chosen.
- **Why:** the reasoning.
- **Alternatives considered:** what was rejected and why.

Capturing the *why* prevents the next agent from unknowingly undoing a
deliberate choice.

## Immediate Next Steps
An ordered, concrete, actionable list. The next agent should be able to start
at step 1 with no guessing. Cite specific files and line numbers.

Good:
1. Wire `updateEvent` in `src/api/events.ts:88` into the edit form's `onSubmit`
   handler at `src/components/EditEvent.tsx:120`.
2. Add optimistic UI update, mirroring the pattern already used by `createEvent`.

Bad: "Finish the write path."

## Pending Work
Remaining tasks beyond the immediate next steps, with rough priority. This is
the backlog, not the active step.

## Critical Files
Important files and what each one is for. Reference them in inline code so the
validator and staleness checker can find them.
- `path/to/file` — purpose and what to know.

## Key Patterns Discovered
Conventions and idioms in this codebase the next agent should follow. Include
short code snippets for the non-obvious ones.

## Potential Gotchas
Known issues, footguns, flaky behavior, and their workarounds. Anything that
cost you time and would cost the next agent time too.

## Handoff Chain
- **Continues from:** predecessor handoff path (or "none").
- **Continued by:** successor handoff path (filled in when a successor exists).
