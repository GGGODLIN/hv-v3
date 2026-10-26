# hv-v3 dot — independent idle loot RPG

## v0.16 development candidate — 2026-10-26 12:18 UTC

Camp navigation groups the secondary panels into **戰況 / 配裝 / 成長** while keeping the hero, battlefield, expedition controls and inventory available. This is a presentation-only iteration: no combat, loot, progression or save-schema changes. Click a tab, or focus it and use Left/Right/Home/End. The selected tab is transient and resets to 戰況 on reload; it is not saved progress. Existing advanced rules remain available in their respective panels.

Source regression passes 1,162/1,162 tests and four JS syntax checks; independent structural/lifecycle review passes. Source backup and actual isolated browser acceptance are pending. Public v0.15 and complete accepted restore `6d3141ddfc42ef8a52a5cdea09496c1de6af2c66` remain the accepted version until this candidate is verified. See `docs/CAMP-NAVIGATION.md` for the scope and acceptance plan.

### Earlier checkpoint timeline (historical)

## v0.15 published and stable-root accepted — 2026-10-26 12:07 UTC

Play: https://gggodlin.github.io/play/hv-v3-dot/ . New rapier equipment parry input/Nimble, consistent seven-stat equipment decisions, and camp departure feedback are now live. Original equipment inputs and our adapted final probabilities remain explicitly distinct; old owned gear is not retrofilled.

Runtime source3f5b3cce2c1fdf3ddb98966bbd93ef2e8d761ceb passed1,155tests/four syntax. Accepted full sourcef791ea3f6cabbcfa27af61a5bb7ccdb5e7a6573b was verified before root663589608a78d5ccdd38dc0b9d30de85a7bc92a2. Exact rootPages40319505231 and HTTP6 passed; five root files changed, session and3882non-root blobs preserved.

Actual candidate and root ordinary purchase/equip/reload/combat passed. Root kept its independent natural profile and endedLv7/gold124/wins8/inventory14/HP707/parry15.15%. See BROWSER-QA-V015.md for observed evidence and explicit random-Nimble/capacity/device limits. The cloud test browser reset earlier; no old profile was invented, and source backup is not browser-save backup.

This exact verified publication-receipt commit is the latest accepted full-source restore (146files/145payloads); prior v0.14 restore22bdfca3068c7934921c2493eb40de624d684318 remains available. Only docs/manifest changed after acceptance; unchanged1,155tests/four syntax are reused. No credentials, Library synchronization or schedule restoration is claimed.

### Earlier checkpoint timeline (historical)


## v0.15 desktop accepted; root promotion pending — 2026-10-26 11:59 UTC

Latest runtime3f5b3cce2c1fdf3ddb98966bbd93ef2e8d761ceb is source-backed (1,155 tests/four syntax). Following explicit isolated-test-page approval, candidate1fa69a69d390123804e3aabd2d71079b00804025 passed exact Pages40318235306 and HTTP6; all3882 earlier website blobs stayed unchanged.

Actual cloud play passed ordinary v0.14 save import, earned568gold rapier purchase, equipment input11.646→adapted15.15%parry, A/B exact preview/swap, reload and preset sale protection. Real victories and counter damage were observed; final normal export retained all13 legacy owned IDs and30 total items. See BROWSER-QA-V015.md for reset/new-profile explanation and explicit random-Nimble/capacity/device limits. Runtime/tests unchanged; results reused for this docs-only checkpoint.

Public root remains v0.14 until this acceptance receipt is backed up and root promotion/smoke complete. Prior accepted restore22bdfca3068c7934921c2493eb40de624d684318 stays available. Source backup does not preserve personal browser saves or account/schedule permissions.

### Earlier checkpoint timeline (historical)


## v0.15 source-only departure feedback correction — 2026-10-26 09:00 UTC

This candidate fixes the existing camp control mismatch: departure requires at least five free inventory slots and no pending loot, exactly as the unchanged engine already enforces. The Start button now reflects that condition, and its adjacent hint states the remaining slot deficit or pending-loot reason. A rejected/repeated start no longer plays the successful-departure sound. Successful/manual lifecycle timing and rejected-action clock preservation are unchanged. See docs/DEPARTURE-FEEDBACK.md.

