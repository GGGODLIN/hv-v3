# v0.5 independent acceptance audit — candidate

Recorded 2026-10-25 17:13 UTC. Scope is this independently authored `dot-game/` only. The reviewer wrote only `tests/v05-acceptance.test.mjs` and this document, inspected the allowed independent v0.4/v0.5 source, and made no runtime edit, user-computer operation, remote write, or deployment. No excluded implementation, generated constants, monster dataset, artwork, or other author's proposal was read.

**Source/unit acceptance is not browser acceptance or publication.** Accepted v0.4 remains separate. This document does not promote the candidate or replace the release owner's source, browser, and public-byte checks.

## Result and reproducible scope

- The independent v0.5 file contains **40 passing checks**, including 24 frozen trajectory regressions. The aggregate suite at this audit checkpoint passes **262/262**, no failures/skips. All four runtime JavaScript files and the independent test file pass `node --check`.
- All **30 stages × four waves = 120 actual spawned waves, 180 enemies** match their preview: identity, order, names, boss flag, role, defense, general mitigation, evade, parry, and block. Actual HP, maximum HP, attack, and resist also match the prior formulas.
- All 24 early-game trajectories match accepted v0.4 **at every sampled state**, including RNG, rewards, combat statuses, events/logs, clocks, and resources. This is stronger than checking only completion time or final seed.
- No runtime defect was found in this independent pass. An initial failure in the new traversal fixture was a test bug: it reset already-dead enemies to one HP repeatedly. Restricting the fixture change to living enemies corrected it. No engine assertion was weakened, and no runtime workaround was made.

Commands, from `dot-game/`:

```sh
node --test tests/v05-acceptance.test.mjs
node --test tests/*.test.mjs
for f in src/*.js tests/v05-acceptance.test.mjs; do node --check "$f"; done
```

The engine frozen for this audit is SHA-256 `2afaaf2ce100607b76e3c3ac86f562ae1019001e40942fff7e9674079bfd83ee`. UI work can still require a final aggregate rerun; these results are not a hash of an eventual release package.

## Independent assertions

### Roles and route truthfulness

The tested role coefficients are **this game's explicit adaptation**, not original-HV monster classes or recovered original rates. Stages 1–2 retain baseline combat values. From stage 3, the designated armored archetype adds 18 defense with evade/parry `.01/.01`; the agile archetype subtracts three defense, floored at zero, with evade/parry `.10/.07`; other regular enemies retain the baseline `.025/.02`. Odd bosses use armored, even bosses agile. Block remains `.015` for ordinary enemies and `.06` for bosses.

An independent formula/name oracle checks every descriptor, rather than assuming matching preview and spawn means both are correct. Every stage from 3 contains both armored and agile opposition. Wave counts remain `1, 2, 2, 1`. Tests traverse the real scheduler with controlled one-HP kills **after** inspecting each untouched spawn. This validates spawning, not the ability of a starter character to clear all 30 stages. Genuine progression and build evidence are separate checks owned by the engine/balance work.

No live enemy owns a computed `mitigation` property. Changing an actual spawned enemy's `defense` to 0, 80, or 500 yields 0%, 80%, or capped 95% general mitigation immediately, with constant-die 100-attack damage of 100, 20, or 5 respectively. This prevents a preview-derived field from shadowing a real combat override. A legitimate explicit `mitigation: .3` still takes precedence, as the prior resolver contract requires.

### Pure, bounded helpers

`previewStage` produces detached four-wave descriptions; mutating a returned nested enemy, array, or route does not alter a later call or another caller's route. It accepts only finite numbers, floors and clamps within 1–30, and safely falls back for strings, objects, arrays, symbols, bigints, infinities, and `NaN`, without invoking caller coercion hooks.

The pure-helper check replaces `Math.random` with a throwing function. All previews and defense views still succeed; frozen enemy/status objects remain unchanged. Returned defense views are detached. Malformed inputs do not produce `NaN`; defensive rates retain the resolver's existing finite-value fallbacks, 0–1 avoidance caps, and 0–.95 general-mitigation cap. Read-only views do not clean up even expired/invalid status objects.

### Current defense, PA, stun, and recovery

- `baseMitigation` remains the actual current source-defense rate. `mitigation` reflects only valid active PA: at 80% base, 0/1/2/3 stacks display 80%/60%/40%/20%. Against 50% separate specific mitigation, constant-die physical damage is 10/20/30/40; Void bypasses that separate factor, yielding 20/40/60/80. Physical skills benefit from existing PA without adding a proc. Magic does not receive PA's physical benefit.
- `baseEvade` and `baseParry` remain role rates. Valid active stun makes their current values zero, but leaves both mitigation and block unchanged. Forced 100% block still blocks an actively stunned target.
- Recovery-pending is **not active stun**: evade/parry return while the owed action remains. Explicit low-level `defender.stunned` is represented consistently with the existing resolver API.
- Expired, malformed, excessive-duration, noninteger-expiry, dead/nonfinite-HP stun does not hide avoidance. Invalid ticks cannot create active PA or stun. Existing input objects are not modified by inspection.
- Role labels alone alter neither damage, proc eligibility, nor RNG count. All prior PA/stun eligibility, post-hit ordering, nonrefresh, recovery scheduling, critical guarantees, and negative-path tests remain passing.

