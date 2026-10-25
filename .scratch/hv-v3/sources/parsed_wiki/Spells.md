Spells - EHWiki

- # Spells

			
				From EHWiki
				
				
				Jump to navigationJump to search
				
				Mana-based spells that are available to players in the HentaiVerse.

## Contents

1 Learning Spells

- 2 Spell Costs

- 3 Spell Durations

- 4 Spell Damage

- 5 Table Legend

- 6 Offensive Spells

6.1 Elemental

6.1.1 Fire

- 6.1.2 Cold

- 6.1.3 Elec

- 6.1.4 Wind

- 6.2 Divine

- 6.3 Forbidden

- 7 Deprecating Spells

- 8 Supportive Spells

8.1 Curative

- 8.2 Supportive

- 9 Status Effects

9.1 Chance on Hit

- 9.2 Theft Effects

- 10 Spike Shields

- 11 Procs

- 12 Stacking

- 13 See also

## Learning Spells

Spells are automatically added to a player's skillbook once they have reached the minimum level AND base proficiency requirements. Usually it is possible to improve the spell by using ability points right away but some abilities will only be available at higher levels.

## Spell Costs

Spell costs are all a percentage of the player's level, rounded up.

Example: 'Fiery Blast' has a base cost of 5, meaning its MP cost is 5% of the player's level. At level 51 Fiery Blast costs:

roundup(51 * 0.05) = roundup(2.55) = 3 MP
Spell costs are further modified by:

| Factor | [COLOR:red]▲/[GREEN]▼ | Amount | Duration |

| Interference | [COLOR:red]▲ | 0.5% per point | Permanent (can be lowered with certain Charms) |

| Mana Conservation | [GREEN]▼ | Stated % | Permanent (can be increased with certain Charms) |

| Spirit Stance | [GREEN]▼ | 25% | As long as it can be maintained |

| Coalesced Mana | [GREEN]▼ | 50% | Up to 5 ticks (and the monster stays alive to be targeted) |

| Channeling | [GREEN]▼ | 100% | Consumed upon casting |

Spell Cost = roundup((Level * Base_cost / 100) * (1 + interference * 0.5%) * (1 - mana_conservation) * (1 - spirit_stance) * (1 - coalesced))
All of the passive factors also affect the upkeep cost of Innate Arcana.

## Spell Durations

The duration of spells lasting more than one turn depends on their base duration, the number of Ability Points invested (where applicable), and the relevant proficiencies.

## Spell Damage

Damage dealt by an offensive magic spell is the Player's Magic Damage Bonus multiplied by their Spell Damage Bonus for the element of the spell used multiplied by the damage modifier for the tier of spell used. It is reduced by the monster's magical mitigation and specific mitigation for the spell's element.

## Table Legend

| Column | Meaning |

| Tier | The tier of the spell. Can be 1-3. |

| Level | The minimum level needed to access the spell. |

| Min/Max Prof | The minimum base proficiency needed to access the spell and the maximum effective proficiency needed to get the highest bonuses. |

| Cost | The base mana cost of the spell and the reduced/increased cost via abilities. |

| CD | The base cooldown of the spell and the reduced cooldown via abilities. |

| Targets | The base number of targets the spell can hit and the increased number via abilities. |

| Duration | The base duration of the spell's effect and the increased duration via abilities. |

## Offensive Spells

These spells are used to inflict direct damage on monsters. Missing the primary target of an spell does not prevent it from hitting other targets if the spell is capable of doing so; each chance-to-hit is calculated independently.

Each type of monster has different levels of resistance to each damage types, which should be taken into consideration when choosing which spell to cast at which target. Monsters hit by offensive magic may also be afflicted by a set of negative status effects.

Tier 2 spells will always at least glance, and Tier 3 spells will always at least hit.

| Name | Description | Tier | Level | Min/Max Prof | Cost | CD | Targets |

| [cs=8]### Elemental |

| [cs=8]#### Fire |

| / Fiery Blast | A ball of fire is hurled at the target. | 1 | 15 | 0/200 | 6 | 0 | 3/5 |

