# v0.23 independent Soulbind acceptance

Status: **GO — frozen-source acceptance**, 2026-10-26 17:55 UTC. This is **not** a publication or browser acceptance receipt. All production owners were frozen before the final independent rerun.

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

## Final frozen-source verification

- Independent acceptance rerun: **15/15 passed**, 0 failures/skips, 703 ms. Log: `/tmp/hv-v023-independent-final.log`.
- Root final aggregate log inspected: **1,426/1,426 passed**, 0 failures/skips, 32.846 s. Log: `/tmp/hv-v023-final-tests.log`. The independent reviewer did not duplicate that entire aggregate run.
- Independently reran `node --check` for all four runtime JavaScript files: **4/4 passed**.
- Read-only final review found no remaining source blocker within this slice. The future-overflow defect above is fixed and independently regression-tested.

Frozen runtime SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `src/engine.js` | `8bf72aac0142a8e33346582678aeb2ee366f6c66c81a84a21594e31ffd3a61bc` |
| `src/loot.js` | `46ff81d7167069607f7d0d2efc2d0cb2a4bcc90fd306397e6a9e02507bab3884` |
| `src/ui.js` | `9fceff024d0362cf77342b7382807a639ed4ea5942ceb452ee2e6915e9d7d3d1` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `index.html` | `7b0b7dfecbf15ad4e0bc18dd7c5520be0074ea90c92aae558931a209e9c183a6` |
| `style.css` | `f8a8865c94a34715c3e5c96591f640a800bc0f00eda7786b31f43a83ca01130d` |

Subsequent documentation/package-version metadata work does not alter this source verdict if these six runtime bytes remain unchanged. Any runtime change requires affected checks to be rerun.

## Limits and separate gates

Candidate-browser earned play, visual/keyboard/width checks, final publication and source/site readback remain separate root-owned gates. This source audit makes no browser, physical-mobile, background/suspend or publication claim. The evidence neither implements nor claims full original HV IW/forge/fusion behavior.
