# Weapon commission: scope and natural-growth evidence

## Rule and provenance

Weapon commission is an **independent game adaptation**, not a claimed original-HV shop, economy, drop rate, or optimal build. It reuses this game's researched weapon stat endpoints and existing item generation calculation. The deterministic catalog initially offers axe, rapier, and club at the hero's current level, Superior quality, R110 for every present stat, no prefix, and Slaughter suffix. Price is `max(250, 4 × existing sale value)`; it is not random loot or a reroll. Ordinary strong drops can still beat it.

The purchase path is camp-only, opens after the first earned clear, requires enough earned gold, no pending loot, and space for the delivered weapon plus five expedition slots. The preview shows the exact item, price, remaining gold, current weapon, and availability reason. A fresh confirmation revalidates the quote. Delivery is locked in inventory; purchase does not automatically equip or sell anything. The player must equip it deliberately. Buying and previewing consume no combat/drop RNG.

The flat comparison score omits proc utility. Axes emphasize attack and have no implemented bleed. Rapiers trade attack for later armor mitigation reduction; clubs trade some attack for bounded stun and recovery behavior. Cross-family differences are not universally better/worse. Within a family, an attack gain can still lose crit, defense, HP, evade, or block from an earned prefix; such offers are explicitly tradeoffs.

## Predeclared natural experiment (before measuring results)

This protocol was written before running the commission balance experiment. It must not be changed to select favorable seeds, gear, routes, or checkpoints after seeing outcomes.

1. Use exactly seeds **1–100**, fresh `createGame(seed)`, default balanced tactics, default repeated **stage 1**, and default auto-sale OFF. Never set gold, level, attributes, unlocks, items, drops, enemies, or combat coefficients. No manual potion, selling, reroll, higher-stage farming, or future-loot knowledge.
2. Run at most **20 natural stage-1 clears**. Stop on defeat, full-bag start refusal, or a 600-simulated-second expedition bound. After each clear, return to camp through production `act('retreat')` and equip each slot's greatest existing `scoreItem`; currently equipped item wins ties, then inventory order. This is a fixed simple player policy, not a proc-aware optimal build.
3. At every earned camp checkpoint 1–20, inspect all three production commission previews. Record first affordability (any family), same-family affordability, exact gold/price/remaining gold, hero level, and cumulative combat seconds. No purchase is made on the natural observation path.
4. Compare the offered **same family** to the equipped earned weapon over all six implemented positive stats: attack, defense, HP, crit, evade, block (omitted means zero). Strict upgrade means none decrease and at least one increases. Exact equality, reverse dominance, and mixed gains/losses are separate categories; score alone never proves upgrade. Cross-family offers are recorded as alternatives, not strict upgrades.
5. At the **first affordable same-family strict upgrade**, clone that exact naturally earned pre-purchase state into a buy-nothing control and a purchase branch. Use production preview, confirmation, and equip in the purchase branch, then run the same stage 1 once in both. Independently evaluate the first affordable same-family tradeoff, if present, using the same paired method. Do not pick a later checkpoint because its fight outcome looks better.
6. Observe HP and MP immediately before the win path's full recovery, plus minimum HP/MP, incoming damage/actions, win/loss, clear seconds, actions, and final RNG seed. Resource setters are observation-only and restored; a separate equality test compares observed and unobserved production runs. No enemy or combat state is manufactured. Level-up healing remains part of normal production mechanics.
7. Report first affordability clears/time, fraction with strict-upgrade offers, explicit tradeoff counts, actual spend and retained gold, faster/equal/slower clear counts, survival/resource results, and RNG divergence. Equal initial seeds do **not** imply matched later random draws: different damage, crit/proc eligibility, kill timing, and attacks can change RNG consumption and later drops. These are paired whole-run outcomes, not isolated damage proofs.
8. Required evidence is at least one reproducible natural same-family strict-stat upgrade with a faster clear or improved survival margin (minimum HP or pre-win HP). If absent, or if the catalog is nearly useless, report that outcome for parent calibration; do not privately tune the catalog or experiment. Do not claim a universal improvement even when a strict-stat offer exists.

