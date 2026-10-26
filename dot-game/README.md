# hv-v3 dot — independent idle loot RPG

An independently designed single-player browser RPG inspired by original HentaiVerse research. This directory is self-contained: do not run or reuse the repository root application. Existing implementation, generated constants, monster dataset, art, and other authors' single-player proposals are excluded.

## Run
Requires Python 3 for static serving and Node 20+ for developer tests. No dependencies, installation, or build step.

```
cd dot-game
python3 -m http.server 8000
```

Open http://localhost:8000/ . Run `node --test tests/*.test.mjs` for checks. Do not open ES-module HTML via file://. Desktop play has been tested; mobile layouts are implemented but not yet device-verified. Game stays local in the browser; no server account, network gameplay, or offline progress.

## Current milestone

## v0.12 desktop accepted; root promotion pending — 2026-10-26 05:13 UTC

Intentional selected-item batch sale passed bounded cloud-browser acceptance: exact IDs survive sorting/filtering, hidden selections remain disclosed, cancel leaves inventory/gold unchanged, one confirmation sells only the three reviewed items for219 credits, reload preserves the result, and ownership/departure clears pending intent. A normal exported-save comparison preserved every unselected item and all equipment. Three actual victories followed cleanup. See docs/BROWSER-QA-V012.md (BROWSER-QA-V012.md in this directory) for observations and limits.

Complete source `21247944ce2615847be37ae31f18b2b5c1e86841` is backed up and exact-readback verified:115 files/114 payloads. Candidate site `5b3c9cbc86cf7d321db153b88c2070c3f62be920` passed exact Pages40272612375 and HTTP6. This checkpoint changes only docs/manifest;921 tests/four syntax checks are reused without runtime reruns. Public v0.11 remains accepted until root promotion and final smoke.


## v0.12 development candidate — 2026-10-26 05:00 UTC

Adds intentional exact-item multi-selection and reviewed batch sale, without changing conservative automatic cleanup, loot/combat rules, prices or saves. See docs/SELECTED-SALE.md (SELECTED-SALE.md from this docs directory). Final aggregate921/921 tests and four runtime syntax checks pass. Independent acceptance reproduces90 naturally earned baseline-identical victories and exact selected-batch/singleton proceeds. A checkbox keyboard-focus defect was corrected before this pass. Backup and browser acceptance remain pending. Public v0.11 remains accepted at recovery `61bd11e904e2aa1ea152e37deb461714df08e139`; do not treat this candidate as a published release.

Version 0.11 is published and bounded-desktop accepted at https://gggodlin.github.io/play/hv-v3-dot/ . Complete accepted source `b8b3a696235210ae1e21a60c14c0379c459dd4ac` was backed up and exact-readback verified before website commit `723b69d8f52a130d0a536544ba9dcabe6b5dfdf1`. Exact Pages run `40269241579` succeeded; HTTP6 returned six200 responses with exact frozen runtime byte/SHA256 matches. Runtime remains unchanged from `98b74deb09e2165b8f6f31f27b07a72532c01beb`.

The actual stable-root smoke retained the original level20/HP rank1 profile, displayed the locked level25 next rank correctly, completed three ordinary stage3 victories and safely returned to camp near inventory capacity. Reload retained AP19/20, HP1090,84 wins and inventory116. A normal exact-ID safe-sale preview sold two proven downgrades for152 credits; final reload left gold8880, inventory114 and Start enabled. Candidate level25/rank2 progress did not mix with the root profile. See docs/BROWSER-QA-V011.md for exact observations and limits.

The exact verified commit containing this publication receipt is the latest accepted full-source restore point (107 files/106 manifest payloads). Prior v0.10 restore `26b01643d4a926fb7abb3669bd823e22dec78e6d` remains available. This receipt changes only docs/manifest;839 passing tests/four syntax checks are reused, without another runtime rerun or deployment. Source backup does not restore personal browser saves, credentials or schedules.

### Earlier acceptance timeline (historical)

Version 0.11 has bounded desktop candidate acceptance at2026-10-26 04:26 UTC. It adds the complete researched ranks of HP Tank, MP Tank and1H Damage with explicit gates, incrementalAP and cumulative refunds. Actual browser-earned Lv24→25 progression verified locked→available HP rank2, active/inactive upgrades, full3AP refund, reload, takeover and two real victories. See docs/BROWSER-QA-V011.md and docs/ABILITIES-GUIDE.md.

