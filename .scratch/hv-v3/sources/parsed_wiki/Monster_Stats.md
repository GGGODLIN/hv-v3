In the HentaiVerse the calculation of monsters' stats are closely related to that of characters' stats (with a few notable differences).

## Contents

- 1 Primary Attributes

- 2 Derived Attributes

- 2.1 Bases

- 2.2 Critical Chance

- 2.3 Evade

- 2.4 Parry

- 2.5 Resist

- 2.6 Mitigation

- 2.7 Points

- 2.8 Battle Regen

- 3 See also

## Primary Attributes

Every monster has a base stat between ?? and ???. The base stat is then scaled to the actual stats by the following formula:

`scaled_stats = int(0.01 * base_stat * monster_level + (monster_level ^ 1.076675) * 0.3325)`

- monster_level = monster's level when it is spawned, equal to player's level

The scaled stats are used to calculate other derived attributes:

| Strength (STR) Every point raises Physical Base Damage by 2 Every point adds half a point to the Physical Crit Chance formula | Endurance (END) Every point raises base Health Points by 5 Every point adds a point to Physical Mitigation formula Every point adds a point to Magical Mitigation formula |
| --- | --- |
| Dexterity (DEX) Every point raises Physical Base Damage by 1 Every point adds a point to the Physical Crit Chance formula Every point contributes to the Parry formula | Intelligence (INT) Every point raises Magical Base Damage by 2 Every 4 points raises base Magic Points by 1 Every point adds half a point to the Magical Crit Chance formula |
| Agility (AGI) Every point contributes to the Evade formula Every point adds a half point to Physical Mitigation formula | Wisdom (WIS) Every 4 points raise base Magic Points by 3 Every point raises Magical Base Damage by 1 Every point adds a half point to Magical Mitigation formula Every 25 points raises Magic Accuracy by 1% Every point adds a point to the Magical Crit Chance formula Every point contributes to the Resist formula |

Notes: 

- Mitigation gains from Primary Attributes (STR/END/WIS) are capped at 80%.

- Any percentage effects on Crit Rate, Avoidance, and Mitigation stats are added multiplicatively.

## Derived Attributes

Derived attributes are stats calculated from the monster's primary attributes. Most of these formulas are affected by Chaos Upgrades. Note that these formulas may be partially inaccurate.

#### Bases

Note that every monsters' normal attacks are physical.

`Base physical damage = (log(3330 + STR * 2 + DEX , 1.0003) - 27039.81) * (1 + chaos_brutality_rank * 2.5%)`

#### Critical Chance

`Physical Crit Chance = 1 - (3750 / (3750 + DEX + STR/ 2))`
`Magical Crit Chance = 1 - (3750 / (3750 + WIS + INT / 2))`

#### Evade

`Evade = 1 - (1 - min(10 , (AGI / 100) , (AGI - Level) / 75) / 100) * (1 - chaos_evasion_rank * 0.5%)`

#### Parry

`Parry = 1 - (1 - min(10 , (DEX/ 100) , (DEX - Level) / 75) / 100) * (1 - chaos_interception_rank * 0.5%)`

#### Resist

`Resist = 1 - (1 - min(10 , (WIS/ 100) , (WIS - Level) / 75) / 100) * (1 - chaos_dissipation_rank * 0.5%)`

#### Mitigation

`Physical Mitigation = 1 - (1000 / (1000 + END + AGI / 2)) * (1 - chaos_defense_rank * 1%)`
`Magical Mitigation = 1 - (1000 / (1000 + END + WIS / 2)) * (1 - chaos_warding_rank * 1%)`

#### Points

`Health Points = (100 + monster_level * 10 + END * 5) * level_mod * difficulty_mod  * class_mod * (1 + chaos_fortitude_rank * 5%)
Magic Points = 10 + monster_level + WIS
Spirit Points = 1 + (Power / 7) + (STR + DEX + AGI + END + INT + WIS) / 5`

- level_mod = MAX(1 ; (monster_level - 100) * 0,01), effectively being 1 for Level 200 and below, capping at 4 for Level 500

- class_mod = 1 for Monster Lab monsters and common monsters; varies for bosses, legndaries, and gods

#### Battle Regen

During battle, monsters gain 10%? of MP and 5% SP per active turn.

## See also

- Character Stats

- Monster Lab

| HentaiVerse Navigation |
| --- |
| Character | Menu | Stats • Training • Settings • Persona • Isekai |
| Abilities | Skills • Spells (Spell Damage‎) • Spirit Stance |
| Levels | Experience Points • Leveling Up • Ranks • Level and Rank Table |
| Info. | Action Speed • Overcharge • Proficiencies • Stamina |
| Services | Bazaar | The Armory • Item Shop • Monster Lab (Monster Stats) • Shrine • MoogleMail • The Lottery • The Market |
| The Armory | Organize • Modify • Repair • Soulbind • Purchase • Sell • Salvage |
| Items | Drops | Loot Drop Rolls • Obsolete Items |
| Equipment | Equipment Basics • Detailed Equip Characteristics • Weapon Procs • Stats • Burden • Interference • Equipment Ranges • Level Scaling |
| Battles | Modes | Arena • Grindfest • Item World • Random Encounter • Ring of Blood • The Tower |
| Info. | Bestiary • Damage Types • Damage (Physical Damage) • Enemy Procs • RiddleMaster |
| Isekai | The Tower | Ranking • Rewards |
| Info. | Seasons • Rewards • Rules |
| Misc. | Currency | Credits • Gallery Points • Hath • Hath Perks |
| Strategy | Advice • Advanced Advice |
| System | Dawn of a New Day • Bugs • Technical Issues • FAQ • Hotkeys • Scripts & Tools |
