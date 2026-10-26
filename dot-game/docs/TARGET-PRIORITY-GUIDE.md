# 集火策略：營地決定，戰鬥自動執行

v0.21 adds three **independently designed idle-game policies**, not a claim that original HV supplies this automatic AI. Existing original-research-supported damage gates, skills, weapon procs and equipment rules remain separate from this convenience policy. No new original skill or spell is claimed.

## Choose before departure

- **依序集火** (default): attack the first living enemy in the existing encounter order. This preserves the previous targeting behavior exactly.
- **施法者優先**: choose the first living enemy with the mixed physical/magical encounter identity; if none survive, use existing order. A caster still counts while its *next* action is physical. The policy does not forecast a cast or wait for a magic telegraph.
- **低血量收尾**: choose the living enemy with the lowest **current absolute HP**, not lowest HP percentage or estimated hits to kill. Equal HP uses existing order. Enemy counters or damage-over-time may naturally change which enemy is lowest before the next player attack.

Only the save-owning tab may change this choice, and only at camp. The chosen policy survives a normal save/reload. The default is omitted from saved data; older saves without the field retain their original behavior. Unknown explicitly supplied values are rejected rather than silently turned into a policy. This does not promise that older game builds can load newer saves; export a personal save before downgrading.

## Read what is happening

During a live fight the target cue names the **currently selected living enemy** and the reason. It is a view of current state, not a prediction of the next damage event. The existing automatic healing and Protection priorities can take the player's next action instead. Camp and settled intermission have no active attack target.

Normal attacks and the existing automatic offensive skill use the selection. Counterattacks still retaliate against the enemy that actually triggered them, never against the selected policy target. Bleeding Wound remains attached to the enemy on which it was applied. Enemies are not reordered, and selecting/viewing a policy consumes no combat randomness, mana, currency or turn.

## A choice, not an upgrade button

Leaving a dangerous caster alive may allow a magic skill, but changing attack order also changes which armor/evasion checks and weapon effects occur first. Avoiding one cast need not reduce total HP loss or clear time. Finishing a weakened enemy can help; it can also move ordinary attacks away from an existing bleed or armor-penetration target. No policy is automatically chosen for the player.

In the authored encounter layout, stage5–6 casters are already first or alone. Stage7 wave3 and stage8 wave2 put a caster behind another enemy, making the distinction visible without rewriting encounters. [Natural paired measurements](MEASUREMENT-V021.md) retain slower and higher-damage outcomes; they are bounded source simulations, not a universal best-build ranking or browser acceptance.

No enemy difficulty, loot quality, reward, price, skill trigger, or original numerical formula is changed by this feature. Different selected targets can naturally produce different downstream RNG consumption, damage, survival and eventual rewards; this is not a promise that all policies produce identical fights.
