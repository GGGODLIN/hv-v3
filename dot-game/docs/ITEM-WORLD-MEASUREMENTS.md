# IW1 earned-play source measurements

**Scope:** deterministic source simulation, not browser evidence or a universal balance claim. All gameplay writes used public `createGame`, `validateSave`, `act`, and `advance` APIs. No hero, resource, item, enemy or RNG injection; no patched saves or forced-loss seed search.

## Final measured source

- Engine SHA256: `54dda1cf9982b4eab2336071d43cf398a1ad35fbe4397508f6fed5afedb5d974`
- Loot SHA256: `8ca322c77ab265d88ebfdf1b64247e9170cbdd47fdb14f68b702903c368259cd`
- Measurement script SHA256: `da3c0d2094320dd800fbf0b6e3b05a3f6d66df9c264feebbe014f0eceaad92ae`

The initial baseline is retained unchanged. After validation hardening changed runtime hashes, `final-baseline` reran the same declared protocol. **Every fresh-profile acquisition/drop/state/trial record and the advanced `loot-1` result are exactly equal to the initial baseline**, not merely the win totals. Both final baseline and exploratory early run had stable before/after source hashes. Comparison evidence: `item-world-natural-comparison.json`. A final portability-only script revision then reran both unchanged protocols with new labels: every acquisition, trial, summary and advanced result again matches exactly (`item-world-natural-portable-comparison.json`). These reruns are verification, not additional independent observations.

Fixed IW strength5 was chosen before any measurement. The earlier level-dependent strength proposal was rejected architecturally before outcomes; no difficulty or reward tuning followed these results.

## Two disclosed cohorts

| Cohort | Fresh seeds | Acquisition | Entry levels | Natural normal results | IW first entries |
|---|---|---|---|---|---|
| Original baseline | 1–100 | Score-best held gear, rank1 HP/MP/1H abilities, routes up to5 | Lv9×99; Lv11×1 | 1,004 wins; 0 defeats | 400 wins /400 |
| Exploratory early | 1–100 | Stage1 only, original starters, no AP purchases | Lv8×100 | 1,002 wins; 0 defeats | 200 wins /200 |

The early cohort was declared **after** seeing the original all-win cohort. It is explicitly exploratory, not a substitute for the original results. All profiles/outcomes remain in the evidence. Baseline seed28 needed14 normal clears before its first supported drop; early seed88 needed12. Every other profile reached the gate after ten wins. No profile hit the40-attempt limit.

Targets were the first naturally earned Fair/Average/Superior axe, rapier or club, bound with the actual100-fragment cost. Baseline qualities/families: Average50/Fair4/Superior46; axe34/club36/rapier30. Early: Average52/Fair2/Superior46; axe32/club37/rapier31.

Each paired arm cloned the same earned state through `validateSave`. Gear policies changed only actually held items through `act('equip')`. Backpack targets remained in backpack; equipped-target arms changed only the weapon where prescribed. Original starters were retained naturally, never reconstructed.

| Cohort/arm | First wins | Median seconds | Median cumulative HP lost | Maximum HP lost |
|---|---:|---:|---:|---:|
| Baseline score-best / target backpack | 100/100 | 21.0 | 281 | 436 |
| Baseline score-best / target equipped | 100/100 | 22.1 | 279 | 473 |
| Baseline starter / target backpack | 100/100 | 34.7 | 653 | 865 |
| Baseline starter armor/accessory / target equipped | 100/100 | 23.1 | 367 | 563 |
| Early starter / target backpack | 100/100 | 46.2 | 941 | 1,215 |
| Early starter armor/accessory / target equipped | 100/100 | 28.6 | 457 | 658 |

Cumulative HP loss is not start HP minus end HP; healing can make the total larger. These results describe deliberately chosen policies, not random player behavior. Item score omits proc value and is not DPS. Paired RNG states can consume different sequences after builds diverge; the table does not prove a single causal mechanic.

**No natural defeat occurred, so the declared one-paid-retry policy was not exercised.** Defeat, retreat, reload and retry behavior require independent behavioral/browser checks. Do not claim this cohort established them.

