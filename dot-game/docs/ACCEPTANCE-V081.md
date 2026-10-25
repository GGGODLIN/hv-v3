# v0.8.1 independent source acceptance

## Scope and status

This is source-level acceptance of a bounded numeric-clock correction, not
browser acceptance, permission to publish, or proof of global caller-partition
invariance. The one-nanosecond comparison window is this game's engineering
tolerance, not an original-HV timing claim. The actual scheduler remains the
existing at-most-0.1-second subdivision of each at-most-two-second accepted
input. No event-time scheduler or wall-clock/offline progress was introduced.

The verified own-v0.8 baseline is receipt `024`, commit
`1c0bbd3363c775e030124fb92fe295d4d6561184`. All 469 original tests passed before
the runtime change. After the numeric change, 425 passed and 44 failed: 43 tests
assumed old exact clocks/trajectories/signatures, and one paired pressure test
assumed outcomes that the corrected boundary changes. The treatment of each
exception is explained below; no expected digest was regenerated.

Browser/HTTP/publication checks are **not performed by this QA task**. The
inherited candidate-HTTP approval gate remains unresolved; see `STATUS.md` for
the parent task's exact denied/pending action. Local Node tests do not establish
browser timing, OS suspend, rendering, save persistence, or deployment identity.

## Commands and current evidence

```sh
node --test tests/v081-acceptance.test.mjs
node --test tests/clock-boundaries.test.mjs
node --test tests/*.test.mjs
```

Independent acceptance contains **22 tests**. The implementation's focused
clock suite adds **19 tests**. The aggregate includes current gameplay/balance
and historical-provenance tests; a passing aggregate is not a claim that all
old trajectories still describe the new runtime. Final aggregate count is
recorded below from the final-source rerun.

### Independently reproduced defects and corrected boundaries

| Controlled input | Frozen v0.8 observation | v0.8.1 assertion |
| --- | --- | --- |
| Real `createPump`, 84 observations of 250 ms | 19 hero actions; `_clock=1.0499999999999998`; 20 ticks | 20 actions and 20 ticks at 21 seconds; no duplicate credit at the same timestamp |
| 21 advances of 0.05 s | 1 hero action, 0 ticks; TU `99.99999999999997` | 1 action and 1 tick |
| 60 advances of 0.05 s from a 3 s rest | Still resting at `2.2898349882893854e-15` s remaining | Fresh fight starts, with no combat action/time credited during rest |

Current assertions also cover exact 2.1 s and 21 s player/TU boundaries and the
1.9 s enemy boundary. Meaningfully below means one microsecond below each
boundary: player, TU, enemy and rest must all remain not due. The subsequent
microsecond pays exactly the appropriate transition. Within the explicit 1 ns
window, a comparison may be early; the raw clock must retain the negative debt.

### Conservation and bounded input

- 20,000 calls of `1.05 - 1e-10` seconds produce **19,999**, not 20,000, player
  actions and ticks. 20,000 calls of `1.9 - 1e-10` produce **19,999** enemy
  actions. Each total is two microseconds short; per-action tolerance cannot
  silently accumulate free time.
- Positive subnormal and tiny inputs remain processed, not rounded away.
  10,000 calls of `1e-12` retain their `1e-8` total. Zero, negative, nonnumeric
  and nonfinite inputs leave even already-due state completely untouched.
- 210,000 calls of 0.05 s reach exactly 10,000 ticks over 10,500 simulated
  seconds. A second independent horizon, 840,000 calls of 0.25 s, reaches
  exactly 200,000 actions/ticks and 20,000,000 TU over 210,000 simulated seconds
  (**58 h 20 m**), with exactly 110,526 enemy actions. This is fast simulated
  time, not a real-time browser endurance observation or an unbounded guarantee.
- `advance(1e9)` is identical to `advance(2)`. The unchanged pump accepts the
  exact 5-second gap only at its 2-second cap; a gap over 5 seconds is discarded.
  Inactive intervals, duplicate timestamps and reset time are not banked.
- Rest still discards its old crossing-substep overshoot. Its newly tolerant
  endpoint may occur at most one nanosecond early; this is explicitly not a
  promise of exact conservation across phase boundaries.

### Status and terminal ordering

At an exactly accumulated seventh tick, the tests independently establish:

1. Old bleed pays its final pulse and PA/stun expire.
2. Earned recovery acts before the player; expired PA cannot still reduce the
   direct attack's mitigation.
3. The recovered enemy cannot also take an ordinary attack in that player-turn
   interval; an unaffected neighbor remains eligible in the focused suite.
4. Fatal recovery prevents the due player heal and attack.
5. A lethal old-wave pulse rewards each old identity once, transitions once,
   and cannot damage or immediately act upon replacement-wave enemies on that
   terminal substep.
