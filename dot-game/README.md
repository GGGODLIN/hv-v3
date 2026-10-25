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
Version 0.6 has bounded desktop candidate acceptance; public v0.5 remains accepted until verified publication. It adds optional conservative future-drop sales and an exact-item cleanup preview. Default OFF, no retroactive sweep, no score-based disposal: only low-quality strict same-base downgrades against equipped/locked keepers qualify. Unknown item-schema imports fail without overwriting the existing save. This is an independent convenience rule, not an original-HV economy claim. See docs/LOOT-MANAGEMENT.md for precise limits.

Version 0.5 is published at https://gggodlin.github.io/play/hv-v3-dot/ . See docs/STATUS.md, docs/RELEASES.md and docs/BROWSER-QA-V05.md for exact source/deployment evidence and bounded desktop acceptance. From stage 3, armored/agile enemy roles make weapon choices visible. Camp preview shows the next route; combat readouts reflect PA/stun effects on actual defenses. New role values are independent adaptations, not imported original monster data. Stages 1–2 remain unchanged. See docs/BUILD-GUIDE.md for honest equipment tradeoffs.

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
