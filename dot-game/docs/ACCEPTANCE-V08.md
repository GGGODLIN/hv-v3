# v0.8 historical axe bleed — independent source acceptance

Recorded **2026-10-25 20:07 UTC**, after the engine/UI owners froze their runtime changes. Scope: the independently authored `dot-game/` candidate, starting from verified v0.7 source checkpoint `e1b576ee2041bd2772f79587e859a80b5ab1f108` and the actual local frozen `022-v07-publication-receipt` baseline. The baseline engine SHA-256 is `b3104eca2e1bb43d67861c27f29c36d0e2c30e66260eba97158d0dfbff44737d`.

**Source/unit GO for the separate browser/release gate. This document is not browser acceptance, publication approval or evidence of deployment.** The reviewer edited no runtime source, used no user computer and performed no external mutation. No excluded authors’ implementation, constants, monsters, assets or single-player designs were read or reused.

## Results

| Check | Result |
| --- | --- |
| Independent `tests/v08-acceptance.test.mjs` | **35/35 pass** |
| Aggregate `tests/*.test.mjs` | **469/469 pass**, 32 test files |
| Failures / skips / cancellations / todos | **0 / 0 / 0 / 0** |
| `node --check` for all source JS and test modules | **Pass** |
| Retained pre-bleed non-axe trajectory digests and source freezes | **Pass, unchanged expected data** |

```sh
node --test tests/v08-acceptance.test.mjs
node --test tests/*.test.mjs
for f in src/*.js tests/*.test.mjs; do node --check "$f"; done
```

The 469-test aggregate includes engine-owner, UI-owner and balance-owner suites; it is not represented as 469 independently authored audit tests. The balance suite’s default run covers its five declared seeds. A separate 100-seed measurement, browser play and publication checks belong to their own evidence documents.

No runtime defect requiring a reviewer fix was found. Initial audit-fixture mismatches were corrected to the agreed event discriminator (`effect: 'bleed'`, versus status/proc type `bleeding`) and to the parent-authorized text-only loot change; they were not runtime regressions.

## Independently checked contract

1. **Pinned rules and exact arithmetic.** Frozen `{chance: .25, durationTicks: 7, maxStacks: 5, damageFractionPerStack: .08}`. Positive surviving physical basic axe hits alone can apply one stack. The snapshot is `floor(basic sheet attack * .08 * current stacks)`, floored after multiplying the whole stack count. The triggering direct hit is unchanged and wrapper HP subtraction remains the caller’s responsibility. Small positive direct hits may produce a zero snapshot: there is no hidden minimum DoT damage.
2. **Eligibility and RNG.** Strictly-less-than-25% noncritical boundary, one eligible noncritical proc draw, one guaranteed stack on eligible criticals including nine critical counts, and no additional critical proc draw. Partial evade/parry/block positive damage remains eligible. Whiff, full avoidance, zero damage, skills, magic, invalid/unknown/nonweapon identity and dead/lethal targets cannot proc or draw proc RNG. Existing wounds do not turn another family or a skill into a bleed application.
3. **Snapshot independence.** All **369 combinations** of 41 damage dice × three general-mitigation values × three specific-mitigation values preserve the same snapshot despite different critical direct-hit damage. Live combat separately confirms the actual sheet attack source. Later equipment/stat changes never recompute a stored wound. PA/stun presence and maximal avoidance/absorb/resist do not amplify, evade or critical a pulse.
4. **Stacking and shared refresh.** Stacks cap at five. Every successful reapplication, including at cap, replaces the entire wound snapshot and refreshes seven future global ticks. A weaker new source can replace a stronger old snapshot, even with zero. Failed procs change neither lifetime nor amount. There are not seven independent timers or seven pulses per stack.
5. **Tick ordering.** No damage at application/refresh time. Exactly one owed pulse at each future processed global tick; the seventh is paid before removal. The exact expiry boundary pays the old final pulse before a same-boundary fresh one-stack application. Pure status reads never cause damage, consume RNG, consult wall time, mutate input or retain aliases to returned objects.
6. **Bounded status.** `bleedStatus` is null or exactly `{stacks, ticksRemaining, damagePerTick}`. It accepts zero snapshot damage but rejects dead/nonfinite HP, expired/unbounded durations, malformed stack counts, noninteger/negative/unsafe damage and invalid ticks. Invalid status is cleaned during processing and cannot become valid merely because time advanced.
7. **Untyped deterministic pulses.** Stored integer damage bypasses all hit/avoidance/critical/mitigation mechanics and spends no combat RNG. Pulse events identify the enemy and actual HP damage, capped at remaining HP rather than reporting overkill. Event/log queues remain bounded. A zero snapshot expires without HP loss, reward or RNG use.
8. **Exactly-once death and transition.** Two simultaneously bleeding enemies each receive one death reward; the old-wave batch finishes before a single wave transition. A mixed boundary with a bleed kill followed by a direct kill also awards each identity once. Replacement enemies stay at full HP with no inherited wound and the ordinary enemy clock resets as before. Final bleed death suppresses due recovery/player/enemy actions, produces one win and retains canonical guaranteed-loot RNG, item and gold reward arithmetic. An extra advance in intermission cannot duplicate rewards.
9. **Cleanup and persistence.** Direct lethal damage, defeat, retreat/new expedition and load discard encounter wounds. Reload safely returns to camp with the ordinary axe family/progress intact and no enemy status or offline damage/reward. Durable keys, strict validator, sheet statistics, item scoring and the v3 save/session rules remain unchanged.
10. **Malformed-time robustness.** Large valid tick jumps replay at most seven already owed pulses. An invalid eight-tick wound at the previous observation is removed before it could age into validity. NaN, infinite, unsafe and negative clocks cause no wound damage/reward. A terminal old-wave jump cannot continue paying pulses into a new spawn. These are robustness checks, not a new offline-progress feature.
11. **Reproducible axe play.** Thirteen controlled starter-stat axe trajectories independently observe positive-to-zero enemy HP transitions and require exactly one kill count per identity, bounded queues and status-free terminal combat. Every trajectory replays to identical complete state, RNG and recorded bleed totals. Stages 1–5 in these fixtures actually exercise live bleed; high-stage failure is preserved rather than hidden.

