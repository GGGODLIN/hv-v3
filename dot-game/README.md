# hv-v3 dot — independent idle loot RPG

[Play the accepted game](https://gggodlin.github.io/play/hv-v3-dot/) · [Current status](docs/STATUS.md) · [Historical records](docs/HISTORY-READMES-STATUS.md)

**Development candidate: v0.22 — departure-build report context.** Latest verified public release remains v0.21 (`9998ac34176ab2bc0055e60ca340e7a86a602016`). The new compact policy row and collapsed actual slotted-ability/equipment details record start configuration without changing combat. [Report guide](docs/REPORT-BUILD-GUIDE.md). Browser acceptance and publication are pending; a source candidate is not a published release.

## Play

1. Choose a stage and start an expedition. Combat and skills resolve automatically; return to camp to compare, equip, lock or sell earned loot.
2. Choose **均衡 / 猛攻 / 持久** at camp for different automatic skill/healing policies, and **依序集火 / 施法者優先 / 低血量收尾** for attack targets. Replay or challenge a higher stage; failed expeditions can recover, and expeditions cost no credits.
3. Use **戰況 / 配裝 / 成長** to browse secondary camp tools. Tabs support Left/Right/Home/End. Learn abilities with AP and activate them in Major slots; Protection is an optional, default-OFF choice at the selected level-10 gate.
4. After your first clear, preview a weapon commission and its supported suffix tradeoff before spending earned credits. Delivery is locked and never auto-equipped; an offer is not necessarily an upgrade.
5. **通關後回營** queues a one-shot stop after normal victory rewards; click again to cancel. During settled victory intermission it returns without awarding rewards again. **回營整備** retains immediate retreat behavior.

Export saves periodically before clearing browser data. The game has no real-money purchases. See [growth discovery](docs/GROWTH-DISCOVERY-GUIDE.md), [abilities](docs/ABILITIES-GUIDE.md), [Protection](docs/PROTECTION-GUIDE.md), [commissions](docs/COMMISSION-AFFIXES-GUIDE.md) and [finish-then-camp](docs/FINISH-CAMP-GUIDE.md).

## Restore and run

Latest fully accepted complete-source restore is `GGGODLIN/hv-v3` / `bot/dot` / `dot-game/` at **`9998ac34176ab2bc0055e60ca340e7a86a602016`** (v0.21). Retrieve the entire directory and verify `CHECKPOINT.json` payload hashes. This v0.22 candidate has a separate full-source snapshot and must not replace that accepted reference until its acceptance ledger passes. Stable website remains `764e43b6736dde7795340a69aa181bf31e2003e0`. A source candidate is not automatically a published game.

From the restored `dot-game/` directory (Node.js and Python 3 required):

```sh
npm test
npm start
# Open http://localhost:8000
```

Browser saves are separate: source restoration does not restore personal progress, credentials, Library synchronization or schedules. Candidate and stable saves stay separate. Older tabs retain their loaded rules until refreshed; only the writer owns progress. Use explicit takeover when needed. See [save behavior](docs/UI-AND-SAVES.md) and [save recovery](docs/SAVE-RECOVERY.md).

## Fidelity and known limits

- Original HV facts, fitted research models and independent idle-game adaptations remain distinct; this is not the complete original HV system. See [source ledger](docs/ORIGINAL-HV.md), [combat](docs/COMBAT-DESIGN.md) and [loot](docs/LOOT-DESIGN.md).
- No offline earnings or universal background guarantee. Long timer gaps are discarded; unsupported Web Locks use a foreground/export-only fallback.
- Acceptance is bounded cloud-desktop evidence, not physical-mobile or OS-suspend validation. Narrow browser layouts are not physical-device tests. The historical foreground-only visibility anomaly and schema-negative browser-test gap remain disclosed.
- Reports, tab selection and finish-then-camp intent are transient, not saved growth. Save migrations preserve older namespaces without merging later old-tab progress.

[Current verification and remaining gates](docs/STATUS.md) · [v0.21 browser evidence](docs/BROWSER-QA-V021.md) · [Release ledger](docs/RELEASES.md). Earlier README/status checkpoints are preserved in the historical archive, not repeated as current pending work.
