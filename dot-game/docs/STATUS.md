# Current status

## v0.8.1 UI boundary follow-up — 2026-10-25 22:00 UTC iteration

A separate inherited UI defect was reproduced with the real dispatcher, pump and engine: Start at 249 ms between timer callbacks credited 250 ms to a fight only 1 ms old. The fix rebases the pump only after a successful manual Start/Retreat mode change. Failed starts, repeated clicks and ordinary combat actions do not discard their pending time. Engine/session/loot bytes remain unchanged from the prior source-backed numerical patch. This is source-only correctness work, not a newly published feature. See PUMP-BOUNDARY.md for final test and backup evidence.

Complete candidate/runtime source is backed up at `053a5dc7dd05d3332a3a6f1bf3a2667dfc12375a`: all 81 files / 1117788 bytes and 80 manifest payloads were read back from that exact commit and independently checked by bytes, SHA256 and Git blob SHA. A package reconstructed exclusively from the remote readback passes all 531 tests and four runtime syntax checks. All 432 outside-dot-game entries remain unchanged; expected-head non-force update and no removals were verified. This subsequent receipt changes only documentation/manifest, not candidate runtime. For continued development, recover the candidate source or this receipt; for accepted play, use the v0.7 recovery target below.

The public HTTP verification decision and pause-schedule question remain unanswered. No retry or alternate browser route is attempted; no website modification or new browser acceptance is claimed. Public v0.7 and its accepted recovery receipt e1b576ee2041bd2772f79587e859a80b5ab1f108 remain unchanged.

## v0.8.1 source-only candidate — 2026-10-25 21:00 UTC iteration

A real numerical defect is fixed in source: the actual 250 ms online pump now pays 20 player actions and 20 TU ticks at 21 processed seconds instead of losing a due action. Exact TU/rest boundaries are repaired with a one-nanosecond comparison window; signed clock debt is retained and TU summation is compensated. A simulated 58 h 20 m stress reaches exactly 200000 player actions/ticks. Only the engine's advance function changes; every engine byte outside it and all loot/session code remain frozen. Existing coarse event grouping and intermission overshoot policy are not redesigned, and full partition invariance is not claimed.

Parent reran all 515 tests and four runtime syntax checks successfully, plus the full 100-seed clock balance suite (4/4). The total includes 43 explicitly historical trajectory/hash cases and one historical pressure case against exact frozen v0.8 fixtures; old golden values were not regenerated. New coverage includes 19 focused clock tests and 22 independent acceptance tests. All 100 starter seeds per driver still win with identical loot, final RNG and action counts; clear feedback is up to 0.1 seconds earlier. Primary stages 3–10 contain 4800 paired wins, including 34 slower candidate clears. The separate exploratory cohort has 2752 pairs: six baseline wins become losses and nine losses become wins; six later baseline-state comparisons after candidate failures are clearly counterfactual. This is a correctness fix, not a universal buff.

See CLOCK-CORRECTION.md, CLOCK-BALANCE.md and ACCEPTANCE-V081.md for evidence, limits and historical attribution. No browser acceptance or publication is claimed. The pending six-file public HTTP recheck has no new user response; no denied action was retried and no website was changed. The earlier v0.8 staging remains immutable and unverified at that external gate. Public v0.7 remains the accepted playable release; its fully verified recovery receipt is `e1b576ee2041bd2772f79587e859a80b5ab1f108`. This source-only patch is fully backed up at `d725a41047bbc77f53113db4b8ae8983877e8b4f`: all 79 files / 1096263 bytes and 78 manifest payloads were read back from the exact commit, with independent byte/SHA256/Git-blob checks. A package reconstructed only from that remote readback also passes all 515 tests and four runtime syntax checks. Expected-head non-force update and unchanged outside paths were verified. This subsequent receipt changes documentation/manifest only; no website, public HTTP or browser operation occurred. The candidate is recoverable for continued development, but it is not the accepted playable restore target.

## v0.8 development candidate — 2026-10-25 20:00 UTC iteration

