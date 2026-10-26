# v0.11 bounded cloud-browser acceptance

Status: bounded desktop candidate acceptance PASS at2026-10-26 04:26 UTC; root promotion and final stable-root smoke were pending at that observation and are now completed below. Source-tested candidate `98b74deb09e2165b8f6f31f27b07a72532c01beb` is backed up/readback verified (106 files/105 payloads). Website candidate `94607ad2a87734c44180cbd58f122fe5897ee478` passed exact Pages run40267785517 and HTTP6: all six 200 bodies exactly matched frozen source bytes/SHA256. The stable v0.10 root was not changed for staging.

## Environment and initial preservation
Cloud Chromium, actual rendered UI and normal controls; no hidden state edits, debugger injection or user-computer access. The existing stable tab26 stayed in camp at Lv20, XP129/1313, gold8398, wins81, inventory110, HP1090 and AP19/20 (HP Tank rank1 active). Its normal UI export SHA256 is `7b68ed7bf54a389b44dc67de894af0e350fa9c27426e5da96c8389984c5d848d`.

To reach the new HP rank2 gate through actual browser play, a separate previously browser-earned v0.10 candidate profile was used. It began at Lv20, XP177/1313, gold8438, inventory111, all three rank1 active. Existing earned armor/accessory were manually equipped, and24 unlocked low-scoring test items were individually sold to make room. These were deliberate manual sales, not claimed safe-auto-sale matches. Future safe sale was enabled and stages4–13 progressed naturally. At Lv21 the profile was returned to camp, auto-advance disabled, stage3 selected and exported through the ordinary UI. The stable root profile remained separate.

## Fresh v0.11 UI
- Fresh Lv1 showed three unlearned rank0 lines and AP1.
- Learning HP Tank spent1AP, left it inactive, and actualHP stayed575. Current rank1 preview630 and next rank2 preview686 were explicitly hypothetical. Rank2 displayed Lv25 and extra2AP, disabled.
- Slotting rank1 changedHP to630; forgetting restoredHP575/AP1. Learning and activation remained distinct.
- Normal confirmed import of the browser-earned Lv21 export retained all three rank1 allocations, AP17/21, three of five slots, HP1287, MP86, gold11300 and inventory103. No ranks were auto-purchased.
- Its HP rank2 gate stayed disabled at Lv21, with2AP incremental cost and hypotheticalHP1387 separate from actual1287.
- Another40 unlocked low-scoring test items were manually sold to make room (inventory64/gold12995), then ordinary stage3 repeated expeditions continued. At04:15:52 UTC the browser naturally reachedLv22, wins94, XP36/1583. All nine ability controls were disabled during battle.

## Layout
At300% browser zoom, viewport393 CSSpx, document388, abilitypanel360.33 and card326.33 (scrollwidth324) had no horizontal overflow. An actual screenshot showed wrapped current/next effect, level gate and cost/refund text. Zoom was restored to100%. This is a narrow cloud-desktop check, not a physical-phone test.

## Explicit limits
Higher ranks and all MP/1H gates are covered by source tests and independent engine-earned cohorts, not automatically by this browser report. Do not equate engine-earned profiles with browser-earned progression. Malformed-save negatives, maximum ranks and old-reader rejection are Node coverage unless separately observed below. Physical mobile, OS suspension and all possible browser lifecycle races are not claimed. No universal speed, survival or drop improvement is inferred from level progression; exact source measurements include neutral outcomes.

## Actual first gate, upgrade and persistence — 04:21–04:25 UTC

