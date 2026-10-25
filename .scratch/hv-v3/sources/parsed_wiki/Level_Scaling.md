Level Scaling pertains to the effective stats of a given piece of equipment versus a player's level. Equipment will only continue to level with the player if it is soulfused.

## How It Works

All stats for equipment have a certain range in which they can be rolled when they are generated. These stats are permanent, as in that when they have been rolled, nothing can change them. Additional stats can be added by Forge upgrades and potency increases.

Each stat has a scaling factor expressed as a formula:

`Scaled Stat = (1 + level / (50/level_factor)) * base_stat`

Simplified Version:

`Scaled Stat = (1 + level / simp_level_factor) * base_stat`

For example, for Elemental Damage Bonus, which has a level scaling factor of 200, the value increases by 1/200 of its "level 0" value per level. Inserting the equipment's level into the formula gives the actual stats of the item.

The difference a single level (443 -> 444) makes can be minor

The following are the known level factors for each equipment stat:

| Stats | Simp_Factor | Factor |
| --- | --- | --- |
| Weapon Damage / Attack Damage Bonus | 16.60027 | 3.012 |
| Magic Damage Bonus | 22.72727* | 2.200* |
| Attack/Magic Accuracy Bonus | 5000* | 0.010* |
| Attack/Magic Critical Bonus | 2000* | 0.025* |
| Block/Evade/Parry/Resist Chances | 2000* | 0.025* |
| Physical/Magical Mitigations | 2000* | 0.025* |
| Specific Physical Mitigations (e.g. Slashing) | ∞ | 0 |
| Elemental Mitigations (Fire, etc.) | ∞ | 0 |
| Magical Proficiency Bonuses | 35.46099 | 1.410 |
| Elemental Damage Bonuses | 199.20319 | 0.251 |
| Primary Attributes | 35.4108 | 1.412 |
| Proc Durations | ∞ | 0 |
| Siphon Procs | 25? | 0 |
| Burden | ∞ | 0 |
| Interference | ∞ | 0 |
| Mana Conservation[1] | ∞ | 0 |
| Attack Speed | ∞ | 0 |

Data marked with an * has been derived in the past and has not been verified by the developer

## See also

- Equipment Basics

- Detailed Equip Characteristics

- Item World

| HentaiVerse Navigation |
| --- |
| Character | Menu | Stats • Training • Settings • Persona • Isekai |
| Abilities | Skills • Spells (Spell Damage‎) • Spirit Stance |
| Levels | Experience Points • Leveling Up • Ranks • Level and Rank Table |
| Info. | Action Speed • Overcharge • Proficiencies • Stamina |
| Services | Bazaar | Equipment Shop • Item Shop • Monster Lab (Monster Stats) • Shrine • MoogleMail • The Lottery • The Market |
| The Forge | Repair • Upgrade • Enchant • Salvage • Reforge • SoulFuse |
| Items | Drops | Loot Drop Rolls • Obsolete Items |
| Equipment | Equipment Basics • Detailed Equip Characteristics • Weapon Procs • Stats • Burden • Interference • Equipment Ranges • Level Scaling |
| Battles | Modes | Arena • Grindfest • Item World • Random Encounter • Ring of Blood • The Tower |
| Info. | Bestiary • Damage Types • Damage (Physical Damage) • Enemy Procs • RiddleMaster |
| Isekai | The Tower | Ranking • Rewards |
| Info. | Seasons • Rewards • Rules |
| Misc. | Currency | Credits • Gallery Points • Hath • Hath Perks |
| Strategy | Play Styles • Advice • Advanced Advice |
| System | Dawn of a New Day • Bugs • Technical Issues • FAQ • Hotkeys • Scripts & Tools |
