# v0.27 emergency supply: source-play measurements

These are deterministic source simulations, **not actual browser acceptance**. The public site remains accepted v0.25; the known staging-tool refusal is unchanged. Two independently predeclared protocols used the same ten seeds, so they are not twenty independent seed samples. Neither modified earned stats, resources, generated items, RNG, unlocks or enemy difficulty. Highest-score equipment selection is a measurement adapter, not a recommended best build.

## 1. Deepest unlocked route, four progression snapshots

[Protocol](EMERGENCY-SUPPLY-MEASUREMENT-PROTOCOL.md) and `scripts/measure-emergency-supply.mjs`: seeds 1, 7, 12, 19, 29, 42, 55, 77, 101, 123; snapshot before play and after 4, 8 and 12 ordinary attempts. Each attempt selects the deepest legally unlocked route. Each snapshot is forked through normal camp actions into Balanced/Assault/Sustain, OFF/ON. No manual potion is used.

- Acquisition: 120 attempts, 120 wins. Comparisons: 120 pairs / 240 branch runs, all wins; no censored or start-blocked result.
- Balanced: 40 pairs, zero potions either way, all clear times equal.
- Assault: 40 pairs. Nine pairs use the new rule, consuming 16 potions total versus zero OFF; all uses are in the naturally earned Lv11 / route13 snapshot. Remaining stock is 1–2 in those nine runs. All 40 clear times and win outcomes remain equal.
- Sustain: 40 pairs, zero potions either way, all clear times equal. Its existing automatic policy is not governed by the new switch; independent boundary tests cover use of its final potion.

### Visible effect and counterexample

Seed55, route13: ON uses two potions and no automatic heals instead of three heals; MP spending changes 60→42. Observed minimum HP rises 8.214%→27.180%. The clear remains 44.1 processed seconds and incoming HP loss remains 2,029. This is supply replacing healing expenditure, not less damage taken or faster combat.

**Seed101 is an adverse observation, not omitted:** ON uses two potions, heals change 4→1 and MP spending 66→48, but minimum HP falls **16.214%→15.214%**. Clear time remains 46.2 seconds and incoming HP loss remains 2,376. Eight of the nine used pairs have a higher observed minimum; one has a lower minimum. Different healing/resource timing does not guarantee a higher minimum HP or survival.

All observed end RNG values match within these pairs, but that is a result of this cohort, not a promise that changing future healing can never change downstream actions or RNG. No losing run was manufactured and no enemies were tuned to create a benefit. These measurements do not establish a win-rate improvement.

## 2. Independent fixed-route neutral cohort

`scripts/emergency-supply-measurement.mjs` predeclared the same seeds, 12 acquisition attempts, highest unlocked route capped at8, and one route lower immediately after a defeat. Afterwards, identical validated earned saves were paired OFF/ON across routes1/5/8 and all three strategies. All requested routes were naturally unlocked; none were silently replaced.

- Acquisition: 120 attempts / 120 wins, with **11,296 quarter-second pulses exactly matching frozen v0.26 whole state, RNG and reports**.
- Comparisons: 90 pairs / 180 branch runs, all wins; zero potions used in any branch; all paired clear times equal. No censoring or skipped route.
- These easier earned profiles do not need the option. This complete neutral cohort remains alongside the deeper-route observations; it is not discarded for failing to show an improvement.

The portable independent regression additionally checks 72 ordinary runs across all three strategies / 6,568 pulses against exact v0.26, with no fields excluded. All 72 win in that fixed sample. Synthetic boundary tests, clearly labeled in source, separately cover after-heal eligibility, strict30% equality, malformed stock, one use per decision, the last-potion reserve, manual override, Sustain, report snapshots and stale paid-entry consent.

## Complete data, integrity and reproduction

All raw observations are retained as deterministic JSON shards ≤65,536 bytes each; no report field was removed. Indexes record ordering, byte counts and SHA256 per shard plus the reconstructed complete JSON. The writer immediately reads back and asserts structural equality. Tampered shards are refused.

| Cohort | Complete source-backed index | Files | Largest file | Reconstructed complete JSON SHA256 |
|---|---|---:|---:|---|
| Deepest route | `measurements/emergency-supply-deepest/index.json` | 21 | 64,378 B | `fe1dc6f1561dd89898c32fba69b6f311537368ac8c8906049121a8113e51be19` |
| Fixed routes | `measurements/emergency-supply-fixed-routes/index.json` | 20 | 64,173 B | `52475721fc6645adde7130d9f01297bd729494d08af9ee6e0e37bf8f47baa1b4` |

From the recovered `dot-game/` source, use new output directories (commands refuse to overwrite existing evidence):

```sh
node scripts/measure-emergency-supply.mjs /tmp/hv-supply-deepest-rerun/index.json
node scripts/emergency-supply-measurement.mjs --output /tmp/hv-supply-fixed-rerun/index.json
node scripts/measurement-shards.mjs docs/measurements/emergency-supply-deepest/index.json /tmp/hv-supply-deepest-complete.json
node scripts/measurement-shards.mjs docs/measurements/emergency-supply-fixed-routes/index.json /tmp/hv-supply-fixed-complete.json
```

Source fingerprints in reconstructed data identify the measured implementation. The measurements reproduce the original observations exactly after splitting; complete original monolithic files also remain in the local audit evidence, but restoration does not depend on that temporary workspace. Source tests and source play cannot substitute for the browser acceptance which remains not run.
