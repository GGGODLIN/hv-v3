# Current status

## v0.3 development candidate — 2026-10-25 15:00 UTC

Accepted public runtime remains v0.2 below. This candidate adds explicit weapon-family identity and historical-model rapier Penetrated Armor, with migration of exact independently generated legacy item names, combat feedback and proc-aware comparison text. 147 Node tests and four JS syntax checks pass. Browser acceptance and source publication are pending; this is not yet a verified restore or playable release. v0.3 uses isolated save-v3/writer-v3 and read-only ordered v2/v1 migration: a pinned old validator was proven to strip new metadata, so mutual exclusion alone is insufficient. Only own dot-game files are changed. Research found conflicting current English and historical Chinese PA semantics; see ORIGINAL-HV.md for the deliberately pinned model.

## v0.2 published — 2026-10-25 14:22 UTC

Accepted runtime source: `12e151786047612e7254783288cf890507d55b5f`; website: `6a93b851e3ef7b12bf59fcb569cf3ccafda12895`. Live: https://gggodlin.github.io/play/hv-v3-dot/ . All 28 source files were read back byte-for-byte from the exact source commit; 27 payload manifest hashes verified. Pages run `40201709893` succeeded; all six public runtime files returned HTTP 200 and matching SHA-256. The website update preserved concurrent commit `9d2829d7e1962fa168e2d7f1adc34c07d1f51b24` and all other works. See RELEASES.md.

88 Node tests and four JS syntax checks pass. v0.2 adds balanced/assault/sustain auto policies, timer-driven online background processing, Web Locks single-writer controls, explicit takeover and read-only v1-to-v2 save migration. Final root Chrome smoke verified migration preserved Lv2, XP42/69, gold100, kills10, wins1, inventory2; candidate Lv7 did not mix. Assault selection persisted after reload, migration banner did not repeat, and a root battle started. No app-origin console errors in inspected entries.

Bounded desktop acceptance only: inactive-tab progress, follower/takeover and 388 CSS-pixel zoom layout observed. Foreground-only pause did not occur in cloud Chrome while document.hidden reported false; unresolved and not a universal pause guarantee. Physical mobile and OS suspension untested. Timer gaps over five seconds are discarded; no offline earnings. Old v1 saves remain untouched; unsupported locks use foreground/export-only memory fallback.

## Retained v0.1 release history

2026-10-25: v0.1 desktop-first playable prototype was published at https://gggodlin.github.io/play/hv-v3-dot/ . The verified runtime source checkpoint is `78316483e93480e6c636c3d1ff5a31bdb729e24d` on `bot/dot`; website commit is `0cc3c431e7e161936f0c1c80cf88b4453ab2eb74`. Pages run `40196513414` completed successfully. All five runtime HTTP responses match the backed-up source bytes and SHA-256 hashes. See RELEASES.md for durable publication evidence and BROWSER-QA.md for the accepted scope and limits.

55 Node tests and JavaScript syntax checks pass. Dedicated cloud Chrome verified combat → loot → equip → faster replay and save export/import/reload. Final public-root smoke at 13:15 UTC passed: independent fresh save, first clear in 31.5 seconds, two loot items, stage 2 unlocked, consistent quality labels, successful return to camp, and no application-origin console errors in inspected entries. This documentation checkpoint does not change runtime files or republish the game. Candidate v0.1 remains separately available, uses separate localStorage keys, and is not the accepted root URL.

## Next priority
Add original-HV-informed weapon procs and meaningful build variety, with explicit original facts/research models/adaptations. Continue coverage of real visibility transitions, mobile and OS suspend without letting infrastructure replace gameplay iteration. Preserve accepted releases and source backups before promotion.

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
