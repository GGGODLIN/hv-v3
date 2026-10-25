# v0.4 independent acceptance audit — candidate

Recorded 2026-10-25 16:10 UTC. Scope: the independently authored `dot-game/` only. This audit used its own current documentation, code, and permitted original-HV research context. It used no excluded implementation, generated constants, monster datasets, artwork, other authors' single-player design, or user computer. **Source/unit acceptance is not browser acceptance, publication, or a promise of universal balance.** The accepted v0.3 release remains separate until the release owner completes its gates.

## Result

At this checkpoint, `node --test tests/*.test.mjs` passes **202/202**, with no failures or skips. There are **29 independent v0.4 checks** in `tests/v04-acceptance.test.mjs`; all four runtime JavaScript files pass `node --check`. The full suite includes retained PA, damage-order, loot-generation, tactics, persistence, ownership, and legacy migration tests.

One actual scheduling defect was caught and corrected before this result: recovery/ordinary-action coalescing originally depended on the caller's time partitions. The regression and correction are described below. No runtime code was edited by this reviewer; fixes were sent to the combat owner. Minimal edits to old acceptance tests replace the superseded “club has no implemented proc” fixture with an axe/no-proc fixture or remove club from that obsolete negative list. The rapier assertions, damage values, RNG counts, and frozen starter outcomes were not weakened.

## Rule boundary and independent coverage

The research-supported shape and uncertainties are recorded in `ORIGINAL-HV.md` and `COMBAT-DESIGN.md`. Fixed **25% / four simulation ticks**, positive surviving basic-hit eligibility, partially avoided-hit eligibility, and exact scheduling integration are explicitly chosen game adaptations, not recovered universal original-HV coefficients.

Independent tests establish:

- Noncritical `.249999` succeeds and `.25` fails. The triggering hit's damage and trace are unchanged. One or nine critical counts guarantee one stun without an additional proc RNG draw.
- Full avoidance, whiff, zero/floor-to-zero damage, lethal/dead/nonfinite-HP targets, magic, and skills do not apply stun or spend a proc roll. Partial positive evade/parry/block hits may apply it; an evade glance still cannot critical.
- Active stun disables evade and parry, **not block**, general mitigation, or specific mitigation. Constant-roll fixtures isolate these effects without confusing changed RNG streams with a damage bonus. PA may coexist and keeps its own timer and relative general-mitigation formula.
- Active stun neither stacks nor refreshes and consumes no proc RNG even on a critical. A pending earned recovery also cannot be replaced by a new proc before the scheduler delivers it.
- Tick four is inactive before that boundary's attack; malformed or unbounded status cannot produce active control. Valid late-observed expiry still queues exactly one recovery.
- A stunned enemy skips ordinary attack cadence without consuming its attack RNG. If expiry occurs between player turns, recovery waits rather than attacking immediately. Pending recovery also suppresses an ordinary action while waiting.
- Recovery runs before the next player action. It can kill the hero before healing, mana recovery, proficiency gain, or the player attack. A lethal recovery stops later enemies' queue and clears transient effects.
- Multiple expired enemies each recover once; unrelated enemies retain their ordinary action. A new stun after expiry cannot erase the already delivered recovery.
- Manual potion use, rejected strategy changes, repeated zero/invalid time, and other free actions do not consume a pending recovery. It is not an extra player turn.
- Dead targets do not recover or transfer status. Lethal damage clears stun, pending recovery, PA, and recovery scheduling state. New waves, retreat/restart, defeat recovery, and reload cannot retain encounter effects.
- Family identity alone changes no sheet stat, score, or resource. Frozen starter seeds **1, 42, and 999** retain their 31.6-second first clears, exact final RNG values, rewards, inventory counts, level/XP, and 30 player turns.
- Candidate paths retain isolated save, preference, and lock scopes. These source checks do not claim that actual browser takeover or rendering has been observed.

### Pure resolver versus live lifecycle

`resolveWeaponAttack` is a damage/proc API, not a battle scheduler. It cleans an expired stun before resolving damage but cannot infer an elapsed player-turn history or independently deliver a recovery action. `advance` observes tick transitions, queues the earned recovery, and executes it at the next player turn. Tests exercise both APIs separately; a direct stale-status wrapper call is **not** treated as evidence that live recovery was scheduled.

## Scheduling defect caught and corrected

The first implementation kept a `recovered` set for one internal `dt` substep. An enemy recovering in one substep and reaching ordinary cadence in the next could therefore attack twice, while the same elapsed time partitioned differently produced only one attack.

Reproduction: seed 42, starter stats, one controlled 100,000-HP / 10-attack / zero-avoidance target; simulation tick 14, TU 1400, elapsed 14.7 seconds, player clock zero, enemy clock `14.7 % 1.9`, active stun expiring at tick 18. Process another 4.5 seconds:

| Initial implementation | Enemy attempts | Hero HP | Final RNG |
| --- | ---: | ---: | ---: |
| Caller steps 0.1 or 2 seconds | 1 | 564 | 3562223158 |
| Caller steps 0.25 seconds | 2 | 560 | 1635343518 |

The corrected adaptation records the **upcoming player-turn index per recovering enemy**. Recovery replaces that enemy's ordinary attack within the same player-turn interval; ordinary attacks resume after the next player action. It does not reset the shared enemy clock or suppress other enemies. This precise coalescing choice is not established by the original research and is labeled as this game's integration policy.

