# hv-v3 dot — independent idle loot RPG

[Play the accepted game](https://gggodlin.github.io/play/hv-v3-dot/) · [Current status](docs/STATUS.md) · [Historical records](docs/HISTORY-READMES-STATUS.md)

**Development candidate: v0.21 — target priorities.** Camp choices keep the default first-alive order, or prioritize persistent caster identity / lowest current HP. These automatic policies are independent adaptations, not original-HV AI. See [target rules](docs/TARGET-PRIORITY-GUIDE.md). Tests and browser/public acceptance are recorded separately in [status](docs/STATUS.md). Latest accepted public release remains v0.20 until all release gates pass.

## Play

1. Choose a stage and start an expedition. Combat and skills resolve automatically; return to camp to compare, equip, lock or sell earned loot.
2. Choose **均衡 / 猛攻 / 持久** at camp for different automatic skill/healing policies. Replay or challenge a higher stage; failed expeditions can recover, and expeditions cost no credits.
3. Use **戰況 / 配裝 / 成長** to browse secondary camp tools. Tabs support Left/Right/Home/End. Learn abilities with AP and activate them in Major slots; Protection is an optional, default-OFF choice at the selected level-10 gate.
4. After your first clear, preview a weapon commission and its supported suffix tradeoff before spending earned credits. Delivery is locked and never auto-equipped; an offer is not necessarily an upgrade.
5. **通關後回營** queues a one-shot stop after normal victory rewards; click again to cancel. During settled victory intermission it returns without awarding rewards again. **回營整備** retains immediate retreat behavior.

Export saves periodically before clearing browser data. The game has no real-money purchases. See [growth discovery](docs/GROWTH-DISCOVERY-GUIDE.md), [abilities](docs/ABILITIES-GUIDE.md), [Protection](docs/PROTECTION-GUIDE.md), [commissions](docs/COMMISSION-AFFIXES-GUIDE.md) and [finish-then-camp](docs/FINISH-CAMP-GUIDE.md).

## Restore and run

For this development candidate, restore the exact verified v0.21 source checkpoint only after its backup receipt exists. Until candidate acceptance, the accepted recovery remains v0.20 **`ee44bf5b2e270e9f71dc62a5567fe7f82053e93b`**, `GGGODLIN/hv-v3` / `bot/dot` / `dot-game/`. Retrieve the entire directory and verify `CHECKPOINT.json` payload hashes. Source candidates and public test pages are not automatically accepted releases.

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
