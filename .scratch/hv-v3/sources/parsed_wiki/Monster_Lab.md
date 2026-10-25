The Monster Lab Mainpage.

The Monster Lab allows the players to create custom monsters that any player can then encounter during battles. Monsters bring gifts to their owner, they do not assist in any other way.

## Contents

- 1 Monster Creation

- 1.1 Naming

- 1.2 Costs & Deleting

- 2 Monster Stats & Power Level

- 2.1 Upgrading

- 2.2 Monster PL vs. Player Level

- 2.3 Important Power Levels

- 3 Skill Editor

- 4 Chaos Upgrades

- 4.1 Gift Factor

- 5 Crystal List

- 6 Monster Classes

- 6.1 Colored Charts

- 7 Morale

- 7.1 Morale Drain Rate

- 8 Food

- 8.1 Hunger Rate

- 8.2 Starving

- 9 Gifts

- 9.1 Chances

- 9.2 Distribution Ratio

- 10 See also

## Monster Creation

Monster Creation page.

A monster slot is needed in order to create a new monster; these can be unlocked using Chaos Tokens. A new monster is created by giving it a name, a base class, and a melee attack damage type. Players may choose from any of the 13 monster classes, each with their own strengths and weaknesses. Up to 100 monster slots can be unlocked; donators get up to 200.

### Naming

Monsters can only be named once they reach a Power Level of 25 (see below). Some guidelines should be followed regarding the name of the monsters:

- Maximum of 30 characters

- No gibberish

- No misspellings of existing monsters' names

- No misleading names (e.g. "Weak Against Holy" or "Bob the Dragon" on a non-dragon monster)

- Only 1 monster should be named directly after an E-Hentai user

- No racist or hateful names

- No typographically similar numerical substitutions on names of existing monsters (e.g. o=0, i=1=l)

- No consecutive spaces or hyphens

- Spaces and hyphens cannot be next to each other

- Cannot start or end with hyphens

- Maximum 5 spaces or hyphens per name
Slot costs.

- Monster names must be unique. Attempting to use an existing name will cause a popup informing this.

- Names that are marked in red indicate that the monster is flagged for having an unacceptable name. Such monsters will not bring any gifts. Any monster flagged for over a month will be deactivated and unnamed. Renaming a monster removes the flag but does not retroactively bring any gifts that were lost due to being flagged.

### Costs & Deleting

- The Nth monster slot costs roundup(1 + (N - 1)^1.2) Chaos Tokens to unlock.

- Donators at or above the Gold Star level get two slots per unlock. Slots unlocked before donating are retroactively doubled.

- Monsters can be renamed and deleted for free.

- Once a monster reaches PL 250, it cannot be deleted.

- Deleting a monster only frees up the slot, nothing else is refunded.

## Monster Stats & Power Level

Monster Stats page.

Monsters can be strengthened by their owner by using crystals. The monster's Power Level (PL) will rise with each stat upgrade. As crystals are used to increase a monster's attributes the cost of subsequent increases in that stat goes up.

### Upgrading

 = Not enough crystals to upgrade, or the stat is maxed out

 = Enough crystals to upgrade, simply click on it to spend the crystals

Mousing over either of these will show the name and number of crystals needed for the next upgrade.