Complete source `98b74deb09e2165b8f6f31f27b07a72532c01beb` is backed up/readback verified;839tests/four syntax checks pass. Candidate site `94607ad2a87734c44180cbd58f122fe5897ee478` passed exact Pages40267785517 and six exact HTTP byte/hash matches. This accepted-source checkpoint changes only docs/manifest, so existing runtime verification is reused. Root promotion remains pending; public v0.10 restore `26b01643d4a926fb7abb3669bd823e22dec78e6d` remains accepted until then.

### Earlier candidate status (historical)

Version 0.11 is a development candidate extending HP Tank, MP Tank and 1H Damage to their researched rank ladders. Current rank, next level gate, incremental AP cost and cumulative refund are distinct. See docs/ABILITIES-GUIDE.md. 839 source tests and four runtime syntax checks pass. Browser acceptance and release evidence are pending; public v0.10 at restore `26b01643d4a926fb7abb3669bd823e22dec78e6d` remains accepted.

### Previous published version
Version 0.10 is published and bounded-desktop accepted at https://gggodlin.github.io/play/hv-v3-dot/ . Accepted pre-promotion source `19f9b9fb3583caec8a910bbff57454d78d896b65` was backed up and exact-readback verified before website commit `176842ae81cd90d55bac5f96f3bbb772dc4f27e4`. Exact Pages run `40264171858` succeeded; one HTTP6 pass returned six 200 responses with exact frozen-source byte/SHA-256 matches. Runtime is unchanged from `a2406ee8ae7dfeeb0edeed268c59fd728dba1833`.

The final stable-root smoke preserved the original level-19 profile, not isolated candidate allocation. Learning and slotting HP Tank spent one AP and changed maximum HP 971→1066. A real stage-3 win naturally reached level 20; retreat/reload retained gold 8398, 81 wins, 110 inventory items, maximum HP 1090, AP 19/20 and the one learned/slotted ability. See docs/BROWSER-QA-V010.md for exact observations and limits. The exact verified commit containing this publication receipt is the latest accepted full-source restore point (99 files / 98 manifest payloads); retain prior v0.9 recovery `83a973bcf2586ed5994e707cfc5faaeb519873cd` as history. This receipt updates docs/manifest only: 694 tests/four syntax passes are reused, with no redundant runtime rerun or extra deployment.

### Pre-promotion acceptance (historical; completed by the publication above)

Version 0.10 has bounded desktop candidate acceptance as of 2026-10-26 03:24 UTC; root promotion is pending in this checkpoint. The three rank-1 AP abilities separate learning from Major-slot activation. Real browser play verified AP costs, inactive learned abilities, free camp refunds, honest zero-proficiency preview, natural old-save import, all-three allocation, battle/read-only guards, natural level-up AP growth, reload and explicit writer takeover. See docs/BROWSER-QA-V010.md for measurements and device/import/lifecycle limits, and docs/ABILITIES-GUIDE.md for original facts versus adaptations.

Complete runtime/source `a2406ee8ae7dfeeb0edeed268c59fd728dba1833` is verified: 98 files / 97 manifest payloads, 23 exact changed-file readbacks and 75 prior-verified unchanged identities. Existing 694 tests/four syntax passes are reused because this accepted-source checkpoint changes only docs/manifest. Isolated site `7ae873625722522e4980e754d944ae8b0fdefaa3` passed exact Pages run `40263377697` and one six-200 exact byte/SHA-256 HTTP comparison; all 3852 prior site blobs were preserved. Public v0.9 and recovery `83a973bcf2586ed5994e707cfc5faaeb519873cd` remain accepted until promotion and final root smoke.

### Earlier candidate status (historical; superseded above)

Version 0.10 is a development candidate adding the first three rank-1 AP abilities: HP Tank, MP Tank and 1H Damage. Learn with AP, then equip in Major slots; five original starting slots and level-based AP are retained. Unlimited free camp refunds and existing maxHP-based support are explicit adaptations. See docs/ABILITIES-GUIDE.md and ORIGINAL-HV.md. Public v0.9 remains accepted until this candidate passes backup/browser/release verification.

