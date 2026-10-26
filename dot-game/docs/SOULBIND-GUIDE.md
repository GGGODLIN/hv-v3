# Soulbound weapon growth — v0.23 candidate

Source implementation and 1,433 tests/four syntax checks pass. This guide is not a browser acceptance or publication receipt; see ACCEPTANCE-V023.md for independent evidence.

## Player loop

Complete ordinary expeditions to earn 10 Soul Fragments per victory. Old saves start with zero; past victories are not retrospectively rewarded. This accelerated, deterministic reward is our single-player adaptation, not an original HV drop rate. It does not replace existing credits, XP or loot and consumes no RNG.

At camp, inspect an owned axe, rapier or club whose item level is no higher than the character. Preview the exact fragment cost, post-purchase balance, level and seven-stat changes. Binding requires explicit confirmation; it never chooses gear or spends fragments automatically. Pending loot and unrecognized weapon identities are not eligible. Locked or preset-referenced recognized weapons can be invested in without changing their ID or preset references.

| Quality | Soul Fragments |
| --- | ---: |
| Crude, Fair, Average, Superior, Exquisite | 100 |
| Magnificent | 250 |
| Legendary | 500 |
| Peerless | 1000 |

A bound weapon matches character level immediately and follows later growth, including while held in the backpack. It preserves its ID, affixes, quality and rolls. Binding preserves current HP/MP rather than refilling them; extra maximum-HP capacity from a weapon affix is not a free heal. Ordinary later equipment changes retain their established camp-recovery behavior. It does not gain a missing legacy parry stat or reroll into a better item. Choosing a higher-quality future drop instead can still be worthwhile.

Binding is a lasting virtual investment. Bound gear is locked and cannot be sold, automatically sold, bulk-sold or unlocked in this slice. Clearing a preset does not remove binding or unlock it. This conservative disposal policy is an adaptation beyond the original no-trading rule. There is no fragment refund, unbinding, salvage, IW or forge operation in this release. To prevent permanent inventory deadlock, this slice permits at most 116 bound weapons in total across equipment, inventory and pending loot. With one equipped, at most 115 remain in the 120-slot backpack, leaving the required five expedition slots after ordinary unbound clutter is removed. At the limit, wear a bound weapon and remove unbound clutter if needed. The 117th binding and over-limit imports are refused without spending or deleting items. This is an explicit storage-safety adaptation, not an original HV binding cap.

## Original facts and deliberate limits

Current [Items revision 67045](https://ehwiki.org/index.php?title=Items&oldid=67045#Soul_Fragments) gives quality base cost B above, with cost `B + 0.02 * B * max(itemLevel - characterLevel, 0)`. Older pages list different costs; they are not mixed into this model. Original Soulbind makes gear nontradeable and makes its level follow the character; see [The Armory revision 67000](https://ehwiki.org/index.php?title=The_Armory&oldid=67000) and [Equipment Basics](https://ehwiki.org/wiki/Equipment_Basics#Level).

The original upper level-gap boundary is inconsistent between sources (100 versus less than 100). This first slice accepts only itemLevel <= characterLevel, so the additional cost is zero and the disputed boundary is not used. Original fragment shop pricing is 1000 credits each; that shop is not implemented, and 100 fragments are not silently reinterpreted as 100 credits.

The original IW/forge/fusion prerequisites remain separate future work. This game does not pretend ordinary free expeditions are original Item World challenges or award unimplemented World Seeds/materials.

## Stable numeric anchor

The item stores an immutable pre-binding level and existing displayed-stat snapshot. Effective stats are always derived from that anchor with the ratio `(1 + newLevel/scale)/(1 + anchorLevel/scale)`, never by repeatedly multiplying yesterday's rounded values.

Attack uses this game's existing `50/3` scale; rate stats and parry use 2000. Current [Level Scaling revision 63848](https://ehwiki.org/index.php?title=Level_Scaling&oldid=63848) lists more precise ADB 16.60027, so our retained compatibility model is not claimed as the exact original server coefficient. Invented HP/defense scale factors 12/20, scaling an item's combined prefix contribution, existing rounding/caps and anchoring previously rounded values are explicit integration adaptations. The process cannot recover unknown original unrounded base rolls.

## Saves and safety

Save version 2 protects new currency even before a weapon is bound. Valid version-1 saves migrate without changing existing progress and receive zero fragments. Older versions reject version 2; refresh old writer tabs and export a backup before updating. Source backups are not personal browser-save backups.

Binding metadata, stat anchors and effective caches are validated before use. Unknown fields, malformed anchors, unsupported weapon records and stale confirmations must fail without spending resources or dropping existing progress. Repeated confirmation cannot charge twice. The resource cap is 1,000,000,000; reaching it must not invalidate an otherwise normal victory or save.

## Acceptance required before publication

Earn fragments through actual normal play, bind an owned weapon, observe immediate and next-level changes, preserve an unbound comparison, and reload/preset-switch without duplicating items or changing anchors. Source tests separately cover insufficient/stale/repeated requests, all disposal paths, currency cap, version migration, malformed data and absolute scaling. Candidate browser observations and final source/site readbacks must be recorded separately; no such success is asserted by this guide alone.