Final source aggregate: **1,155/1,155 tests pass**, zero failures/skips, and all four runtime syntax checks pass. Independent new UI/engine/pump acceptance:15/15; existing pump-transition checks:16/16. Runtime engine/loot/session bytes are unchanged from the previously verified v0.15 candidate. No browser/site verification was performed.

This remains a source-only candidate awaiting the existing isolated-test-page authorization; no website write, v0.15 browser acceptance, CI or HTTP verification is claimed. Public v0.14 and accepted recovery `22bdfca3068c7934921c2493eb40de624d684318` remain unchanged. The previously prepared unreferenced website commit `71c68c269745526f3dd4c9af70a9d69fb4432cf5` contains the older UI: do not publish it as this corrected candidate. A future permitted stage must be rebuilt from the latest exact verified source while preserving any concurrent website changes.


## v0.15 source backed up; isolated staging blocked — 2026-10-26 08:48 UTC

New rapier equipment input and legal Nimble suffix are implemented, with1,140 tests and four syntax checks passing. Full source `48776a2cac13eaf6842c46de7e26ef264c115bd1` is verified142files/141payloads. The original source labels its equipment field `Parry Chance`; our stored 招架值 and final adapted probability are distinct, not a claim of full original accuracy-system fidelity. Literal source evidence and conversion limits are in PARRY-GEAR-GUIDE.md.

Isolated test-page staging was denied, including one evidence-backed reassessment. Website HEAD remains `a8bc6a82da6f476c6a0b2e53320c95f7ff106fe8`; **public v0.14 remains accepted**. v0.15 has no browser acceptance, CI/HTTP publication verification or live version link. See docs/RECOVERY-V015.md (RECOVERY-V015.md from docs) for exact restore references, the unreferenced candidate, and specific staging permission needed. No further website writes or alternate routes are attempted.

This source-only recovery receipt changes docs/manifest only; runtime and1,140 tests are unchanged. It is development-source backup, not a new accepted playable release.

### Earlier checkpoint timeline (historical)


## v0.15 development candidate — 2026-10-26 08:00 UTC

New rapier Parry rating and legal Nimble suffix connect gear tradeoffs to the existing counterattack system. Original equipment input (the source labels it `Parry Chance`) and the game's adapted final probability are explicitly distinct; old items remain unchanged, while new rapier scores/prices and future RNG trajectories can change. See docs/PARRY-GEAR-GUIDE.md (PARRY-GEAR-GUIDE.md from docs). Source tests, backup and browser acceptance are pending. Public v0.14 and complete restore `22bdfca3068c7934921c2493eb40de624d684318` remain accepted until this candidate is verified.

### Earlier checkpoint timeline (historical)


An independently designed single-player browser RPG inspired by original HentaiVerse research. This directory is self-contained: do not run or reuse the repository root application. Existing implementation, generated constants, monster dataset, art, and other authors' single-player proposals are excluded.

## Run
Requires Python 3 for static serving and Node 20+ for developer tests. No dependencies, installation, or build step.

```
cd dot-game
python3 -m http.server 8000
```

Open http://localhost:8000/ . Run `node --test tests/*.test.mjs` for checks. Do not open ES-module HTML via file://. Desktop play has been tested; mobile layouts are implemented but not yet device-verified. Game stays local in the browser; no server account, network gameplay, or offline progress.

## Current milestone

## v0.14 published and stable-root accepted — 2026-10-26 07:29 UTC

Version0.14 is published at https://gggodlin.github.io/play/hv-v3-dot/ . Accepted source `cc26b628b97fcd665051c3410858ad93195fb27a` was backed up/readback verified before website `a8bc6a82da6f476c6a0b2e53320c95f7ff106fe8`. Exact Pages40285780632 succeeded; HTTP6 returned six200 exact frozen-runtime byte/SHA256 matches. Runtime remains `65e02542472fc4cf9eb9592f2eab1ababd777b39`. Only four root runtime files changed; loot/session and3876non-root website blobs were preserved.