### Earlier accepted version
Version 0.9 is published and bounded-desktop accepted at https://gggodlin.github.io/play/hv-v3-dot/ . Accepted pre-promotion source `8d6be5b3c3735021aea8e94570ee88b0efe5eea9` was backed up and exact-readback verified before website commit `08d5066a74c93a69260f384fbd02a02bbf68f81e`. Exact Pages run `40259045608` succeeded; all six public runtime HTTP 200 bodies match the frozen source bytes/SHA-256. Runtime remains unchanged from `d7c6a91c8f8ad854ddd8e01663ce3da630f26ea6`.

The final stable-root smoke retained the original level-19 profile rather than isolated candidate progress, verified two actual stage-3 club victories and measured reports, then pinned the latest report. Retreat/reload retained level 19, gold 8238, 80 wins and 109 inventory items while session-only reports/pin correctly cleared. See docs/BROWSER-QA-V09.md for exact observations and explicit limits. The exact verified commit containing this publication receipt is the latest accepted full-source restore point (93 files / 92 manifest payloads); retain prior v0.8.1 recovery `c1530bc76aa06716443b9ccca8de6f616e9f5f47` as history. This receipt updates documentation/manifest only: no redundant runtime tests or extra deployment.

### Pre-promotion acceptance (historical; completed by the publication above)

Version 0.9 has bounded desktop candidate acceptance as of 2026-10-26 02:22 UTC; public-root promotion is pending in this source checkpoint. It adds session-only expedition reports and one optional pinned comparison. Actual browser play verified victory/retreat reports, natural axe loot with visible bleed accounting, pin retention after recent-list eviction, narrow text wrapping and report reset on reload while durable progress survives. See docs/BROWSER-QA-V09.md for observed values and limits, and docs/EXPEDITION-REPORTS.md for controls and measurement definitions. Natural clears at different levels are not a controlled weapon-benefit comparison.

Complete runtime/source `d7c6a91c8f8ad854ddd8e01663ce3da630f26ea6` is backed up and exact-tree/readback verified (92 files / 91 manifest payloads); 599 tests and four syntax checks pass. Candidate site `6ed32468c73cfd4cbb9e0d2f589fe6bcda57ca20` passed exact Pages run `40258269362` and all six HTTP 200 exact byte/hash comparisons. This accepted-source checkpoint adds only browser acceptance documentation and its manifest; runtime/tests are unchanged and are not redundantly re-run. Public v0.8.1 and recovery `c1530bc76aa06716443b9ccca8de6f616e9f5f47` remain the published accepted version until promotion and stable-root smoke verify.

### Earlier accepted version
Version 0.8.1 is published and bounded-desktop accepted at https://gggodlin.github.io/play/hv-v3-dot/ . Website commit `5f2edb7a6927b6433c1a5d8fd64c0a51e4e7561c` passed exact Pages run `40253248001`; all six public runtime HTTP 200 bodies match the accepted source bytes/SHA-256. Pre-promotion accepted source `f1228ea6e2777c9469fd387c32f2ba312b725a75` was backed up and verified first. The complete runtime originates at `ff6bb071240deef5d86c34e80a1d514daeb9762d`, unchanged by later documentation receipts.

The final public-root browser smoke retained the original v0.7 stable profile, not candidate progress, and verified a real stage-3 win, loot, retreat, reload and saved writer ownership. See docs/BROWSER-QA-V081.md for observed values and limits. The exact verified commit containing this publication receipt is the latest accepted full-source restore point; keep prior v0.7 recovery `e1b576ee2041bd2772f79587e859a80b5ab1f108` as history. This receipt updates docs/manifest only, without another deployment or redundant runtime test run.

### Pre-promotion acceptance (historical; completed by the publication above)

Version 0.8.1 has bounded desktop browser acceptance as of 2026-10-26 01:11 UTC; public-root promotion is pending in this source checkpoint. The exact source/runtime remains the already verified 551-test package at `5a280428eb940d667ee3c2a63ecbc01c5dbe9643` / `ff6bb071240deef5d86c34e80a1d514daeb9762d`. It adds the historical-model axe bleed plus numerical clock, manual-start boundary and repaired-save takeover corrections. Actual candidate play covered natural v0.7 import, purchase/manual equip, visible bleed, progression/reload and writer takeover. See docs/BROWSER-QA-V081.md for evidence and explicit limits; this is not a universal buff or mobile/suspend guarantee.

