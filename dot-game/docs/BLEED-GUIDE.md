# Axe bleed: natural progression and honest comparisons

## Scope

The selected model is historical axe bleed, adapted to this independent game: eligible positive-damage physical basic attacks against a surviving target have a fixed 25% noncritical proc chance; a qualifying critical guarantees one stack. Up to five stacks share seven future simulation ticks. Each proc refreshes even at the cap and replaces the attack snapshot for all stacks. Per-tick damage is `floor(snapshot sheet ADB × 0.08 × stacks)`, untyped, noncritical, and bypasses mitigation and avoidance. No immediate application damage, skill/magic proc, or proc from bleed itself. Tick is a simulation unit, not a promised wall-clock second. The fixed maximum chance/duration, snapshot, cap and scheduler are adaptations, not claims about current original-HV rates.

This comparison changes no item stats, prices, loot rates, enemy data, experience, or economy. Flat equipment score still omits proc value. An axe's bleed is not proof that it always beats a rapier or club.

## Predeclared experiment (written before measurement)

Use exactly seeds **1–100**, fresh `createGame(seed)`, default balanced tactics, auto-advance OFF, auto-sale OFF and identical **0.1-second calls** to production `advance` in every branch. Never inject gold, levels, attributes, gear, enemy state, unlocks or combat coefficients. No manual potions, sales, rerolls or future-loot knowledge. A fight ends on its first clear or defeat, with a 600-simulated-second safety bound. Failure is reported, not discarded or replaced by a favorable seed.

### A. Unpurchased random-loot early progression

1. Attempt stages **1–5**, one clear per stage, stopping at defeat or a start refusal. Select stages through production `act`; assert each is naturally unlocked.
2. At camp equip the highest existing `scoreItem` in each slot; the currently equipped item wins ties, then inventory order. Score is deliberately simple and not proc-aware.
3. Run the real-bleed branch as the continuing natural path. At each start where an axe is actually equipped, clone that exact start for a neutral comparison. Change only the control's equipped `weaponFamily` to explicit `null`; names, stats, rolls, level, gear, resources and seed stay identical. The control is a test-only proc-off treatment, not a separately obtainable weapon.
4. Report all natural starts/successes/failures, axe availability, procs/ticks, and paired faster/equal/slower and survival outcomes by stage. No axe means no axe pair, not a hidden exclusion from natural-route results.

### B. Naturally paid fixed-axe progression, including longer targets

1. Repeat stage 1 at most **20 clears**, using the same earned-item camp policy. After each clear inspect the actual axe commission preview. At the **first affordable** offer, buy via production confirmation and equip it via production `act`. Record clears, combat seconds, hero level, gold, price, remaining gold and exact weapon. Do not wait for a better seed, level or fight result.
2. Keep that purchased axe for this entire route, even if a later drop has higher score. Continue equipping only highest-score earned armor/accessory after each clear. This is a purposeful, fixed bleed-build experiment, not an optimal general progression policy.
3. From the purchase camp state attempt **stage 1 once, then stages 2–10 sequentially**, stopping the continuing real-bleed path on defeat, start refusal or timeout. Clone every reached start into real-bleed and explicit-null-family control branches. Both branches use identical stats, starting seed and 0.1-second calls. Continue only the real-bleed branch's earned state; the control's success cannot grant the natural path an unlock.
4. Report affordability and spend, reached starts, wins/failures/timeouts, faster/equal/slower among mutual wins, one-sided wins, minimum HP, HP/MP immediately before win recovery, actions, incoming damage, final seed divergence, bleed procs/ticks/damage, maximum stacks and boss duration. Also report later stronger earned weapons instead of implying the purchased axe is permanently best.
5. A meaningful long encounter is a naturally reached boss lasting at least **seven simulation ticks** in the real-bleed branch. Report how often it occurs and whether bleed actually ticks there. If absent or effects are rare/unhelpful, say so; do not manufacture a boss, extend its HP or tune the engine to secure a favorable result.

