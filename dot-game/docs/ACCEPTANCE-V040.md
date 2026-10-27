# v0.40 source-only: observed event recovery

Base source: `c78833531c52b4f8e288b5409a6161cc0d63f3c5`. Latest browser-accepted recovery remains v0.36 `2a5354689165d7512d279327db8935c3bbef8570`; formal website remains `f192fec4eff401948d80156f941c01404816cbba`.

## Reproduced defect, not lost progress

A equips an item and observes transient event 1. B takes ownership using the actual ownership/BroadcastChannel controller, chooses the valid `assault` strategy through the select handler, and saves its canonical restored state. A receives/adopts it with `events=[]`, `_eventId=0`, but retains UI `seenEvents=['1']`. A takes ownership back and equips another item: the operation succeeds and produces a new event 1, yet its banner is suppressed. The same collision affects other newly generated event types using the common display path. Inventory and actual rewards are not lost.

Root also reproduced the existing defect in the real cloud browser on formal **v0.36**: A normally equipped `loot-42` armor and saw its banner; B opened the same stable URL, used Settings → 接手此分頁, changed to 猛攻; A took back and normally equipped `starter-armor`. The old loot-42 text remained hidden instead of showing the new equip. No state/ID/owner flags were injected. Root restored balanced strategy, closed B, exported/reloaded A. All original 45 held records and hero/RNG/equipment/inventory/progression/strategy remained exact; only transient `events`/`_eventId` differed. Lv12, gold1218, wins22, bag42 unchanged; no combat, sales or new items. Post-baseline export SHA-256: `12f7453f0120d366b671bd15a2472f3cc9ce12ca23b7c94cff65856b8ecd4b2c`. This proves the old defect, **not** real-browser validation of v0.40.

## Minimal correction

`resetEventObservation()` clears/reseeds observed event IDs only after successful validated state replacement in `refreshSavedState` or the storage handler. Existing successful import resetting remains unchanged. It is not called by generic `syncSelection`: same-object ownership changes must retain deduplication and cannot replay rewards. Invalid import/storage parsing cannot reset the current observation set. No engine, event-ID generator, save format, RNG, loot or economy changes.

## Independent source acceptance

`tests/event-observation-recovery.test.mjs` runs full production UI with simulated browser APIs: 7/7 pass on v0.40, while the same suite pointed to v0.39 yields 5 pass and exactly 2 expected failures (storage and refresh replacement). Coverage includes legal DOM strategy selection, both adoption paths, unchanged-state ownership loss, single-tab pagehide/pageshow reacquisition, invalid import/storage, successful import, and exactly-once subsequent rendering.

The older focused `v02-acceptance` refresh fragment needed the new real helper included in its VM context; the first aggregate run exposed this missing test dependency. The test now executes the actual helper and checks its observation reset, rather than stubbing it or weakening acquisition assertions. Historical art-only byte pins now normalize only the exact new helper and its two calls; old hash values remain unchanged. A new boundary test pins one helper, exactly two calls and no generic selection reset. The commission source assertion retains syncSelection and includes the new call. Aggregate rerun result is recorded in CHECKPOINT.json.

Additional audit: 1,089 synthetic bag0..120 × pending0..8 FIFO/readback/sale-refill cases passed; 84 existing pending/recovery tests, 26 save/session tests, and 72 comparison/selection tests passed (overlapping groups, not additive unique totals). No separate pending-loot or item-loss defect found. Synthetic near-capacity tests are not naturally earned full-inventory play evidence.

## Limits and publication

v0.40 has not received real-browser acceptance and is not published. v0.37/v0.38 inherited art remains browser-unaccepted. Existing Kenney publication-scope refusal is unresolved: zero website operations, no alternate route or retry, no attribution removal. Source backup only to bot/dot; no dot-archive, company data, user computer, schedule changes or new assets. Actual source backup/readback evidence is external to this source manifest to avoid a self-referential commit claim.
