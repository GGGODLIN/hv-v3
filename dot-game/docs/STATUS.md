# Current status

## Latest verified release — v0.18

**Published and bounded-desktop accepted: 2026-10-26 14:09 UTC.** [Play](https://gggodlin.github.io/play/hv-v3-dot/).

- Accepted full-source publication receipt / restore: **`b61a8ed67ea9c58260dab0bb98ea754a6ff33f0a`** (`GGGODLIN/hv-v3`, `bot/dot`, `dot-game/`; baseline snapshot083, 164 files / 163 payloads).
- Runtime source: `92bf6bc0528b0066d63beff10ce0e3d0aa32ed72`; **1,253 source tests and four syntax checks passed** for that runtime. Documentation-only acceptance receipts reused those results.
- Pre-publication accepted source: `0c183aa010f77537ddb2cfe62b35236aa352bcf4`, verified before root `23d6b154f024d3c93b6ae0f9628bd5a76a11c373`.
- Exact root Pages run `40336345282` and six HTTP byte/SHA-256 comparisons passed; actual stable-root victory and reload passed. [BROWSER-QA-V018.md](BROWSER-QA-V018.md) records the observations and bounds.

v0.18 adds supported weapon-commission suffix choices and cancellable one-shot **通關後回營**. Actual candidate checks covered paid purchase/equip/fight, cancellation, already-settled intermission without duplicate rewards, reload reset and read-only controls. These are bounded observations, not evidence of universal gear superiority or complete original-HV fidelity.

The stable test profile stayed separate and naturally reached Lv9 / gold382 / wins11 / inventory20 / HP751; candidate progress was not imported. Prior v0.17 restore `69c837f85c01b8352be4316874dc959d2462e0cb` remains recoverable. Source backups do not restore personal browser saves, credentials, Library synchronization or schedules.

## Accepted candidate — v0.19 growth discoverability

**Bounded-desktop accepted, not root-published yet.** Runtime source `88907e42c728922a50038b219799a7baa6c74c4f` is backed up with 169 complete-source files. Candidate site `7a424212937f61ce019662ee44389397fc562760`, exact Pages `40340421670` success and six HTTP/source byte comparisons passed.

Implemented scope is presentation: truthful learn/slot/upgrade cues and explicit focus-only shortcuts using existing eligibility. Protection is a separate optional choice. No gameplay formulas, rewards, RNG, save schema or auto-allocation changed. **1,295/1,295 tests and four syntax checks passed**; 14,400 independent old/new state/RNG/report comparisons match. Actual browser tests cover fresh AP1, zero-AP slotting, Lv9 explicit growth, three victories naturally reaching Lv10, optional Protection, readonly, keyboard focus and reload. See [source acceptance](ACCEPTANCE-V019.md), [browser evidence](BROWSER-QA-V019.md), and [growth guide](GROWTH-DISCOVERY-GUIDE.md).

Remaining: accepted-source receipt backup, root deployment with exact CI/HTTP, then actual stable-root smoke. Stable is still the v0.18 release above. Documentation-only receipts reuse tested runtime results.

README/STATUS consolidation is maintenance, not gameplay. Every prior paragraph is preserved in [HISTORY-READMES-STATUS.md](HISTORY-READMES-STATUS.md); its old pending states are historical, not new blockers.

## Retained limits and boundaries

- Bounded cloud desktop only: physical mobile and OS suspension remain unverified; narrow CSS/zoom checks are not physical-device acceptance.
- No offline earnings or universal background guarantee; the inherited foreground-only visibility anomaly remains unresolved.
- Schema-negative import rejection has source/UI-harness evidence, not the missing direct browser case. A browser file-read failure must not be described as schema rejection.
- Original research, selected models and independent adaptations must stay explicit. No borrowed implementation, generated constants, pixels or other single-player designs. Old HV stays paused.
- Source writes are restricted to the authorized `bot/dot` game path; the separate website exception is `public/play/hv-v3-dot/`. Do not alter other works or treat this document as new publication authority.

See [README](../README.md) for play/restore instructions, [RELEASES.md](RELEASES.md) for the existing release ledger and [historical README/status records](HISTORY-READMES-STATUS.md) for earlier acceptance, denial and recovery receipts. Historical automation configuration is not proof of a currently running schedule.
