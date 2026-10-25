# v0.8.1 numerical clock correction

## Scope and release status

This is a source-only candidate correction to `advance`, not a new scheduler or an accepted public release. The frozen v0.8 candidate and accepted public v0.7 remain separate. No browser, public HTTP, website publication, or device verification is established by these source tests.

Only the scheduler region changes at runtime. The attack resolver, weapon procs, enemy definitions, policy decisions, rewards, loot generator, item/save validators, and UI/session pump are unchanged. There is no new original-HV mechanic or coefficient claim.

## Reproduced defects in the frozen v0.8 engine

The measurements use this game's engine and an independently created nonlethal diagnostic encounter; they do not import a monster or alternate implementation.

- After 21 processed seconds, 420 calls of `.05` give **20** player actions, whereas 210 calls of `.1`, 84 calls of `.25`, and the actual `createPump` receiving eighty-four integer 250-ms timestamps give **19**. Both cases have 20 TU ticks. The missed player clock is `1.0499999999999998`, just below the intended `1.05` boundary.
- After exactly 1.05 seconds, 21 calls of `.05` give one player action but only **zero** ticks: `TU = 99.99999999999997`. After 42 seconds, that partition gives 40 actions but 39 ticks.
- A three-second intermission advanced in `.05` calls remains in intermission with `_rest = 2.2898349882893854e-15`.
- Raw TU addition accumulates error over a long online session. At 210,000 calls of `.05` (10,500 processed seconds), the frozen engine records `TU = 999999.9999980474`, or **9,999** ticks rather than 10,000. A small boundary comparison alone does not repair this long-session drift.
- `advance(1)` has a tiny positive final substep from binary subtraction. That can make its outcome differ from `.1` calls even at the same stated total. This correction does **not** rewrite or epsilon-filter the substep loop.

These are processed-time numerical defects, not evidence of offline earnings or real browser suspension behavior.

## Bounded equality contract

The comparison window is **one nanosecond of simulation time** (`1e-9` seconds):

1. Player and ordinary-enemy clocks are considered due within that window of 1.05 and 1.9 seconds respectively. The exact period is then subtracted from the actual clock. A tiny **negative residual remains debt**; it is not rounded or clamped to zero.
2. TU uses the equivalent window, `1e-9 / 1.05` in tick units. Only the derived integer-tick decision is snapped near the next integer. Raw accumulated TU is not rounded, snapped, or incremented by epsilon. Negative, nonfinite, and unsafe integer boundaries are not promoted into valid status ticks by this decision.
3. Intermission ends when its remaining countdown is at most `1e-9` seconds. It can therefore end at most one nanosecond early at a transition. The existing rule that discards surplus time inside the crossing substep is unchanged. Full time-budget conservation across arbitrarily many phase transitions is **not** claimed.
4. `battle.elapsed`, caller deltas, the internal `.1` maximum substep, two-second `advance` clamp, and remaining-time loop are untouched. No epsilon is added on each update. Genuine tiny positive deltas still accumulate; zero/invalid/negative deltas remain inert.

In particular, repeated almost-complete periods cannot earn a free action each time: 20,000 calls of `(1.05 - 1e-10)` retain their aggregate two-microsecond deficit and give **19,999**, not 20,000, player actions. This guards against the tempting but incorrect “snap the clock to its period, then reset it to zero” implementation.

## Long-session TU precision

TU is session-global: ordinary new expeditions and retreat do not reset it. Its additions now use compensated (Kahan) summation through one lazy internal scalar, `_tuCompensation`. That retains low-order addition error rather than widening the equality tolerance until it hides drift.

- A carry must be numeric, finite, and bounded by `Number.EPSILON * max(1, abs(TU))`; malformed or oversized values are ignored.
- Even a bounded injected carry cannot rewind observed TU. If it would do so, that update uses the ordinary positive TU increment instead.
- New carry is similarly checked for finite, bounded magnitude.
- Existing start/retreat retain the carry alongside global TU. Existing `validateSave` reconstructs a fresh safe camp state and does not restore this field, TU, or encounter status. There is no added accepted save-schema field or migration.

The 10,500-second focused test now reaches exactly `TU = 1000000` and 10,000 ticks. This is bounded numerical evidence, not a promise of arbitrary precision for unlimited session lengths, malformed state, or arbitrary sub-nanosecond caller schedules.

## Ordering and deliberately unchanged limits

Within each existing substep, the ordering remains:

1. Advance observed clocks and determine crossed TU boundaries.
2. Process prior bleed pulses and status expiry; settle deaths and terminal waves.
3. Deliver earned stun recovery immediately before a due player action.
4. Perform the player action if still alive and fighting.
5. Perform due ordinary enemy actions, with the existing per-enemy recovery coalescing rule.

A terminal bleed wave still stops all remaining actions on that boundary; a fatal recovery still interrupts the player. No action is sorted or moved to a newly introduced event queue. Corrected equality can make an action or status expiry occur one existing substep earlier than the buggy engine did; ensuing combat RNG use and outcomes can legitimately change. This is an explicit numerical correction, not a claim that every seeded trajectory remains the same.

The unchanged scheduler uses caller-dependent substep endpoints. Different caller partitions can still group nearby actions differently, and intermission still discards crossing-substep overshoot. Therefore **full combat partition invariance is not claimed**. The focused tests compare specific due counts and specified boundary ordering, not complete state equality across arbitrary partitions. A negative-contract test retains the existing distinction: with an enemy due in `.02` seconds and the player due in `.04`, one `.05` substep executes player then enemy, while two `.025` substeps execute enemy then player. Changing that priority would require a separate scheduler design, not numerical tolerance.

The actual `createPump` remains unchanged: observed medium gaps are bounded, sufficiently long gaps are discarded, disabled/duplicate observations do nothing, and rendering never advances gameplay. These source checks do not replace browser or OS-suspension QA.

## Verification and historical baselines

`tests/clock-boundaries.test.mjs` independently checks the real engine and real pump: the 1.05/2.1/21/42-second boundaries across specified caller patterns; actual 250-ms pump observations; 1.9-second enemy and three-second rest equality; meaningfully-below-threshold controls; zero/invalid and tiny-positive input; the unchanged two-second clamp; repeated player/enemy near-period debt; 10,500-second TU accumulation; unsafe carry; clock lifetime/load reset; and exact bleed → recovery → player → ordinary-enemy ordering including terminal bleed and fatal recovery interruption. A separate test explicitly preserves the coarse-partition ordering limitation.

Before modifying historical tests, an in-memory diagnostic application of this correction to the frozen 469-test suite passed **425** and failed **44**. Forty-three failures were historical exact timing/full-state signatures; one old controlled club-pressure fixture changed its expected non-club outcome from defeat to victory. These old results must remain attributed to the old clock, not silently overwritten with candidate hashes. Source-domain freezes and independent new-clock assertions are the appropriate guards for unchanged mechanics.

A bounded preliminary check of 100 ordinary stage-one starter seeds found all 100 still win under both `.1` and `.25` calls, with unchanged final RNG state and loot in every case. With `.1` calls, 63 clears become exactly `.1` seconds earlier and 37 are unchanged; with `.25` calls, 80 become `.05` or `.1` seconds earlier and 20 are unchanged. Seeds 1 and 42 change from 31.6 to 31.5 seconds with the same 30 attacks and loot. This limited starter evidence is not a universal buff claim; proc collisions and pressure fixtures can change more substantially. Wider candidate balance results must be reported separately, including losses and slower cases.