Candidate site `57f7ab124852d9f0313c2f475ac43a09b069cb03` has exact-commit Pages success and six HTTP 200 byte/hash matches. Earlier HTTP-blocked statements below are historical: normal permitted execution resumed at 01:03 UTC on 2026-10-26, and the old v0.8 HTTP6 also completed successfully. No denied operation was bypassed. Keep the accepted public v0.7 root until the subsequent promotion verifies; this source checkpoint records acceptance before that write.

### Prior milestone notes (historical; superseded by the current status above)

The 23:00 UTC source-only follow-up fixes a protected-save recovery failure: after another tab repairs corrupt data, taking ownership now revalidates the current durable save and permits persistence only if valid. Previously the repaired journey could play indefinitely without saving. 551 tests and four syntax checks pass. Complete 83-file source is exact-readback verified at `ff6bb071240deef5d86c34e80a1d514daeb9762d`; a package reconstructed only from that remote commit also passes all tests and syntax checks. This is an unpublished candidate; browser/public acceptance remains pending. See docs/SAVE-RECOVERY.md.

The 22:00 UTC source-only follow-up rebases the online timer when a manual Start or Retreat actually changes lifecycle mode. Camp time before clicking Start no longer counts toward the new fight. Failed/repeated actions and ordinary combat actions retain their timer interval. All 531 tests and four runtime syntax checks pass. Its complete 81-file source backup is exact-readback verified at `053a5dc7dd05d3332a3a6f1bf3a2667dfc12375a`, including a successful test run from the remotely reconstructed package. It remains an unpublished v0.8.1 candidate; see docs/PUMP-BOUNDARY.md for the narrow scope, recovery evidence and validation.

Version 0.8.1 is a source-only numerical clock-correction candidate. All 515 tests, four runtime syntax checks and the full 100-seed balance run pass; complete source backup/readback is verified at d725a41047bbc77f53113db4b8ae8983877e8b4f, including a successful test run from the remotely reconstructed package. The earlier v0.8 public-file verification is blocked pending a user decision, and no further website writes or HTTP retries are being attempted. Public v0.7 remains the accepted playable version; do not treat either candidate as an accepted release.

Version 0.8 is the next development candidate: historical-model axe Bleeding Wound. Its 469 source tests and full 100-seed balance measurement pass; browser and release gates remain pending; public v0.7 remains accepted. Do not treat a candidate as the latest verified playable checkpoint.

Version 0.7 is published and accepted at https://gggodlin.github.io/play/hv-v3-dot/ . See docs/BROWSER-QA-V07.md and docs/RELEASES.md for verification. It adds an explicitly adapted weapon commission after the first clear: choose axe, rapier or club, preview exact current-level Superior/R110/Slaughter stats and cost, confirm purchase, then equip separately. Item delivery is locked. Spending can leave zero gold; expeditions remain free. It is not an original Bazaar/Forge/Training implementation or a guaranteed upgrade over good random loot. See docs/COMMISSION-GUIDE.md for measured usefulness and limits.

Version 0.6 is published at https://gggodlin.github.io/play/hv-v3-dot/ . See docs/STATUS.md, docs/RELEASES.md and docs/BROWSER-QA-V06.md for exact source evidence, bounded desktop acceptance and the explicit schema-negative browser-test gap. It adds optional conservative future-drop sales and an exact-item cleanup preview. Default OFF, no retroactive sweep, no score-based disposal: only low-quality strict same-base downgrades against equipped/locked keepers qualify. Unknown item-schema imports fail without overwriting the existing save. This is an independent convenience rule, not an original-HV economy claim. See docs/LOOT-MANAGEMENT.md for precise limits.

Retained from v0.5: From stage 3, armored/agile enemy roles make weapon choices visible. Camp preview shows the next route; combat readouts reflect PA/stun effects on actual defenses. New role values are independent adaptations, not imported original monster data. Stages 1–2 remain unchanged. See docs/BUILD-GUIDE.md for honest equipment tradeoffs.

Retained from v0.4: club stun with visible duration/recovery feedback. Fixed 25% chance and four simulation ticks are game adaptations using researched maximum values, not original low-level scaling. Stun cannot refresh; recovery guarantees an enemy action on the next player turn under the documented independent scheduling rule. See docs/COMBAT-DESIGN.md for precise eligibility and ordering.

