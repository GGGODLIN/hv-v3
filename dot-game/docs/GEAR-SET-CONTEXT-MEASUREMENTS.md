# v0.29 gear-only context: earned source play

This is **source-engine play, not browser acceptance**. Engine preview inspection is not a UI Cancel test; the controller tests separately verify the visible retained-settings summary, dialog cancellation and stale consent. The website remains accepted v0.25 under the unchanged publication-tool block.

## Protocol fixed before execution

The portable [`scripts/gear-set-context-measurement.mjs`](../scripts/gear-set-context-measurement.mjs) declares seeds **29, 42, 77**, exactly **30 ordinary stage-1 attempts each**, a maximum of **1,000 one-second pulses per fight**, and no replacement seeds or extra runs for missing equipment. Every start requests the existing finish-then-camp action. Before each attempt, a measurement adapter equips the highest-scoring owned item in each slot (earlier/current item wins ties) and tries legal learn/slot actions for the three existing Rank-1 abilities. This is not an in-game recommendation of a universally best build.

No levels, stats, resources, items, unlocks or RNG are injected. No manual potions, sales, commissions, Soulbind, Item World, rank upgrades or enemy retuning are used. Defeats, start blocks, censored fights and absent families are retained if encountered.

After acquisition, the first naturally held axe/rapier/club in equipped-then-backpack order is saved into A/B/C with the current armor/accessory. The acquisition weapon is restored; an already-current preset remains an honest no-change result. Each settings branch starts from an independent copy of that same earned prepared save:

| Preset | Current strategy / targeting | Protection | Extra emergency supply | Slotted abilities |
|---|---|---|---|---|
| A / axe | Balanced / front | OFF | OFF | HP Tank, MP Tank, 1H Damage |
| B / rapier | Assault / caster | ON only if naturally unlocked | ON | HP Tank, 1H Damage |
| C / club | Sustain / weakest | OFF | ON retained, **not effective under Sustain** | HP Tank, MP Tank |

Only existing camp actions change these settings. All learned ranks are retained; an unslotted learned ability remains learned but does not appear in the actual start-build enabled list. Locked Protection would remain OFF rather than manufacturing an unlock. Higher-rank, locked and malformed-state boundaries belong to separately labeled tests, not this natural cohort.

## Observations

| Seed | Acquisition | Earned level / backpack | Acquisition pulses | Actual preset changes / already-current | Follow-on source expeditions |
|---|---|---|---:|---|---|
| 29 | 30 wins / 30 attempts | Lv13 / 51 items | 318 | 2 / 1 (axe already worn) | 3 wins / 29 pulses |
| 42 | 30 wins / 30 attempts | Lv13 / 47 items | 315 | 2 / 1 (axe already worn) | 3 wins / 26 pulses |
| 77 | 30 wins / 30 attempts | Lv13 / 53 items | 347 | 3 / 0 | 3 wins / 30 pulses |

- **90 acquisition wins / 980 pulses**, followed by **9 branch wins / 85 pulses**. All three weapon families were naturally available for every fixed seed. No defeat, censor, start block or missing-family case occurred; no extra run was added to create one.
- All nine branches kept full state and RNG byte-equivalent across the read-only engine preview. Seven valid applications changed only gear locations, existing camp HP/MP recovery and the existing application log; two already-current applications were complete no-ops.
- All held item identities and bytes, current strategy, targeting, Protection policy, emergency-supply choice, learned ranks and slotted allocation survived the gear-only application. No AP, currency, random draw or new item was consumed by preview/apply.
- All three earned profiles were naturally Lv13, so the requested Protection-ON branches were unlocked. All learned abilities were **Rank 1**; this measurement does not claim naturally earned Rank 2+ coverage.
- All nine actual start reports recorded the branch's exact strategy, policies, slotted ranks and equipped IDs. Sustain retained supply ON while the extra policy was inactive, preserving its established separate potion rule. Source expeditions did not rewrite those choices.

Different branches deliberately use different weapons, ability slots and policies. Their elapsed times are observations, **not evidence that the UI change improves combat speed, survival, or balance**, nor that any family/policy is universally better. Showing these retained settings is decision-time clarification, not saving or replaying a full build.

## Integrity and reproduction

The script asserts exact v0.28 runtime byte identity against source commit `e4121bb89be2b9e29bdbb262c83f16d0be993267` before running:

| File | SHA256 |
|---|---|
| `src/engine.js` | `020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d` |
| `src/loot.js` | `2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |

One compact receipt, [`measurements/gear-set-context-v029.json`](measurements/gear-set-context-v029.json), retains protocol, source fingerprints, earned-state and complete acquisition-trace hashes, actual branch configurations, exact preset items/stats, checks and start-report context. The trace is hashed rather than stored as thousands of redundant state snapshots. The reproducible script is the reconstruction path; no private browser save is required.

Receipt: **55,907 bytes**, SHA256 `fab6c54b2a59665b1bf9f1d3c59a9508df78b9ba1d3e1874bd20af19d85fefb6`.

From recovered `dot-game/`, use a new output path (the writer refuses to overwrite an existing receipt):

```sh
node scripts/gear-set-context-measurement.mjs --output /tmp/gear-set-context-rerun.json
cmp docs/measurements/gear-set-context-v029.json /tmp/gear-set-context-rerun.json
```

Unchanged engine/loot/session bytes prove no combat retune in this slice. They do not prove DOM behavior or browser interaction: those remain separately labeled acceptance work. The source measurement neither resolves nor retries the website publication block.