## Zero/rounded growth was retained

Per100 unique target previews (paired arm copies are not extra independent targets):

| Observation | Baseline | Early |
|---|---:|---:|
| At least one present stat truly unchanged in high-precision quote | 15 | 18 |
| At least one present stat displayed equal in ordinary item detail | 59 | 59 |
| At least one positive change hidden by ordinary detail rounding | 52 | 53 |
| Every present quote stat unchanged | 0 | 0 |

The second row includes genuine unchanged stats; it must not be described as59 hidden positive gains. Missing legacy fields are recorded separately and never invented. Entry-level preview deltas isolate immediate IW1 growth; final item stats can additionally reflect naturally earned level increases during combat.

## Two separate unchanged advanced-save trials

Both read the same ordinary v0.23 `final-guarded.json` without editing/copying that save into source, use canonical migration, preserve its existing build/abilities, and earn one seed through one ordinary clear. They are separate paired starting-profile demonstrations, not extra fresh players.

- Imported Lv15 /41 wins /60 fragments /0 seeds → normal clear gives42 wins /70 fragments /1 seed.
- Existing bound `loot-1` in backpack: IW win20.0s, seed1→0, +28 kill credits/+147 kill XP,2 ordinary drops; attack unchanged by integer rounding, crit changed.
- Existing equipped bound `loot-12`: IW win20.0s, seed1→0, +28 kill credits/+147 kill XP,2 ordinary drops; no high-precision quote-neutral present stat, but crit displays unchanged in ordinary detail.

Across **600 fresh IW entries plus these2 advanced entries**, the script asserted exact kill-only XP, per-kill quarter-credit flooring, no boss completion item, unchanged ordinary wins/clears/unlock/best-time/fragment counters, and no completion seed/refund. The repeat final-baseline run is an exact-source recheck and is not counted as additional independent evidence.

## Evidence and reproduction

The portable source package includes `docs/ITEM-WORLD-NATURAL-PROTOCOL.md`, `docs/ITEM-WORLD-EARLY-PROTOCOL.md`, and `scripts/measure-item-world.mjs`. Full raw run records are retained separately in the original workspace evidence archive rather than embedded in the restored source package. No external archive links are required for reproduction.

From the restored project root (containing `src/`, `docs/`, and `scripts/`):

```sh
node scripts/measure-item-world.mjs --label reproduce-baseline
node scripts/measure-item-world.mjs --cohort early --label reproduce-early
```

The script creates `measurements/` automatically and writes the full JSON plus a Markdown summary there. `--output /desired/directory` selects another directory. Choose a new label for each execution: the script refuses to overwrite existing labeled results. Fresh cohorts require no private save or external evidence folder.

An optional unchanged ordinary v0.23 save can be supplied with `--advanced /path/to/save.json`; `--advanced-target loot-12` selects an already-held supported bound target without equipping or editing it. The historical advanced input is not bundled and is not required to reproduce fresh cohorts.

Archived raw JSON SHA256 (the portability runs use the final script hash above):

- `baseline`: `36241eab3f9687833d419a035b243db11e757d5ce635a3eb1b9f7b5ea9b458ea`
- `final-baseline`: `b4b155a93838850e9581109c5fea34b524ba67cf48820358c57db3b0a7531f0d`
- `early`: `ac9ce6a852458759ad5323d9f79f3f5abcb3e540e1b4411f7e05b60bc764505b`
- `portable-final-baseline`: `69fc3871e5d841416f2faa33591c1142d1d131cd237c6b8f459ec9513edb20e0`
- `portable-final-early`: `7c4b82f9175d0486494987fd94561b345a4ccae5a6305c615058f1198b4718de`

**Conclusion:** the fixed first tier was accessible under both disclosed earned-play policies, including low-investment legal choices. No forced losses or retuning were introduced to manufacture a difficulty narrative. Broad balance, all player builds, higher tiers, browser correctness and interruption behavior remain outside this evidence.