The regression now yields identical one-recovery/one-attempt, HP 564, final RNG 3562223158 for caller steps **0.1, 0.25, 2, 0.05, 0.17 seconds** and two mixed lists (`.03,.17,.08,.42,.01` and `.19,.004,.201,.37,.052`). A separate test verifies that an ordinary action resumes in the next interval. This targeted invariant does **not** assert complete partition invariance of the pre-existing discretized engine for all encounters or clocks.

## Equal-stat controlled encounter evidence

All below use identical seed-42 level-one starter stats, balanced tactics, zero general/specific mitigation, zero block, and 0.1-second updates. The only treatment difference is `weaponFamily: null` versus `weaponFamily: 'club'` on the same weapon stat block. Targets are **synthetic final-wave test fixtures**, not changed shipped encounters or an imported monster dataset. “Attempts” includes hits, blocks, and misses, including recovery attacks. Damage is accumulated before end-of-clear healing; comparing post-clear HP would hide the cost.

| Fixture | Treatment | Result / simulated time | Enemy attempts | Incoming damage | Stuns / recoveries | MP spent |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| HP 1,000; attack 40; evade/parry 30% each | No proc | Win, 37.9 s | 19 | 716 | 0 / 0 | 36 |
| Same fixture | Club | Win, 28.4 s | 10 | 302 | 3 / 2 | 15 |
| HP 2,000; attack 50; no avoidance | No proc | Defeat, 43.7 s | 23 | 1,060 | 0 / 0 | 39 |
| Same fixture | Club | Win, 43.1 s | 11 | 542 | 7 / 7 | 36 |
| HP 3,000; attack 40; evade/parry 20% each | No proc | Defeat, 53.2 s | 28 | 1,060 | 0 / 0 | 45 |
| Same harder fixture | Club | Defeat, 74.1 s | 26 | 1,075 | 7 / 7 | 57 |

The first two pairs replay deterministically, and the harder club-loss case is retained as a regression against an invulnerability claim. Control is useful in these chosen fixtures; it is not a universal upgrade or win guarantee. The harder fixture lasts longer **but still loses and spends more MP**. A killed target need not receive recovery from its last stun, explaining three stuns/two recoveries in the first club row.

Club proc draws, skipped attacks, and bypassed avoidance legitimately change the RNG stream. These paired results are repeatable seeded outcomes, **not** all-dice-held-equal estimates of average balance. Separate constant-roll tests prove the unchanged triggering damage, disabled evade/parry, retained block, and unchanged PA math. Figures above were rerun after the scheduling correction; pre-fix survival/clear figures are superseded, not presented as current evidence.

## Save compatibility decision: retain v3 namespace

Unlike v0.2 → v0.3, this slice adds no new allowlisted durable item/progression fields. `weaponFamily` already supports club, rapier, axe, and explicit unknown `null`. Encounter enemies and timing are rebuilt at camp on validation; stun, pending recovery, and the per-enemy recovery-turn marker do not survive load/import/takeover.

For a bounded compatibility reproduction, the reviewer captured this game's pre-edit v0.3 engine before combat work. Its SHA-256 is `b58bc20f192e62877983aa2af2269c32fecd9303f9d79d7b9e878b98d86e8039`, matching the inherited checkpoint's `src/engine.js` entry. Its actual validator was executed in a Node VM, adapting only module import/export syntax and supplying the unchanged family resolver. Current `sanitizeItem` plus `validateSave` source remains **byte-identical** to that capture.

For each of club, rapier, axe, and explicit `null`, a current live battle save with gold 123, XP 42, sustain policy, and active/pending stun was passed through the captured v0.3 validator and then the current validator. It retained the exact identity/progress, discarded enemies, returned to camp, and produced the same serialized validated state as a direct current load. Explicit unknown identity did not turn into a name-inferred proc. The full ownership/legacy/current-corruption suite remains passing.

Therefore **reuse `save-v3`, `writer-v3`, and `preferences-v3`** within the same stable/candidate scope; no demonstrated data-correctness risk justifies a new namespace or another progress fork. Already-open v0.3 tabs retain their old gameplay until refreshed, but share the same serialized writer lock and compatible durable schema. Reusing the key does not magically hot-update their combat rules. Candidate v0.4 remains in its own URL-derived scope and never reads stable data. Future durable schema or identity changes require a new compatibility assessment rather than assuming this conclusion applies forever.

## Release-owner gates and limits

- Re-run the full suite and syntax checks against the final frozen files after any later edits; verify the exact source checkpoint and its complete manifest before candidate publication.
- Observe actual browser stun countdown, recovery-before-player feedback, retained block, item-rule/score explanations, and reduced-motion text. Exercise reload/import, repeated actions, two-tab ownership/takeover, and candidate/stable separation. This reviewer did not duplicate the parent's browser session.
- Browser behavior, remote commits/CI, public bytes, physical mobile, OS suspension, and the previously unresolved Page Visibility anomaly are **not established by this source audit**. Existing limitations remain; no offline rewards or universal background guarantee are claimed.
- No remote write, deployment, merge, or user-computer operation was performed by this audit. The candidate is not promoted by this document.
