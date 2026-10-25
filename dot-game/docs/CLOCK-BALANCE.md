# v0.8.1 numeric-clock balance evidence (source-only)

## Predeclared measurement protocol

This protocol was written before the first v0.8.1 comparison. The frozen baseline is this project's own verified v0.8, copied unchanged into `tests/fixtures/v0.8/` by independent QA; see its `PROVENANCE.md`. It is not another author's implementation. Only the numeric clock correction is under test. No damage, enemy, loot, commission price, session, or save-schema changes are proposed here.

- Full cohort: seeds 1–100, inclusive, fixed in advance. Default quick cohort: 1, 7, 42, 73, 100. `CLOCK_SEEDS=100 node --test tests/clock-balance.test.mjs` runs the full cohort; `CLOCK_SEEDS=N` uses seeds 1–N (1–100).
- Two separate input drivers: production `advance(state, 0.1)` and the actual unchanged `createPump` with monotonically increasing 250 ms timestamps. The latter calls production `advance` with 0.25; it is not an invented 0.1-only replacement for the UI timer. Neither is browser/OS-timer verification.
- Starter first clear: untouched `createGame(seed)` equipment, balanced strategy, stage 1, no purchases, sales, potions, injected resources, or equipment changes. Compare wins, terminal combat seconds, full earned inventory/pending loot, final RNG, and action counts between versions. This is a per-driver version comparison, not a claim that different drivers must have identical quantized outcomes.
- Earned family policy: separately for each seed, driver, and axe/rapier/club, follow **frozen v0.8** stage-1 clears (at most 20). After each clear, return to camp and equip each slot's highest flat-score earned item (existing item wins ties). Buy that family's first affordable production commission, pay the real price, then equip it. No sale or manual potion action, no generated bench equipment, and no injected gold/levels/stages. This gives explicit family access without pretending random drops reliably supply all families.
- Hold the paid weapon unchanged; after each clear equip only best earned armor/accessory. Starting at stage 1, advance through stage 10 or the first **baseline** loss/refusal/600-second timeout. At every start, clone exactly the same naturally earned baseline state into both engines. Record all pairs; stages 3–10 are the primary role/status cohort. The baseline run alone supplies the next checkpoint. Candidate wins/losses do not select samples, and a later candidate pair is **not** evidence that its own route survived the prior stage. Denominators show this attrition explicitly.
- Any loss, slower clear, reduced HP, changed RNG, and changed loot is retained. Faster/equal/slower time counts use **mutual wins** only; time distributions are winning fights only. Missing later starts are never counted as losses or successes.
- All fights stop at the first clear or defeat (600 simulated input seconds is an explicit timeout, not an omitted sample). Win resources are captured before the production full-heal. Natural kill/level/between-wave healing remains intact.
- Observation instruments only existing property writes, event-array pushes, and status deletion; it never calls RNG or changes combat values. Equality against an unobserved production run is tested for both engines and both drivers. A tiny negative clock after a due payment is counted separately as a tolerance-restored boundary payment. Expiry counts include only an actual status deletion on a living enemy at/after its stored expiry tick; death cleanup is excluded. Counts across different whole fights are outcomes, not proof of a direct one-for-one causal benefit.
- Deterministic boundary controls, if added, are explicitly separate from natural play. No old expected hash is regenerated to make this patch pass. Historical `BLEED-GUIDE.md` and `COMMISSION-GUIDE.md` measurements remain versioned v0.8 evidence and are not rewritten.

### Separately labeled exploratory survival extension

After the initial 100-seed stage-1–10 measurement completed, all primary stage-3–10 pairs won. Before running deeper encounters, the exact same baseline-earned paths were prospectively extended through stage 20 or the first baseline failure. No policy or combat value changed. The original cohort is retained below; stages 11–20 are a separate exploratory follow-up, not a revised primary endpoint.

**All candidate pairs are conditional same-start comparisons, not an uninterrupted v0.8.1 route.** Even before a loss, the next state comes from v0.8 rewards/RNG/equipment. After a candidate loss, later baseline-state comparisons are explicitly counterfactual fixtures, not evidence that a current-version player naturally reached or unlocked those stages.

## Source measurement — 100 seeds per driver/family

`tests/clock-balance.test.mjs`: **4/4 pass** for the default five-seed subset and `CLOCK_SEEDS=100`; the full run takes approximately 20 seconds locally. The suite checks observer/nonobserver whole-state equality in both versions and drivers, including naturally earned stage-10 status-bearing fights, deterministic route replay, exact cohort accounting, and starter win/loot/RNG/action compatibility. No timeouts or refused starts occurred. A full invocation prints each stage’s denominator, both result summaries, matched-expiry timing, attrition, and deterministic witnesses.

Measured source identity:

