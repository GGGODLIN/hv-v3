# v0.13 independent counterattack acceptance

Status: independent source acceptance PASS. This is not browser acceptance or a publication receipt; exact backup, isolated-page QA and stable-root release evidence remain separate.

## Scope and source boundaries

The original probability and proficiency cap are implemented for a deliberately incomplete one-handed passive. See COUNTERATTACK-GUIDE.md for pinned original research and uncertainty. A successful actually reached partial **or** full parry/block check is eligible in this game; partial eligibility and recognizing only our three known weapon families are explicit adaptations. This is not a generic `glance` trigger. Counter-stun, Overcharge and Overwhelming Strikes are not implemented. No damage, avoidance, loot or enemy coefficient was raised to manufacture visible counters.

## Independent checks

`tests/counterattack-acceptance.test.mjs` passes **15/15 tests**, independently of the engine author's focused suite. Its own accepted-v0.12 engine/loot control fixture has fixed SHA-256 identities and documented source provenance. It is not third-party game code.

- Three complete starter expeditions, with the unrecognized starter weapon, remain byte-identical in state, RNG and reports to accepted v0.12.
- Chance is conditional on a defensive trigger. The probability uses current STR/DEX and the existing effective proficiency cap; caps at 75%. Turn limits are 1/2/3 at effective proficiency 0/100/200. Detached preview mutation cannot grant extra counters.
- Optional defensive evidence records only reached gates. Full evade produces no parry/block evidence; partial evade alone does not qualify; partial evade plus actual parry/block retains the latter evidence. Tracking adds no resolver RNG draws or changed default result.
- Pure counter damage uses sheet attack once, bypasses evade/parry, still respects block and existing PA mitigation, never crits, and does not mutate or refresh target statuses.
- Multiple enemies share the budget. Initiated fully blocked/zero-damage counters consume it. Another enemy batch or global tick cannot refill it.
- Retreat/start and normal load reset the session budget; it is not stored in durable saves. A lethal incoming hit ends before retaliation.
- Counter lethals pay one kill reward, cap reported damage at actual removed HP, and stop the captured old-wave batch. Replacement enemies receive neither an inherited strike nor a player attack on that consumed recovery boundary.
- Recovery reactions use the upcoming player's shared budget without adding a player action. A reserved-turn regression covers a terminal recovery kill followed by another wave's recovery: the pending turn keeps its spent budget until an actual player action advances the turn.

### Defect found and repaired

Initial code unconditionally cleared the counter budget at every due player boundary. If recovery retaliation killed the last old-wave enemy, the boundary was consumed without `timing.turns` advancing; the next boundary could clear the same pending turn's budget again. The final implementation records a reserved turn token and clears only for a new token (or expedition initialization). This avoids retiming historical actions and prevents a wave-transition budget bypass. Both author and independent regressions pass after the correction.

## Naturally earned matched cohort

All acquisition uses accepted public game actions and simulation; no level, resources, proficiency or equipment was injected. This is **engine-earned, not browser-earned**. Seeds29/42/77 each win40 expeditions using a deterministic highest-score equipment policy and the existing three rank1 abilities. They reach level17 through **120 earned victories**. Score is merely a reproducible acquisition policy, not a new claim that score selects the best build.

Each earned profile separately pays the unchanged commission price for axe, rapier and club using earned credits. Two actual-owned equipment loadouts are then compared: the existing score-policy gear, and the owned armor/accessory with the greatest existing block stat. No item stats are edited. For each family/loadout, stages3/5/6 begin from identical old/new state, equipment, resources and RNG. This yields **54 paired trials**, all wins in both versions.

| Actual-owned loadout | Per-check block range | Counters / actual counter HP removed | Faster / equal / slower than old engine | Total incoming HP loss, old → new |
|---|---:|---:|---:|---:|
| Existing score-policy gear, 27 trials | 7.22%–7.51% | 1 / 181 | 6 / 16 / 5 | 3360 → 3378 |
| Owned block-heavy gear, 27 trials | 9.73%–10.64% | 8 / 1554 | 5 / 16 / 6 | 3084 → 3250 |

These results show that actual block gear makes retaliation occur more often in this bounded sample, **not that it is universally better or even lowers damage taken in every paired fight**. Counter eligibility consumes a new probability roll even when no counter succeeds. This changes later shared RNG, so changed clear times or HP losses without a counter cannot be attributed to counter damage. The measured cohort includes neutral and worse outcomes; no tuning was performed to remove them. Original source coefficients and existing reward formulas were preserved. Higher proficiency caps use explicit synthetic boundary tests, not naturally earned level100+ browser claims.

For every current paired run, a separate observer watches actual enemy HP assignments and emitted public counter events. It compares measured counter attempts and capped HP removal to the finished report's separate `actions.counters` and `damage.counter`; it does not infer damage from a multiplier or count counters as normal/skill attacks.

## Narrow historical-test maintenance

Eligible counterattacks intentionally invalidate pre-v0.13 full-combat/RNG equality. No old golden digest was regenerated:

- The v0.10, ranked-ability and selected-sale historical acquisition comparisons now advance only their acquisition side using the fixed accepted v0.12 fixture. Current camp allocation, ability formulas, paired ability battles, persistence and actual selected-sale transactions still exercise current production code.
- The v0.9 observation-only full-state/RNG cohort is explicitly labeled historical and uses that fixed pre-counter fixture. Existing current report tests remain; the new independent counter observer above covers current naturally earned report accounting.
- Original v0.5 resolver/enemy-loop/recovery byte guards retain their exact old hashes against the already frozen historical v0.8.1 source. Current resolver, damage ordering and counter behavior are tested behaviorally, not forced to match intentionally superseded bytes. XP/death rewards, loot generation and session guards remain current.

Actual browser behavior, physical mobile, OS suspension and exhaustive lifecycle races are not proven by Node tests. Publication must separately verify source backup, exact website commit/HTTP and normal browser play. Source backup does not restore personal browser saves.
