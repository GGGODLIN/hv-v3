# v0.23 independent Soulbind acceptance

Status: **GO — final guarded-source acceptance**, 2026-10-26 18:42 UTC. The earlier 17:55 GO was reopened for the specific inventory-recovery finding below; that blocker is now fixed and independently regression-tested. This is **not** a publication or browser acceptance receipt.

Scope is the independent game's Soul Fragment / weapon Soulbind slice in `docs/SOULBIND-GUIDE.md`. Tests do not claim original HV Item World, forge, fusion, shop or drop-rate fidelity. Primary fact revisions are the guide's Items 67045 and Armory 67000; attack coefficient `50/3`, HP/defense factors, whole-prefix scaling, deterministic expedition rewards and conservative disposal rules are explicitly this game's adaptations.

## Independent evidence

Run `node --test tests/soulbind-acceptance.test.mjs` from `dot-game/`. The test has no external workspace dependency. Its immutable own-v0.22 reference is `tests/fixtures/v0.22/` with fixed SHA-256 checks:

- `engine.js`: `64eec991d435029aa08990837cb85df5feb5d240dcc3220c1751980fad2144d7`
- `loot.js`: `db841ff9d52a2a0d6e58458351ca3c3f59ec8c3bc8b4d7a8baf78c3bbc28f38d`

No baseline or golden digest was regenerated.

### Earned-play parity

Thirty normal, naturally won expeditions across seeds 29, 42 and 77 preserve every compared v0.22 transition. The projection removes **only** root `version` and `soulFragments`: all events, logs, event IDs, RNG state, combat state, clocks, existing XP/gold/loot, gear and complete reports remain compared exactly. The separate cap branch intentionally adds cap feedback and is tested independently.

| Seed | Wins | Character level | Fragments | Half-second simulation pulses | Held items |
| --- | ---: | ---: | ---: | ---: | ---: |
| 29 | 10 | 9 | 100 | 350 | 18 |
| 42 | 10 | 9 | 100 | 361 | 18 |
| 77 | 10 | 9 | 100 | 349 | 21 |

This is engine-earned evidence, not browser-earned evidence.

### Earned investment and growth

Seed 42 earns 100 fragments through ten ordinary wins. An actual owned Superior axe (`loot-2`, original level 4, original attack 70) is equipped and referenced by preset A, then explicitly bound for 100 at character level 9. Its attack becomes 87 and its anchor stays `{version:1, level:4, stats:{attack:70}}`. Binding does not heal, change RNG, allocate a replacement ID, reroll or automatically select equipment.

The source acceptance verifies reload, subsequent ordinary expeditions, level 9→10 growth from the original anchor, one additional fight using the grown weapon, unchanged unbound comparison, preset application, preset clearing, normal equipment swaps and every sale/unlock exclusion. This seed's first post-investment expedition does not level up; growth occurs on the second victory. It is not represented as a natural midfight level-up. A separate controlled actual-kill level-up proves equipped, inventory and pending bound items all synchronize before further combat, and coherent old caches synchronize on load.

### Safety and compatibility

- Eight quality costs across all three recognized weapon families; unknown, pending, nonweapon and higher-level items remain unavailable.
- Exact full-quote consent; field omission/tampering, stale fragments/hero/items/presets/abilities, repeated confirmation and insufficient balance are atomic no-ops.
- Frozen-input previews remain detached. Binding preserves HP, RNG, item counter, identity, affixes, rolls, preset references and location.
- Seven-stat absolute scaling, rounding, rate caps, parry-as-rating display, existing-stat subset and missing legacy parry are covered; stepwise growth equals direct growth.
- All seven dominance dimensions recognize valid bound keepers but never allow bound sale candidates. Damaged live lock flags do not make bound items disposable.
- Valid v1 migration awards zero fragments and preserves old progress; v1 readers reject v2 even before binding, so they cannot silently discard currency.
- Invalid versions/currency, malformed/unknown anchor fields, stale cached stats/power, unsupported identities and imported/nested getters fail closed without modifying input or invoking accessors.
- At both partial and full 1,000,000,000-fragment cap, ordinary wins still award existing loot/XP/gold and remain loadable; repeated observation does not settle rewards twice.

## Defect found during independent audit

A recognized, structurally legal imported level-1 weapon with attack 490,000 and power 980,000 could originally bind and load, but could not scale at level 2 within the existing power bound. A real kill then left the weapon behind at level 1 and made the resulting save unloadable. The independent regression requires rejecting future-unsafe anchors at bind/import, without modifying otherwise readable unbound legacy gear or inventing a scaling cap/reroll. The owner fix now validates the monotonic level-500 projection during both new binding and bound-item validation. The independent regression passes: unsafe future anchors are rejected before investment/import, while the old unbound record remains readable. No numerical clamp or generation change was introduced.

## Legacy-test maintenance review