HP/MP observation occurs after ordinary kill XP processing but before the clear's full recovery. Minimum HP/MP retain normal level-up and between-wave healing. Observation-only property accessors are restored; independent deep-state equality tests must show no state or RNG mutation from instrumentation. Identical initial seed does **not** imply identical later draws: axe proc eligibility consumes RNG, and changed kills/actions affect every later draw, including loot. Pairs are whole-encounter outcomes, not isolated damage attribution. This protocol asserts no full-engine invariance under different floating-point `dt` partitions.

Default regression uses the fixed subset `[1, 7, 42, 73, 100]`; `BLEED_SEEDS=100` runs the full predeclared sample. Other values 1–100 run seeds 1 through that count for diagnosis, not a replacement for the full report. No assertion requires every seed to improve. Assertions protect the method, resources, determinism and no early survival cliff; contrary evidence must be reported, not tuned away.

## Reproduce

```sh
node --test tests/bleed-balance.test.mjs
BLEED_SEEDS=100 node --test tests/bleed-balance.test.mjs
```

## Measured v0.8 results

The unchanged production implementation passed this protocol on **all 100 seeds**, plus the five-seed regression subset. The final frozen-engine rerun passed **5/5 tests** in **2.20 seconds**; the default subset passed **5/5** in **0.33 seconds** in this cloud environment. Reported fight times are simulated combat, not human/UI time. Route-continuity assertions verify that every prior natural win proceeds to the next declared stage, so no helper parameter can silently truncate the denominator. These are v0.8 measurements. Historical v0.7 commission and v0.5 role results elsewhere remain historical, not reruns under bleed.

Final measurement identities (SHA-256):

- `src/engine.js`: `a9e3b4b8d8ec5ac6ecc8dcdbc72e3586e24e9ca7cce32b6ebb4de3e7346fe8b1`
- `tests/bleed-balance.test.mjs`: `e34367c80d7742b6b9d1cc4c8b620af462a410682d32d740011cd0d57f5f387c`

Every paid-axe stage's final denominator is 100 starts / 100 mutual wins; every ordinary early stage has 100 natural starts / 100 wins. All 18 previously measured aggregate/witness diagnostics were exactly reproduced after runtime freeze; the nineteenth diagnostic separately verifies normal import of the natural witness.

### Early random loot remains viable; acquiring an axe is not guaranteed

All 100 fresh paths reached and won every stage 1–5: **500/500 natural wins**, no defeat, refusal or timeout. Stage 1 uses the neutral starter sword, so no bleed is expected. Thereafter some paths keep a naturally stronger rapier or club under the score policy.

| Stage | Natural wins | Naturally equipped axe pairs | Pairs with actual bleed pulses | Faster / equal / slower than same-stat neutral axe | Higher / equal / lower minimum HP |
|---|---:|---:|---:|---:|---:|
| 1 | 100/100 | 0 | 0 | — | — |
| 2 | 100/100 | 33 | 30 | 15 / 7 / 11 | 19 / 1 / 13 |
| 3 | 100/100 | 37 | 36 | 21 / 5 / 11 | 21 / 0 / 16 |
| 4 | 100/100 | 45 | 43 | 26 / 11 / 8 | 27 / 1 / 17 |
| 5 | 100/100 | 57 | 56 | 37 / 9 / 11 | 33 / 2 / 22 |

Every paired control also won. Stage-5 axe-pair median clear time was **22.1 → 21.1 s**, minimum HP **650.9 → 656**, and pre-win HP **650.9 → 656.7**. Across all weapons, early natural median times were **31.6, 17.9, 20.0, 19.0, 21.1 s**. This is evidence of early accessibility, not an exact v0.7 full-state comparison or a claim that a particular weapon always wins.

### A naturally purchased axe has a visible, bounded use

Every seed first afforded the **axe** at **10 clears / Lv8**, after **123.7–170.7 s** of combat (median **141.4 s**). The exact standard offer had attack **+81**, cost **744 gold** from **760**, and left **16**. This consumes **97.89%** of savings: it is an optional expensive purchase, not free power or a guaranteed financial cushion. The cheaper-family first-affordability figures in the historical commission guide are a different question.

