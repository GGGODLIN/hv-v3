# v057 independent source acceptance

Date: 2026-10-28 UTC. Scope: effective potion-heal event value only.

## Evidence

`node --test tests/potion-feedback-audit.test.mjs`: **15 passed, 0 failed, 0 skipped** against the v057 candidate.

The identical test file run with `POTION_AUDIT_ENGINE_URL` pointing at the unchanged v056 engine (`36b2be0887262446526e10294869ba1886d2194c`) gives **10 passed / 5 failed**. All five failures concern clipped healing feedback: the old event advertises 230 HP on a standard 575-HP starter even when only 1, 0.25, 0.75 or 51.5 HP are missing; the separate Lv1 test repeats the 1-HP reproduction. No old source fixture was modified.

## Checked behavior

- Capped manual recovery reports `Math.round(hpAfter - hpBefore)` and consumes exactly one potion.
- Full, uncapped recovery still grants the existing 40% of maximum HP.
- Complete state comparison after restoring only the pre-existing HP, potion count, potion action count, event list and event counter proves no other manual-use mutation, including seed, clocks, equipment and rewards.
- Full health, zero supply, repeat presses after full recovery, town, defeat and battle intermission are complete no-ops.
- Balanced, assault and sustain auto-supply all execute the real shared potion path once, preserve one player attack and one turn, and emit the rounded observed HP gain. Synthetic safe enemies prevent unrelated incoming damage; these are source tests, not earned player encounters.
- The real fresh Lv1 starter has 575 max HP. No invented sub-500 HP character or invalid low-maximum state is presented as legal gameplay.

## Limits

Existing integer rounding remains intentional: an effective heal below 0.5 HP has event value 0, and the unchanged UI uses its text fallback rather than a misleading `+0`. This is not a new fractional-number display rule. Tests do not constitute browser layout, actual-play or website acceptance. No website changes were made by this independent check. Damage, healing policy, potion quantity and recovery magnitude were not redesigned.
