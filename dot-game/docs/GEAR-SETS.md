# Three gear-only camp presets

## Use
1. Equip the three items you want through normal inventory controls.
2. At camp choose an empty 配裝 A/B/C slot's explicitly labeled lock-and-save control. This stores existing item IDs and locks all three items. It neither creates another copy nor moves them into extra storage.
3. Equip another build and save a different preset. The same physical item may appear in several presets.
4. Preview a saved preset. Review exact current/target IDs, full character stats and conditional counter context, then confirm the complete swap. No partial equipment swap is accepted.
5. Clearing or overwriting a saved slot requires explicit confirmation. This removes/replaces references only. Former items remain locked; unlock them separately after no preset references them if you wish to sell them.

The three fixed names are A/B/C. No custom naming, automatic build selection, score recommendation or background equipment switching is introduced. Abilities, AP allocation, tactics, chosen stage and progression are deliberately outside the preset. This is not the original Persona system.

## Safety and lifecycle
Referenced items cannot be unlocked or sold through singleton, selected-batch, conservative-safe or common-sale actions. UI labels explain this additional protection. Current equipped gear remains protected by the existing inventory-only sale paths. A stale selection made before saving a preset cannot sell its newly protected gear.

Applying requires town mode, three uniquely owned supported IDs in the correct slots, and the exact current preview. Targets may be equipped already or in the backpack, never pending loot. If any target is missing, incorrect, duplicated or unsupported, the entire application fails without making replacements. There is no fee, stat reroll, RNG consumption or extra item storage. Full backpacks can swap because the inventory count is unchanged. Ordinary camp recovery follows one successful equipment change; rejected, repeated or already-current applications do not heal or advance anything.

Pending UI consent is transient and invalidated by relevant state changes, import, ownership resynchronization or departure. Another tab must explicitly take writer ownership before changing saved presets. A preview is not permission to apply a changed set later.

## Save compatibility
`gearSets` is optional. Each present key a/b/c maps exactly to weapon/armor/accessory IDs. Empty/malformed/unknown/accessor fields and missing, pending, unlocked or wrong-slot references reject the save rather than silently dropping gear or inventing a replacement. Allocation-free older saves remain accepted and do not receive presets automatically.

Accepted v0.13 readers do not know the field and may drop the preset metadata when saving; ordinary item locks remain. This is safe retention of locks, **not preservation of presets by an old reader**. Refresh old tabs before writer takeover and export a current save. Clearing the last preset omits the optional field. Source backups do not include your personal browser save; normal game export does.

## Original facts versus this game's choices
Original research supports three initial Equipment Sets, but actual original sets include more than equipment; Persona is broader still. Our fixed three gear-only ID sets, explicit save-lock workflow, whole-set quote confirmation and leave-locks-on-clear rule are independent adaptations. See ORIGINAL-HV.md for pinned lines and official revisions. Existing combat/loot/quality/economy formulas are unchanged. A build with more block or damage is not universally superior; previews show current measured stats, not a predicted win rate.