Selected historical axe Bleeding Wound to complete three weapon identities. Source research and implementation are complete. All 469 tests and four runtime syntax checks pass; independent acceptance adds 35 adversarial checks while preserving non-axe baselines. The final 100-seed natural measurement passes: every paid-axe path and neutral pair survives stages 1–10; stage 10 outcomes are 65 faster, 14 equal and 21 slower, with 42 lower minimum-HP outcomes. A naturally earned axe costs 744 of 760 credits, leaving 16. Historical facts, fixed tuning, weaker refresh and the inherited floating cadence limitation are separated in the source ledger. Complete candidate source `21bf7bc45a1229ee8dfd145a6473f2f6855f9f8e` is backed up and exact-readback verified: 70 files, 945077 bytes, 69 manifest payloads. Isolated candidate staging commit `a324f7a30ddf23e9e8e6507fd6f1390a21133ee4` preserves every accepted-root/prior-site file; exact Pages run `40229602008` succeeded. Public HTTP byte/hash verification is BLOCKED/UNVERIFIED, and browser play acceptance has not begun. The original verifier result was not recoverable; an attempted replacement was refused and left an empty output artifact. A narrow process check found no matching verifier still running, but neither its exit result nor completed GETs are known. Do not infer success from CI, GitHub bytes or an empty artifact. A specific request for one further read-only six-file comparison is pending user response; do not repeat or bypass the denied action. No root promotion: public v0.7 remains accepted. Source files and tests are safe in GitHub; this block is the separate served-page verification gate. Latest verified recovery is `e1b576ee2041bd2772f79587e859a80b5ab1f108`; public accepted runtime remains v0.7 below.

## v0.7 published — 2026-10-25 19:50 UTC

Accepted runtime source: `03e769c1beff762ff370b7539cc0c8cb8589678d`; website: `bc706c9b87d4117aac6ddcf5436e1817bd1f9233`. Live: https://gggodlin.github.io/play/hv-v3-dot/ . Complete64 files/814222 bytes and63 manifest payloads were read back before promotion. Exact Pages run `40227611219` succeeded; all six public runtime HTTP200 bodies match source SHA256. Other works, previous candidates and fixtures remain untouched. This later publication receipt changes documentation/manifest only.

New gameplay: transparent fixed-spec weapon commissions after first win. Earned credits can buy current-level Superior/R110/Slaughter axe, rapier or club; exact stat tradeoffs and remaining balance shown, explicit confirmation, one locked item, no auto-equip. Price `max(250,4*saleValue)` is an independent adaptation, not original Bazaar/Training/Forge. Purchase may use all credits; expeditions remain free. No new durable item/schema, no catalog RNG, no changed ordinary drops/combat.

416 tests/four syntax checks pass. Independent acceptance covers1500 purchases/actual v0.6-validator roundtrips and3000 full ordinary-item/RNG fingerprints. Final100-seed natural measurement:60/100 found strict same-family offers within20 clears;20 faster/38 equal/2 slower, all wins. Median first-use spend97.89%, zero balances disclosed. Not a universal improvement or a complete long-term economy.

Actual cloud browser verified first-win/funds guard, natural old-save import, cancel/no debit, exact locked delivery/no auto-equip, equip/stronger replay, reload, ownership revocation, double-click single delivery and narrow393CSSpx layout. Same natural starting save: original club stage3 14.7s, purchased club10.6s. Final public root retained originalLv19/XP470/gold8764/wins76/items99 before explicit takeover; oldv0.6 became read-only. Cancel/reload preserved all values. Actual root club purchase1036 then equip changed attack187→237; stage3 cleared10.6s. After normal auto-loop/retreat/reload:Lv19,XP674/1192,gold7888,wins77,kills472,inventory102, purchased club equipped, auto-saleOFF. No app-origin errors observed. Candidate data did not mix with stable.

Bounded desktop GO only: inherited schema-negative browser gap, physical mobile, OS suspension and foreground-only visibility anomaly remain unresolved. No offline earnings. BROWSER-QA-V07.md separates observed cases from automated coverage. Quiet-hour publication produced no routine user notification. Source backup is not a personal browser-save, GPT Library, credential or schedule restoration claim.

## Retained prior releases

## v0.6 published — 2026-10-25 19:08 UTC

Accepted runtime source: `2346d7d3a2e2ec2f610180c6d59b68ddde53b071`; website: `4e9be8514d82de3b7c383ab919003d3b82750304`. Live: https://gggodlin.github.io/play/hv-v3-dot/ . All 56 source files / 666816 bytes and 55 manifest payloads were read back before promotion. Exact Pages run `40224227625` passed; six public runtime HTTP200 bodies match source SHA-256. Five runtime blobs changed; session, candidates, test fixtures and other works were preserved. This receipt updates documentation only.

