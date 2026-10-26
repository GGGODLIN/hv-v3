# Item World first tier — v0.26 Exquisite access

This is one complete seed → challenge → permanent IW1 loop, not full original Item World. v0.26 extends the existing first tier to Exquisite weapons without retuning it. Browser acceptance and publication are tracked separately in STATUS.md.

## Play

1. Every normal expedition clear earns **one World Seed**, up to 1,000,000,000. This deterministic single-player pacing is an adaptation, not an original drop rate. Old victories grant nothing retrospectively.
2. At camp, select an owned **Soulbound Fair, Average, Superior or Exquisite axe, rapier or club**. The target may be equipped or in the backpack; entering does not auto-equip it. Pending loot is not an owned-entry target.
3. Preview the exact target, current and prospective stats, one-seed price, and five-round challenge. Confirm explicitly to spend one seed. No automatic spending or retry is provided.
4. Clear all five rounds to permanently gain IW1 on that same item ID. This checkpoint stops at IW1. The original table ends at IW10 for Fair/Average/Superior and IW15 for Exquisite; this is a quality-specific original limit, not implemented access to later tiers. Other qualities and every IW2+ tier remain **unimplemented**, not asserted to be illegal in original HV.

The trial always returns to camp on victory, defeat or retreat, without changing the normal-route selection, unlocks, win count, best times or automatic stage-advance preference. Killed enemies retain their ordinary XP and nonboss item-drop behavior (including the existing maximum-level500 load cap: XP above the current threshold is clamped on reload), but each kill's credit award is `floor(normal kill credits / 4)`. There is no ordinary expedition completion XP, credits, guaranteed item, fragments or seed. Trial reports identify the target and actual upgrade rather than inventing a normal-route victory.

Entry consumes the seed immediately. **Defeat, retreat and reload do not refund it** in this adaptation. Already earned XP/loot are retained; no failed/abandoned trial grants IW1. Reload safely returns to camp and does not restore or simulate the interrupted challenge. Original consumption-on-entry is sourced; no-refund-after-failure/reload is not established by the available primary evidence and is explicitly our persistence rule.

## Difficulty, rewards and capacity

Original first-tier table for all four supported qualities: five rounds, monster level100, Hard, one seed. This game lacks the original level100/Hard model. Its separately labeled challenge freezes a local strength stage at entry: **fixed stage5**. Leveling inside or outside the trial does not increase this first-tier strength; later growth can make the same challenge easier. A provisional hero-level formula was rejected before measurements because the local exponential stage curve would punish growth; stage5 was fixed before collecting outcomes. Existing independently authored monsters, defensive roles and magical-skill patterns are reused; normal attacks remain physical. Five rounds contain1,2,2,2,1 monsters with the boss last. Enemy attack gets `1 + .02 * (round - 1)`; first round is1.00, fifth1.08. The underlying base attack formula is multiplied before its final two-decimal rounding, not after rounding an intermediate cache. This is a documented local indexing choice, not an original formula claim.

The dedicated Item World page says damage rises2% per round while the Battles overview says1%; we select the dedicated2% statement and record the discrepancy. No normal-route preview, reward formula, random stream or event stream is changed apart from the new deterministic seed balance.

The existing five-free-backpack-slot departure reserve and empty pending queue still apply. At most seven nonbosses can drop equipment, so even a drop from every one fits five reserved backpack slots plus at most two of the existing eight pending slots. The boss grants no normal drop and completion grants none. Nothing is truncated. Existing permanent bound-weapon limit116 and all sale/preset protections remain.

## Stat anchor and first-tier scope

The Armory describes +1% base stats, except +2% physical/magical attack, per victorious completion. Only already implemented item stats exist here. Attack gets1.02; other present implemented stats get1.01. Their current level ratio and IW factor are applied to the **same immutable original Soulbind anchor before one final rounding/cap**, never by multiplying a previously rounded effective cache. An old missing parry field remains missing; item ID, quality, rolls, affixes, locks and preset references stay intact.

Existing Soulbind mapping remains explicit: historical attack50/3 versus more precise wiki16.60027, rate/parry2000, invented HP12/defense20 and whole-prefix scaling are local compatibility choices. The original multi-tier additive/compound equation remains unproven, so this checkpoint intentionally implements only one tier and does not claim either cumulative model. Rounding can make an individual displayed stat unchanged; IW1 is not a guarantee that every encounter becomes faster or winnable.

Before spending, prospective IW1 must remain valid through maximum character level500. Unsupported/malformed, stale, insufficient-seed, full-backpack or pending-loot entries refuse without spending. Sparse `itemWorld:{version:1,level:1}` is permitted only on coherent supported bound items. No unused CP, forge, stamina, charms, salvage or seed shop is added.

## Original evidence

- [Item World, revision67048](https://ehwiki.org/wiki/Item_World#Item_World_Level): the WIP table distinguishes Fair/Average/Superior (through10) from Exquisite (through15). Both have the same first-tier row above; later Exquisite monster levels remain unknown. Soulbound requirement, quarter credits and2% per-round damage are explicit.
- Source conflict: pinned findings003 at `8e1ff32097d50ba8e1c30266653234506b98a5f4`, lines864–883, groups Superior/Exquisite under max10. We use the current dedicated Item World table for Exquisite15. The Armory's Exquisite forge-cost table ending10 is not an IW cap; neither table establishes multi-tier stat arithmetic.
- [The Armory, revision67000](https://ehwiki.org/index.php?title=The_Armory&oldid=67000#Challenge_Item_World): victorious upgrade, base-stat increases and +1IW/CP/max-forge. This game implements only its supported first stat upgrade.
- [Items, revision67045](https://ehwiki.org/index.php?title=Items&oldid=67045#World_Seeds): random Hard+ drops at unspecified rate; level200+ Arena clear, Shrine Collectables10% bonus and Monster Lab gift5%. No verified NPC price is used.
- [Battles, revision66324](https://ehwiki.org/index.php?title=Battles&oldid=66324#Battle_Modes): overview's1% per-round damage conflicts with dedicated page.
- Permitted pinned findings003 line870 retracts the earlier unsupported failure/escape-no-refund assertion. Neither current primary page establishes a target-wearing requirement, so backpack targets are allowed.

## Save compatibility

Data format3 stores bounded integer World Seeds even before any IW upgrade. Valid v1 migrates with zero fragments and seeds; valid v2 preserves fragments and binding anchors with zero seeds. No historical awards are granted. v1/v2 imports containing newer seed/IW fields fail closed. Readers before v0.24 reject format3. The v0.24/v0.25 readers do not support Exquisite IW1 metadata, even though the data shape is still format3; do not treat a shared version number as backward readability. Refresh old tabs before taking ownership or loading newly invested progress, and export progress before clearing browser data. Independent source tests verify exact v0.25 reader rejection, protected startup/import/follower-takeover, and no overwrite through timer/save/release. This is a bounded production-UI simulation, not a claim of every real-browser concurrency case; see ACCEPTANCE-V026.md.

The current v3 browser storage namespace is unchanged; namespace and data-format version are separate. Trial context and session reports are not durable. Source backups do not restore browser progress, Library/account state, credentials or permissions.