The game has no implemented player counterattack action/flag. Counterattack-specific bleed rejection is therefore not claimed as a separately enforced or tested channel; that feature remains deferred.

### Clock limitation — explicitly not repaired

The pre-existing full engine is **not generally partition-invariant** for `.05` versus `.1` caller increments because of its established action cadence/floating-point boundary behavior. This release does not globally rewrite that scheduler or claim universal full-state equality across frame partitions.

The independent partition test suppresses ordinary actions and compares **bleed-only HP, pulses, seed and rewards at identical processed tick counts**, using `.02`, `.05`, `.1`, `.2`, `1` and `2` second calls. It also checks the existing two-second advance clamp. This establishes no duplicate/missing bleed pulses for the same observed ticks, not identical battle histories at nominally equal wall time. Browser throttling, OS suspension and physical devices remain separate validation questions.

## Preserved baseline and narrowly updated historical tests

The reviewer verified the frozen local v0.7 engine before runtime changes, independently derived unchanged-function fingerprints from it, and later compared the seven selected raw combat/reward function bodies directly byte for byte. No hash of changed candidate combat was substituted for an old guarantee.

Reviewer-owned edits to older tests are limited to:

- **`v05-acceptance.test.mjs`:** replace broad `resolveAttack`+wrapper and `playerTurn`→`act` freezes that necessarily contain the new mechanic with exact frozen-v0.7 `resolveAttack`, `enemyAttack`, `enemyTurn`, `recoverStunnedEnemies` and `usePotion` body hashes. Retain the existing `gainXp`→`win` XP/death-reward hash, existing session hash and complete ordinary-generator fingerprints. Six old axe trajectory expected hashes remain **explicitly archived verbatim**; all 18 null/rapier/club hashes remain active and unchanged.
- **`v06-acceptance.test.mjs`:** keep all seven old axe rows/expected hashes **explicitly archived verbatim**, separate from active expectations; retain all 21 non-axe full-state OFF hashes unchanged. No generator, sale-policy, sanitizer or family baseline is weakened.
- **`v03-acceptance.test.mjs`, `weapon-procs.test.mjs`, `club-stun.test.mjs`:** use genuinely neutral/unresolved family controls where old PA/stun isolation tests incorrectly assumed axe had no effect. Their full direct-resolution/RNG assertions remain intact. Weapon identity/migration assertions still include axe.
- **`role-balance.test.mjs`:** replace the obsolete “axe has no implemented proc” assertion with the same requirement used for other implemented families: real encounters must actually exercise the proc. Same-stat OFF controls, natural-route accessibility, survival and measured comparison checks remain.

The 13 new axe replay cases do **not** overwrite or re-bless the 13 archived historical hashes. They check the newly authorized mechanic independently. The old source hashes and historical axe rows remain legible historical evidence rather than being mislabeled current expectations.

The UI owner separately owns narrow version/header/trait updates in UI suites and `weapon-identity.test.mjs`; those are not reviewer edits. The parent authorized the only `loot.js` changes: current axe trait prose, exact legacy “unimplemented axe” suffix cleanup, and its explanatory comment. Therefore **the entire loot file is not byte-identical**. Instead the audit freezes the entire pre-trait prefix (catalog, endpoints, identity) and the suffix beginning at `const STAT_KEYS` (strict metadata handling, sale logic, item builders and generation), against the actual accepted v0.7 file. The existing complete-item/RNG baselines, including 3,000 ordinary generated items, also still pass.