361 tests and four JS syntax checks pass. A final 100-seed actual-engine rerun (300 policy runs) confirms bounded inventory relief: median additional wins OFF59 / equipped keepers64 / locked alternatives74; all runs eventually stop safely. Drop/RNG common prefixes and original items are preserved. New gameplay convenience: default-OFF future-drop sale, same-base strict six-stat dominance against equipped/locked keepers, exact-ID manual preview and atomic confirmation. Score alone never authorizes sale; unknown, equal/tradeoff, locked/equipped and Superior+ items remain. This is an explicit single-player adaptation, not a new original-HV economy or infinite idle claim.

Actual CUA verified old-save import/cancellation, precise manual batches, future-only activation, ownership revocation, actual new-drop auto-sale through a normal UI-exported log, original-item preservation, natural near-full stop118, OFF reload and narrow modal layout. Final root retained Lv19, XP470/1192, gold8764, wins76 and99 inventory items; defaultOFF/read-only held before explicit shared-v3 takeover. Old v0.5 became read-only; root preview/cancel/reload did not sell anything, and normal combat worked with autoOFF. No unexplained app-origin errors in inspected root logs.

Important bounded gap: schema-specific rejection has Node/UI-harness evidence but was not directly exercised in browser, due file-transfer/download tooling restrictions. Real valid imports and a real file-read-failure preserving state were observed separately; do not conflate them. A refused internal-download-page observation was stopped, not bypassed. Independent QA gives bounded desktop GO; BROWSER-QA-V06.md records exact scope. Physical mobile, OS suspension and inherited foreground-only visibility behavior remain unverified. Old validators may drop the new opt-in safely to OFF. Quiet-hour publication produced no routine user message; the 19:00 run joined this existing release gate rather than duplicating work.

## Retained prior releases

## v0.5 published — 2026-10-25 17:33 UTC

Accepted runtime source: `3cc1a3d4e25205ebb4a969dcf0f8c0cd91de1d76`; website: `25b8f474b42de1a68535fe176dc0cb0548a26ed8`. Live: https://gggodlin.github.io/play/hv-v3-dot/ . All 46 source files / 490515 bytes were read back before promotion; 45 manifest payload hashes verified. Exact Pages run `40216688254` succeeded, and all six live runtime HTTP200 bodies match source SHA-256. Only four root blobs changed (index, engine, UI, style); candidates and other works were preserved. This receipt is documentation-only.

262 Node tests and four JS syntax checks pass. New gameplay: deterministic armored/agile roles from stage 3, camp four-wave preview, live defenses after PA/stun and cautious equipment hints. Stages 1–2 preserve previous state/RNG; HP, attack, block, rewards, proc and item rules stay unchanged. Role constants/schedule are explicitly independent adaptations, inspired only by original class differentiation. All 120 waves match preview. Seeds 1–100 naturally clear stages 1–5; paired median slowdowns for stages 3/4/5 are 11.7%/0%/10.5%. Real generated weapon comparisons do not support a universal best weapon; see BUILD-GUIDE.md.

Actual cloud Chrome verified previews and living role/boss values, PA-adjusted mitigation, stun suppression without removing block, natural loot/equip progression, narrow layout and reload. Final public root retained Lv19, XP40/1192, gold8424, kills442, wins73 and 94 inventory items. Shared-v3 takeover made the new v0.5 tab writable and the previous v0.4 tab read-only. Root combat visibly showed a stunned agile enemy with 3.9% mitigation, 0% evade/parry and 1.5% block beside an unaffected baseline enemy. No app-origin errors in inspected logs; final camp retained four preview rows. See BROWSER-QA-V05.md and RELEASES.md.

The v3 save schema remains compatible; older tabs retain old gameplay until refreshed. Exact 120-wave/RNG/cap/expiry assertions are automated evidence, not exhaustive browser play. Armored PA was not directly captured in this browser pass; other actual PA/stun readouts and all combinations pass tests. New file import was not rerun. Narrow zoom is not physical mobile; OS suspension and the prior foreground-only visibility anomaly remain unresolved. No offline earnings. Quiet-hour publication was completed without a routine user notification.

## Retained prior releases

## v0.4 published — 2026-10-25 16:30 UTC