`tests/commission-balance.test.mjs` will preserve this protocol. Default tests use a fixed fast subset `[1, 7, 42, 73, 100]`; `COMMISSION_SEEDS=100 node --test tests/commission-balance.test.mjs` runs the full predeclared sample. The subset is regression coverage, not a replacement for 100-seed evidence. One-shot pairs do not measure long-term purchase strategy, other tactics, higher stages, or every possible save.

## Measured results

The initial unchanged catalog and production purchase API were measured with the exact protocol above on all **100 seeds**, plus the default five-seed regression subset. Both commands passed all three tests. The full run took approximately 1.4 wall-clock seconds in this cloud environment; simulation time below excludes human camp/UI time. A separate read-only direct comparison against this project's own accepted v0.6 sibling verified exact complete-state equality on the unpurchased natural path at every camp/equip checkpoint for seeds1,7,42,73,100 ×20 clears. The shipped tests do not depend on that external sibling checkout.

### Access, utility, and limitations

- All 100 natural paths survived twenty clears. Every seed could afford some offer after exactly **6 clears**, at median **97.1 combat seconds** (range 83.5–116).
- All 100 eventually had an affordable same-family offer; **40/100** had a strict-stat upgrade at their first such checkpoint. Within twenty clears **60/100** had a strict-stat upgrade, and **61/100** had an explicit same-family tradeoff. These groups overlap; they are not percentages of purchases or a claim that all offers help.
- First strict-upgrade checkpoints occurred after **6–20 clears**, median **10**, at median **145.6 combat seconds** (104.4–249.3). Their next-fight paired results were **20 faster / 38 equal / 2 slower**. All 60 controls and purchases won. **23/60** improved speed or at least one observed HP margin; 37 showed no such immediate improvement. This is a useful optional growth path, not a universal upgrade or promise that each purchased stat point saves a turn.
- First explicit-tradeoff pairs were **16 faster / 41 equal / 4 slower**; all 61 controls and purchases won. Only 17 improved speed or an observed HP margin. A mixed-stat offer is not labeled an upgrade merely because its attack or flat score rises.
- In **26/100** paths an affordable same-family catalog item was matched or beaten in every relevant stat, with at least one strictly better stat by earned gear at some checkpoint. Strong natural loot remains meaningful.

| First applicable purchase | Strict-upgrade pairs (60) | Explicit-tradeoff pairs (61) |
|---|---:|---:|
| Median clear seconds, control → purchase | 10.6 → 10.05 | 10.6 → 10.6 |
| Median minimum HP, control → purchase | 811.5 → 818.5 | 795 → 784 |
| Median HP before win recovery | 827 → 827 | 808 → 805 |
| Median MP before win recovery | 37.9 → 38.8 | 37.6 → 37.6 |
| Median mana spent | 6 → 4.5 | 6 → 6 |
| Median incoming damage | 61.5 → 56.5 | 59 → 61 |
| Higher / equal / lower minimum HP | 11 / 39 / 10 | 9 / 39 / 13 |
| Higher / equal / lower pre-win HP | 11 / 41 / 8 | 7 / 35 / 19 |
| Higher / equal / lower pre-win MP | 12 / 38 / 10 | 8 / 41 / 12 |
| Divergent final RNG state | 24 / 60 | 26 / 61 |

These are medians of each branch, not the median of pairwise changes. All resource measures precede the clear's full recovery; kill XP healing, between-wave healing, and ordinary balanced-tactic decisions still occur.

### Spending caveat: initial price can consume nearly all savings

