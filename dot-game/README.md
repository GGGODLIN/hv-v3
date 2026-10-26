# hv-v3 dot — independent idle loot RPG

[Play the accepted game](https://gggodlin.github.io/play/hv-v3-dot/) · [Current status](docs/STATUS.md) · [Historical records](docs/HISTORY-READMES-STATUS.md)

**Latest verified release: v0.22**, bounded-desktop accepted and published2026-10-26. Reports now remember the actual departure target/Protection policies, active ability ranks and equipped identities. Expand configuration details to understand which build produced a result; changing camp later does not rewrite history. No combat changes or claim of a best build. [Report guide](docs/REPORT-BUILD-GUIDE.md).

## Play

1. Choose a stage and start an expedition. Combat and skills resolve automatically; return to camp to compare, equip, lock or sell earned loot.
2. Choose **均衡 / 猛攻 / 持久** at camp for different automatic skill/healing policies, and **依序集火 / 施法者優先 / 低血量收尾** for attack targets. Replay or challenge a higher stage; failed expeditions can recover, and expeditions cost no credits.
3. Use **戰況 / 配裝 / 成長** to browse secondary camp tools. Tabs support Left/Right/Home/End. Learn abilities with AP and activate them in Major slots; Protection is an optional, default-OFF choice at the selected level-10 gate.
4. After your first clear, preview a weapon commission and its supported suffix tradeoff before spending earned credits. Delivery is locked and never auto-equipped; an offer is not necessarily an upgrade.
5. **通關後回營** queues a one-shot stop after normal victory rewards; click again to cancel. During settled victory intermission it returns without awarding rewards again. **回營整備** retains immediate retreat behavior.

Export saves periodically before clearing browser data. The game has no real-money purchases. See [growth discovery](docs/GROWTH-DISCOVERY-GUIDE.md), [abilities](docs/ABILITIES-GUIDE.md), [Protection](docs/PROTECTION-GUIDE.md), [commissions](docs/COMMISSION-AFFIXES-GUIDE.md) and [finish-then-camp](docs/FINISH-CAMP-GUIDE.md).

## Restore and run

Accepted complete-source restore: `GGGODLIN/hv-v3` / `bot/dot` / `dot-game/`, prepublication accepted commit **`aa6cd6166d9424745ce9b82bb7e58d73e4bc5b21`**. Retrieve the entire directory and verify `CHECKPOINT.json` payload hashes. The exact commit containing this publication receipt is a newer documentation checkpoint of the same accepted runtime and is preferred after its manifest/readback verifies. Runtime source `6e0614dd199c958a4d3ce7c84592936d61d2e822`; root site `0abefbcc311d68f37c56751e3c45f94a2812e39f`. A source candidate is not automatically published.

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

[Current verification and remaining gates](docs/STATUS.md) · [v0.22 browser evidence](docs/BROWSER-QA-V022.md) · [Release ledger](docs/RELEASES.md). Earlier README/status checkpoints are preserved in the historical archive, not repeated as current pending work.
