# v0.7 actual browser acceptance

Date: 2026-10-25 19:39–19:43 UTC. Cloud Chrome, ordinary UI and DOM-visible readback only; no injected currency/items, hidden state inspection, localStorage scripting or test hooks. Source candidate `520b915747b18e6ee85519d48211b87368a19519` was fully backed up/read back (63 files,808665 bytes,62 manifest payloads) before staging. Isolated site candidate `b471d7ff356c6776cf988d858372b89f3c8e4dfb`, exact Pages run `40226863695` SUCCESS; six public HTTP bodies match source. Existing root v0.6 and all previous site blobs remained unchanged.

## Actual observations

1. Fresh Lv1: commission disabled before first win. Normal stage1 cleared in31.6 seconds, reachedLv2/gold76/two natural drops. After returning to camp, club preview showedLv2 Superior/R110/Slaughter, attack51/crit2.94%, cost464 and shortfall388. Confirmation disabled; cancel did not debit/deliver.
2. Exported naturally played public v0.6 profile through normal game download, imported through candidate file chooser and explicit confirmation. RetainedLv19, XP470/1192, gold8764, wins76,99 inventory, Lv4 balanced club, auto-saleOFF. Candidate/stable namespaces separate.
3. Original gear baseline: stage3 log14.7 seconds. Reimported the exact original export for the purchase branch, restoring starting RNG/progress/gear. No fabricated resources.
4. Lv19 club: attack97 versus47 (+50), crit2.97% versus7.16% (-4.19 percentage points), cost1036, balance8764→7728. Tradeoff/no-universal-upgrade warning visible. Cancel retained8764/99; reopening/confirm delivered one locked item, total100/gold7728; character attack remained187 and old club equipped. List switched to weapon filtering; rendered card count is not total inventory.
5. Reload retained7728/100/locked new club. Explicit equip: character attack187→237, crit18.8%→14.6%. Same restored starting progress/RNG, non-RNG purchase/equip, stage3 log10.6 seconds versus14.7 baseline. This is one actual tradeoff witness, not universal improvement or identical post-action RNG-path claim. Auto-loop began before retreat; final XP/gold include an extra kill, not a single-clear reward.
6. Opened rapier quote atgold7848, opened second candidate and explicitly transferred ownership. Old tab read-only, purchase modal closed/confirmation disabled. No rapier bought;7848/101 unchanged. Combined visibility/ownership interruption tested, not exact callback source in isolation.
7. New owner fresh axe quote:1164,7848→6684, attack117 versus97, loss2.97 crit points. At300% zoom: viewport393 CSSpx, document scrollWidth388, dialog358.33, dialog scroll/client widths351/351. Vertical scrolling reached actions without horizontal overflow. Real double-click confirm delivered one locked axe:101→102,gold6684, club still equipped. Restored100% zoom.
8. Reload/UI export preserved both commissions/locks. Postprocessing only those UI-downloaded JSON artifacts confirmed all102 original items (99 inventory+3 equipped) field-for-field unchanged across inventory/equipment; exactly two commissions and one natural accessory added. Club loot-152, natural accessory loot-153, axe loot-154. Final inventory102/gold6684; club equipped, axe locked in inventory. No new durable schema/purchase ledger.
9. Inspected candidate/owner console: no app-origin errors/warnings observed. Errors identified as chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js, not game runtime.

Test-export SHA256: initial `f1b67363cdaf011c96bbb13bce7824834a6cbe503e7e85a675837931f2cbea26`; final `e88d8706a5ce257ab19948bea6b524d6012142292d627a44d7ee93bf033f4598`. These are test progress, not personal-data backup. No browser profiles/credentials included.

## Boundaries
416 source tests/four syntax checks and separate100-seed actual-engine measurements supplement observations; not browser evidence. All1500 catalog/collision/replay/cap/schema cases automated, not exhaustively browser-tested. Inherited v0.6 schema-negative browser gap remains; denied internal-download route was not retried. Physical mobile, OS suspension and foreground-only visibility anomaly remain unresolved. No offline rewards. Narrow desktop zoom is not phone testing.

**Candidate desktop GO.** Root promotion, exact root CI/HTTP hashes and shared-save smoke remain separate gates; append evidence only after completion.

## Final public-root smoke — 2026-10-25 19:49 UTC
Accepted source `03e769c1beff762ff370b7539cc0c8cb8589678d` (64 files/814222 bytes/63 payloads) fully verified before site `bc706c9b87d4117aac6ddcf5436e1817bd1f9233`. Exact Pages40227611219 SUCCESS, six Git/HTTP hashes match. Only root runtime changed; all prior candidates/fixtures/other works preserved.

New root tab retainedLv19,XP470/1192,gold8764,wins76,inventory99, oldLv4 club and auto-saleOFF. Initially read-only; explicit takeover made oldv0.6 read-only. Quote/cancel/reload preserved values. Actual root purchase1036 delivered one locked club without equipping; explicit equip raised attack187→237 and stage3 log10.6 seconds. After auto-loop began and manual retreat/reload:Lv19,XP674/1192,gold7888,wins77,kills472,inventory102, newclub equipped, auto-saleOFF. No app-origin warnings/errors in inspected log. Closed old/candidate test tabs, retained newroot in safe camp. Final values include subsequent-loop kills, not just oneclear reward.

**Final bounded desktop release PASS**, with inherited limits above unchanged.