- Candidate `src/engine.js`: `9ae2378a4818ab92d9e4813ca89e2bed5c4af7f5de5acee01e29575dfeacfa6a`.
- Frozen own-v0.8 engine: `a9e3b4b8d8ec5ac6ecc8dcdbc72e3586e24e9ca7cce32b6ebb4de3e7346fe8b1`.
- Both loot modules: `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc`.
- Unchanged session module: `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a`.

### Untouched starter first clear

For **each driver**, both versions win 100/100, with identical complete earned loot, final RNG, player actions, incoming attacks/damage, and minimum HP. The comparison is exact data equality, not a regenerated golden digest. Every time delta is between −0.1 and 0 seconds.

| Driver | v0.8 median s | v0.8.1 median s | Faster / equal / slower | Changed loot / RNG |
|---|---:|---:|---:|---:|
| 100 ms advance | 31.6 | 31.5 | 63 / 37 / 0 | 0 / 0 |
| 250 ms createPump | 31.6 | 31.5 | 80 / 20 / 0 | 0 / 0 |

### Genuinely paid equipment access

All 100 seeds in each driver/family reach the first affordable commission without a farming failure. The fixed held-weapon policy deliberately does not switch to stronger later random weapons. These purchases are not claimed to be universally optimal.

| Family | Stage-1 clears before purchase | Real price | Gold remaining |
|---|---:|---:|---:|
| axe | 10 | 744 | 16 |
| rapier | 6 | 456 | 0 |
| club | 9 | 628 | 56 |

Values are identical for both drivers and all 100 seeds. The rapier legitimately consumes the entire treasury; expeditions remain free. No resources are invented to continue.

### Primary earned-family cohort: stages 3–10

Each row contains **800 pairs = 100 seeds × 8 stages**; both engines win all 800. Across all six rows: 4,800 paired encounters, 34 slower candidate wins, no survival reversal. Time classifications use mutual wins (here every pair). A numeric correction is therefore not a universal speed buff or a promise to preserve later RNG/loot.

| Driver | Family | Faster / equal / slower | Delta seconds min / median / max | Changed RNG / loot | Lower minimum HP |
|---|---|---:|---:|---:|---:|
| 100 ms advance | axe | 416 / 375 / 9 | -4.8 / -0.1 / 3.1 | 29 / 31 | 11 |
| 100 ms advance | rapier | 412 / 388 / 0 | -0.1 / -0.1 / 0 | 0 / 0 | 0 |
| 100 ms advance | club | 366 / 423 / 11 | -3.2 / 0 / 4.1 | 32 / 32 | 9 |
| 250 ms createPump | axe | 551 / 241 / 8 | -2.2 / -0.1 / 4.7 | 21 / 23 | 13 |
| 250 ms createPump | rapier | 525 / 274 / 1 | -1.1 / -0.1 / 1 | 2 / 2 | 0 |
| 250 ms createPump | club | 537 / 258 / 5 | -6.4 / -0.1 / 3.05 | 23 / 24 | 7 |

### Restored boundary payments and status-expiry observations

At a tolerance-restored payment the actual pre-subtraction clock is just below its period, and subtraction preserves the small negative debt. The old strict comparison would defer that due action to a later simulation step. These are **earlier due payments, not net extra attacks**. No negative-debt enemy payment occurs on these particular two natural input grids; enemy-boundary correctness is covered separately in `clock-boundaries.test.mjs`, not manufactured here.

For primary stages 3–10, 59,725 player boundary payments are restored. Matching expiry events by enemy ID, status kind and stored expiry tick gives 1,684 shared events: 937 occur earlier in the candidate, by at most 0.1 seconds; none occurs later. This temporal match is observational, not an assertion that whole fights otherwise remain identical.

| Driver | Family | Restored player payments | Matched expiry events / earlier | Actual expiries v0.8 → v0.8.1 |
|---|---|---:|---:|---:|
| 100 ms advance | axe | 8313 | 25 / 11 | 25 → 25 |
| 100 ms advance | rapier | 10654 | 65 / 30 | 77 → 72 |
| 100 ms advance | club | 9312 | 752 / 392 | 785 → 788 |
| 250 ms createPump | axe | 9121 | 23 / 11 | 23 → 23 |
| 250 ms createPump | rapier | 11952 | 70 / 44 | 79 → 79 |
| 250 ms createPump | club | 10373 | 749 / 449 | 777 → 765 |

For example, 100 ms axe pairs produce 6,148 → 6,182 bleed pulses and 114,486 → 115,143 bleed damage in aggregate, but still include nine slower wins. Expiry counts can go either way because corrected action/status ordering changes attacks, proc RNG, deaths and refreshes. A deleted status on a dead enemy is not counted as a natural expiry.

### Exploratory stages 11–20: slower wins and both directions of loss reversal

Each row begins with the same 100 declared seeds. The baseline path stops at its first failure; actual attempts therefore differ by family. Across 2,752 pairs, v0.8 wins 2,152 and v0.8.1 wins 2,155. **Six baseline wins become candidate losses, and nine baseline losses become candidate wins.** This small aggregate difference is not an uninterrupted-route survival estimate or a statistical guarantee. No seed reaches stage 18, so stages 18–20 have zero starts rather than assumed wins/losses.

