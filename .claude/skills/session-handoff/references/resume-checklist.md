# Resume Checklist

Work through this before starting from a handoff's "Immediate Next Steps". The
goal is to confirm the handoff's assumptions still hold in the live repository.

## 1. Load fully
- [ ] Read the entire handoff document, not just the next steps.
- [ ] If the Handoff Chain links a predecessor, read back through the chain
      until you have full context.

## 2. Check staleness
- [ ] Run `check_staleness.py <file>`.
- [ ] If it reports STALE or PARTIALLY STALE, note which signals fired
      (new commits, changed files, branch divergence, missing files) and treat
      the corresponding assumptions as suspect.

## 3. Verify environment
- [ ] Confirm you are on the branch named in Metadata (or understand why not).
- [ ] Confirm the files listed under "Critical Files" still exist at the stated
      paths.
- [ ] Spot-check that line-number references in "Immediate Next Steps" still
      point at the code they describe (files drift).

## 4. Verify assumptions
- [ ] Re-read "Important Context" and "Decisions Made"; confirm nothing has
      changed that invalidates them.
- [ ] Re-read "Potential Gotchas" so you don't rediscover them the hard way.

## 5. Reconcile drift
- [ ] If commits landed since the handoff, skim them — the next step may already
      be done or may now conflict.
- [ ] If anything material has changed, surface it to the user before diving in.

## 6. Begin
- [ ] Start with item 1 of "Immediate Next Steps".
- [ ] As you make significant progress, consider creating a continuation handoff
      (`--continues-from` this one) to keep the chain intact.
