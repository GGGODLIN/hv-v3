# v0.26 Exquisite IW1: earned-source measurements

These are deterministic source simulations, **not actual browser play** and not an encounter-balance claim. No resources, item stats, RNG state or outcomes are fabricated; the existing fixed-strength5 challenge was not retuned after observation.

## Predeclared fresh cohort

Seeds:1,7,12,19,29,42,55,77,101,123. Each uses ordinary stage1 expeditions until20 wins, with a40-attempt ceiling. Equip highest-score currently held item per slot and learn/slot the three existing rank1 abilities when affordable. Score is merely a disclosed acquisition policy, not a universal best-build recommendation. At the stopping point, choose the oldest actually held eligible unbound Exquisite if present; no reroll, replacement or fallback when absent. Bind with earned fragments and enter with an earned seed.

The ten seeds earned200 ordinary wins. Eight had an eligible Exquisite and all eight first-tier trials won. Seeds12 and77 had none after20wins and remain **no-access** results, not failures to be erased or rerolled. This does not establish a guaranteed acquisition deadline. Any loss/censor would be retained; no natural defeat occurred in the tested trials. Synthetic boundary tests, not invented earned defeats, cover interruption and failure safeguards.

## Unchanged actual v0.25 export as source input

SHA256 `3cb1c0e42a28d163a92bec43b73b1ea91be428b4b32af9fec5b8dfebbf5bb583`, Lv16,110fragments,1seed. The four retained Exquisite weapons are investigated in **four independent forks of that same export**, not four purchases that one profile could afford. Each fork binds for100 earned fragments, spends1 earned seed, keeps the actual equipped weapon unchanged, and wins in21.0 processed seconds.

| Target | Family | Bound at Lv16 → IW1 attack | Other same-level observations |
|---|---|---:|---|
| loot-6 | Axe |116→119| Existing stats only |
| loot-9 | Legacy rapier |71→73| Crit .0351→.0355; absent parry remains absent |
| loot-15 | Axe |125→127| Existing stats only |
| loot-69 | Club |85→86| HP22→23; defense5 unchanged |

The table isolates **IW1**: comparison is already-bound at the same character level, not unboundLv3→boundLv16. Neutral defense rounding is retained, not inflated to manufacture a gain. Original ID, immutable binding anchor, rolls, affixes and target location are preserved. Trials return to camp, do not increment ordinary wins or award ordinary completion fragments/seeds, and do not automatically repeat. Reload preserves investment.

## Reproduction and limits

Run `node scripts/exquisite-item-world-measure.mjs` for the portable fresh cohort; inspect script CLI usage for output and optional unchanged-profile input. The private browser export is not bundled in source. Freeze-specific output and hashes are recorded with the independent acceptance evidence; repeated freeze runs are not additional independent players.

Actual browser acceptance and public deployment are separate gates in BROWSER-QA-V026.md/STATUS.md once completed. No universal speedup, full original Item World, higher-tier stacking, physical mobile, OS sleep or complete concurrency guarantee is inferred.