| Unchanged accepted-v0.7 region | SHA-256 |
| --- | --- |
| `loot.js` prefix before `const WEAPON_TRAITS` | `1244fd797574884277636905a7cf8c5201ef39cbe424694ceaec0224bd1d3db3` |
| `loot.js` suffix from `const STAT_KEYS` | `44f86cb5e777bbf4c6561558eefe67dbce043877ff6cd39973425dcd9d025904` |
| Exact sanitizer/validator suffix | `8c3110caeccd48bb103800f615b5c50a90a02bdac0ee86b1742fd4acebc3475b` |
| Entire `session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |

## Honest controlled axe evidence

These are **starter-stat identity treatments**, not genuine generated-weapon comparisons, natural progression or a universal balance ranking. The baseline column was rerun with the actual frozen v0.7 engine. Both engines use `.1` advances. “Win” means reaching the normal win/intermission; “loss” means defeat.

| Stage / seed / strategy | Frozen v0.7 | v0.8 | v0.8 procs / pulses / bleed HP |
| --- | --- | --- | --- |
| 1 / 1 / balanced | Win 31.6s | Win 28.4s | 3 / 12 / 24 |
| 1 / 42 / balanced | Win 31.6s | Win 26.3s | 10 / 14 / 54 |
| 1 / 999 / balanced | Win 31.6s | Win 30.5s | 6 / 12 / 48 |
| 2 / 1 / balanced | Win 40.0s | Win 36.8s | 7 / 20 / 52 |
| 2 / 42 / balanced | Win 33.7s | **Win 36.8s** | 8 / 18 / 57 |
| 2 / 999 / balanced | Win 37.9s | Win 36.8s | 3 / 12 / 24 |
| 1 / 42 / assault | Win 28.4s | Win 25.3s | 2 / 3 / 6 |
| 2 / 999 / sustain | Win 37.9s | Win 36.8s | 3 / 12 / 24 |
| 3 / 42 / balanced | Win 49.4s | Win 45.2s | 8 / 24 / 96 |
| 4 / 999 / assault | Loss 41.1s | Loss 48.9s | 8 / 19 / 97 |
| 5 / 42 / sustain | Win 79.9s | Win 69.4s | 15 / 49 / 263 |
| 15 / 42 / balanced | Loss 19.0s | **Loss 15.2s** | 2 / 11 / 22 |
| 30 / 999 / balanced | Loss 1.9s | Loss 1.9s | 0 / 0 / 0 |

The extra eligible noncritical proc draws and changed deaths legitimately alter subsequent RNG consumption. One early route is slower and one high-stage defeat is earlier; a zero-successful-proc run can still have a different final RNG state because failed checks also consume draws. Nothing here promises a per-seed improvement, free damage from family metadata or axe dominance over rapier/club. Natural earned-loot and paid-commission results belong in `BLEED-GUIDE.md`.

## Audited frozen local source

These fingerprints identify the tested source, not a deployed release. Re-run affected checks after later code changes.

| File | SHA-256 |
| --- | --- |
| `src/engine.js` | `a9e3b4b8d8ec5ac6ecc8dcdbc72e3586e24e9ca7cce32b6ebb4de3e7346fe8b1` |
| `src/loot.js` | `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `src/ui.js` | `286ab634c15004240d9afffb47d144fef58d3f60b47896c9bb88e4e9376de04c` |
| `index.html` | `41a58167230cededafe3bf04ca3493f5e6c3752508aa7864fd47b90a6851d4b2` |
| `style.css` | `b7b3a9b869a0a9480a38dcc39007c38633ee3afea10539f13242a381f8d2abce` |
| `tests/v08-acceptance.test.mjs` | `3916cb2f51d561dfa3fc9c0fe3a2a332b710e4e377848f27dc3c66a9d0b08aa5` |

## Remaining release gates

- Actual browser play must verify stack/timer/damage readability, proc versus pulse distinction, lethal pulse/wave transition feedback, gear/commission descriptions, reduced-motion behavior, persistence and read-only ownership. Source/DOM harnesses are not browser rendering acceptance.
- No physical-mobile, universal background-progress, OS-suspend or offline-earnings claim follows from these tests. Inherited browser gaps are not retroactively closed.
- Exact source backup/readback, checkpoint manifest, candidate/public deployment and served-file verification are parent-owned and not established by this audit.

**Decision: source/unit GO, with no unresolved runtime blocker found; browser and publication remain separate gates.**