- At real browser-earned Lv24, XP616/1886, wins122, HP1360, HP rank2 remained disabled despite sufficient AP. It correctly named Lv25, extra2AP and hypotheticalHP1466. Inventory114 required another20 ordinary manual test-item sales before further expeditions; safe-auto-sale is not unlimited storage.
- Normal stage3 play reached Lv25, XP259/2052, wins133, inventory112, gold18239. The HP upgrade became available in camp. Existing HP1384/AP21/25 became HP1493/AP19/25 after paying exactly2AP. It stayed active, still used one slot (three total), and showed cumulative3AP refundable. Rank3 correctly showed Lv50 locked.
- Full forgetting returned3AP, givingAP22/25, HP1276 and two slots. Learningrank1 again then upgrading while **unslotted** spent3AP total but left actualHP1276, two slots, rank2 inactive. Its preview1493 was clearly hypothetical. Slotting madeHP1493; reload retainedAP19/25, three slots, rank2 and unchangedgold18239.
- Two actual rank2 stage3 victories were observed:8.5s and10.5s, both startLv25, attack334/maxHP1493/generalmitigation31.8%. The8.5s report recorded1319basic+229skill damage,33HPlost/min99%, one stun;10.5s recorded1052basic+496skill,51HPlost/min98.9%, no stun. These are observed runs, not a controlled speed-improvement claim.
- A second candidate tab showed rank2/AP19/25/HP1493 while read-only, with refund disabled. Explicit takeover completed normally; previous owner became read-only. New owner reload retainedLv25, gold18499, wins135, inventory116, HP1493 andAP19/25.

Normal final browser export SHA256 `0488dda5adad8933ba80cc66db91934670c1634b4e928ec9693bd91422db2b58` contains `abilities={"learned":["mp-tank","one-handed-damage","hp-tank"],"slotted":["mp-tank","one-handed-damage","hp-tank"],"ranks":{"hp-tank":2}}`. This confirms sparse rank2 metadata and all three slot allocations persisted through actual UI. Browser export is a separate own QA artifact; source backup does not restore a user's browser profile.

MP rank2 atLv30, 1H later ranks, maxima and malformed-import cases were not repeated in browser; all have explicit Node coverage. No application-console inspection claim is made for this iteration: supported targeted documentation lookup did not expose a log method, and none was guessed. Rendered controls, reload, actual battles and persistence were observed working. Candidate bounded acceptance does not erase these limits.

## Public-root publication and smoke — 04:30–04:32 UTC

Accepted source `b8b3a696235210ae1e21a60c14c0379c459dd4ac` was backed up and read back before site `723b69d8f52a130d0a536544ba9dcabe6b5dfdf1`. Exact Pages run40269241579 succeeded and HTTP6 matched all six frozen runtime files with200 responses and exact bytes/SHA256. Four root blobs changed, loot/session stayed identical and3858 non-root blobs were preserved.

Actual stable tab26 loaded v0.11 while retaining its original level20, gold8398,81 wins,110 inventory items, HP1090 and AP19/20. HP Tank stayed rank1/10 active. Rank2 correctly remained disabled until level25, displaying hypotheticalHP1188 separately. The isolated candidate's level25/rank2 progress did not overwrite this root profile.

A normal stage3 loop completed three victories before the existing inventory guard returned to camp at116 items. The two visible newest reports were10.6s and9.5s, both start level20/attack242/maxHP1090/mitigation9%. The10.6s report had1206 basic+342 skill damage,38HP lost/min97.5%, three stun applications; the9.5s report had1319 basic+229 skill,16HP lost/min99%, two stuns. These are actual observations, not a controlled benefit comparison. A requested Retreat click correctly found the control disabled because the game had already returned safely to camp; there was no failed battle or stuck lifecycle.

Reload retained level20, XP546/1313, gold8728,84 wins,116 items, HP1090 andAP19/20 with HP rank1 active. To leave the test profile playable, ordinary safe-cleanup preview identified exactly loot-123/loot-127, both dominated by protected same-base keeper loot-114. Confirming that two-item batch added152 credits. Final reload retained gold8880,114 items,84 wins, HP1090/AP19of20 and an enabled Start button in camp.

Candidate tabs32/33/34 were closed; stable tab26 was marked Deliverable. Candidate saves and normal browser exports remain separate. No application-console, physical-mobile, arbitrary lifecycle, or old-version downgrade acceptance claim is added. This final receipt changes only documentation and manifest; runtime and839 passing tests are unchanged.