Actual candidate swaps retained all120 owned items with only the three explicitly saved lock changes; exact cancel/clear/overwrite, reload and takeover passed. Root preserved its own level20 profile, saved original A and owned defensive B, switched back through the exact preview, completed a normal stage3 win and reloaded atgold9973/items113/wins88/HP1090/AP19of20. See docs/BROWSER-QA-V014.md (BROWSER-QA-V014.md in docs) for actual versus Node evidence and explicit capacity/device/console limits.

The exact verified source commit containing this publication receipt is the latest accepted full-source restore (134files/133payloads). Prior v0.13 recovery `f707a916e79cd8fbd87ba5dae2d90dc598047e23` remains available. This receipt changes docs/manifest only;1081tests/foursyntax are reused without runtime reruns or another deployment. Source backup does not restore personal browser saves, Library files, credentials or schedules.

### Earlier checkpoint timeline (historical)


## v0.14 desktop accepted; root promotion pending — 2026-10-26 07:23 UTC

Actual cloud-browser gear-only presets passed bounded acceptance: explicit save locks, exact three-item preview, cancel/apply, clear retaining locks, overwrite, shared references, import/reload and read-only takeover. A normal export proved all120 owned items retained with only three intended false→true locks, while hero/gold/RNG/abilities/tactics stayed unchanged. Two real victories followed ordinary inventory cleanup. See docs/BROWSER-QA-V014.md (BROWSER-QA-V014.md in docs) for measurements, capacity and device limits.

Complete source65e02542472fc4cf9eb9592f2eab1ababd777b39 is verified133files/132payloads; candidatef3530c6b2e0bcc19b279dda4ad3bbbe5c54ea329 passed exact Pages40284707129 and HTTP6. Runtime/tests are unchanged;1081tests/foursyntax are reused for this docs-only checkpoint. Publicv0.13/recoveryf707a916e79cd8fbd87ba5dae2d90dc598047e23 remain accepted until root promotion and stable-root smoke. Source backup does not restore personal browser saves, Library, credentials or schedules.

### Earlier candidate timeline


Version0.14 is a development candidate adding three gear-only camp presets. Explicitly save and lock currently equipped items, preview an atomic swap, and retain referenced gear against accidental sale. Abilities and tactics are not part of these presets. See docs/GEAR-SETS.md. Public v0.13 and recovery `f707a916e79cd8fbd87ba5dae2d90dc598047e23` remain accepted until this candidate completes source backup and browser/release acceptance.

### Earlier accepted timeline

## v0.13 published and stable-root accepted — 2026-10-26 06:30 UTC

Version0.13 is published at https://gggodlin.github.io/play/hv-v3-dot/ . Accepted source `328d746f077b155e62a4c58c39279b778b45025e` was backed up and exact-readback verified before website `ce9a91f142fd10fd2dc8cfde7ce34dddae031a09`. Exact Pages40279841540 succeeded; HTTP6 returned six200 exact frozen-runtime byte/SHA256 matches. Runtime remains `c08de8e753edf690eff96066e3d9dbd7b385f968`. Only four root files changed; loot/session and3870non-root website blobs were preserved.

Actual candidate play showed genuine194/205counter notices and a stage7 victory with2counters/298actualHPremoved using owned block gear. The stable root retained its separate Lv20/original gear, completed two normal stage3 victories and automatically returned near inventory capacity. Reload retained gold9528, inventory117, wins87, HP1090 and AP19of20; Start remained enabled. No counter was observed in those two root fights, which is expected for a conditional passive. See docs/BROWSER-QA-V013.md (BROWSER-QA-V013.md from docs/) for source-versus-browser evidence, no new narrow/mobile/takeover claim, and bounded console inspection.

The exact verified source commit containing this receipt is the latest accepted full-source restore (125files/124payloads); prior v0.12 recovery `9e84422bfc366fc1c526ff7f052f2dd8bd69d30d` remains available. This receipt changes documentation/manifest only;978tests/foursyntax and the final expanded15-test independent cohort are reused without another runtime rerun/deployment. Source backup does not restore personal browser saves, Library files, credentials or schedules.

### Earlier checkpoint timeline (historical)


## v0.13 desktop accepted; root promotion pending — 2026-10-26 06:24 UTC

