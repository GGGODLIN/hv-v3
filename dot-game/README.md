# hv-v3 dot — independent idle loot RPG

[Play the accepted game](https://gggodlin.github.io/play/hv-v3-dot/) · [Current status](docs/STATUS.md) · [Historical records](docs/HISTORY-READMES-STATUS.md)

**Latest verified release: v0.20**, bounded-desktop accepted and published2026-10-26. From stage5, nonboss 赤砂守衛 alternates physical attacks with a telegraphed magical skill. Physical armor/parry do not stop magic; block, control, offense and Protection retain tradeoffs. [Rules and limits](docs/MAGICAL-ENCOUNTERS-GUIDE.md). Firstfour routes, rewards and prices remain unchanged; playerresistgrowth and monsterMP are not implemented.

## Play

1. Choose a stage and start an expedition. Combat and skills resolve automatically; return to camp to compare, equip, lock or sell earned loot.
2. Choose **均衡 / 猛攻 / 持久** at camp for different automatic skill/healing policies. Replay or challenge a higher stage; failed expeditions can recover, and expeditions cost no credits.
3. Use **戰況 / 配裝 / 成長** to browse secondary camp tools. Tabs support Left/Right/Home/End. Learn abilities with AP and activate them in Major slots; Protection is an optional, default-OFF choice at the selected level-10 gate.
4. After your first clear, preview a weapon commission and its supported suffix tradeoff before spending earned credits. Delivery is locked and never auto-equipped; an offer is not necessarily an upgrade.
5. **通關後回營** queues a one-shot stop after normal victory rewards; click again to cancel. During settled victory intermission it returns without awarding rewards again. **回營整備** retains immediate retreat behavior.

Export saves periodically before clearing browser data. The game has no real-money purchases. See [growth discovery](docs/GROWTH-DISCOVERY-GUIDE.md), [abilities](docs/ABILITIES-GUIDE.md), [Protection](docs/PROTECTION-GUIDE.md), [commissions](docs/COMMISSION-AFFIXES-GUIDE.md) and [finish-then-camp](docs/FINISH-CAMP-GUIDE.md).

## Restore and run

Accepted complete-source restore: `GGGODLIN/hv-v3`, branch `bot/dot`, pre-publication accepted commit **`69a7f8e3ebda6c9a31bdfc8973343f266626ba65`**, directory `dot-game/`. Retrieve the entire directory and verify `CHECKPOINT.json` payload hashes. The exact commit containing this publication receipt is the newer documentation checkpoint of the same accepted runtime and is preferred after its manifest verifies. Runtime source is `bb8c7ec2c070f9bb421d7b7b0a137c235b6aadf1`, root website `816ed14836a62be992a8f75e7b29258cd03a2009`. A source candidate is not automatically a published game.

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

[Current verification and remaining gates](docs/STATUS.md) · [v0.20 browser evidence](docs/BROWSER-QA-V020.md) · [Release ledger](docs/RELEASES.md). Earlier README/status checkpoints are preserved in the historical archive, not repeated as current pending work.
