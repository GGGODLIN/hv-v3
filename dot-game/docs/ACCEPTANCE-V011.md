# v0.11 ranked-ability acceptance

## Scope and status

Independent source acceptance for the complete ranks of the **three existing** Major abilities: HP Tank, MP Tank and 1H Damage. This does not implement the rest of the original ability tree, Training, Mastery or separate Support abilities. It does not establish complete original-HV fidelity or universal balance improvement.

The independent suite is `tests/ranked-abilities-acceptance.test.mjs`; it supplies explicit schedules and equation oracles rather than reading production rank constants. Its **41 tests pass**. The higher-rank arithmetic, save shape and action changes were independently reviewed against the frozen accepted v0.10 engine. Browser, backup and publication acceptance are separate gates, not implied by these Node results.

Run:

```sh
node --test tests/ranked-abilities-acceptance.test.mjs
node --test tests/*.test.mjs
for file in src/engine.js src/loot.js src/session.js src/ui.js; do node --check "$file"; done
```

## Required semantics and evidence

The researched rank schedule is recorded in the [pinned findings002, §3.1–3.2](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/002-combat-and-character-formulas.md), corroborated by the [Abilities reference](https://ehwiki.org/wiki/Abilities) (revision 64891 as observed during this milestone). The project's source research is not a claim that all current original-HV systems are recreated.

| Ability | Rank level gates | Incremental AP costs | Total cost | Current-rank effect |
| --- | --- | --- | --- | --- |
| HP Tank | 0, 25, 50, 75, 100, 120, 150, 200, 250, 300 | 1, 2, 3, 3, 4, 4, 4, 5, 5, 5 | 36 | Base HP +10% per rank |
| MP Tank | 0, 30, 60, 90, 120, 160, 210, 260, 310, 350 | 1, 2, 3, 3, 4, 4, 4, 5, 5, 5 | 36 | Base MP +10% per rank |
| 1H Damage | 0, 100, 200 | 2, 3, 5 | 10 | Effective proficiency ×2, ×3 or ×4 ADB |

- Effects replace the previous rank total: HP rank 2 is +20%, not +30%; 1H rank 2 is ×3, not ×5.
- Learning and slotting stay separate. One ability occupies one of five Major slots regardless of rank. Upgrading preserves whether it is active.
- A command purchases only the next rank. Full forgetting returns **every paid rank cost**, removes its slot and rank key, and does not touch gold. All three maxima total 82 AP and use three slots.
- One-next-rank operation and unlimited free camp refunds/reslotting are explicit game design choices; the original references do not prove identical original UI/refund behavior.
- Existing maxHP-based automated healing and potions are unchanged adaptations, not original Cure formula reproduction.

## Independent coverage

### Numerical rules and combat

- Every one of the 20 upgrade boundaries is checked immediately below and exactly at its gate, with both learned/inactive and active abilities. Each action charges only its incremental cost, preserves one slot, and stops at the next gate.
- **7,158 eligible level/rank Tank cases** cover every rank at every legal level through 500. The oracle uses an integer-ratio multiplication before flooring the base; fractional flat gear HP is added afterward, before the existing final HP rounding.
- Ranks 2+ avoid binary-decimal multiplier boundary losses. Rank 1 intentionally preserves accepted v0.10 arithmetic; all legal level-derived attribute cases in the sweep also match the rational oracle.
- All three 1H coefficients are checked with zero, fractional, at-cap and far-over-cap proficiency. The rank contribution replaces rather than accumulates the old contribution, then participates in the existing sheet-attack rounding.
- Live basic and skill attacks at ranks 2 and 3 receive the effective attack exactly once before that turn's proficiency gain. A rank-3 axe proc snapshots the effective ADB once; a later bleed payout does not add the ability a second time.
- Maximum-rank HP/MP feed existing automated heal, potion and camp recovery mechanics; no new support formula was introduced.

### Actions, previews and persistence

- Derived AP equals level; no durable AP grant field exists. Full-rank refund, free unslot/reslot, repeat learn, repeated next-rank purchases, max-rank no-op and relearning are conserved.
- Battle, intermission, defeat and unknown modes refuse all five ability mutations. Invalid IDs and payload coercion/getters do not execute. Refused operations do not heal, change RNG, write logs or touch clocks/items.
- Current-slot preview uses the learned rank (rank 1 if unlearned); next-rank preview is explicitly hypothetical **if slotted**, even when currently inactive or gate-locked. Unlearned and maximum-rank upgrade previews are null.
- Returned metadata, rank maps, effects and stats are detached. Mutating a returned next-rank cost cannot alter the catalog or buy an ability. Preview reads do not advance, heal or change state.
- Durable `abilities.ranks` is optional and nonempty when present. Its only valid entries are learned IDs with an integer rank strictly above 1 and at most that line's maximum. Unknown/unlearned IDs, rank 1, empty maps, nonintegers, unknown fields, accessors, hidden/symbol keys and inherited metadata are rejected rather than silently discarded.
- Save level gates and cumulative AP budgets are validated before restoration; fabricated grant fields do not bypass them. Failed import leaves its input untouched, and malformed allocation is inactive rather than granting effects.
- Rank-1 `learned`/`slotted` saves and allocation-free legacy saves retain their previous shape and behavior. Repeated ranked reloads retain exact ranks/costs without replaying any grant.

The old v0.10 reader deliberately rejects rank-2+ allocation metadata. This is forward rejection, not successful downgrade compatibility. Refresh old tabs before taking writer ownership; retain an exported backup. The save schema number and existing storage-key isolation remain unchanged.

## Naturally earned matched cohort

This is **engine-earned progression**, not browser-earned progress, fabricated browser state, a save editor, or a high-level synthetic stat fixture. The public `createGame`, `act` and `advance` interfaces produce all XP, items, gold, proficiency and levels. The deterministic policy equips highest-score available gear in camp, manually sells unlocked surplus when inventory exceeds 50, learns/slots the three rank-1 abilities once level 4 is reached, and farms unlocked routes up to stage 3. It deliberately does not claim that score selects the universally best weapon family.

Seeds **29, 42 and 77** each reach level 30 after **211 actual engine victories**: 633 victories and 6,417 one-second advance calls in total. The accepted v0.10 and new engines are deeply equal after every action and every advance. This includes both natural first-rank gates; no rank upgrade is applied to the equality branch.

For each seed, the last camp before level 25 is level 24 at XP **1784/1886**, 123 wins. The last camp before level 30 is level 29 at XP **2692/2816**, 210 wins. The next victory naturally crosses each gate. Rank 2 is unavailable beforehand, available afterward, and spends two additional AP when separately chosen in a cloned earned branch.

At earned level 30, four branches begin from the same saved profile, RNG, equipment and resources: existing rank 1, only HP rank 2, only MP rank 2, and both rank 2. The 12 matched stage-3 runs all win:

| Seed | Weapon at comparison | HP rank 1 → 2 | MP rank 1 → 2 | ADB (unchanged) | Elapsed, all four branches | HP lost, all four branches |
| --- | --- | --- | --- | --- | --- | --- |
| 29 | club | 1449 → 1569 | 116 → 127 | 367.16 | 7.4 s | 50 |
| 42 | axe | 1400 → 1520 | 116 → 127 | 369.16 | 7.4 s | 58 |
| 77 | axe | 1475 → 1595 | 116 → 127 | 377.16 | 8.4 s | 60 |

Spent AP is 4 / 6 / 6 / 8 across those four choices. Every branch spends 3 mana in the measured encounter. HP rank 2 slightly improves the minimum-HP percentage because the pool is larger; it **does not reduce the absolute HP lost or improve clear time in these easy encounters**. MP rank 2 increases capacity but has no observed encounter outcome benefit here. No universal improvement, harder-stage balance, or high-rank natural progression is inferred.

The independent suite regenerates these cohorts and prints the full measurement diagnostic. Separate temporary QA exports outside the deliverable (`../qa/`) contain seed-29 near-gate saves, the replay script and input ledger. They are honestly labeled engine-earned and were not used to fabricate browser progress.

## Limits and separate release gates

- Rank gates above level 30, all maximum ranks, malformed-save cases and zero/fractional-proficiency corners use explicitly synthetic Node fixtures; they are not naturally earned or browser-tested high-level profiles.
- The three-seed comparison is a narrow deterministic stage-3 cohort, not a broad balance study, all-family comparison, damage guarantee or win-rate estimate.
- DOM harness tests and real desktop browser observations belong to the UI/browser records. They do not establish mobile/touch, suspend/resume, every browser, or arbitrary mixed-version tab safety.
- Source backup, exact remote readback, candidate deployment, Pages/HTTP identity, stable-root promotion and real browser acceptance must be reported separately. This document alone does not mark v0.11 published.
