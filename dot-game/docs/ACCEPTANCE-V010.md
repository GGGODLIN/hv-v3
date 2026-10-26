# v0.10 independent source acceptance: first ability growth

## Status and scope

**GO for this bounded source acceptance.** `node --test tests/v010-acceptance.test.mjs`
passes **11/11**, with zero failures, skips or cancellations. The parent owns
the single final aggregate run and release decision. This document does not
claim browser, mobile, public-site or release acceptance. v0.9 remains the
accepted playable version until separately verified promotion.

The auditor owns the new acceptance test and this document. The parent also
authorized the narrow historical-source guard adjustment described below. No
network, browser, deployment, commits, user-computer work, new fixture copies,
historical golden regeneration or broad balance gate was performed.

## Independent oracles and fidelity boundary

The rule oracle is the allowed original-game research, not candidate ability
helpers. [Pinned research 002](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/002-combat-and-character-formulas.md)
records:

- Lines 65–68: one initial AP at level 1, then one per level. With no training,
  earned AP is character level, not a separately incremented save balance.
- Lines 341–351: learning and slotting are separate; initial capacity is five
  Major slots plus five Supportive slots. These three abilities use Major slots.
- Lines 366–369 and 377–379: rank-1 HP Tank costs 1 AP for +10%, MP Tank costs
  1 AP for +10%, and 1H Damage costs 2 AP for +2 ADB per proficiency. All have
  a level-0 gate; rank 1 does not require a proficiency threshold.
- Lines 145–155 and 177–180: base HP is `500 + 10*L + 6*END`, base MP is
  `10 + L + WIS`; tank percentages enter the base-pool multiplier before flooring.
  Ability ADB adds to attribute and equipment ADB, rather than multiplying final
  damage or replacing actual proficiency with character level.

The research agent also corroborated the selected rules against official
Abilities revision 64891 and Character Stats revision 65166. These are
research-supported rules, not direct verification of original server code.

The independent formula oracle uses `floor(base * 11 / 10)`, including every
integer level 1–500, rather than duplicating the implementation's binary `1.1`
expression. No integer-boundary discrepancy occurred. Fractional flat gear HP
checks distinguish the base-only Tank multiplier from incorrectly multiplying
this game's entire prior maximum. Flat equipment HP remains outside the Tank
floor, followed by the existing final rounding. Rank-zero arithmetic is exact.

The frozen rank-zero/runtime resolver oracle is **own v0.8.1**, not a purported
v0.9 copy. Existing `tests/fixtures/v0.8.1/` was previously copied byte-for-byte
from accepted own-source publication receipt `034-v081-publication-receipt`;
its runtime originated at `ff6bb071240deef5d86c34e80a1d514daeb9762d`:

- Engine SHA-256: `9ae2378a4818ab92d9e4813ca89e2bed5c4af7f5de5acee01e29575dfeacfa6a`
- Loot SHA-256: `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc`

This baseline is valid for zero-allocation gameplay because v0.9 added only
session-local observational reports. Existing v0.9 acceptance independently
established that boundary. The new suite verifies the unchanged fixture,
current loot and current session hashes without altering any prior digest.
No other author's implementation, constants, monster data, art or single-player
proposal is used.

Three historical static checks now read that existing exact v0.8.1 fixture:
the two v0.7 guards spanning `sanitizeItem`/`validateSave` and `STRATEGIES`
through pre-status state/stat helpers, plus v0.8's duplicate validator-tail
guard. v0.10 necessarily changes the current optional validator and sheet-stat
region. **All old digests remain unchanged**, as do the actual frozen v0.6
validator and every current behavioral test. A name-filtered run of the
explicitly relabeled v0.7 historical guard passes. The parent identified and
narrowly redirected the v0.8 duplicate during aggregate verification; the
auditor reviewed and approved that one-line byte-source change and historical
label/comment. Its loot/session hashes and unallocated runtime stat/family
checks still target current code. Parent aggregate evidence is recorded
separately. These are authorized historical-boundary corrections, not new
candidate-generated goldens.


## Functional and adversarial evidence

The 11 tests establish:

1. Exact rank-1 costs, five Major slots, AP equal to validated level, default
   omission, and `VERSION = 1`. Proficiency 0 gives no damage bonus; fractional
   proficiency is used, bounded by the existing `1.2 * level` ceiling.
2. Each ability works only when learned **and** slotted. Unslotting removes its
   effect but retains the AP expenditure; refunding also unslots and returns
   precisely its cost. Repeated/no-op commands cannot stack effects or AP.
3. Eight full allocation/refund cycles, equipment switches and 24 repeated
   save imports preserve the ledger, seed and gold. Final refund removes the
   optional field rather than installing a new default allocation.