Bounded actual cloud-browser acceptance passed. Fresh unknown starter weapon was inactive; the normal earned Lv20 import showed29.24% conditional counterchance and a1-per-turn cap. Manually equipping owned block gear and ordinary stage4 onward progression produced visible194/205counter notices and a stage7 report with2counterattempts/298actualHPremoved, distinct from basic/skill damage. Reload retained naturalLv21/gold10816/items109/wins91 and cleared session-only counter/report observations. No new narrow/mobile/takeover claim is made; see docs/BROWSER-QA-V013.md (BROWSER-QA-V013.md from docs/) for limits and separate source evidence.

Full candidate source `c08de8e753edf690eff96066e3d9dbd7b385f968` is exact-readback verified (124files/123payloads). Site candidate `d121a67aad4ad41b65ca05deee77f5dd8c10b6f0` passed exact Pages40278750956/HTTP6. Existing978tests/foursyntax passes and final independent15test cohort are reused without runtime reruns for this docs-only acceptance. Public v0.12/recovery `9e84422bfc366fc1c526ff7f052f2dd8bd69d30d` remain accepted until promotion/rootsmoke; the accepted source receipt must be backed up first.

### Earlier candidate timeline (historical)


## v0.13 development candidate — 2026-10-26 06:00 UTC

A researched one-handed Counter-Attack damage subset adds retaliation after an actually successful parry/block check, including partial defenses as an explicit adaptation. Recognized one-handed weapon families use the original chance formula and proficiency-based per-player-turn attempt cap. Counter damage uses current sheet attack, benefits from existing armor penetration, cannot crit or apply weapon procs, and is reported separately. Original counter stun, Overcharge and Overwhelming Strikes remain unimplemented; this is not the full original fighting style. See docs/COUNTERATTACK-GUIDE.md (COUNTERATTACK-GUIDE.md from docs/) for source facts and integration choices.

Source acceptance passes: integrated978/978 tests and four runtime syntax checks; the final expanded natural cohort inside the unchanged15-test independent suite also passes. The audit reproduced and fixed a recovery-counter wave-ending budget reset: a reserved player-turn token now retains spent attempts until that player action actually advances. Across120 naturally earned acquisition wins and54 matched trials, original-gear branches produced1 counter/181HP damage and owned block-heavy branches8/1554; all pairs won, but11 were faster,32 equal and11 slower, and total incoming loss rose6444→6628. Failed eligible proc rolls also shift RNG; no universal improvement is claimed. See docs/ACCEPTANCE-V013.md. Full-source backup and actual browser acceptance remain pending. Public v0.12 and recovery `9e84422bfc366fc1c526ff7f052f2dd8bd69d30d` remain the accepted version until the candidate completes release verification.

### Earlier checkpoint timeline (historical)


## v0.12 published and stable-root accepted — 2026-10-26 05:18 UTC

Version0.12 is published and bounded-desktop accepted at https://gggodlin.github.io/play/hv-v3-dot/ . Complete accepted source `26e96e6626dfc80e42492de9b3869e9d90eb8ec1` was backed up and exact-readback verified before website commit `02939222eed1789a235f343fd9e07a155ce80c8d`. Exact Pages run `40273174651` succeeded; HTTP6 returned six200 responses with exact frozen runtime bytes/SHA256. Runtime remains unchanged from `21247944ce2615847be37ae31f18b2b5c1e86841`.

The public root retained its separate level20, gold8880, inventory114 and HP Tank rank1 profile. Normal reviewed selection sold onlyloot-167 andloot-165 for268 credits, yielding112 items/gold9148. An ordinary stage3 victory followed; retreat/reload retained level20, HP1090, AP19/20, wins85, inventory113 and gold9308. Selection was empty, the tab held progress ownership and Start was enabled. Candidate progress did not replace root progress. See docs/BROWSER-QA-V012.md for actual observations and limits.

The exact verified commit containing this publication receipt is the latest accepted full-source restore point (116 files/115 manifest payloads). Prior v0.11 restore `61bd11e904e2aa1ea152e37deb461714df08e139` remains available. This receipt changes only docs/manifest;921 tests and four syntax checks are reused without runtime reruns or another deployment. Source backup does not restore browser saves, Library files, credentials or schedules.

### Earlier candidate timeline (historical)


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
