# Current status

## v0.2 candidate — 2026-10-25 14:06 UTC
Remote base verified at 088c930e3c86fc9cd4a2fce46e863800fabac648. Current work is a separate candidate; public root still runs accepted v0.1 below. 88 Node tests and JS syntax checks pass. v0.2 adds cost-based balanced/assault/sustain auto policies, timer-driven online background processing, Web Locks single-writer controls, explicit takeover, and read-only v1-to-v2 save migration. Prior v1 save keys are never overwritten or deleted. Unsupported locks use export-only foreground memory mode. Browser throttling/OS suspension can stop progress; gaps over 5 seconds are discarded, not offline-rewarded.

Candidate backup and staging must complete before real browser QA. Do not promote root until that gate passes. Current required checks: actual background tab progress; read-only second tab/takeover; strategy selection and costs; old-save migration; no application console errors. Both fixed ownership lifecycle defects and migration races have independent tests, not a claim of browser acceptance.

## Published baseline

2026-10-25: v0.1 desktop-first playable prototype is published at https://gggodlin.github.io/play/hv-v3-dot/ . The verified runtime source checkpoint is `78316483e93480e6c636c3d1ff5a31bdb729e24d` on `bot/dot`; website commit is `0cc3c431e7e161936f0c1c80cf88b4453ab2eb74`. Pages run `40196513414` completed successfully. All five runtime HTTP responses match the backed-up source bytes and SHA-256 hashes. See RELEASES.md for durable publication evidence and BROWSER-QA.md for the accepted scope and limits.

55 Node tests and JavaScript syntax checks pass. Dedicated cloud Chrome verified combat → loot → equip → faster replay and save export/import/reload. Final public-root smoke at 13:15 UTC passed: independent fresh save, first clear in 31.5 seconds, two loot items, stage 2 unlocked, consistent quality labels, successful return to camp, and no application-origin console errors in inspected entries. This documentation checkpoint does not change runtime files or republish the game. Candidate v0.1 remains separately available, uses separate localStorage keys, and is not the accepted root URL.

## Next priority
Do not stop at this baseline. Improve online background-idle behavior (distinct from offline earnings), verify mobile layout, and add meaningful original-HV-informed skill/gear choices. Protect saves and keep accepted release stable while extending a candidate. Choose the next bounded increment autonomously from ROADMAP.md and observed play issues.

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