Retained from v0.3: rapier Penetrated Armor, weapon-family persistence and visible stack/timer feedback. The deliberately historical post-hit model uses a fixed 25% chance and seven simulation ticks; these rates and timing choices are this game’s adaptations, not a claim of exact current HV. Each stack reduces existing general physical mitigation by 25%, up to three. It is not +25% direct damage. Basic critical hits guarantee one stack; 破勢斬 benefits from existing stacks but cannot trigger them. Weapon scores compare stats only, not this effect.

This version retains v0.2’s online background processing where browser timers permit; long pauses and closed-page time give no offline earnings. Web Locks serialize writes, with a safe foreground/export-only fallback if unavailable. Development continues beyond this first loop.

## Play
Choose 均衡 for the original policy, 猛攻 for more skill use at higher MP cost, or 持久 for earlier healing and finite automatic potions. Change tactics at camp. These are independent auto-decision policies, not an original-HV skill-tree claim.

Choose a stage and start an expedition. Combat and skills resolve automatically. Return to camp to compare, equip, lock, and sell loot, then replay or challenge a higher stage. Failed expeditions can recover; no real-money purchases. Export saves periodically; clearing browser storage can lose progress. The UI documents exact controls as implemented.

## Source and fidelity
See docs/ORIGINAL-HV.md for allowed research, docs/COMBAT-DESIGN.md and docs/LOOT-DESIGN.md for explicit adaptations. Original facts, fitted research models, and independent game decisions must remain distinct. Unknown original constants are not presented as exact. Early playable slices are milestones, not a permanent scope limit.

## Recovery and release
Source backups are committed to GGGODLIN/hv-v3 branch bot/dot under dot-game/. Retrieve the exact checkpoint commit; preserve source, tests, documentation and assets together. Verify the checkpoint manifest where provided, then serve and run tests. A source backup is not necessarily an accepted playable release: read docs/STATUS.md and its validation evidence. Browser saves are separate from source backups.

Accepted static releases deploy only to https://gggodlin.github.io/play/hv-v3-dot/ through the separate personal-site repo. Other branches of hv-v3 and other personal-site works are not modified. The old dot-probe is only infrastructure verification, not this game. This package cannot restore credentials, platform permissions or automation schedules.

## Save migration in v0.2
On first v0.2 load without a v2 save, a validated v0.1 save is copied read-only into the new version. The old save is retained untouched. Progress made later in a still-open old tab is not merged; use the new version going forward or export/import deliberately. Multiple v0.2 tabs have one writer; use the explicit takeover control. Candidate builds keep separate save namespaces.

Browser QA limits: inactive-tab progress and safe takeover were observed in cloud Chrome. Foreground-only pause did not occur in that environment while document.hidden reported false; its cause is unresolved. 388 CSS-pixel layout was checked with browser zoom, not a physical mobile device. Do not equate bounded-clock unit tests with real OS-suspend validation.

## Save migration in v0.3
v0.3 uses its own save/writer/preferences namespace. With no v3 save, read a valid v2 save first, or v1 only if v2 is absent. Corrupt newer data blocks automatic replacement rather than silently rolling back. Older save bytes remain untouched; progress made later in an old tab is not merged. An exact legacy name created by this independent game can recover its weapon family; unknown/explicitly invalid identities receive no proc. Importing an old save returns safely to camp without retaining combat statuses.

## Save compatibility in v0.4
The existing v3 save/lock namespace is retained: v0.4 adds no new persistent weapon fields, and loading always discards encounter-only stun/recovery state. Older v0.3 tabs still run their old combat rules until refreshed; only one tab may own and write progress. Refresh the game to use current mechanics, or use the explicit takeover control. The prior v1/v2 migration remains read-only and does not merge later progress from those old namespaces.

## Save compatibility in v0.7
The v3 namespace and ordinary item schema remain unchanged. Commissioned weapons are standard locked items; all1500 purchases passed the actual frozen v0.6 validator without item/gold/lock loss. Old tabs show old UI until refreshed; use refresh or explicit takeover for commission. Candidate saves are separate. Source backups do not back up your personal browser save: export it through the game before clearing site data.

## Save compatibility in v0.8
Existing v3 saves and weapon identities are retained. Bleeding is encounter-only state, discarded on load just like PA and stun; it is not a persistent weapon upgrade. Refresh old tabs to run the new axe behavior and descriptions. Ordinary item generation, commission prices and supported inventory records are unchanged. See docs/ORIGINAL-HV.md for the historical model and docs/BLEED-GUIDE.md for natural-play outcomes and counterexamples.
