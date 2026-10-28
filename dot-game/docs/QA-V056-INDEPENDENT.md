# v056 independent wave-growth audit

2026-10-28, independent scout/reviewer. Scope: own dot-game engine and isolated tests only; no website writes or browser-acceptance claim.

## Reproduced defect on v055

Seed 1, new journey, start, XP one below threshold, one remaining 1-HP enemy, ordinary attack after 1.05 s: hero becomes level 2, wave 2, max HP rises from 575 to 597, but actual HP is cut to 575 by pre-kill max-HP caching. This also affects a skill kill and lethal bleed pulse. At injured HP 100 (MP zero to isolate the existing automatic Cure), v055 restores to 247.5 rather than the current-max result 249.7. Counterattack already uses post-reward maximum and is a regression control, not a newly claimed defect.

## Independent regression evidence

`node --test tests/wave-growth-audit.test.mjs`: **16/16 passed** against v056 engine. The identical test body imported against v055 produced **7 passes / 9 failures**, specifically basic/skill/bleed full-health growth basic/bleed injured growth, and four bound-HP growth cases. No fixtures modify production source or RNG implementation.

Coverage: direct attack, skill, bleed and counter growth at nonfinal boundary; exact 90 level-heal then 10% current-max wave-heal arithmetic; no-level recovery unchanged; surviving enemy prevents wave heal; final-wave victory/full recovery and no repeated reward remain unchanged.

Reviewed fix computes `stats(s).maxHp` inside the nonfinal branch of `finishWave`, after existing kill/XP/bound-item settlement. It does not alter reward amounts, random calls, cadence, enemy construction, final-win branch, or introduce a new original-HV assertion. This is correction of an existing local wave-recovery adaptation.

Scope limitations: these are deterministic engine tests, not real-browser play or a statistical balance study. Full suite and exact source backup are performed by the integration owner. Normal public browser acceptance remains pending for this candidate.

## Additional bound-HP and Item World boundary coverage

Four additional independent cases use an actual `generateItem` 堅守 weapon (HP prefix), full `previewSoulbindWeapon` → `act(soulbindWeapon)` → equip, and for the trial the full `previewItemWorld` → `act(enterItemWorld)` contract. Basic/bleed clearing the first normal/trial wave grows the bound weapon from level 1 to 2; its HP gain is included alongside the 22 base-HP gain before recovery. Anchor and item identity remain valid, seed is spent exactly once only for IW, wave is 2, kills 1, wins 0, and IW1 upgrade is not granted prematurely. These are valid action-path focused fixtures, not naturally earned playthroughs. Original twelve cases remain unchanged.
