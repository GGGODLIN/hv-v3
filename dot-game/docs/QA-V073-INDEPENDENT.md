# v073 independent source review: fixed-slot quality hunting

Result: 12/12 independent tests PASS, zero failed/skipped/cancelled. No blocking issue found. Command: `node --test tests/quality-slot-goal-audit.test.mjs`.

## Findings and coverage

- All three supported exact slots (weapon, armor, accessory) naturally achieve a new Superior-or-better item under source simulation, then finish the entire four-wave expedition. Their combat state/rewards, inventory, RNG seed, progression and reports match ordinary repeating play through the same simulation steps; only the intended final camp transition differs.
- Seed1 weapon hunt receives a Superior armor in the first expedition and continues; the second expedition yields the requested weapon and stops only after full rewards. Wrong-slot gear is not discarded or rerolled.
- Omitted payload and explicit `any` are identical during every simulated step. Existing qualifying inventory does not satisfy the new goal.
- Invalid payloads (including null, booleans, numbers, unknown/case-mismatched/space-suffixed strings, object and array) reject without game mutation. A second start call in battle cannot change the fixed slot.
- A controlled full-inventory source case delivers the qualifying armor to pending exactly once; reward and report parity with ordinary play holds. This is a source boundary, not naturally earned browser evidence.
- Failed departure, cancellation, explicit finish-current override and canonical reload do not leave or resurrect the goal. No persistent slot/goal is added.
- Native selector changes preserve source-DOM focus and do not dispatch game actions, modify serialized game state or write saves. Invalid changes restore the last valid choice. Active-battle synthetic change events are rejected even when the disabled UI is bypassed by the test harness.
- Readonly selector events do not acquire ownership or change choice/game/save. `claimLease()` is a pure boolean check of existing page/owner/visibility conditions, not a lock-acquisition or takeover operation.
- Adoption/import resets choice to `any` and clears the active goal. A new UI instance defaults to `any`.

## Scope and pending browser acceptance

This is source simulation and a focus-faithful DOM model only. It is not a real browser keyboard/select rendering check, a mobile/responsive audit, a public-page verification, or a controlled wall-clock timing test. Browser acceptance should use normal input and genuine earned state: select a slot, inspect the fixed target text, observe an unrelated qualifying drop being retained without satisfying the target when naturally available, and verify the matching drop settles the entire expedition before camp. Report any naturally unobserved paths honestly. Existing quality thresholds, item generation, drop rates, automatic-sale eligibility, Item World exclusion, storage limits and save validation remain unchanged.
