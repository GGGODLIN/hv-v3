# hv-v3 dot — independent idle loot RPG

An independently designed single-player browser RPG inspired by original HentaiVerse research. This directory is self-contained: do not run or reuse the repository root application. Existing implementation, generated constants, monster dataset, art, and other authors' single-player proposals are excluded.

## Run
Requires Python 3 for static serving and Node 20+ for developer tests. No dependencies, installation, or build step.

```
cd dot-game
python3 -m http.server 8000
```

Open http://localhost:8000/ . Run `node --test tests/*.test.mjs` for checks. Do not open ES-module HTML via file://. Desktop and mobile browsers are intended. Game stays local in the browser; no server account, network gameplay, or offline progress.

## Play
Choose a stage and start an expedition. Combat and skills resolve automatically. Return to camp to compare, equip, lock, and sell loot, then replay or challenge a higher stage. Failed expeditions can recover; no real-money purchases. Export saves periodically; clearing browser storage can lose progress. The UI documents exact controls as implemented.

## Source and fidelity
See docs/ORIGINAL-HV.md for allowed research, docs/COMBAT-DESIGN.md and docs/LOOT-DESIGN.md for explicit adaptations. Original facts, fitted research models, and independent game decisions must remain distinct. Unknown original constants are not presented as exact. Early playable slices are milestones, not a permanent scope limit.

## Recovery and release
Source backups are committed to GGGODLIN/hv-v3 branch bot/dot under dot-game/. Retrieve the exact checkpoint commit; preserve source, tests, documentation and assets together. Verify the checkpoint manifest where provided, then serve and run tests. A source backup is not necessarily an accepted playable release: read docs/STATUS.md and its validation evidence. Browser saves are separate from source backups.

Accepted static releases deploy only to https://gggodlin.github.io/play/hv-v3-dot/ through the separate personal-site repo. Other branches of hv-v3 and other personal-site works are not modified. The old dot-probe is only infrastructure verification, not this game. This package cannot restore credentials, platform permissions or automation schedules.
