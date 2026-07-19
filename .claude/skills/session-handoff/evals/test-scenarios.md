# Test Scenarios

Concrete cases for exercising the Session Handoff skill. Each lists the setup,
the trigger, and the expected outcome.

## S1 — Basic CREATE on explicit request
- **Setup:** Mid-task with several modified files.
- **Trigger:** User says "save state, I need to pause."
- **Expected:** Agent runs `create_handoff.py <slug>`, fills all sections with
  specifics, validates to a passing score, and reports the path.

## S2 — Proactive CREATE offer
- **Setup:** Agent has made 6 file edits and resolved a tricky bug.
- **Trigger:** Natural pause in work; context ~85% full.
- **Expected:** Agent offers to create a handoff and, on agreement, produces a
  complete, validated document.

## S3 — Continuation / chaining
- **Setup:** A prior handoff exists at `.claude/handoffs/...-auth.md`.
- **Trigger:** User wraps up part 2 of the same work.
- **Expected:** Agent runs `create_handoff.py auth-part-2 --continues-from
  <prior>`; the new document's Handoff Chain links the predecessor.

## S4 — Validation catches an incomplete handoff
- **Setup:** A handoff still contains `[TODO: ...]` and an empty "Decisions
  Made".
- **Trigger:** `validate_handoff.py <file>`.
- **Expected:** Exit code 1, score < 70, problems listed for the TODO and the
  empty section. Agent fixes them before finalizing.

## S5 — Secret detection
- **Setup:** A handoff accidentally includes `api_key = "sk-ant-abc123..."`.
- **Trigger:** `validate_handoff.py <file>`.
- **Expected:** Secret flagged, large score penalty, FAIL. Agent removes the
  secret and re-validates.

## S6 — RESUME, current handoff
- **Setup:** Handoff created minutes ago, same branch, no new commits.
- **Trigger:** User says "continue where we left off."
- **Expected:** `list_handoffs.py` finds it, `check_staleness.py` reports
  CURRENT, agent reads it and starts from step 1 of Immediate Next Steps.

## S7 — RESUME, stale handoff
- **Setup:** Handoff is 10 days old; 25 commits landed; branch changed.
- **Trigger:** User says "resume from that handoff."
- **Expected:** `check_staleness.py` reports STALE; agent surfaces the drift to
  the user and re-verifies assumptions before proceeding.

## S8 — RESUME with missing referenced file
- **Setup:** A "Critical Files" path was deleted since the handoff.
- **Trigger:** Staleness check.
- **Expected:** Missing file reported; staleness score raised; agent notes the
  file is gone and adjusts the plan.