| / Inferno | Unleashes an inferno of flames on all hostile targets, causing Fire damage. | 2 | 95 | 50?/500 | 14 | 4/2 | 5/7 |

| / Flames of Loki | Fire damage. | 3 | 175 | 150/800 | 21 | 7/4 | 7/10 |

| [cs=8]#### Cold |

| / Freeze | Cold damage. | 1 | 25 | 0/200 | 6 | 0 | 3/5 |

| / Blizzard | Cold damage. | 2 | 105 | 50/500 | 14 | 4/2 | 5/7 |

| / Fimbulvetr | Cold damage. | 3 | 185 | 150/800 | 21 | 7/4 | 7/10 |

| [cs=8]#### Elec |

| / Shockblast | A bolt of lightning strikes the target, causing Elec damage. | 1 | 35 | 0/200 | 6 | 0 | 3/5 |

| / Chained Lightning | Elec damage. | 2 | 115? | 50?/500 | 14 | 4/2 | 5/7 |

| / Wrath of Thor | Elec damage. | 3 | 195 | 150/800 | 21 | 7/4 | 7/10 |

| [cs=8]#### Wind |

| / Gale | A blast of wind hits the target, causing Wind damage. | 1 | 45 | 0/200 | 6 | 0 | 3/5 |

| / Downburst | Wind damage. | 2 | 125? | 60/500 | 14 | 4/2 | 5/7 |

| / Storms of Njord | Wind damage. | 3 | 205 | 150/800 | 21 | 7/4 | 7/10 |

| [cs=8]### Divine |

| / Smite | Holy damage. | 1 | 65 | 0/500 | 14 | 0 | 3/5 |

| / Banishment | Holy damage. | 2 | 100? | 100/700 | 21 | 4/2 | 5/7 |

| / Paradise Lost | Holy damage. | 3 | 200? | 200/900 | 30 | 7/4 | 7/10 |

| [cs=9]### Forbidden |

| / Corruption | Dark damage. | 1 | 85 | 0/500 | 14 | 0 | 3/5 |

| / Disintegrate | Dark damage. | 2 | 100? | 100/700 | 18.5? | 4/2 | 5/7 |

| / Ragnarok | Dark damage. | 3 | 245 | 200/900 | 28? | 7/4 | 7/10 |

## Deprecating Spells

These spells are used to inflict debuffs on the monsters. Most of these debuffs will assist you in increasing your survival chances by weakening the attack power/frequency of the monsters (like Weaken or Silence), some others will make them more vulnerable to your attacks (Imperil), some will do both at once (Sleep, Immobilize with its ability slotted).
The minimum proficiency corresponds to the proficiency needed to have the spell available. The maximum proficiency corresponds to the breakpoint when the debuff's duration reaches the maximum multiplier (x4 duration).

| Spell | Description | Level | Min/Max Prof | Cost | CD | Duration |

| / Drain | Inflicts Drain on one target, causing damage over time. • Inflicts Vital Theft on the target | 30? | 0/300? | 11.5 | 20/15 | 7? |

| / Slow | The target is slowed by x%, making it attack less frequently. • Base action speed reduction: 30%/50% | 10? | 0/300? | 18/25 | 3 | 10/15 |

| / Weaken | The target is weakened, making it deal less damage, and preventing it from scoring critical hits. • Base Physical and Magical damage reduction: 25%/50% | 70 | 0/345 | 10/16 | 3/0 | 10/15 |

| / Sleep | The target is lulled to sleep, preventing it from taking any actions. • Base chance of breaking on damage: 90%? • Sleeping monsters cannot attack, evade, or parry attacks • Sleeping monsters' base Resist is lowered by 50% | 80 | 0/410 | 22/35 | 7 | 5/7 |

| / Confuse | Confuses the target, making it lunge out wildly and strike friends and foes alike. • Base chance of breaking on damage: 90%? • Base chance of monster hitting itself: 25%? | 150 | 45/660 | 25/35 | 10 | 10/12 |