| Driver | Family | Pairs | Mutual wins | Baseline-only / candidate-only wins | Both lose | Faster / equal / slower (mutual wins) | Delta s min / max |
|---|---|---:|---:|---:|---:|---:|---:|
| 100 ms advance | axe | 464 | 364 | 0 / 2 | 98 | 185 / 165 / 14 | -4.3 / 9.4 |
| 100 ms advance | rapier | 390 | 290 | 0 / 0 | 100 | 139 / 151 / 0 | -2.1 / 0 |
| 100 ms advance | club | 518 | 416 | 2 / 2 | 98 | 208 / 206 / 2 | -7.4 / 1 |
| 250 ms createPump | axe | 472 | 370 | 2 / 1 | 99 | 243 / 118 / 9 | -4.25 / 6.25 |
| 250 ms createPump | rapier | 390 | 290 | 0 / 0 | 100 | 207 / 83 / 0 | -2.1 / 0 |
| 250 ms createPump | club | 518 | 416 | 2 / 4 | 96 | 290 / 124 / 2 | -5.35 / 1 |

The 27 slower mutual wins in this extension include an axe slowdown up to 9.4 seconds. A shorter defeat is never classified as a faster clear.

#### Exact attrition and censoring

All 600 baseline family/driver routes lose before the stage-20 cap; there are no cap-censored baseline routes. The histogram below reports **first baseline loss stage: seed count**. Nine candidate comparisons win at the terminal baseline-loss checkpoint; their later outcome is unobserved because this protocol does not continue from candidate state. They are not credited with additional stages.

| Driver | Family | First baseline loss stage: count | Later conditional pairs after a candidate failure |
|---|---|---|---:|
| 100 ms advance | axe | 14: 36, 15: 64 | 0 |
| 100 ms advance | rapier | 13: 11, 14: 88, 15: 1 | 0 |
| 100 ms advance | club | 14: 2, 15: 81, 16: 14, 17: 3 | 2 |
| 250 ms createPump | axe | 13: 1, 14: 26, 15: 73 | 2 |
| 250 ms createPump | rapier | 13: 11, 14: 88, 15: 1 | 0 |
| 250 ms createPump | club | 14: 3, 15: 79, 16: 15, 17: 3 | 2 |

**Six later pairs occur after an earlier candidate failure** (two 100 ms club, two 250 ms axe, two 250 ms club). All six candidate attempts also lose. They are counterfactual baseline-state fixtures, not a recovered or uninterrupted candidate route. They remain included in conditional-pair denominators and are not represented as naturally reached current-version stages.

#### Reproducible counterexamples, no retuning

- 100 ms, club, seed 6, stage 6: both win, but 20.0 → 23.1 seconds; incoming attempts 6 → 10; living stun expiries/recovery events 0 → 2; minimum HP 832 → 791.4. Final RNG changes. This is a real slower outcome, not a rounding-only display change.
- 100 ms, club, seed 87, stage 16, initial RNG 687563842: baseline wins in 107.2 seconds (minimum HP 52.8); candidate loses at 102.9 seconds (minimum HP 0).
- 250 ms pump, axe, seed 55, stage 14, initial RNG 3633185766: baseline wins in 59.95 seconds (minimum HP 210.46); candidate loses at 61.2 seconds.
- 250 ms pump, club, seed 82, stage 15, initial RNG 1928178836: baseline wins in 94.6 seconds (minimum HP 229.25); candidate loses at 91.95 seconds.
- Opposite direction: 250 ms pump, club, seed 26, stage 15: baseline loses at 90.35 seconds; candidate wins at 99.75 seconds, minimum HP 11.18. This terminal baseline failure does not establish any subsequent candidate survival.

The only production treatment is the clock patch; all these natural checks retain actual earned stats, status rules and RNG. Once ordering changes, RNG-dependent combat diverges, so do not attribute every later hit or loss to a single observed expiry. No damage, price or loot parameter was tuned to hide any counterexample.

## Limits and release boundary

- The default five-seed run is a fast regression subset, **not** the 100-seed measurement. Reproduce the full evidence with `CLOCK_SEEDS=100 node --test --test-reporter=tap tests/clock-balance.test.mjs`.
- This file reports source simulation only. Actual `createPump` execution with controlled timestamps is not browser throttling, OS suspend, background-tab, deployment, or user-computer verification.
- Candidate remains **SOURCE-ONLY**. The parent task’s HTTP check was denied; the related user request remains pending. This work made no HTTP/browser/site/external write or user-computer attempt and did not bypass the denial.
- Historical v0.8 `BLEED-GUIDE.md` / `COMMISSION-GUIDE.md` results are deliberately unchanged. These v0.8.1 clock measurements supplement them; they do not silently replace their versioned balance claims.
