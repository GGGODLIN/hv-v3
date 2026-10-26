# v0.22 independent build-context audit

## Scope and reference

Observation-only `report.build` is compared to this project's own v0.21 publication receipt (`101-v021-publication-receipt`), not outside implementation code. Its two source files are copied unchanged into the portable `tests/fixtures/v0.21/` fixture and hash-checked by the test. The audit owns `tests/report-build-audit.test.mjs`; no existing golden values are changed.

Reference SHA-256:

- `engine.js`: `eeab4752f8b32408a33f98171d9ca3c79ed5d5c6a57dd5e69c9c3a0c506290a2`
- `loot.js`: `db841ff9d52a2a0d6e58458351ca3c3f59ec8c3bc8b4d7a8baf78c3bbc28f38d`

The parity comparison removes **only the newly added top-level report `build` field**. Every enumerable state field, JSON state byte, RNG seed and historical report field remains compared. No combat/reward/state exclusions or re-recorded historical digests are used.

## Verification

`node --test tests/report-build-audit.test.mjs`: **5 passed, 0 failed**.

- 48 natural cohorts: four seeds × stages 1/4/5/6 × front/caster/weakest policies, 450 advances each, including automatic subsequent expeditions where reached. Exact state, RNG, historical reports and validated saves match the baseline.
- 12 targeted cohorts: four seeds × rapier/axe/club, automatic Protection enabled, real alternating physical/magical enemy actions and a lethal pre-existing bleeding effect. Exact comparisons after all 160 advances per cohort and retreat; positive counter, magic and bleed witnesses ensure these paths were actually exercised.
- Departure uses actual slot order and ranks, including HP Tank rank 10 and a learned-but-unslotted MP Tank exclusion; actual weapon/armor/accessory identity fields are compared exactly.
- Deliberate post-start changes to equipment, ability ranks/order and policies cannot rewrite the captured departure. Repeated Start cannot replace it.
- Returned nested arrays and entries can be mutated without altering retained reports; 30 subsequent expeditions retain only the newest two, while a separately retained detached report remains unchanged.
- Repeated report reads do not change serialized game state; report build data is absent from saves and validated loads expose no prior session reports.

Additional focused regression: `expedition-report.test.mjs`, `target-priority.test.mjs`, and `target-priority-audit.test.mjs`: **43 passed, 0 failed**.

## Inspection and limits

Source inspection confirms departure capture occurs in the successful-start path after setup but before any battle action; inventory-blocked starts return first. The build container, both arrays and each entry are frozen internally, and every nested build entry is copied on read. The retained pin test establishes detached-object stability, not browser interaction: actual pin-button lifecycle and rendering are covered separately by the UI agent's tests.

An initial UI review found valid HP/MP Tank ranks above 3 would display as unknown. This was reported immediately to the coordinator; the final source now validates rank 10 for both tank lines and rank 3 for 1H Damage, with unknown ability IDs still rejected. Historical report comparisons in older tests need only the explicit new-field omission described above; they must retain all pre-existing expected values.

This audit is deterministic engine/source verification, not a claim of browser-earned progression, visual QA, deployment or external-site verification. No balance changes, new reward assumptions, external code, user-computer access or publication are involved.