| Stat type | Crystal cost to upgrade | PL increase per upgrade | Total PL (per stat) | Morale restored | Cap (per stat) |
| --- | --- | --- | --- | --- | --- |
| Primary | round(50 * 1.555079154^N) | 3 + (N * 0.5) | N*(6+(N-1)*0.5)/2 | (roundup(N*0.5)+3)*1000 | +25 |
| Elemental | round(10 * 1.26485522^N) | Rounddown(1 + (N * 0.1) | (rounddown(N/10)+1)*(rounddown(N/10)*5+remainder(N/10)) | (rounddown(N/10)+1)*2000 | +50 |

The monster's actual PL is a round value of all stats added together.

There is no way to increase a monster's Piercing, Crushing, or Slashing defenses.

For stat upgrades, holding Shift while clicking on the stat name upgrades by 5 instead of 1 and holding Ctrl while clicking on the stat name upgrades by 10

### Monster PL vs. Player Level

- A monster must have a PL of at least 25 to participate in battles.

- Higher PL monsters give more Experience.

- Monsters give additional loot drop chance as ((PL - 500) / 50), capped at 15%.

- It is possible for players to fight monsters that they have created.

- For the PL cap calculation, a player's effective level (current level + difficulty modifier) is used .

- The system is biased towards picking monsters that are closer to the player's PL cap. The maximum PL of monsters that a player can face is:

| Player's Level + Difficulty Modifier | Max Monster PL |
| --- | --- |
| 1-99 | Player's effective level? |
| 100+ | ((Player's effective level) ^ 1.27) - 247? |

At higher level players will face a minimum of (min(max_pl/2, 500)).

### Important Power Levels

Crystal packs required for each PL. "Bonus" is the boost in PL you'll earn between two different situations.

| Power <br> Level | Effects |
| --- | --- |
| 25 | Unlocks naming and becomes active in battles once named |
| 200 | Unlocks second Skill Attack |
| 250 | Can no longer be deleted |
| 251 | Requires Monster Edibles instead of Monster Chow as Food |
| 400 | Unlocks Spirit Attack |
| 499? | Gifts may now include High-Grade materials |
| 750 | Low-Grade materials can no longer be gifts (?) |
| 751 | Requires Monster Cuisine instead of Monster Edibles as Food |
| 1,000 | Will never be deactivated |
| 1,005 | All Chaos Upgrades are available |
| 1,499? | Mid-Grade materials can no longer be gifts (100% are High-Grade) |
| 2,250 | Power Level cap reached |

## Skill Editor

The Skill Editor page.

Monsters get skills when they are created, at PL 200, and at PL 400. 

- If you don't create a skill for your monster, it will use the default skill

- Skills names must be between 3 and 30 characters long and contain only alphanumeric characters, hyphens, and spaces.

- The initial skill has the same damage type as the monster's main attack, and costs 50% MP.

- Monsters with a physical attack damage type gets a Physical type skill (which is boosted by DEX), while those with an elemental attack type get an Magical type skill (which is boosted by INT).

- Additional skills at PL 200 and PL 400 have following characteristics:

- The skill at PL 200 costs 50% MP and is more powerful than the initial skill.

- The skill at PL 400 costs 100% SP and is more powerful than both MP skills.

- Some monster classes can choose between physical and magical skills. The damage type can also be changed.

Skills marked as "Basic" in the following table means that the skill will be of the same type than the basic attack you've chosen upon creation of the monster.
In other words, you cannot chose the element of that skill.

| Monster Class | Skill Type | Damage Type | Power |
| --- | --- | --- | --- |
| Arthropod | Physical | Basic (Crushing/Piercing) | 20 |
| Physical | Crushing/Piercing | 50 |
| Physical | Crushing/Piercing | 100 |
| Avion | Physical | Basic (Piercing/Slashing) | 20 |
| Physical | Piercing/Slashing | 50 |
| Physical | Piercing/Slashing/Wind | 100 |
| Beast | Physical | Basic (Slashing/Piercing) | 20 |
| Physical | Slashing/Piercing | 50 |
| Physical | Slashing/Piercing/Crushing | 100 |
| Celestial | Physical | Basic (Slashing/Crushing) | 50 |
| Physical/Magical | Holy | 80 |
| Physical/Magical | Holy/Void | 120 |
| Daimon | Physical | Basic (Slashing/Piercing) | 30 |
| Physical | Slashing/Piercing | 60 |
| Physical/Magical | Dark/Void | 100 |
| Dragonkin | Physical | Basic (Piercing/Crushing) | 20 |
| Physical/Magical | Piercing/Crushing/Fire | 50 |
| Physical/Magical | Piercing/Crushing/Fire | 100 |
| Elemental | Magical | Basic (Fire/Elec/Wind/Cold) | 30 |
| Magical | Basic (Fire/Elec/Wind/Cold) | 60 |
| Magical | Basic (Fire/Elec/Wind/Cold) | 100 |
| Giant | Physical | Basic (Crushing) | 10 |
| Physical | Basic (Crushing) | 30 |
| Physical | Basic (Crushing) | 50 |
| Humanoid | Physical | Basic (Piercing/Slashing/Crushing) | 30 |
| Physical | Piercing/Slashing/Crushing | 60 |
| Physical/Magical | Piercing/Slashing/Crushing <br> /Fire/Wind/Elec/Cold | 100 |
| Mechanoid | Physical | Basic (Piercing/Slashing) | 20 |
| Physical | Piercing/Slashing | 50 |
| Physical | Piercing/Slashing | 100 |
| Reptilian | Physical | Basic (Piercing/Slashing) | 20 |
| Physical | Piercing/Slashing | 50 |
| Physical | Piercing/Slashing | 100 |
| Sprite | Physical | Basic (Piercing/Slashing) | 50 |
| Physical/Magical | Fire/Elec/Wind/Cold | 100 |
| Physical/Magical | Void | 150 |
| Undead | Physical | Basic (Crushing/Slashing) | 20 |
| Physical | Crushing/Slashing | 50 |
| Physical/Magical | Dark | 100 |

## Chaos Upgrades

Monsters can be further upgraded using chaos tokens. This will not change the monster's PL but does increase its "chaos level".

- Available upgrades depend on PL of monster (every 5 PL unlocks another rank of at least 1 upgrade), and is shown in light blue blocks. Unavailable upgrades are shown in white blocks.

- The number of tokens required for an upgrade equals the number of next upgrade. (i.e. the Nth upgrade requires N tokens). Upgraded stats are shown in yellow.

- Each upgrade has 20 ranks. It takes 210 tokens to fully rank up an upgrade. Thus, it takes 2520 chaos tokens to fully upgrade one monster.

- Holding Shift while clicking on the + upgrades by 5 instead of 1 and holding Ctrl while clicking on the + upgrades by 10.

| Name | Related Stats |
| --- | --- |
| Scavenging | Increases the gift factor by 2.5% |
| Brutality | Increases monster damage by 2.5% |
| Swiftness | Increases monster attack speed by 2.5% |
| Accuracy | Increases monster accuracy by 5% |
| Precision | Decreases effective target evade/block by 1% |
| Overpower | Decreases effective target parry/resist by 1% |
| Fortitude | Increases monster health by 5% |
| Interception | Increases monster parry by 0.5% |
| Dissipation | Increases monster resist by 0.5% |
| Evasion | Increases monster evade by 0.5% |
| Defense | Increases monster physical mitigation by 1% |
| Warding | Increases monster magical mitigation by 1% |

### Gift Factor

The Gift Factor influences the amount of gifts a monster earns at once. The base value is 100% and each upgrade of Scavenging adds 2.5% to this total. While this chaos upgrade is specifically designed to raise the gift factor, the other chaos upgrades contribute to the gift factor aswell, by an amount of 0.5% for each upgrade. A fully chaosed monster therefore gets a +160% bonus to the gift factor, effectively bringing the maximum value of the gift factor to 260%.

To optimize the amount of chaos tokens spent on a monster regarding the gift factor aspect, one has to invest 5 times more tokens in the Scavenger upgrade than other upgrades. This means having a Scavenging level 5 times higher than other levels. The following table gives an approximation of the chaos levels needed to optimize the investment on a monster:

| Scavenging level | Tokens | Other upgrade | Tokens | Factor* | Total tokens* |
| --- | --- | --- | --- | --- | --- |
| 2 | 3 | 0 | 0 | 105% | 3 |
| 5 | 15 | 1 | 1 | 118% | 26 |
| 10 | 55 | 2 | 3 | 136% | 88 |
| 15 | 120 | 3 | 6 | 154% | 186 |
| 20 | 210 | 4 | 10 | 172% | 320 |

*: The factor and the total tokens displayed here correspond to what results in Scavenger raised to the given level, and the 11 other upgrades to the "other upgrade" level.

## Crystal List

Use these to increase a monster's stats as follows.

| Crystal | Stat increased |
| --- | --- |
| Crystal of Vigor | Strength |
| Crystal of Finesse | Dexterity |
| Crystal of Swiftness | Agility |
| Crystal of Fortitude | Endurance |
| Crystal of Cunning | Intelligence |
| Crystal of Knowledge | Wisdom |
| Crystal of Flames | Fire resistance |
| Crystal of Frost | Cold resistance |
| Crystal of Lightning | Elec resistance |
| Crystal of Tempest | Wind resistance |
| Crystal of Devotion | Holy resistance |
| Crystal of Corruption | Dark resistance |

## Monster Classes

| Monster Class | Starting Attributes | Resistances | Neutral <br> (0) | Weaknesses | Damage Types |
| --- | --- | --- | --- | --- | --- |
| STR | DEX | AGI | END | INT | WIS | (+25) | (-25) | (-50) |
| Arthropod | 80 | 50 | 70 | 100 | 40 | 40 | Fire, Wind, Elec, Slash | Holy, Dark, Pierce | Cold, Crush |  | Crush, Pierce |
| Avion | 50 | 80 | 140 | 40 | 60 | 50 | Elec, Pierce | Cold, Holy, Dark, Crush, Slash | Fire | Wind | Pierce, Slash |
| Beast | 80 | 90 | 90 | 70 | 30 | 20 | Wind, Cold, Crush | Elec, Holy, Dark, Slash, Pierce | Fire |  | Slash, Pierce |
| Celestial | 50 | 50 | 100 | 50 | 100 | 80 | Fire, Cold, Elec, Wind, Holy |  | Crush, Slash, Pierce | Dark | Slash, Crush |
| Daimon | 90 | 90 | 80 | 40 | 60 | 50 | Fire, Cold, Elec, Wind, Dark |  | Crush, Slash, Pierce | Holy | Slash, Pierce |
| Dragonkin | 100 | 50 | 30 | 90 | 50 | 60 | Fire, Elec, Crush, Slash | Holy, Dark, Pierce | Wind | Cold | Pierce, Crush |
| Elemental | 30 | 60 | 60 | 40 | 80 | 120 | Fire, Cold, Elec, Wind, Holy, Dark | Slash | Crush, Pierce |  | Fire, Elec, Wind, Cold |
| Giant | 100 | 80 | 30 | 120 | 20 | 10 | Fire, Cold, Crush | Holy, Dark, Slash | Elec, Wind, Pierce |  | Crush |
| Humanoid | 50 | 100 | 80 | 50 | 80 | 70 |  | All but Dark | Dark |  | Pierce, Slash, Crush |
| Mechanoid | 100 | 70 | 40 | 70 | 40 | 30 | Fire, Cold, Wind, Holy, Slash, Pierce | Dark, Crush |  | Elec | Pierce, Slash |
| Reptilian | 70 | 100 | 60 | 80 | 60 | 40 | Fire, Elec, Crush, Slash | Wind, Holy, Dark, Pierce |  | Cold | Pierce, Slash |
| Sprite | 30 | 120 | 120 | 20 | 70 | 60 | Fire, Cold, Elec, Wind, Holy, Pierce | Slash | Crush | Dark | Pierce, Slash |
| Undead | 100 | 70 | 40 | 100 | 20 | 20 | Cold, Elec, Wind, Dark, Crush, Pierce | Slash |  | Fire, Holy | Crush, Slash |

- For primary stats every point increases the stat by 1/10th of the base value (but always between 6 and 10).

### Colored Charts

Resistances

|  | Fire | Cold | Elec | Wind | Holy | Dark | Crushing | Slashing | Piercing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arthropod | 25 | -25 | 25 | 25 | 0 | 0 | -25 | 25 | 0 |
| Avion | -25 | 0 | 25 | -50 | 0 | 0 | 0 | 0 | 25 |
| Beast | -25 | 25 | 0 | 25 | 0 | 0 | 25 | 0 | 0 |
| Celestial | 25 | 25 | 25 | 25 | 25 | -50 | -25 | -25 | -25 |
| Daimon | 25 | 25 | 25 | 25 | -50 | 25 | -25 | -25 | -25 |
| Dragonkin | 25 | -50 | 25 | -25 | 0 | 0 | 25 | 25 | 0 |
| Elemental | 25 | 25 | 25 | 25 | 25 | 25 | -25 | 0 | -25 |
| Giant | 25 | 25 | -25 | -25 | 0 | 0 | 25 | 0 | -25 |
| Humanoid | 0 | 0 | 0 | 0 | 0 | -25 | 0 | 0 | 0 |
| Mechanoid | 25 | 25 | -50 | 25 | 25 | 0 | 0 | 25 | 25 |
| Reptilian | 25 | -50 | 25 | 0 | 0 | 0 | 25 | 25 | 0 |
| Sprite | 25 | 25 | 25 | 25 | 25 | -50 | -25 | 0 | 25 |
| Undead | -50 | 25 | 25 | 25 | -50 | 25 | 25 | 0 | 25 |
|  |
| Total | 125 | 75 | 150 | 100 | 0 | -50 | 25 | 50 | 0 |

		
- 
			
			Primary Attributes gained with each crystal upgrade
		
		
- 
			
			Resistances gained with each crystal upgrade; Appears to round down
		

## Morale

Each monster has up to 24,000 points of morale that gradually decays over time. Morale solely affects a monster's ability to bring gifts to its owner. Freshly created monsters start with 0 morale.

| Morale Color | Morale | Effect on Gifts |
| --- | --- | --- |
| Green | 6,000 - 24,000 | +25% chance |
| Yellow | 2,400 - 5,999 | Normal chance |
| Red | 1 - 2,399 | -50% chance |
| Empty | 0 | 0% chance (any held gifts are lost and no new ones can be earned) |

Morale can be raised by feeding monsters crystals or Happy Pills. Crystals restore morale based on how many are spent (roughly 500 + 2.5*N) and pills restore 6,000 (or 12,000 for players with the Extra Strength Formula Hath Perk).
The Drug All button will only give pills to Yellow morale monsters.

### Morale Drain Rate

Morale drains over time at a base rate of ~33 per hour, lasting roughly 30 days.

- Increased By:

- A starving monster will lose morale faster (50%?) than normal

- Decreased By:

- All Owned Monsters:

- Training Inspiration (5% per rank?)

- Players with a Gold Star or higher have 50% drain rate

- These 2 bonuses stack multiplicatively

- Individual Monsters:

- Raising a monster's PL past 250 reduces its drain rate linearly, up to 7x slower at PL 2,250[1]. (An approximate point for 2x is ~580[2][3]).

## Food

Monsters consume food in order to "live" and must be fed every so often to keep them fighting and from losing morale. Freshly created monsters start at 2,000 food.

Monsters of different power levels require different foods:

| Power Level | Food Required |
| --- | --- |
| 1 - 250 | Monster Chow |
| 251 - 750 | Monster Edibles |
| 751 - 2,250 | Monster Cuisine |

Monsters can be fed up to 24,000 food (6 days' worth). Each unit of food restores up to 1,000 points; this can be increased to 1,200 with the That's Good Eatin' Hath Perk.

- Food can be fed at a "max" amount which only uses as much food as possible without being wasteful (stopping before a unit does not restore a full 1,000) unless the monster has less than 1,000 hunger.

Higher tier food items drop more frequently on higher difficulties (capping at 40%/30%/30% on IWBTH).

### Hunger Rate

Monsters consume food at a base rate of ~166 per hour.

- This can be slowed (up to halved?) via Metabolism Training.

- Players with a Gold Star will halve their monsters' hunger rate.

- These 2 bonuses stack (to 75%? reduced hunger).

### Starving

- A starving monster will lose morale 50%(?) quicker.

- After 90 days of starving a monster will cease to participate in battles and will be un-named.

- Monsters that are 1,000+ PL are immune to this.

- Un-named monsters will retain monster-type, power level and chaos upgrades

- Un-named monsters can be revived by feeding and renaming them

## Gifts

Monster Gift notification.

Player-created monsters have a chance of bringing materials to their owner. Monsters can hold up to 3 gifts (further increased by chaos upgrades up to +160%). Simply visiting the Monster Lab will check if any of the player's monsters have gifts to give.

### Chances

The chance to receive a gift is based on how many battles a monster has won since they last delivered a gift, modified by their morale (updated dynamically; a monster that goes from yellow morale to green may bring a gift immediately[4]; visiting the monster list is necessary). A monster can give gifts up to once per hour. Monsters will automatically earn gifts if they have not earned one in the past 72 hours.

Battles won:

- Fleeing from battle counts as a win for all of the monsters in that round.

- Does not count deaths to a player's own monsters.

- To prevent potential abuses there is a cooldown on how often a player can count as a repeat win.

### Distribution Ratio

Graded materials are gifted at a ratio of 2:1:1:1 in Metal:Cloth:Leather:Wood.

## See also

- Monster Stats

- HentaiVerse Bestiary

- zhenterzzf and OnceForAll's Monster Database

- The Forge

- Grindfest

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