| / Imperil | The target is imperiled, reducing physical and magical mitigation as well as elemental mitigations. • Base Physical and Magical defense reduction: 25%/50% • This reduction is multiplicative (ie, a monster with 80% physical mitigation would be reduced to 60%, or lower with Abilities. • The Penetrated Armor multiplier is layered with this reduction (i.e. 0.8 physical mitigation * 0.5 imperil reduction * 0.25 penetrated armor reduction = 0.1 physical mitigation). • Base Fire/Cold/Elec/Wind resistance reduction: 10%/40% • Base Dark/Holy resistance reduction: 0%/25% • The elemental resistance reductions are additive, but they cannot reduce it below 0%. | 130 | 30/495 | 10/15 | 3/0 | 10/15 |

| / Blind | Blinds the target, reducing the chance of it landing attacks and hitting with magic spells. • Base attack/magic hit chance reduction: 20%/30% | 80? | 30/610 | 18/25 | 7/3 | 10/15 |

| / Silence | The target is silenced, preventing it from using special attacks and magic. | 120 | 40/665 | 18 | 10/5 | 10/13 |

| / Immobilize | Immobilize the target, making it unable to evade attacks or spells. • Slowing effect requires at least 1 AP investment. • Does not disable parrying. • Also reduces the target's base Resist by 25%/50%. | 250? | 100?/800 | 22 | 15/10 | 10/15 |

## Supportive Spells

| Spell | Description | Level | Min/Max Prof | Cost | CD | Duration |

| [cs=7]### Curative |

| / Cure | Restores a moderate amount of Health on the target. • Base health restored = base_health * (AP / 100) * MIN (1.5, MAX ((0.8 + supportive_proficiency / player_level * 0.2), (1 + (supportive_proficiency - player_level) / player_level * 0.5))) | 5 | 0/385+ | 20 | 5/2 | N/A |

| / Regen | Places a heal over time effect on the target. • Base health restored per turn = base_health * (AP / 100) | 50? | 0/845 | 22.5/75 | 0 | 14/30 |

| / Full-Cure | Fully restores the Health of the target. | 220 | 0/945+ | 50 | 10 | N/A |

| [cs=7]### Supportive |

| / Protection | Places a shield effect on the target, absorbing 25%/30% of the damage from all attacks. | 10? | 0/320 | 25 | 0 | 15?/30 |

| / Haste | Speeds up all actions of the target, allowing it to attack more frequently. • Base Action Speed increase: 25%/50% | 60? | 0/450 | 30 | 0 | 10?/20 |

| / Shadow Veil | Surrounds the target with a veil of shadows, making it harder to hit with attacks and spells. • Base evade chance increase: 10%/20% • 10%/20% chance for monsters to "whiff at shadows" | 90 | 0/610 | 30 | 0 | 10?/20 |

| / Absorb | The next magical attack against the target has a chance to be absorbed and partially converted to MP. • The effect is permanent until it absorbs a spell. • Base chance to absorb: 60%/90% • Cannot absorb critical hits • Absorbed MP is between 5-10% of the monster's base max MP? Very little MP regained • Can absorb more than 1 spell if they occur on the same turn. | 50? | 0/385+? | 30 | 20 | ∞ |

| / Spark of Life | Any attack that would one-shot a target with more than 1 HP leaves it alive but on the brink of defeat. The buff is removed when triggered. • If the player does not have enough SP remaining the trigger will fail and the player will die. • When active and enough SP is available the player's health bar will turn dark green. | 100 | 0/750? | 44?/30 | 0 | 15?/30 |

| / Cloak of the Fallen | Being brought back by Spark of Life has draped you with this powerful protective shield, increasing your damage resistance for a brief time. • When Spark of Life is triggered Cloak of the Fallen procs, which grants full immunity to damage for the rest of the turn that Spark triggers. • Attacks that are fully nullified will not appear in the message log but effects like Spike Shield recoil for the nullified attacks will. • Grants +75% physical and magical mitigation bonus. | [cs=4] | 3? |

| / Arcane Focus | The target attains a higher level of attunement with the arcane forces, increasing spell and crit damage. • Magical damage bonus: 25% • Magical crit damage bonus: 25%/40% | 175 | 0/980? | 100 | 0 | 50?/100 |

| / Heartseeker | The target attains intimate knowledge of the flow of life in all living beings, increasing attack and crit damage. • Physical damage bonus: 25% • Physical crit damage bonus: 25%/40% | 140 | 0/880? | 100 | 0 | 50?/100 |

| / Spirit Shield | Powerful attacks against you will be partially absorbed and damage your spirit gauge instead of health. • Any attack that hits for more than 45-20% of max HP will cause the player to lose exactly 45-20% of their health, with the remainder absorbed as damage to their spirit.(Formula) • The spell will fail if the player does not have sufficient SP. | 200 | 0/950? | 25 | 0 | 15?/30 |

Spirit Damage = Base_SP * SS_AP_Damage * MIN( (Damage - Max_HP * SS_AP_Damage) / (Max_HP * SS_AP_Damage * 3) , 1)
(SS_AP_Damage = percentage of damage required for Spirit shield to kick in) Note: This formula works in such way that increasing base spirit points (e.g. by increasing STR primary attribute or through the Suffusive Spirit hath perk) increase the spirit cost of Spirit Shield (and Spark of Life) proportionately. 

## Status Effects

When an offensive spell or a spike shield hits a monster, it may produce an associated status effect on the target, which lasts for a number of ticks. In addition, these status effect will explode for bonus damage on the monster when struck by the next offensive spell in the cycle. For example a monster afflicted by Searing Skin will receive extra damage when struck by a Cold spell. Drain counts as a Dark spell for this and can explode Breached Defense. The status effect will dissipate after it explodes.

| Name | Description | Additional Effect(s) | Duration |

| Searing Skin | The skin of the target has been scorched, inhibiting its attack damage. • Caused by Fire spells/spike shield • Damage reduction: 10% | Cold resistance is lowered by 25. | [rs=6]3 |

| Freezing Limbs | The limbs of the target have been frozen, causing slower movement. • Caused by Cold spells/spike shield • Speed reduction: 10% | Wind resistance is lowered by 25. |

| Turbulent Air | The air around the target has been upset, blowing up dust and increasing its miss chance. • Caused by Wind attacks/spike shield • Base Accuracy reduction: 10% | Elec resistance is lowered by 25. |

| Deep Burns | Internal damage causes slower reactions and lowers evade and resist chance. • Caused by Elec spells/spike shield • Base Evade and Resist reduction: 10% | Fire resistance is lowered by 25. |

| Breached Defense | The holy attack has penetrated the target's defenses, making it take more damage. • Caused by Holy spells • Physical & Magical mitigation reduction: 10% | Dark resistance is lowered by 25. |

| Blunted Attack | The decaying effects of the spell has blunted the target's offenses, making it deal less damage. • Caused by Dark spells • Damage reduction: 10% | Holy resistance is lowered by 25. |

| Burning Soul | The life essence of the target has been set ablaze, damaging its physical form over time. • Caused by Holy spells with Soul Fire ability slotted • Damage over time = MDB * (1 + EDB / 100) * 0.2 | Will cause Ether Theft if targeted by Drain and the ability Ether Theft is active (even if Drain is resisted/absorbed/evaded) | [rs=2]7 |

| Ripened Soul | The life essence of the target has been corrupted beyond repair, damaging its physical form over time. • Caused by Dark spells with Ripened Soul ability slotted • Damage over time = MDB * (1 + EDB / 100) * 0.2 | Will cause Spirit Theft if targeted by Drain and the ability Spirit Theft is active (even if Drain is resisted/absorbed/evaded) |

### Chance on Hit

The chance-on-hit to proc one of these effects on a monster varies based on the spell cast.

The following base averages have been observed:

- From being hit with a spike shield active: 17.5%

- T1: 25%

- T2: 50%

- T3: 75%

### Theft Effects

Thefts are status effects inflicted by Drain. Casting Drain on a target will inflict Vital Theft, and will also inflict Ether Theft or Spirit Theft when specific conditions are met.

| Name | Description | Effect(s) | Duration |

| Vital Theft | Siphons off the target's life essence over time. This causes a damage-over-time effect and returns a small amount of health to the player. • Damage over time = MDB * (1 + forbidden EDB / 100) * 0.1 • HP damage/drained = 5% of the target's current HP or 5% of your total base HP, whichever is lower | Damages the target then heals the player after each of the target's turn. • Damage occurs first, before healing the player. | See Drain |

| Ether Theft | Siphons off the target's mana over time. This returns a small amount of mana to the player. • MP damage/drained = 5% of the target's current MP or 5% of your total base MP, whichever is lower | Reduces the target's MP and recovers the player's MP after each of the target's turn. | [rs=2]5 |

| Spirit Theft | Siphons off the target's spirit over time. This returns a small amount of spirit to the player. • SP damage/drained = 5% of the target's current SP or 5% of your total base SP, whichever is lower | Reduces the target's SP and recovers the player's SP after each of the target's turn. |

## Spike Shields

Spike Shields are an ability that grant an added effect to the Protection spell. Only 1 of 4 elemental shields can be active at one time.

- Can proc upon parrying or blocking an attack.

- Do a minimum of 5 damage to monsters regardless of damage taken.

- Count as physical damage.

- Can proc status effects (~20%? chance).

## Procs

Spell procs take priority in the following order (assuming they are applicable):

Absorb > Spirit Shield > Spark of Life > Spike effects

## Stacking

The effects of Arcane Focus and Heartseeker cannot be active simultaneously: in the case one is already active, casting the second will result in the dissipation of the first one.

## See also

- Abilities

- Hath Perks

- Skills

| [cs=3]HentaiVerse Navigation |

| [rs=4]Character | Menu | Stats • Training • Settings • Persona • Isekai |

| Abilities | Skills • Spells (Spell Damage‎) • Spirit Stance |

| Levels | Experience Points • Leveling Up • Ranks • Level and Rank Table |

| Info. | Action Speed • Overcharge • Proficiencies • Stamina |

| [rs=2]Services | Bazaar | The Armory • Item Shop • Monster Lab (Monster Stats) • Shrine • MoogleMail • The Lottery • The Market |

| The Armory | Organize • Modify • Repair • Soulbind • Purchase • Sell • Salvage |

| [rs=2]Items | Drops | Loot Drop Rolls • Obsolete Items |

| Equipment | Equipment Basics • Detailed Equip Characteristics • Weapon Procs • Stats • Burden • Interference • Equipment Ranges • Level Scaling |

| [rs=2]Battles | Modes | Arena • Grindfest • Item World • Random Encounter • Ring of Blood • The Tower |

| Info. | Bestiary • Damage Types • Damage (Physical Damage) • Enemy Procs • RiddleMaster |

| [rs=2]Isekai | The Tower | Ranking • Rewards |

| Info. | Seasons • Rewards • Rules |

| [rs=3]Misc. | Currency | Credits • Gallery Points • Hath • Hath Perks |

| Strategy | Advice • Advanced Advice |

| System | Dawn of a New Day • Bugs • Technical Issues • FAQ • Hotkeys • Scripts & Tools |

Retrieved from "https://ehwiki.org/index.php?title=Spells&oldid=66314"
				Category: 
- HentaiVerse
				
				
			
		
		
	
	
		
## Navigation menu

		
			
### Page actions

			
				
				
- Page
- Discussion
- Read
- View source
- History
				
				
			
		
		

	
### Page actions

	
		
- Page
- Discussion
- More
- Tools
		
	

		
			
### Personal tools

			
				
				
- Create account
- Log in
				
			
		
		
			
		
		
		

	
### Navigation

	
		
- Main Page
- Recent changes
- Random page
- Help
		
	

		
			
### Search

			
				 
			
		
		

	
### external links

	
		
- E-Hentai.org
- E-Hentai Forums
- HentaiVerse
		
	

	
### Tools

	
		
- What links here
- Related changes
- Special pages
- Printable version
- Permanent link
- Page information
		
	

		
		
		
		
		
	
	
	
	
		
			
		
		
			
		
		
			
- This page was last edited on 15 October 2026, at 15:37.
- Content is available under GNU Free Documentation License 1.2+ unless otherwise noted.
			
- Privacy policy
- About EHWiki
- Disclaimers