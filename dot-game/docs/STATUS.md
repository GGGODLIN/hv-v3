# Current status

2026-10-25 12:27 UTC: v0.1 candidate source complete. 54 Node tests pass (combat, loot, independent acceptance, UI static) and all three JavaScript modules pass syntax checks. Browser gameplay/visual/persistence acceptance is pending. Live root still serves the infrastructure probe.

The backed-up runtime will first be staged at /play/hv-v3-dot/candidates/v0.1/ for cloud-browser QA because executor localhost is not reachable by the cloud browser. Candidate storage is namespaced separately from the accepted root. Public candidate existence is not acceptance; only after QA passes will root be promoted. No old game is overwritten.

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

Hourly iteration automation configured 2026-10-25 for every hour from 21:00 Asia/Taipei. Its first execution has not yet been observed. Continue development at night but suppress routine reports 01:00–08:59; reports resume 09:00. Record real outcomes and blockers, never claim activity without evidence.