First strict purchases cost **456–860 gold**, median **744**; remaining gold was **0–660**, median **16**. Median spend was **97.89%** of current savings; **2/60** emptied the treasury. First tradeoff purchases cost 456–860, median 664; remaining gold was 0–660, median 56, and **3/61** emptied the treasury. The present API checks affordability, not a cash reserve. Therefore the rule does **not** guarantee that commission leaves meaningful savings, even though a useful witness below leaves 360 gold. The explicit review decision retains the initial pricing: this is optional virtual spending, expeditions are free, and there are no other current mandatory gold fees, so zero gold does not strand the player. The balance test does not silently reduce prices, grant money, or defer purchases to hide expensive first-use outcomes.

The catalog is optional and previews remaining gold. A player can keep the earned weapon and continue farming instead; no commission is required for any of these twenty-clear paths. The measured first-affordable policy is intentionally stricter than a player who chooses to save a cushion.

### Reproducible natural strict-upgrade witness

Run seed **12** under the exact policy. After **15** natural stage-1 clears (**219.5 combat seconds**, hero **Lv9**), the currently equipped drop is **Average Slaughter axe, Lv3, attack 56**, with no other stat. The same-family commission is **Superior Slaughter axe, Lv9, attack 84**, likewise no other stat: a strict-stat upgrade with unchanged family/proc semantics. The player has **1140 gold**; the actual purchase costs **780**, leaving **360**. Production delivery is locked, and production equip selects it.

Clone that camp state (RNG seed **2161187267**) into buy-nothing and purchase/equip branches:

| Next stage-1 run | Buy nothing | Buy and equip |
|---|---:|---:|
| Outcome | Win | Win |
| Clear time | 11.6 s | **9.5 s** |
| Attacks / skills | 11 / 2 | 9 / 1 |
| HP immediately before win recovery | 909 | **918** |
| Minimum HP | 875 | **903** |
| MP immediately before win recovery | 43.6 | **46** |
| Minimum MP | 40 | 40 |
| Incoming damage / attempts | 100 / 7 | 46 / 4 |
| Mana spent | 6 | 3 |
| RNG calls / final seed | 161 / 4233249382 | 113 / 195938550 |

The initial seed and earned state are identical; buying and equipping consume no RNG. The first divergence occurs at 1.1 s, after one player attack in both branches (8 versus 9 RNG calls): altered damage/kill timing already changes which production RNG requests occur. Later draws, attacks, procs, damage, and drops are not artificially resynchronized. This supports a whole-next-fight gameplay improvement, not a claim that every HP difference is an isolated deterministic stat effect.

The default fast subset independently includes a second witness, **seed100 after16 clears**: earned same-family axe attack66 → commission87, cost816 from1216 leaves400, next fight10.6 →8.5 s. HP is worse there (pre-win891 →878) despite the faster clear; the test and guide do not hide that tradeoff in realized outcomes.

### Honest counterexamples

- **Seed2, clear11, hero Lv8:** earned Exquisite sharpness-prefix Slaughter club has attack70 / crit3.96%; the affordable commission has attack67 / crit2.95%, price664 from836. Keep the natural drop: the catalog is strictly worse in both implemented weapon stats.
- **Seed1, clear14, hero Lv9:** earned Superior crit-prefix Slaughter axe has attack66 / crit0.91%; commission has attack84 / no crit. This is explicitly a tradeoff, costing780 from1064. Both next fights take10.6 s with the same HP802, MP40, and RNG state; the larger score does not create an immediate visible benefit.

### Reproduce

```sh
node --test tests/commission-balance.test.mjs
COMMISSION_SEEDS=100 node --test tests/commission-balance.test.mjs
```

Diagnostics print aggregate metrics and the first strict-upgrade witness, strong-earned-weapon counterexample, and tradeoff example in seed order. The deterministic replay test repeats the complete first seed, including first-checkpoint purchase pairs. These measurements cover this bounded natural default route only; other stages, tactics, long-term saving strategies, and the browser's purchase dialog require separate verification.
