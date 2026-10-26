# v0.9 independent source acceptance: expedition reports

## Status and boundary

Source-level acceptance only. v0.8.1 remains the accepted playable release;
v0.9 is a separate development candidate. This review made no browser,
network, deployment, commit, or user-computer changes. The parent's final
aggregate and any later release evidence belong in `STATUS.md`, not inferred
from these focused checks.

Reports are a convenience observation of this independent game's existing
combat, not another original-HV mechanic or a gear-ranking formula. No new
combat, loot, price, resource, RNG or scheduling rules are authorized here.

## Baseline and method

The portable test-only `tests/fixtures/v0.8.1/` engine and loot modules were
copied byte-for-byte from the accepted own-source publication receipt
`034-v081-publication-receipt`. Its runtime originated at source commit
`ff6bb071240deef5d86c34e80a1d514daeb9762d`. Fixture hashes:

- Engine: `9ae2378a4818ab92d9e4813ca89e2bed5c4af7f5de5acee01e29575dfeacfa6a`
- Loot: `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc`

The baseline is not reconstructed by stripping candidate hooks. No other
author's implementation or proposal supplies these fixtures. The test also
keeps current loot and session bytes pinned to their accepted hashes.

The independent observer runs against the frozen baseline. Transparent
accessors record actual enemy and hero HP writes; emitted events distinguish
basic, skill and bleed damage, incoming strikes, and successful proc
applications. It records contemporaneous maximum HP, start context, final
level, processed combat time and action counters. It does not use the new
report code or repeat its internal helper calls. Instrumentation is removed
after each expedition.

Candidate and baseline hash the **complete serialized gameplay state** after
each action and simulation input, then compare both trajectory fingerprints
and terminal states. Equipment, enemy statuses, event/log history, clocks,
resources, rewards, inventory and RNG seed all participate. The baseline's
transparent observer therefore cannot silently manufacture a successful
comparison by changing the observed gameplay.

## Focused evidence

`node --test tests/v09-acceptance.test.mjs` passed **9 tests**.

The fixed natural cohort is seeds 1–20, alternating 0.1- and 0.25-second
inputs. It earns levels, equipment and credits through ordinary stage-1
expeditions, purchases one real commission, equips it manually, then attempts
stages 2–8 and a timed retreat. Families rotate axe/rapier/club; post-purchase
tactics rotate balanced/assault/sustain. Camp equipment uses the existing flat
score as a deterministic test policy, not a claimed optimal build. There are
no injected items, gold, levels or combat-stat edits in this natural cohort.

Observed result:

- **326 expeditions**, **36,591 simulation inputs**, and **20 matching full
  trajectory fingerprints**; every completed report matched the independent
  baseline measurements.
- Commission access: 7 axe, 7 rapier, 6 club routes.
- Naturally observed cumulative bleed HP removal: 7,325; stun applications:
  197; PA applications/refreshes: 93. These are coverage totals, not balance,
  causal benefit or weapon-strength estimates.
- All completed natural challenges won in this bounded cohort; **zero natural
  defeats** were observed. This is not a universal survival claim. Defeat
  correctness is established separately by the fatal-recovery fixture.

The adversarial checks establish:

1. Start context is captured once, remains detached from later live-object
   changes, and history remains newest-first with at most two reports.
2. Mutating returned arrays or any nested metric/context object does not alter
   stored history or gameplay. Completed snapshots survive later starts.
3. Active repeated starts and capacity/pending-loot refusals cannot reset,
   fabricate or evict reports. A new successful start resets its counters.
4. Basic and skill overkill count only the target's actual remaining HP,
   including a fractional 0.375-HP target, not the uncapped event damage.
5. A final bleed pulse removes only the final 3 HP, wins exactly once, pays
   the same rewards/RNG as the accepted baseline and does not execute queued
   recovery, player or ordinary enemy actions.
6. Fatal stun recovery records only the remaining 0.625 HP as incoming loss,
   reaches 0% minimum life, prevents the queued player heal/attack and settles
   one defeat. Subsequent retreat does not replace it with a retreat report.
7. Win/intermission, defeat, camp and repeated retreat cannot duplicate a
   completed report or rewards. History is absent after cloning, JSON reload,
   validation, forged report-field imports or creation of another game.

The two modified historical source-freeze assertions also passed their focused
name-filtered run. Only the v0.5 `enemyAttack` body and the v0.8.1 historical
before/after-`advance` engine regions now read the exact frozen v0.8.1 fixture.
**All previous digests are unchanged.** Other unchanged source guards and all
behavioral tests still target the current runtime. This is a transparent
historical-boundary adjustment, not a new golden generated from the candidate.

## UI review and interpretation limits

Source review found that `actions.attacks` includes skill turns. Calling that
number “basic attacks” overcounts the displayed basic category. The UI owner
corrected it to total attacks including the skill count, and the help text
clarifies that heals/potions are not additional turns. Minimum-HP copy was
also corrected to observation-time maximum HP, because a wave's existing
post-level-up HP cap can reduce the ratio without an enemy hit. The UI owner
reported all 14 focused report-UI tests passing after these corrections.
That suite verifies rendering, pin lifecycle and import flows; these are
source/VM checks, not browser or mobile acceptance.

Damage categories are actual HP removal; incoming HP loss is cumulative and
is not reduced by healing. Minimum-life percentage is not calculated from
starting maximum HP. Proc counters count successful applications/refreshes,
not stack count, active ticks, hit rate, PA's extra damage, or damage prevented
by stun. Processed combat time excludes intermission and is not wall time or
DPS. A retreat is an incomplete expedition and cannot be compared to a clear
as though both completed the same route.

The optional manual comparison pin is local presentation state. It does not
turn two uncontrolled runs into an experiment: different stage, levels,
equipment, tactic, random state, healing and rewards remain confounders. No
claim of weapon balance, universal improvement, offline credit, browser
timing, persistence of reports, deployment identity or current-server HV
equivalence follows from this acceptance.
