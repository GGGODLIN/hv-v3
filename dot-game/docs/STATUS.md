# Current status

## v0.5 desktop accepted, publication pending — 2026-10-25 17:26 UTC

Public release remains v0.4 below. Candidate work adds deterministic armored/agile enemy roles from stage 3, camp route preview and live defense readouts. Stages 1–2 and all HP/attack/reward/proc/item rules are preserved; role values are explicit adaptations. 262 Node tests and four JS syntax checks pass. Independent 120-wave route/spawn checks and actual old-validator compatibility pass. Seeds1–100 naturally clear stages1–5; stages1–2 preserve prior state/RNG, paired stage3–5 median slowdowns are11.7%/0%/10.5%. See BUILD-GUIDE.md for equipment tradeoffs and sampling limits. Candidate source `3e692b4008a93ba45aaffe5d5e62d76378927f30` is exact-readback verified. Candidate site `7d6ae90e71245984034a8048b0443ec1b62bcf9e` / CI `40215716667` and six public hashes pass. Cloud Chrome verified four-wave previews, matching live armored/agile defenses, PA/stun-adjusted readouts, natural equip/progression, narrow layout and reload. See BROWSER-QA-V05.md for limits. Accepted-source backup, root promotion and final takeover smoke remain pending. No new persistent schema is intended. Routine reports are suppressed during Taipei 01:00–08:59 while authorized work continues.

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
Rapier and club slices are complete. Next prioritize recognizable enemy defensive roles and beginner-facing equipment decisions, checking current/historical source conflicts and separating original facts/research models/adaptations. Continue coverage of real visibility transitions, mobile and OS suspend without letting infrastructure replace gameplay iteration. Preserve accepted releases and source backups before promotion.

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