6. A final boss bleed kill produces the independently calculated ordinary drop
   and final LCG state exactly once, and suppresses due recovery/player/enemy
   combat. Later rest time repeats no rewards.

## Unchanged core and save contract

The independent guard hashes **every engine byte outside `advance()`**, not a
newly selected subset of unchanged functions. Thus raw attack arithmetic,
LCG implementation, proc rules, status settlement, enemy factory, XP/reward
formulas, item/commission actions, and the strict validator are all protected.
Whole `loot.js` and `session.js` are frozen as well. The UI version header is
intentionally outside this guard.

| Verified v0.8 bytes | SHA-256 |
| --- | --- |
| Engine before `export function advance(s, seconds) {` | `d0e87b4314fc11520cb0d9d22377194909a0f6ba5e0ade27a6817ca149f69d96` |
| Engine from `function refillPending(s)` onward | `d56ef0bc3c189055643c6b817ca36f822116afb085333904df06cbdea87c27ca` |
| Whole `loot.js` | `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc` |
| Whole `session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |

The lazy `_tuCompensation` is runtime bookkeeping. It follows the existing
global-TU lifetime through retreat/start and is discarded by validated loading.
It is not a new durable item field or accepted import capability. Tests cover
malformed/oversized carry, bounded injected carry that would rewind time,
unchanged restored keys/inventory/gold, and safe-town load with zero clocks.
The old complete loot/RNG fingerprints, 1,500 commission price/stat cases,
strict-item-schema tests, and raw combat tests still exercise current code.

## Historical fixtures: retained, executable, not newly blessed

`tests/fixtures/v0.8/engine.js` and `loot.js` are exact baseline copies; see their
`PROVENANCE.md`. No import-path edit was needed. Their whole-file hashes are
checked independently. The browser never imports these test fixtures.

| Existing tests moved to explicitly historical execution | Test count | Reason |
| --- | ---: | --- |
| `v02`, `v03`, `v04` first-clear signature tests | 3 | Old exact 31.6 s/seed/item signatures depend on delayed boundaries |
| `enemy-roles` early-stage full-state digest test | 1 | 18 embedded full-state hashes include old clocks and runtime shape |
| `v05` active non-axe per-frame trajectory tests | 18 | Every frame includes clocks, states, RNG and event interleaving |
| `v06` active non-axe OFF per-frame trajectory tests | 21 | Same full-state constraint across stage/strategy combinations |
| **Total re-scoped existing tests** | **43** | All old expected values stay verbatim; none skipped or regenerated |

The six/seven already archived pre-bleed axe fixture rows remain unchanged.
The old pressure/counterexample outcomes are retained in **one additional
historical test**, while the original paired-pressure test continues on current
code with honest mechanism assertions and the same seed/stats. Every other
pre-existing current-runtime test remains current, including the separate
defense-5 club fixture whose old 43.7 s/45.2 s measurements still pass unchanged.

### Pressure evidence without replacement-seed selection

All rows below use the original seed 42, fixed starter stats, and original
synthetic fixture. These are not shipped-stage performance promises. The
first two rows have zero mitigation, HP 2,000, attack 50 and no avoidance.
The third uses the old HP 3,000, attack 40, evade/parry 0.2 club fixture.

| Treatment | Frozen v0.8 | Corrected v0.8.1 |
| --- | --- | --- |
| No proc | Defeat 43.7 s; 1,060 incoming; 23 attempts | Win 43.1 s; 1,004 incoming; 22 attempts |
| Club | Win 43.1 s; 542 incoming; 11 attempts; 7 recoveries | Same bounded result; 7 recoveries paid |
| Old losing club counterexample | Defeat 74.1 s; 1,075 incoming; 26 attempts | Win 76.7 s; 984 incoming; 24 attempts |

The patch therefore cannot claim the old forced win/loss split or that the old
counterexample still loses. Current same-seed club assertions establish less
incoming damage/attempts and actual paid recovery, not universal superiority.
Existing and new fatal-recovery tests independently establish that stun does
not grant invulnerability. No new seed or stronger fixture was substituted to
manufacture a replacement loss. Broader paired measurements are in
`CLOCK-BALANCE.md`; raw resolver/LCG equality does not imply unchanged RNG
assignment after an action moves to its corrected boundary.

## Final-source rerun

Final source rerun: **515/515 pass, 0 skipped, 0 failed**. This is the original
469 test cases (43 explicitly re-scoped to frozen historical execution), one
added historical pressure test, 22 independent acceptance tests, 19 focused
clock tests, and four paired clock-balance tests. The final tested runtime
`engine.js` SHA-256 is
`9ae2378a4818ab92d9e4813ca89e2bed5c4af7f5de5acee01e29575dfeacfa6a`.
Source acceptance remains separate from unresolved browser/publication gates.
