# v0.8.1 bounded desktop browser acceptance

Observed in actual cloud Chrome on 2026-10-26, 01:08–01:11 UTC. Candidate site commit `57f7ab124852d9f0313c2f475ac43a09b069cb03`; Pages run `40252508863` completed successfully for that exact SHA. Six public runtime responses were HTTP 200 and byte/SHA-256 identical to frozen source receipt `5a280428eb940d667ee3c2a63ecbc01c5dbe9643` (runtime source `ff6bb071240deef5d86c34e80a1d514daeb9762d`). The accepted v0.7 public root was not changed during candidate testing.

## Actual observations
- A fresh journey cleared stage 1 in the displayed 31.5 seconds, received loot, and reached level 2 / 88 gold after a short auto-loop and retreat.
- Imported a naturally played v0.7 profile through ordinary UI export/import. Level 19, XP 674/1192, gold 7888, 77 wins and 102 inventory items were retained.
- Bought a level-19 axe for 1164: gold became 6724; attack stayed 237 until manual equip. Equipping changed attack/crit from the club's 237/14.6% to 257/11.6%.
- Stage 4 cleared in 14.7 seconds, then replay in 10.5 seconds. These were not controlled same-state comparisons and do not establish a pure buff. The live notice `流血結算 · 裂隙守門者 · 4 · 流血 20` matched floor(257 × 0.08) = 20.
- Continued into stage 5, retreated and reloaded. Level 19, XP 1071, gold 7048, wins 79, kills 489, inventory 110 and the equipped axe persisted.
- A second ordinary tab started read-only. Explicit takeover made it the writer and the former owner read-only.
- A normal UI export was parsed: all 105 original total items were unchanged; eight new items were the purchase plus earned loot. Final export SHA-256: `9302aced4b5021302797815a5c5d984b21d1f08c12103a7232806afb0b005eb1`. No personal export bytes or private browser paths are included in this source backup.
- No app-origin errors appeared in inspected logs; observed noise had explicit browser-extension URLs.

## Scope and limits
Bounded desktop GO, not universal browser/device validation. Corrupt-save multi-tab repair has 20 production-handler Node UI tests and an independent audit, but was not reproduced in this browser pass. Exact clock boundaries are unit-tested, not wall-stopwatch proof. Physical mobile, OS suspension, universal foreground-only pause, and every bleed-stack timing were not browser-verified. Existing unknown-schema browser-negative coverage limits remain; no offline earnings or universal timing guarantee is claimed.

All 551 source tests and four runtime syntax checks had already passed on the exact fully read-back source. This acceptance record changes documentation/manifest only; those runtime checks were not redundantly rerun. Root promotion and its final shared-save smoke are separate subsequent steps and are not claimed by this record.
