# v0.28 source acceptance — pending-loot inspection and recovery

This is a **source-only candidate**, not browser acceptance or publication. The last accepted game remains v0.25. Source base is exact v0.27 commit `6cb7230093f0ddc99bdddd0c1d96efabf4aa8d4b`. The known website tool-review refusal remains unchanged; no candidate/site ref, CI trigger, alternate host, HTTP or browser operation was attempted.

## Actual gap and bounded change

Natural play can finish with the120-slot backpack full plus an existing pending drop. Previously the interface exposed only a count and departure refusal, not the item's identity/stats; a player had to choose something to sell before seeing what would be claimed. The ordinary victory log also incorrectly called a queued guaranteed drop delivered to the backpack.

A separate pending tray now shows exact original IDs and compares each item to the currently worn item. Its order is always FIFO, not backpack sort/filter order; pending items do not enter sale selection or count as usable backpack gear. Equip, lock, sale, Soulbind and Item World stay unavailable until claimed. Existing investment metadata and missing legacy stats are not invented or changed.

An explicit camp-only claim transfers the oldest items that fit into current free backpack slots. It uses the original objects; it creates no item, reward, event, heal, clock reset, RNG draw or currency change. Full/empty queues, repeated/stale clicks, battle/defeat and read-only ownership do not claim. Existing sale-triggered automatic refill is unchanged. This also gives already-valid imported saves with free slots and pending items a non-destructive recovery route; that imported-state case is **not** called a naturally earned deadlock.

Backpack120, pending validator8, departure reserve5 and permanent Soulbound cap116 remain unchanged. The permanent-item cap was independently found recoverable; it is not presented as a bug fixed by this work.

## Consent and interface boundaries

Pending inspection remains read-only under ownership loss and in battle. After a successful claim, inspected identity follows the same ID into the backpack, with a truthful hidden-filter notice if appropriate. No claim selects gear for sale, changes filters, auto-equips, sorts the queue or clears saved presets. Queue-only changes refresh the display. Import/reload and replaced/missing IDs do not silently point to another object.

The claim handler cancels an open visible selected-sale consent only after a successful move, retaining the user's selected IDs for a fresh review. It does not broaden the existing engine selected-sale quote, which binds chosen exact IDs/items, equipped comparison and gold; unrelated claimed items can never be silently included. Full-context Soulbind, Item World and preset quotes become stale through their existing inventory/pending bindings.

The UI tests execute the actual controller/session code with a simulated DOM, storage and ownership harness. They are not real rendering, real keyboard/device, mobile, OS sleep or broad cross-tab acceptance.

## Evidence and verification

Focused engine coverage includes FIFO original-reference conservation, partial capacity, mode/payload/read-only no-ops, accepted free-space imports,116 permanent items, natural encounter topology, deterministic synthetic maximum-drop boundaries and normal gameplay parity. Independent audit separately checks invested IW1 anchors, strict existing import guards, all protected disposal paths, stale quotes, old-reader format3 behavior and full-state non-storage invariance. Synthetic maximal-drop/large-collection fixtures are labeled and are not earned-play evidence.

Natural source simulations and exact prior-version comparison are recorded separately in [PENDING-LOOT-MEASUREMENTS.md](PENDING-LOOT-MEASUREMENTS.md), with a compact reproduction script/receipt rather than an oversized pulse archive. Fixed no-overflow outcomes remain in the result; no drop-rate or universal recovery-speed claim is made.

The frozen aggregate suite passes **1,672/1,672 tests**, with all four runtime syntax checks passing. New coverage is13 engine,14 controller/DOM and14 independent audit cases. All155 executable/test/script/index/style inputs remain unchanged during the final run, and all40 existing fixture files retain exact bytes. Independent natural reproduction yields the same16,072-byte measurement receipt:1,430 wins,12,267 pulses and17,178 exact prior-state/report comparisons. Complete stable input hashes and fixture preservation are recorded in [AUDIT-V028.md](AUDIT-V028.md) and `CHECKPOINT.json`. Source backup requires complete source/assets/tests/fixtures/scripts/recovery, small-blob/SHA-only-tree creation, non-force expected-HEAD update on personal `GGGODLIN/hv-v3` `bot/dot`, exact changed-file readback and unchanged Git-identity verification, preserving409 outside blobs/modes.

There is no new save field or namespace. Exact current-schema old readers retain the same item/queue data; this does not erase the pre-existing v0.27 preference fallback or Exquisite-IW1 incompatibility with older versions. Source proof cannot satisfy the still-blocked public/browser gate.