All 100 continuing axe paths reached and won stages 1–10; all **1,000** same-start controls also won. There were **zero one-sided wins, defeats, refusals or timeouts**. The table reports every stage, including less favorable ones. Arrows compare neutral → real bleed; medians are branch medians, not median pairwise deltas.

| Stage | Faster / equal / slower (100 pairs each) | Median seconds | Higher / equal / lower minimum HP | Encounters with bleed pulses | Median bleed damage |
|---|---:|---:|---:|---:|---:|
| 1 | 36 / 45 / 19 | 10.6 → 9.5 | 55 / 10 / 35 | 68 | 13 |
| 2 | 30 / 41 / 29 | 11.6 → 11.6 | 46 / 6 / 48 | 77 | 13 |
| 3 | 40 / 31 / 29 | 13.7 → 13.7 | 57 / 3 / 40 | 84 | 26 |
| 4 | 42 / 35 / 23 | 15.8 → 14.8 | 53 / 1 / 46 | 90 | 39 |
| 5 | 45 / 26 / 29 | 19.0 → 16.9 | 58 / 1 / 41 | 99 | 63 |
| 6 | 47 / 23 / 30 | 20.0 → 20.0 | 45 / 0 / 55 | 99 | 84 |
| 7 | 61 / 7 / 32 | 24.2 → 23.2 | 57 / 0 / 43 | 99 | 149.5 |
| 8 | 62 / 11 / 27 | 26.3 → 25.3 | 55 / 0 / 45 | 100 | 152.5 |
| 9 | 76 / 12 / 12 | 32.6 → 31.6 | 70 / 0 / 30 | 100 | 262 |
| 10 | 65 / 14 / 21 | 37.9 → 35.6 | 58 / 0 / 42 | 100 | 318.5 |

The proc is not merely theoretical: paid-axe stages 8–10 had actual pulses in every run. Stage 9 dealt **19,029 aggregate bleed damage to armored enemies** across the 100 fights (other roles: baseline 5,687; agile 2,355). This is observed damage, not evidence of a role-specific damage multiplier; bleed bypasses all those roles' defenses equally.

Long bosses were uncommon early with this farmed character. At stages 5, 6, 7, 8, 9 and 10, respectively, **3, 5, 62, 80, 100 and 99** of the 100 bosses lasted at least seven simulation ticks in the real branch. Of those long bosses, **0, 4, 58, 67, 96 and 97** actually received bleed pulses. All 100 bosses existed and were observed at each stage; stage 10's denominator 99 means one boss finished sooner than the long-encounter threshold, not a missing sample. Five stacks occurred in the sample from stage 7 onward, but are not required for usefulness.

| Survival/resources | Stage 9: neutral → bleed | Stage 10: neutral → bleed |
|---|---:|---:|
| Median minimum HP | 435.3 → 482.9 | 321.25 → 330.3 |
| Median pre-win HP | 493.68 → 517 | 474.88 → 487.19 |
| Median pre-win MP | 49 → 49 | 39.4 → 43 |
| Median incoming damage | 857.5 → 786.5 | 1,152 → 1,065.5 |
| Median mana spent | 18 → 18 | 30 → 27 |
| Lower pre-win HP with bleed | 38/100 | 48/100 |
| Divergent final RNG seed | 96/100 | 95/100 |

### Counterexamples and interpretation

- Stage 2's median speed is unchanged; **29/100** pairs become slower and **48/100** have lower minimum HP. Stage 6 likewise has unchanged median speed and lower minimum HP in **55/100** pairs. The test does not rewrite these as improvements.
- Even stage 10, with better aggregate speed/resources, has **21 slower pairs**, **42 lower minimum-HP pairs**, and **48 lower pre-win-HP pairs**. The five-seed fast subset happens to have worse minimum and pre-win HP in all five stage-10 fights. This is why its outcome is not substituted for the full sample.
- New eligible axe proc draws can change later attack/crit/avoidance/drop draws even when bleed never fires or never saves a turn. Different RNG outcomes can outweigh the added damage in one whole fight. Neutral controls never silently draw an extra random number to force artificial alignment.
- Already at the purchase checkpoint, **9/100** paths held an earned weapon with higher flat score than the paid axe; by stage 10 this was **50/100**. Score excludes proc value and this count is not componentwise dominance, but it plainly rules out claiming the purchased axe remains the best gear. The fixed experiment deliberately keeps it.
- These data establish useful optional damage against longer natural encounters, without an observed early survival cliff. They do **not** establish cross-family dominance, late-game balance beyond stage 10, optimal spending, all tactics, every seed, or exact browser timing. No stats, rates or prices were tuned in response.

