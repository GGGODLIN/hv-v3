# Camp navigation — v0.16

## Why this slice
The accepted v0.15 cloud UI at 1188 × 761 had a 3330 px document: abilities began at y1808, reports at y2536 and commissions at y2853. Five secondary systems competed in one long center column. This observation is a desktop snapshot, not a mobile test.

## Interaction contract
- 戰況: single-handed counterattack information, recent expedition reports and combat log.
- 配裝: the three existing gear presets and weapon commission.
- 成長: existing AP abilities and their original rule disclosures.
- Hero, battlefield, expedition controls and inventory stay outside the hidden secondary panels. Tabs are available in camp, combat and read-only tabs; existing action guards still govern game changes.
- Only one tab/panel is selected. Left/Right wrap, Home/End choose the endpoints. Tab reaches the selected tab and then visible content. Selection is page-local UI state, never game progress or a saved preference. Reload returns to 戰況.
- The controls do not dispatch game actions, save, reset combat timers, rebuild inventory or change the game mode. Rendering continues for inactive panels, so returning shows current state. Dialogs stay outside hidden panels.

## Research boundary
This navigation is independently designed presentation, not an original HV mechanic. No damage, equipment, loot, currency, ability, ownership or save migration rule is changed. Original-HV facts and existing adaptations remain documented in ORIGINAL-HV.md and the individual system guides.

## Acceptance plan
Source regression and focused keyboard/hidden-state tests; independent review of IDs, dialog focus and lifecycle; actual isolated browser import, switching during combat, victory/drop, gear/equipment and ability interactions, read-only guards and reload. Candidate source must be backed up before staging; production stays v0.15 until accepted. Actual results and explicit device limitations will be recorded separately, not inferred from tests.

## Build and restore
This directory is self-contained. With Node 20+ run `npm test`; with Python 3 run `python3 -m http.server 8000` from dot-game and open http://localhost:8000. No installation or compilation is required. Preserve all files, including src, assets, tests, docs and CHECKPOINT.json. Verify manifest payload byte counts and SHA-256. Source recovery does not restore browser saves: use the in-game 存檔 → 匯出存檔 / 匯入存檔 controls separately.

## Source acceptance — 2026-10-26 12:21 UTC
1,162/1,162 Node tests pass (seven new focused navigation cases), zero failures/skips; engine/loot/session/ui syntax passes. Independent review confirmed all old IDs remain unique, all nine existing feature subtrees retain their content, all dialogs stay outside main, and engine/loot/session bytes equal accepted v0.15. Six current-version assertions were updated and the ability test now extracts its own closing section rather than depending on its old order before reports; no historical fixture changed. Actual browser acceptance is still pending.

## Browser acceptance
Isolated desktop acceptance passed; see BROWSER-QA-V016.md for exact source/site references, keyboard and lifecycle evidence, normal import and explicit device limits. Production smoke is pending.