Accepted runtime source: `b47ecc87f5fa66bbd2dbf85f7581bdc06626f74f`; website: `5aa89cb1771f3b934e26a8085030830f2747c73b`. Live: https://gggodlin.github.io/play/hv-v3-dot/ . All 39 source files / 389175 bytes were read back before promotion; 38 manifest payload hashes verified. Exact Pages run `40211704287` succeeded; all six live runtime files returned HTTP200 with matching SHA-256. Only five root runtime blobs changed because session.js is unchanged; candidates and concurrent unrelated website work were preserved. This receipt changes documentation only.

202 Node tests and four JS syntax checks pass. New gameplay: club stun, no refresh, loss of enemy evade/parry, earned recovery action before the next player turn, visible countdown/recovery cues and honest equipment descriptions. Fixed 25% / four ticks and recovery-turn coalescing are explicitly labeled adaptations. The review-found partition-dependent double strike was fixed; seven timing partitions agree. PA behavior and item numeric/RNG generation remain unchanged.

Cloud Chrome used natural drops to equip the club and armor, clear stages 2–8 and reach stage 9. Active stun, recovery notices and persistent logs were observed with reduced motion. Narrow layout and reload passed. The public root retained Lv18, XP421/1076, gold7874, kills412, wins68 and 82 inventory items. Shared-v3 takeover made the new v0.4 tab writable and older v0.3 tab read-only; reload kept equipment and progress. A living enemy on the public root visibly had four stun ticks. No app-origin errors in inspected logs. See BROWSER-QA-V04.md and RELEASES.md.

The existing v3 save schema is retained after actual prior-validator compatibility tests. Older tabs still run their old combat until refreshed; use refresh or explicit takeover for current mechanics. Fatal recovery and exact boundary details have automated evidence, not natural browser observation. File-chooser import was not rerun; 393 CSS-pixel zoom is not a physical-mobile test. OS suspension and inherited foreground-only visibility anomaly remain unresolved; no offline earnings or universal background guarantee.

## Retained prior releases

## v0.3 published — 2026-10-25 15:28 UTC

Accepted runtime source: `fee2d2ade97b959cb3d396b5f863279ed84edd53`; website: `45666f8ea1d0612d1e4b294ded7fb98340c73428`. Live: https://gggodlin.github.io/play/hv-v3-dot/ . All 35 source files / 299045 bytes were read back exactly before promotion;34 payload hashes verified. Pages run `40206772110` succeeded; all six public runtime HTTP200 bodies match source SHA-256. This receipt updates documentation only, not runtime.

147 Node tests and four JS syntax checks pass. New gameplay: rapier Penetrated Armor (historical post-hit model), explicit weapon identities/legacy migration, visible enemy stacks/ticks, reduced-motion proc notice, and stat-only score disclosure. Fixed 25% / seven ticks / shared refresh are explicit adaptations; current English wiki semantics differ. No stage stats, item rolls or drop rates changed.

Cloud Chrome verified normal clear→loot→equip→faster replay, natural rapier drop/equip and stage 2 clear, real PA text/countdown, reload, v3 two-tab takeover, and isolated v2→v3 migration on the public root. An actively saving old v0.2 tab could not replace v3 strategy/equipment. Final root boss visibly had PA 1/3 and seven ticks. Browser tests did not read hidden localStorage bytes; legacy-byte preservation is source/unit evidence. See BROWSER-QA-V03.md and RELEASES.md.

Limits: exact seven-tick expiry/max three visually unobserved (automated coverage); new filechooser import not rerun; narrow layout checked via browser zoom at 393 CSS pixels, not physical mobile. OS suspension and cloud foreground-only pause anomaly remain unresolved; no offline earnings or universal background guarantee.

## Retained prior releases

## v0.2 published — 2026-10-25 14:22 UTC

Accepted runtime source: `12e151786047612e7254783288cf890507d55b5f`; website: `6a93b851e3ef7b12bf59fcb569cf3ccafda12895`. Live: https://gggodlin.github.io/play/hv-v3-dot/ . All 28 source files were read back byte-for-byte from the exact source commit; 27 payload manifest hashes verified. Pages run `40201709893` succeeded; all six public runtime files returned HTTP 200 and matching SHA-256. The website update preserved concurrent commit `9d2829d7e1962fa168e2d7f1adc34c07d1f51b24` and all other works. See RELEASES.md.

88 Node tests and four JS syntax checks pass. v0.2 adds balanced/assault/sustain auto policies, timer-driven online background processing, Web Locks single-writer controls, explicit takeover and read-only v1-to-v2 save migration. Final root Chrome smoke verified migration preserved Lv2, XP42/69, gold100, kills10, wins1, inventory2; candidate Lv7 did not mix. Assault selection persisted after reload, migration banner did not repeat, and a root battle started. No app-origin console errors in inspected entries.

