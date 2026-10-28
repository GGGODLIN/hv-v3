# v0.48 independent stat-delta audit

Scope: production `ui.js` evaluated with the existing full-UI DOM harness. This is source/controller evidence, not browser, layout, screen-reader or real-player acceptance.

Six independent cases pass on the candidate:

1. A small positive critical chance and negative evade change retain their signs and use percentage points, while an exactly equal block chance is a dash.
2. Small fractional parry and attack changes are not reduced to signed zero; a positive defense change below display precision is explicitly bounded.
3. A negative rate difference below display precision remains distinguishable from exact equality.
4. Worn equipment suppresses comparison deltas, including fractional stats.
5. Manual-sale comparison shares precise signed units, preserves `相同` for equality, and discloses tiny negative non-rate differences.
6. Repeated detail rendering and manual-sale comparison leave state, action calls, storage writes and UI error collection unchanged.

Command: `node --test tests/stat-delta-audit.test.mjs` (6 passed, 0 failed).

Counterfactual: setting `HV_STAT_DELTA_AUDIT_BASELINE` to v0.47's unchanged `src/ui.js` yields 2 passes / 4 expected failures. The old detail output hides the 0.025→0.0251 critical-chance increase as `—` due to its tolerance, rounds +0.0042 parry to `+0.0`, and hides tiny negative rates; the old manual-sale rate unit is `% 點` rather than the new explicit `百分點`.

Fixtures deliberately include below-precision synthetic values to exercise formatting boundaries. They do not assert those values are naturally rolled, or that the change alters combat, quality rolls or equipment value. Positive/negative sub-precision text is a bound, not a claim of significant combat improvement. The independent audit does not modify runtime, source data, saves, CSS, assets or publication state.
