# v0.24 Item World independent audit

Status: **24/24 focused tests and 1,504/1,504 full-repository tests passed**, zero skipped. Last run 2026-10-26 UTC; runtime, old helpers and UI were declared frozen by parent before the final independent aggregate run.

## Scope and authority

- Auditor wrote only `tests/item-world-audit.test.mjs` and this evidence note; no runtime, existing test, documentation, or remote edits.
- Current approved slice: save v3; world seeds 0–1,000,000,000; +1 per normal win without new RNG/log/event; Fair/Average/Superior bound axe/rapier/club IW0→IW1; fixed local strength stage 5, five rounds, final boss only.
- Earlier draft assumptions (Superior-only and ceil(entryLevel/3)) were explicitly replaced by parent before final assertions.
- Engine tests are not browser evidence. Focused fixtures are identified as synthetic; only the normal parity replay and earned cohort claim unmodified gameplay acquisition.

## Reproducible command

`node --test tests/item-world-audit.test.mjs`

Exit code: 0.

## Evidence

### Ordinary-play parity

The exact accepted v0.23 publication source is hash-pinned under `tests/fixtures/v0.23`. Three seeds (1, 42, 77), 12 expeditions each: **36 normal wins**, **2325 paired advancement pulses**. Entire live state and detached reports compare at each step, including RNG, combat timing, items/stats, XP, credits, fragments, IDs, events and logs. The only projection exclusions are root `version` and root `worldSeeds`; no item metadata is hidden. Seed cap and repeated settlement also preserve exact ordinary behavior.

### Strict data/transaction gates

- Actual v3 exports reject in frozen v0.23; v1 migrates both resources to zero, v2 preserves fragments and introduces zero seeds. v1/v2 reject world-seed or IW metadata rather than discarding it.
- New currency range/type/missing fields and IW rank/version/extra fields fail closed. Coherent earlier-level caches rescale; inconsistent caches, powers, anchors, unknown stats/items and malformed ranks reject without input repair.
- Accessor checks never execute getters on currency, hero, item, IW rank, source anchor, pending data, quote fields, or full-entry graph. Sparse/inherited/nonenumerable/symbol/foreign-prototype metadata rejects; ordinary cross-realm JSON works.
- Every quote field is required; changes/extras/partial quotes reject silently. Hero/build/ownership/resources/stage/seed/clocks/IDs/strategy/optional settings changes invalidate consent. Immutable graph/slot destinations reject before debit.

### Combat, rewards and permanence

- Five rounds verified as 1,2,2,2,1 actors, boss only round 5. Seven forced nonboss drops survive five free backpack slots plus two pending slots without truncation; all IDs remain unique.
- Each final lethal route (basic, bleed, counter, stun-recovery counter) settles exactly once and stops the captured old action batch. Normal stage/unlock/wins/clear count/best times/fragments/autoAdvance are preserved.
- Full trial kill rewards at fixed stage 5 are 28 credits and 147 XP; no ordinary completion drop/XP/credits/fragments/seeds.
- Success updates the exact target ID in its existing equipped/backpack location without auto-equip. Retreat, failure and reload keep spent seed/earned kills/resources but no IW upgrade; all return camp without automatic repetition.
- All seven stat dimensions derive from the immutable absolute source anchor, with attack ×1.02 and others ×1.01 before final rounding/caps. Missing historical parry remains absent. Repeated scaling equals direct level-500 scaling.
- Prospective level-500 score overflow rejects before spending. Permanent bound collection limit stays 116 including pending, and over-cap imports reject. Combat level-up synchronizes equipped/backpack/pending IW1 items; presets/reload preserve identity/anchor; all disposal routes protect the item.

### Naturally earned trials (not browser-earned)

Each of three fresh seeded runs earns ten ordinary wins, 100 fragments, ten world seeds and commission funds through combat. From each earned camp save, six replay branches use public commission, ability, bind and entry actions (three families × target equipped/backpack). No resources, levels, HP, gear, combat stats or RNG are injected or edited. Every seeded outcome is retained; no rerolls/tuning.

**18/18 trial wins** at entry level 9. This small deterministic cohort establishes reachability and identity behavior, not a general balance or difficulty guarantee.