### No hidden reward or proc retuning

Compared with accepted source `48376ae7876e51e5868f82a5d856db3b690cb65a`, the following are byte-identical and protected by independent SHA-256 assertions: the damage/proc resolver section; reward/drop/win functions; player/enemy action scheduler; item/save sanitizer; all of `loot.js`; and all of `session.js`. Fixed PA and club rules are separately asserted. Thus quality distributions, item rolls/scores, drop-rule probabilities, skill multipliers, and proc rules were not retuned for this slice.

Changed defense after stage 2 legitimately changes attack outcomes and subsequent RNG consumption. “Unchanged drop rules” is not a promise of identical stage-3+ loot in different combat runs.

## Accepted v0.4 early-game baseline

The actual read-only prior engine was verified against its inherited checkpoint: SHA-256 `1f0f9ca3289e6d73a1b1b64b6fd72a26b9c5e0abac494d3a157e56a3d3b7b618`. It was executed to capture 24 reference trajectories: stages 1 and 2, seeds 1/42/999, and same-stat weapon families `null`, axe, rapier, club. Those digests are embedded in the portable test file; the delivered tests do not depend on a sibling v0.4 directory or network access.

Each digest includes canonical JSON before departure, after departure, and after every `.1`-second update through the first win. Only newly added display metadata `roleId`/`roleLabel` is excluded; object key order is normalized. No damage, resource, timing, RNG, item, effect, log, or event field is stripped.

| Stage | Initial seed | No proc / axe | Rapier | Club |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1 | 31.6 s | 30.5 s | 30.5 s |
| 1 | 42 | 31.6 s | 29.5 s | 30.5 s |
| 1 | 999 | 31.6 s | 31.6 s | 31.6 s |
| 2 | 1 | 40.0 s | 37.9 s | 37.9 s |
| 2 | 42 | 33.7 s | 36.8 s | 31.6 s |
| 2 | 999 | 37.9 s | 36.8 s | 36.8 s |

These are frozen regression signatures, **not a cross-family balance estimate**. Different proc families legitimately consume different RNG streams. The stage-2 seed-42 rapier time is slower than no-proc and is deliberately preserved, not adjusted to manufacture a benefit.

## Save-v3 compatibility and actual old-validator reproduction

The sanitizer/validator suffix remains byte-identical to v0.4: SHA-256 `158ebd12a17bd231a586667d5cb4333bb1d46ad9e25b0b7f17221049a9199064`. More importantly, the reviewer executed the **actual prior engine's validator**, not just a rewritten approximation, on four current live saves.

For each weapon family, a real first clear created inventory; the fixture then selected stage 3 with unlocked stage 12, gold 123, XP 42, sustain policy, automatic advancement, and one valid pending item. Current enemies received active PA/stun plus pending/recovery-turn fields. One untrusted item role field was also injected. Both validators returned deeply equal states, the old→current validator roundtrip was equal to direct current validation, and the original supplied JSON remained byte-for-byte unchanged. The families retained their exact identities; real inventory and pending loot, progression, strategy, and best times were preserved. Encounter state was safely reset to camp under the same pre-existing loading policy.

The portable acceptance test additionally checks ignored role-like root/hero/item metadata, repeated-validation idempotence, and preservation of durable progress. Role/stun/PA state may appear in a **raw live JSON export**; compatibility means it is ignored on validation, not that raw serialization suppresses it. Enemies, clocks, current HP/MP, events, and other encounter state are rebuilt as before. No offline gains or resumed combat are inferred.

There is no new durable schema field requiring a fork. Keep stable and candidate-scoped `save-v3`, `writer-v3`, and `preferences-v3`. Source checks verify candidate v0.5 keys are disjoint from stable and preserve same-scope v2/v1 read-only fallback. Existing corruption/ownership/migration tests pass. Already-open v0.4 tabs retain old combat rules until refreshed; shared compatible keys do not hot-update old code.

## Release gates and remaining limits

- Rerun the aggregate suite and syntax checks after final edits, then verify the exact source/checkpoint manifest. No remote source, CI, deployment, public bytes, or publication was established by this reviewer.
- The release owner must observe the actual four-wave preview, changing stages, combat base/current percentages, PA and stun/recovery feedback, retained block, gear-rule explanation, and stable/candidate isolation in its authorized browser workflow. Unit/source tests are not visual or browser acceptance.
- No physical mobile device, OS suspension, or background-throttling guarantee is established here. Prior browser limitations and the no-offline-rewards policy remain unchanged.
- These deterministic role and formula tests do not prove universal difficulty balance or that every proc weapon is optimal. Build guidance must label equal-stat controlled fixtures, actual progression evidence, RNG differences, and surviving negative cases accurately.

No denied, pending-permission, or uncertain external action occurred in this audit. Browser/release gates are **not run by this reviewer**, rather than claimed passed or blocked.
