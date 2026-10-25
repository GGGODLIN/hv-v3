# Current status

2026-10-25 13:09 UTC: v0.1 desktop-first playable candidate accepted for publication. 55 Node tests pass and JavaScript syntax checks pass. Dedicated cloud Chrome verified the combat→loot→equip→faster replay loop and save export/import/reload. See BROWSER-QA.md for exact observations and untested boundaries. Public root promotion remains pending until publication receipt/HTTP verification confirms it; no success is assumed from this file alone.

Prior source checkpoint 82aaec41a926de697e953d3151153f6894866502 is fully readback-verified; candidate site commit 5c6301c0a8e72cdad96fcca64b2922d7a9c317a4 passed CI/HTTP. This snapshot adds the quality-label fix and browser evidence. Source must be saved and read back before promotion of /play/hv-v3-dot/. Candidate subdirectory remains separately named and uses separate localStorage keys.

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

Hourly iteration automation configured 2026-10-25 for every hour from 21:00 Asia/Taipei. Its first execution has not yet been observed. Continue development at night but suppress routine reports 01:00–08:59; reports resume 09:00. Record real outcomes and blockers, never claim activity without evidence.