| Seed | Family | Target location | Outcome | Seconds | HP lost | Minimum HP % |
|---:|---|---|---|---:|---:|---:|
| 1 | axe | backpack | win | 24.2 | 400 | 84.82 |
| 1 | axe | equipped | win | 21 | 296 | 88.76 |
| 1 | rapier | backpack | win | 24.2 | 400 | 84.82 |
| 1 | rapier | equipped | win | 26.25 | 352 | 86.94 |
| 1 | club | backpack | win | 24.2 | 400 | 84.82 |
| 1 | club | equipped | win | 23.1 | 263 | 88.76 |
| 42 | axe | backpack | win | 26.25 | 198 | 92.66 |
| 42 | axe | equipped | win | 26.25 | 321 | 87.13 |
| 42 | rapier | backpack | win | 26.25 | 198 | 92.66 |
| 42 | rapier | equipped | win | 24.2 | 329 | 87.81 |
| 42 | club | backpack | win | 26.25 | 198 | 92.66 |
| 42 | club | equipped | win | 23.1 | 246 | 91.76 |
| 77 | axe | backpack | win | 22.1 | 285 | 89.8 |
| 77 | axe | equipped | win | 18.95 | 342 | 89.21 |
| 77 | rapier | backpack | win | 22.1 | 285 | 89.8 |
| 77 | rapier | equipped | win | 24.2 | 298 | 88.59 |
| 77 | club | backpack | win | 22.1 | 285 | 89.8 |
| 77 | club | equipped | win | 21 | 309 | 88.9 |

## Accepted baseline hashes

- `tests/fixtures/v0.23/engine.js` — `8b89bc08955d504ab6dfe7b207db4f210053c4b0fd918b632c0b5db9220e77ae`
- `tests/fixtures/v0.23/loot.js` — `46ff81d7167069607f7d0d2efc2d0cb2a4bcc90fd306397e6a9e02507bab3884`

## Limits

No runtime defect was established in this pass. The existing capped-level XP load-clamping policy remains unchanged from v0.23; level-500 audit assertions cover equipment/stat/score overflow, not unbounded XP retention. Initial test failures were corrected fixture assumptions (score overflow threshold and selecting actual recovery-counter outcomes rather than fallback basic kills). The independent full-repository and frozen-source checks below passed. This note does not claim browser validation, remote publication verification, or broad balance sampling; those remain parent-owned.

## Final independent frozen-source verification

`npm test` exit code **0**. Runtime/UI/old-helper freeze was explicitly confirmed by parent before this run. **127 source/test/UI/package files** were hashed immediately before and after: all hashes unchanged.

```text
ℹ tests 1504
ℹ suites 0
ℹ pass 1504
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 29090.975804
```

Compared all **31 preexisting fixture/browser-fixture files** against the accepted v0.23 publication snapshot: byte-identical; no changed goldens.

Reviewed all 17 modified preexisting tests: only version/schema/UI text expectations, addition of root worldSeeds to existing v1 projections, and two minimal new-controller stubs/entry-notice regex. No previous behavioral assertions removed. Added independent helper checks prove root-only projection, nested future metadata preservation, forbidden own/inherited soulbound+itemWorld rejection and zero getter invocation.

- Final `src/engine.js`: `54dda1cf9982b4eab2336071d43cf398a1ad35fbe4397508f6fed5afedb5d974`
- Final `src/loot.js`: `8ca322c77ab265d88ebfdf1b64247e9170cbdd47fdb14f68b702903c368259cd`
- Final `src/ui.js`: `3b826e52a9f1c7ace9b41d2bee27cbe4ab920575a302fef804576b39083488a4`
- Final `index.html`: `388603688ba843f3a091c994043d1854ebe4569bb167ef5bf39200ecb0139504`
- Final `style.css`: `4ebbd5eafbbe61700f04981951e3bbf1924b2aac50bda28bd3515d01e865206e`
- Final `tests/helpers/soulbind-compat.mjs`: `91a080ce3908a8a3b2a453f2bbb71aaefd68745eb6dd5525e4ebd1b8b94713fa`
- Final `tests/item-world-audit.test.mjs`: `b0f72e42bfa1668300db554ff62edad81311b62e41b41f27e0c120f1285079ca`