Bounded desktop acceptance only: inactive-tab progress, follower/takeover and 388 CSS-pixel zoom layout observed. Foreground-only pause did not occur in cloud Chrome while document.hidden reported false; unresolved and not a universal pause guarantee. Physical mobile and OS suspension untested. Timer gaps over five seconds are discarded; no offline earnings. Old v1 saves remain untouched; unsupported locks use foreground/export-only memory fallback.

## Retained v0.1 release history

2026-10-25: v0.1 desktop-first playable prototype was published at https://gggodlin.github.io/play/hv-v3-dot/ . The verified runtime source checkpoint is `78316483e93480e6c636c3d1ff5a31bdb729e24d` on `bot/dot`; website commit is `0cc3c431e7e161936f0c1c80cf88b4453ab2eb74`. Pages run `40196513414` completed successfully. All five runtime HTTP responses match the backed-up source bytes and SHA-256 hashes. See RELEASES.md for durable publication evidence and BROWSER-QA.md for the accepted scope and limits.

55 Node tests and JavaScript syntax checks pass. Dedicated cloud Chrome verified combat → loot → equip → faster replay and save export/import/reload. Final public-root smoke at 13:15 UTC passed: independent fresh save, first clear in 31.5 seconds, two loot items, stage 2 unlocked, consistent quality labels, successful return to camp, and no application-origin console errors in inspected entries. This documentation checkpoint does not change runtime files or republish the game. Candidate v0.1 remains separately available, uses separate localStorage keys, and is not the accepted root URL.

## Next priority
Safe loot management is complete within its conservative limits; credits still have no meaningful sink. Next research a transparent source-informed shop/commission or investment loop, keeping original facts and adaptations separate, no arbitrage, quote/RNG/reload safety and conservative saves. Do not call direct credit-for-damage original training without its AP/mastery requirements. Continue coverage of real visibility transitions, mobile and OS suspend without letting infrastructure replace gameplay iteration. Preserve accepted releases and source backups before promotion.

## Work allocation
- Research: original HV source evidence and explicit uncertainty.
- Combat: engine.js, engine tests, COMBAT-DESIGN.md.
- Loot: loot.js, loot tests, LOOT-DESIGN.md.
- Experience: index.html, style.css, ui.js, original visuals and persistence.
- Integration: shared interface, package, README, current status, acceptance.
- Backup: frozen snapshots only, exact commit readback before publication.

Each worker owns separate files. New rounds must inspect remote source/status and active work before dispatching duplicates. Preserve accepted release while next candidate is developed. Do not confuse documentation or backup checks with new gameplay.

## First acceptance target
Expedition → automatic combat → loot → equipment/growth → replay visibly stronger → higher-stage challenge. Verify defeat/recovery, repeat runs, save/reload/import validation, hidden-tab handling, mobile layout and key controls. First release is intentionally small but roadmap continues autonomously.

## Authority and boundaries
Independent capability test; only original-game inventory/research shared. No reuse of existing implementation, generated data/constants, pixel assets or other single-player designs. User authorizes independent additions/adaptations and continuing iteration, without repeatedly seeking direction. HV source repo writes only bot/dot; website exception only public/play/hv-v3-dot/ on GGGODLIN.github.io main. No user-computer work or unsolicited Codex delegation, no paid purchases, credentials or access changes. Old HV remains paused.

Hourly iteration automation configured 2026-10-25 for every hour from 21:00 Asia/Taipei. The 2026-10-25 13:00 UTC wake was received by the parent and continued the existing release work without duplicate dispatch. Continue development at night but suppress routine reports 01:00–08:59; reports resume 09:00. Record real outcomes and blockers, never claim activity without evidence.

### Browser fixture transfer checkpoint
The browser successfully imported its own exported natural v0.5 test save, including cancel/accept and manual sales. A synthetic unsupported-schema file in the executor-only /tmp was not readable by the browser (NotFoundError), so that attempt proves file-read-error preservation, not schema rejection. Two minimal synthetic fixtures under tests/browser-fixtures provide an authorized same-origin download path for the exact schema-negative browser check. They contain only generated Lv1 game data, are labeled non-checkpoints, and do not alter runtime.