Independently compared all pre-existing tests and fixture files against the accepted v0.22 snapshot. Twenty-six pre-existing test files changed; all prior fixture bytes and all ordered 64-hex oracle literals remain unchanged. The compatibility helper clones inert unbound test data, changes only root `version` and removes only root `soulFragments`. It rejects own/inherited bound metadata and accessors; version-chain tests explicitly verify actual frozen-v0.22 rejection of v2. Historical-envelope cases are identified as test-only, not a downgrade feature. The changed XP/death source-byte guard remains against the fixed accepted v0.22 fixture because current `gainXp` legitimately adds bound-item synchronization; the strict independent behavioral comparison above covers current ordinary progress.

## Late recovery finding and repair — 18:35–18:39 UTC

The permanent no-sale/no-unlock policy plus the existing 120-slot inventory and five-free-slot departure reserve previously permitted an irreversible deadlock at **117 unique bound weapons across all held locations**. Only one can be equipped, so at least 116 remain in inventory; `start` requires at most 115. Before the repair, all 117 could be bound with public preview/action calls using recognized generated Average weapons, and the resulting save validated successfully.

Independent pre-repair bounded fixture reproduction (not an earned 1,170-win simulation):

| Bound total | Minimum backpack occupancy | Fragment cost | Minimum normal wins funding that cost | Validates | Departure |
| --- | ---: | ---: | ---: | --- | --- |
| 116 | 115 | 11,600 | 1,160 | Yes | Starts battle |
| 117 | 116 | 11,700 | 1,170 | Yes | Refused, remains in town |

Equipping a different bound weapon, saving/applying/clearing presets A/B, attempted unlock, individual sale, common sale, safe sale and selected sale leave every bound weapon intact and cannot create the fifth free slot. Reload preserves the blocked state. The arithmetic is reachable in principle with ordinary rewards and retained eligible drops; this fixture proves the state/action failure, not that a long natural cohort was executed.

Root approved and the engine owner implemented a permanent bound-ownership cap of **116**, counting valid unique bound weapons across equipment, inventory and pending loot. The preview/action refuses a new binding that would exceed it, and import fails closed on over-cap bound inventories without changing input. Inventory capacity, departure reserve, permanent protection and existing items remain unchanged; no unbinding, salvage or automatic deletion was added. The preview explains the 116-item / five-free-slot limit.

Three added independent regression groups pass: 115→116 is allowed; the 117th and stale pre-cap consent refuse without debit; pending items count; over-cap imports in three pending layouts reject unchanged; unbound extras are retained. At 116, departure can still be temporarily blocked if an unbound weapon is equipped or ordinary spare items occupy inventory. **Wear a bound weapon and unlock/sell ordinary unbound spares to recover five free slots**; the test executes that recovery and starts a battle. A bound weapon is never secretly deleted or unlocked. Focused total is now **18/18**. This was the only reopened audit scope.

## Final guarded-source verification

- Independent post-freeze acceptance rerun: **18/18 passed**, 0 failures/skips, 1.023 s. Log: `/tmp/hv-v023-cap-independent-final.log`.
- Root guarded-source final aggregate log inspected: **1,433/1,433 passed**, 0 failures/skips, 31.487 s. Log: `/tmp/hv-v023-cap-final-tests.log`. The independent reviewer did not duplicate that entire aggregate run.
- Independently reran `node --check` for all four runtime JavaScript files: **4/4 passed**.
- Read-only final review found no remaining source blocker within this slice. Both the future-overflow and permanent-inventory recovery defects above are fixed and independently regression-tested. The final confirmation copy explicitly states the 116-total bound-weapon limit, and the guide identifies it as a storage-safety adaptation rather than original HV behavior.

Frozen runtime SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `src/engine.js` | `8b89bc08955d504ab6dfe7b207db4f210053c4b0fd918b632c0b5db9220e77ae` |
| `src/loot.js` | `46ff81d7167069607f7d0d2efc2d0cb2a4bcc90fd306397e6a9e02507bab3884` |
| `src/ui.js` | `9fceff024d0362cf77342b7382807a639ed4ea5942ceb452ee2e6915e9d7d3d1` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `index.html` | `a65264cc81557bfe3057c8eead0169a60ecd874f92d3111e3ba61db6e33f9eb0` |
| `style.css` | `f8a8865c94a34715c3e5c96591f640a800bc0f00eda7786b31f43a83ca01130d` |

Subsequent documentation/package-version metadata work does not alter this source verdict if these six runtime bytes remain unchanged. Any runtime change requires affected checks to be rerun.

## Limits and separate gates

Candidate-browser earned play, visual/keyboard/width checks, final publication and source/site readback remain separate root-owned gates. This source audit makes no browser, physical-mobile, background/suspend or publication claim. The evidence neither implements nor claims full original HV IW/forge/fusion behavior.
