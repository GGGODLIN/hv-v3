# Physical strikes and a telegraphed magical skill — v0.20

## Play and tradeoffs

Starting at stage 5, non-boss **赤砂守衛** alternates a physical attack, then **赤砂術式**, a magical skill. The route preview identifies this pattern; its live card announces the next actual attack. A missed/evaded/blocked attack still consumes that step. A stun-skipped action does not; a real stun-recovery attack does. New enemies begin with a physical attack. Returning/reloading ends the encounter rather than saving a half-completed casting cycle.

Physical armor and parry still help against its physical strikes, but **neither applies to the magical skill**. Evade and block remain relevant, as does Protection's 25% independent reduction. Faster kills and club control can prevent opportunities to cast, without guaranteeing a faster or safer overall clear. Counterattacks remain possible after an actually reached successful block; evade or resist alone never qualify.

The character's magic mitigation in this slice comes only from END and WIS. Existing gear `defense` is physical mitigation, not a hidden magic-defense bonus. Player resist probability is **not implemented (0)**; the resolver's existing three-check Resist phase is not a claim that resist equipment or a complete Wisdom-to-resist growth system exists.

Stages 1–4, boss patterns, enemy attack power/HP/cadence, drop/commission prices and reward formulas are unchanged. No new copied monster pool or art is used. This is an encounter-choice expansion, not a universal player buff.

## Original facts and evidence

- [Monster Stats, revision 63858](https://ehwiki.org/index.php?title=Monster_Stats&oldid=63858): monster normal attacks are physical. [Monster Lab / Skill Editor](https://ehwiki.org/wiki/Monster_Lab#Skill_Editor) distinguishes physical and magical skills. Attack kind is separate from elemental damage type; this skill adds no elemental-resistance system.
- [Damage, revision 66419](https://ehwiki.org/index.php?title=Damage&oldid=66419): magical attacks can encounter Evade, Block and Resist, but not Parry. Resist's three successes produce damage factors 1, .5, .25, .1. Existing resolver critical/Absorb ordering is retained.
- [Pinned original findings 002 §H](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/002-combat-and-character-formulas.md#L251): magical attribute mitigation is `min(.8, 1 - 900/(900 + END + WIS/2))`. No level-dependent denominator is added.
- [Spells / Protection](https://ehwiki.org/wiki/Spells#Supportive): Protection reduces damage from all attacks; the existing 25% baseline therefore remains applicable to both kinds. The prior level/duration research uncertainties and automatic-casting adaptations are unchanged.
- [Character Stats / Resist](https://ehwiki.org/wiki/Character_Stats#Resist): raw Resist is `.4 × WIS + equipment`, not directly a probability. The incomplete Accuracy-to-interception research is not silently replaced with raw/100.

## Explicit inference and adaptations

[Fighting Styles, revision 67008](https://ehwiki.org/index.php?title=Fighting_Styles&oldid=67008) and pinned findings002 describe counters after an enemy attack is blocked or parried without a physical-only exception. **Magic-block eligibility is an inference from that general rule**, not separately verified original-server behavior. Existing eligibility after one partial block/parry check remains this game's declared adaptation. Counter stun/overcharge are still absent.

This independently authored enemy, stage gate, two-action alternating pattern, same attack-strength baseline and ordinary enemy cadence are adaptations. The magic action is deliberately called a skill, not a magical normal attack. There is no monster MP/SP pool, spell cost, charge meter, original skill AI, T2/T3 spell behavior or element-specific mitigation. Do not mistake the absence of a cost simulation for a claim that original magic is free.

All cast sequencing is encounter-local and read-only previews consume no RNG. Existing saving remains compatible; older loaded tabs retain their prior rules until refreshed.