4. Battle, intermission and defeat refuse all four allocation actions without
   healing, logging, seed changes or other state mutation. Invalid payloads,
   unknown IDs, unaffordable learning and unlearned slot/refund commands are
   also unchanged no-ops.
5. Malformed supplied allocations fail import: explicit undefined/null,
   unsupported types/fields/IDs, duplicate learned or slotted entries,
   unlearned slots, non-array/sparse/metadata-bearing lists and overspending.
   A root accessor is rejected without invoking it. Invalid live allocation
   produces no stat bonus. Failure does not mutate the input save.
6. Legacy omitted allocations load identically to the frozen validator, without
   activating a default. The old validator drops a new allocation but retains
   supported equipment, inventory and gold. Returning to v0.10 therefore has
   level-derived AP available again, not a missing currency balance.
7. Ability views and row previews are detached and read-only at camp and in
   battle: mutating returned nested data does not alter gameplay, grant AP,
   settle combat or allocate an ability. A preview describes hypothetical
   learning plus slotting, not an automatic purchase.
8. Live basic and skill damage use the researched ability-inclusive sheet ADB
   exactly once. The frozen resolver and identical seeded rolls provide the
   expected damage. The inherited pre-turn stat snapshot still precedes that
   turn's `+0.08` proficiency gain. Axe bleed snapshots the same basic ADB once,
   applies no immediate DOT, and pays the later tick without adding the ability
   bonus again.
9. Start/report context, camp recovery and MP regeneration use the effective
   maxima. Existing auto-heal and potion behavior remains 27% and 40% of the
   new maximum HP. These deliberately adapted support actions are **not
   original Cure**, whose researched basis differs. Existing 10%-maximum-HP
   wave recovery is unchanged by source integration; it is not a new Cure rule.

## Narrow natural paired profiles

Three profiles, seeds 1–3, acquire everything through ordinary gameplay:
real stage-1 wins, deterministic score-based camp equipment selection, earned
credits, a real commission and manual equip, followed by stage-2 and stage-3
clears. Families rotate axe/rapier/club and tactics balanced/assault/sustain.
The first route uses 0.1-second simulation inputs; the other two use 0.25.
No levels, gold, proficiency, items or combat values are injected into these
natural profiles. The score policy is merely reproducible, not claimed optimal.

**31 acquisition expeditions / 2,899 simulation inputs** preserve all three
complete serialized gameplay/RNG trajectory fingerprints against frozen
v0.8.1. Ledger checks run after every action and input, including natural
level-ups. Rank-zero gameplay remains unchanged.

At each earned stage-3 camp, five identical-save branches select none, HP Tank,
MP Tank, 1H Damage, or all three. Each allocation leaves gold, RNG, equipment,
inventory and pending loot unchanged before start. **15 paired expeditions /
1,255 inputs** all settle in wins. Allocations and gold survive terminal save
validation; AP remains derived from each branch's actual final level.

| Earned profile | Start level / proficiency | ADB none → 1H | HP none → Tank | MP none → Tank | Clear seconds none → 1H/all |
|---|---:|---:|---:|---:|---:|
| Axe / balanced | 9 / 9.60 | 162.32 → 181.52 | 833 → 906 | 43 → 47 | 12.60 → 12.60 |
| Rapier / assault | 7 / 7.92 | 113.54 → 129.38 | 887 → 956 | 37 → 40 | 17.85 → 14.70 |
| Club / sustain | 8 / 9.60 | 144.43 → 163.63 | 822 → 893 | 40 → 44 | 15.75 → 12.60 |

HP Tank alone preserves clear times and cumulative incoming HP loss in this
cohort, but increases observed minimum-HP percentages: 93.52→94.04,
93.01→93.51 and 91.97→92.61. MP Tank alone increases capacity without changing
clear time or MP expenditure here. Damage/all allocations reduce incoming loss
from 153→118 on the rapier route and 132→130 on the club route; axe remains
128. Axe's unchanged clear time is an explicit equal-result counterexample,
not omitted as inconvenient evidence. No natural defeats or MP-limited rescue
were observed in this easy bounded cohort.

These are optional early growth choices, **not lasting specialization**: all
three cost four AP and fit the five original Major slots, so a level-4 player
can learn and slot all three. Unlimited free camp refunds are this game's
convenience adaptation, unlike original limited free resets followed by Soul
Fragment costs. Later ranks, Supportive abilities, Mastery expansion, training,
Soul Fragments and a complete ability tree remain unimplemented.

Once damage changes, action counts and later RNG/rewards can diverge. These
paired observations demonstrate implemented effects, not universal improvement,
weapon balance, endgame survival, browser timing or current-original equivalence.
UI/source-VM tests are owned by the UI implementer and remain separate from
actual browser acceptance.
