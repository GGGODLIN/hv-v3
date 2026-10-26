# v0.17 source acceptance — 2026-10-26

Candidate and stable root accepted; publication chain verified. Actual evidence is in BROWSER-QA-V017.md.

- Full Node suite1,188/1,188; no failures/skips; four runtime syntax checks passed.
-19 new engine Protection tests and7 UI tests cover spell turn/MP cost, globalTick lifecycle, same-roll independent damage reduction, HP-capped prevention, heal priority, shortage fallback, legacy saves and ownership/read-only behavior.
- Independent read-only reviewer ran18,000 default-OFF complete-state/RNG/report comparisons against accepted v0.16 and350 same-RNG physical/magical damage matrix cases; all matched expected results.
- Literal official Spells text independently checked twice: cost percent is player's level rounded up. Source10?/15? uncertainty and missing cost/proficiency modifiers are disclosed; no original Auto-cast Slot fidelity claim.
- Initial aggregate failed six version-label assertions after the legitimatev016→v017 marker change; only those version expectations/test title were updated, then the complete suite passed. No engine expectation was weakened.
- loot.js and session.js are unchanged from the accepted restore. Independent SVG/CSS/canvas assets remain included; no excluded art/data/constants used.

Pending actual browser: legacy normal import, locked level8 state, natural growth to10, enable/disable, active MP/ticks and damage prevention, expiry/recast/return/report/reload, read-only control. No narrow/mobile claim without actual observation.
