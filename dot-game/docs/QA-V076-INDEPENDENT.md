# v076 independent source/DOM review

2026-10-29 UTC. Reviewer owns only this record and `tests/expedition-count-choice-audit.test.mjs`; runtime implemented by a separate agent.

## Result

PASS: 11 independent tests, plus all 20 previous three-run goal tests (31/31 combined). No blocking issue found in the reviewed change. This is a source/DOM-harness acceptance result, **not browser visual acceptance or public release approval**.

Command:

```sh
node --test tests/expedition-count-choice-audit.test.mjs tests/three-run-goal.test.mjs tests/three-run-goal-audit.test.mjs
```

## Evidence

- For each of 3, 5 and 10, natural seed-3 ordinary expeditions starting with 50 historical wins stop only after the selected number of new complete four-wave victories. Full hero, equipment, inventory, pending loot, RNG seed, item IDs, currency, unlocks, best times and expedition reports match an otherwise identical unrestricted loop at the same simulation step. Fragment/seed rewards settle exactly once; town remains unchanged on further ticks.
- Legacy `startThree` retains default-three behavior and rejects payloads. New `startCount` accepts only numeric 3/5/10; malformed, fractional, string, array, object, null and missing values do not depart or consume RNG. The exported options are frozen.
- Repeated starts during fight/intermission cannot reset progress or mutate the captured target. Intermission ticks do not count as extra clears.
- Cancellation preserves current battle and restores unrestricted continuation. Finish-current supersedes the count target; cancelling that override does not resurrect the discarded count goal.
- Nondefault goals clear after early capacity return, defeat, save validation/reload or retreat. Capacity can stop a ten-run intent after just one successful expedition; the UI does not promise ten successes.
- DOM harness: choosing ten in town is preparation-only (no serialized state mutation); battle selector is disabled and stale change events cannot mutate target. Invalid UI values are rejected. Readonly tab choice/actions are guarded. `syncSelection` (used for ownership/load reconciliation) and import reset intent and selection to three.
- A 2x DOM-harness session completes exactly ten natural victories, receives 100 fragments and 10 world seeds, returns to town and stays frozen afterward, without harness faults.

## Boundaries

The selection is a local game adaptation, not a claimed original-HV mechanic, RNG bonus, saved progression field or guaranteed win count. Existing Item World isolation and auto-advance semantics remain covered by the passing baseline tests. Ownership reset is checked through its shared reconciliation function, not an actual multi-tab browser handoff. No screenshot/layout inspection, real-browser play, public-page verification, CI verification, GitHub write or deployment was performed by this reviewer. Parent integration performs full-suite and exact-commit backup verification separately. Formal playable version remains untouched by this review.
