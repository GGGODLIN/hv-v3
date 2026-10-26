# Current status

## v0.20 candidate — source verified, browser/publication pending

- One later-route mixed physical/magical-skill enemy with next-action telegraph; firstfour routes unchanged. No new MP/element/resist-equipment system.
- Integration **1,318/1,318 tests** passed; 12,000 exact firstfour-route state/RNG/report comparisons and independent historical parity check. Natural measurement preserves rare casts and worse outcomes rather than claiming universal benefit; see MEASUREMENT-V020.md.
- Candidate source backup, isolated browser acceptance and root publication must be recorded before treating this as accepted. Latest verified release remains v0.19 below.

## Latest verified release — v0.19

**Published and bounded-desktop accepted: 2026-10-26 14:45 UTC.** [Play](https://gggodlin.github.io/play/hv-v3-dot/).

- Runtime source: `88907e42c728922a50038b219799a7baa6c74c4f`.
- Pre-publication accepted complete-source backup: **`deb39342a5ac84a85c9e898370a2acbf10b02432`**, `GGGODLIN/hv-v3` / `bot/dot` / `dot-game/`, 170 files / 169 manifest payloads. The exact commit containing this publication receipt is the newer documentation checkpoint of that same runtime; all source, tests, assets and recovery documents must remain together.
- Root website: **`ccaddf45ff38ad09263e65dbe3f5bd01fd8508f5`**, exact Pages **`40342010206` success**, six HTTP 200 byte/SHA-256 comparisons passed. Root actual growth→learn→slot→fight→victory→reload smoke passed.
- Source **1,295/1,295 tests**, four runtime syntax checks and **14,400 exact baseline state/RNG/report comparisons** passed. Docs-only acceptance/publication receipts reuse these unchanged-runtime results.
- Isolated candidate `7a424212937f61ce019662ee44389397fc562760`, Pages `40340421670`, six HTTP comparisons and actual browser acceptance passed before root promotion.

### What changed

Growth tab now exposes eligible **learn / slot / upgrade** choices instead of merely showing unspent AP. It prioritizes learned-but-uninstalled abilities and distinguishes optional Protection from growth upgrades. The shortcut only focuses an existing control; no automatic spending, allocation or casting. AP affordability, level gates and maximum ranks remain unchanged. No combat/loot formulas, rewards, RNG or saved-state changes.

Actual candidate play covered AP1 individually affordable alternatives, AP0 pending slot, normal Lv9 import, explicit three-line configuration, three normal victories to natural Lv10, Protection choice, readonly behavior, keyboard focus and reload. Stable retained its separate profile; root smoke explicitly learned/slotted HP Tank and won once: Lv9 / gold458 / wins12 / inventory21 / HP824 / AP8 / one active slot / ProtectionOFF. It remains in camp with battle tab selected. Source backups do not recover personal browser progress.

See [source acceptance](ACCEPTANCE-V019.md), [browser evidence](BROWSER-QA-V019.md) and [growth guide](GROWTH-DISCOVERY-GUIDE.md). No active v0.19 release blocker remains.

## Recovery and retained limits

- [README](../README.md) describes restore/run/play. Prior accepted v0.18 full-source receipt `b61a8ed67ea9c58260dab0bb98ea754a6ff33f0a` remains recoverable, not the preferred latest version.
- README/STATUS consolidation is maintenance, not gameplay. Every earlier paragraph is preserved in [HISTORY-READMES-STATUS.md](HISTORY-READMES-STATUS.md); old pending/denied statements are historical, not current blockers. [RELEASES.md](RELEASES.md) links release evidence.
- Bounded cloud desktop only; higher-rank gates/upgrades have source/UI-harness coverage, not fabricated high-level browser progress. Physical mobile, narrow viewport and OS suspension remain unverified.
- No offline earnings or universal background guarantee; inherited foreground-only visibility anomaly remains unresolved. Schema-negative import rejection has source/UI-harness evidence, not the missing direct browser case.
- Original facts, selected research models and independent adaptations remain explicit. No borrowed implementation, generated constants, pixels or other single-player design. Old HV stays paused.
- Source writes remain limited to authorized `bot/dot` game paths; website exception only `public/play/hv-v3-dot/`. No dot-archive or other work touched. No claim of Library synchronization, credential, personal-save or schedule recovery.