## Reusable natural witness

The first qualifying long witness in seed/stage order is **seed 1, stage 8**: same axe and sheet stats, neutral **28.4 s / minimum HP 547**, bleed **25.3 s / minimum HP 685**, with 12 pulses totaling 201 damage. Its agile boss lasts eight ticks and receives five pulses/115 damage.

For a thick target, continue the same natural route to **stage 9**. The earned camp has **18 clears, Lv11, gold 1,100, RNG seed 4293287945**, and the same purchased **Lv8 +81 attack axe**; sheet attack is **184.06**. The neutral branch wins in **35.8 s**, minimum/pre-win HP **429**, 34 attacks, and 18 mana spent. Real bleed wins in **30.5 s**, minimum/pre-win HP **549**, 29 attacks, and 15 mana spent. Its 16 pulses total **334** damage; the armored boss lasts ten ticks and takes five pulses/**105** damage. The boss itself lasts longer than in the control (**10.5 vs 9.5 s**) despite the shorter whole clear—another reason not to conflate one component with the total.

To produce that camp for the ordinary browser **Import** flow, run this developer recipe from `dot-game/`. It replays real production actions; it does not grant anything. The command emits JSON only, which may be redirected to a local fixture file. Use an isolated candidate save and preserve any personal save before importing.

```sh
node --input-type=module <<'JS'
import {createGame, act, advance, previewWeaponCommission} from './src/engine.js';
import {scoreItem} from './src/loot.js';
const s = createGame(1);
function equip(slots = ['weapon','armor','accessory']) {
  for (const slot of slots) {
    const best = [s.equipment[slot], ...s.inventory.filter(i => i.slot === slot)]
      .reduce((best, item) => scoreItem(item) > scoreItem(best) ? item : best);
    if (best.id !== s.equipment[slot].id) act(s, 'equip', best.id);
  }
}
function clear() {
  const wins = s.wins;
  act(s, 'start');
  for (let n=0; n<6000 && s.mode==='battle' && s.wins===wins; n++) advance(s, .1);
  if (s.wins !== wins+1) throw Error('Natural route did not clear; do not inject a fix.');
  act(s, 'retreat');
}
let bought = false;
for (let n=0; n<20; n++) {
  clear(); equip();
  const offer = previewWeaponCommission(s, 'axe');
  if (!offer.available) continue;
  act(s, 'commissionWeapon', {family:'axe', quoteBasis:offer.quoteBasis});
  act(s, 'equip', offer.item.id); bought = true; break;
}
if (!bought) throw Error('No naturally affordable axe.');
for (let stage=1; stage<=9; stage++) {
  equip(['armor','accessory']); act(s, 'selectStage', stage);
  if (s.stage !== stage) throw Error('Stage not naturally unlocked.');
  if (stage===9) break;
  clear();
}
console.log(JSON.stringify(s));
JS
```

The test separately validates this camp with the real `validateSave`, verifies unchanged earned gold, gear, sheet stats, seed and unlocks, then observes actual bleed on its next stage-9 fight. Import deliberately resets encounter clocks/statuses. This particular imported fixture reproduces the same listed fight under 0.1-second calls, but that is **not** a full-engine partition-invariance promise. Browser frame timing can differ; browser QA should verify visible proc/stack/timer/damage behavior and normal rewards, not demand the exact simulation time above. The engine tests and this recipe alone are not evidence that the browser UI was inspected.
