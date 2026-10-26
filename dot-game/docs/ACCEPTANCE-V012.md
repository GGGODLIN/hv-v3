# v0.12 independent selected-sale acceptance

Status: source-level acceptance passes. This document is not browser acceptance or a publication receipt. Parent aggregate tests, exact source backup, isolated browser QA and final root release evidence are recorded separately.

## Scope and verdict

The new manual batch is explicitly **selected by the player**, not inferred from quality, score or safe-sale dominance. It may intentionally include valuable or stronger gear. Existing item generation, sale-price arithmetic, ability progression, combat, RNG, automatic safe-sale rules and save schema remain unchanged. Locked, equipped and pending items cannot be selected. There is no implicit selection, bulk select-all, automatic recommendation, buyback or unlimited-storage claim.

The independent test file `tests/selected-sale-acceptance.test.mjs` passes **23/23** tests, including 90 naturally earned expeditions. The actual accepted v0.11 engine and loot bytes are shipped as an isolated, non-production compatibility fixture with fixed SHA-256 checks in `tests/fixtures/v0.11/PROVENANCE.md`; this is our own prior implementation, not excluded third-party code.

## Transaction contract verified independently

- Pure detached preview returns the exact requested ID order, full selected records, currently equipped comparisons, recomputed individual prices, aggregate price and resulting gold. Reading deeply frozen state succeeds and consumes no randomness.
- Explicit high-quality and stat-tradeoff items are eligible, even when absent from the conservative safe-sale preview. The interface must not call this a safe-downgrade batch.
- Confirmation binds selected item bytes/order, all equipped comparison records and balance. A changed lock, item/stat/name/description/price, missing item, new equipped comparison, changed gold or non-camp mode rejects the **entire** batch. Rejection changes nothing, including logs, clocks, RNG and items.
- Locked, equipped, pending, missing and duplicate IDs reject the whole selection. Cross-container duplicate IDs and unknown item/stat/roll metadata fail closed without stripping data. Malformed payloads and payload getters cannot authorize a sale or execute the getters.
- Confirmation sells only exact IDs once. New unselected inventory entries survive. Repeating the same confirmation or an overlapping older confirmation cannot duplicate credits or sell remaining items.
- Valid transactions match the previous engine's sequential individual sales byte-for-byte except for the new single batch log. Pending items retain the existing FIFO refill behavior; they are never implicitly added to the sale.
- Aggregate credit overflow above the existing `1e12` save cap rejects atomically; a transaction exactly reaching the cap survives normal validation. No clamp silently loses proceeds.
- Merely previewing leaves durable state unchanged. Successful batches retain the prior save shape and load identically with the v0.11 validator. Selection and consent are UI-only, not saved progress.

## Natural matched cohort

All levels, XP, items, credits and proficiency below were earned via public `createGame`, `act` and `advance` interfaces. This is **engine-earned**, not browser-earned, and no fixture resources or edited save were supplied to the cohort. The deterministic camp policy equips the highest existing score by slot, allocates the three rank-1 abilities at level 4, and farms up to stage 3. Score is only a repeatable test policy, not a new sale recommendation or a claim of universally optimal weapons.

Every action and advance before the new sale was deeply equal to the frozen accepted v0.11 engine, including RNG state. Three seeds each completed 30 expeditions, for **90 wins and 1,237 one-second simulation inputs**. All reached level 14.

| Seed | Inventory before → after | Selected | Selected above Average | Exact credits | Simulation inputs |
|---|---:|---:|---:|---:|---:|
| 29 | 48 → 36 | 12 | 6 | 659 | 414 |
| 42 | 49 → 37 | 12 | 7 | 916 | 412 |
| 77 | 42 → 30 | 12 | 7 | 1,396 | 411 |

For each earned profile, the exact first 12 unlocked inventory IDs were intentionally selected. The batch result equalled those same 12 previous-version individual sales except for the batch log. Equipped and unselected items, RNG and all progression were preserved; old and new save validators agreed. This demonstrates fewer repeated confirmation operations for the same deliberate choices, not better loot, faster fights or automatic detection of unwanted items.

## UI source review and limits

Reviewed exact-list modal, six-stat deltas and direction explanation, weapon-route warning, total/after-sale balance, explicit cancellation and irreversible-sale warning. Filtered-out selections remain explicitly counted and appear in the complete review. Ownership/import/navigation/lifecycle changes clear or invalidate transient intent; confirmation is consumed before dispatch and checks the observed outcome. Existing singleton and safe-sale controls remain separate.

One usability defect was identified during review: replacing inventory controls after each check lost keyboard focus. The fix restores focus to the same replacement checkbox only when that checkbox had focus, without stealing unrelated focus. Its focused regression is included in the 16 passing new full-UI VM tests. The independent reviewer re-ran that complete new UI file after the fix: 16/16 passed. The selected-count status also has an explicit polite live region. No remaining source defect was found.

VM/Node UI tests are not an actual browser, physical mobile, OS suspension, exhaustive cross-tab race or console-inspection claim. Actual candidate selection/cancel/filter/sale/persistence/readonly and narrow-layout cases must be separately exercised before publication. Manual test-item sales in browser QA must be clearly distinguished from conservative automatic disposal.

## Integrated final checks
Parent final aggregate:921/921 tests passed, zero failures/skips, and all four runtime JS syntax checks passed. The earlier development aggregate ran before UI harness completion and failed; only narrow current-version labels/harness dependencies and the independently identified checkbox-focus fix changed before this clean run. No old gameplay golden data was regenerated. Runtime freezes here before source backup and actual browser acceptance.
