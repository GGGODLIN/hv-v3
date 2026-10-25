Damage - EHWiki

- # Damage

			
				From EHWiki
				
				
				Jump to navigationJump to search
				
				This page is dedicated to explaining the mechanics of the ways players and monsters in the HentaiVerse reduce or avoid damage.

## Contents

1 Damage Reduction

1.1 Monsters

- 1.2 The Player

- 2 Damage Avoidance

2.1 Resist Mechanics

- 3 Anti-Avoidance

- 4 Countering

- 5 See also

## Damage Reduction

All damaging attacks are classified as either Physical or Magical, but also have a specific type:

### Monsters

| Mitigation | Description | Increased / Granted By | Reduced / Exploited By |

| Physical | Against player's melee attacks & skills | AGI, END, Chaos Token upgrade | • Penetrated Armor (equipment proc) - 25% per stack (up to 75%) • Breached Defense (Stat Effect from Holy spells) - 10% • Imperil (deprecating spell) - 25% (up to 50% with Better Imperil) • Spreading Poison (Backstab proc) - 10% |

| Magical | Against player's offensive spells | END, WIS, Chaos Token upgrade | • Breached Defense (Stat Effect from Holy spells) - 10% • Imperil (deprecating spell) - 25% (up to 50% with Better Imperil) |

| [rs=3]Specific | Slashing, Piercing, Crushing | Depends on monster class | Depends on weapon type |

| Fire, Cold, Wind, Elec, Holy, Dark | Elemental Mitigation | • Depends on weapon's damage type, spell's damage type • Imperil (deprecating spell) - 25% (Fire, Cold, Wind, Elec) (up to 40% with Better Imperil) • up to 25% (Holy, Dark) (only when Dark/Holy Imperil ability is active) • Elemental Status Effects - 25% (depends on status effect) |

| Void | [cs=2]There is no corresponding specific mitigation type for Void damage. |

### The Player

| Mitigation | Description | Increased / Granted By |

| Physical | Against monsters' basic attacks & physical skills | [rs=2]• Primary Attributes • Equipment • Equipment suffixes • Protection spell - 25% (Up to 30% with Better Protection or 50% with the scroll) • Defend - 25% • Cloak of the Fallen - 75% |

| Magical | Against monsters' magical skills |

| [rs=3]Specific | Slashing, Piercing, Crushing | • Equipment • Equipment Affixes • Heavy Abilities |

| Fire, Cold, Wind, Elec, Holy, Dark | • Equipment Affixes • Charms • Infusions - 25% • Spike Shield Abilities - Up to 25% |

| Void | There is no corresponding specific mitigation type for Void damage. |

It is important to note that mitigations are applied in a multiplicative fashion. Physical/Magical mitigations are reduced multiplicatively and specific mitigations are reduced additively. However, they cannot be reduced below 0, or reduced further if the mitigation is already negative.

The system first checks if the attack is physical or magical and applies the physical/magical mitigation. Then it checks if there is any specific damage type involved and applies the specific mitigation.

This works out to:

Damage Taken = Original_Damage_Roll * (1 - Physical or Magical Mitigation) * (1 - Specific Mitigation)

## Damage Avoidance

There are several factors that go into avoiding attacks for either the players or the monsters:

| [rs=2]Avoidance | [cs=2]Against | [rs=2]Successful Rolls | [rs=2]Damage Multiplier | [rs=2]Notes |

| Physical | Magical |

| [rs=3]Evade | [rs=3]✔ | [rs=3]✔ | 0 | x1 | Eligible to be a critical hit |

| 1 | x0.5 | Glancing blow |

| 2 | x0 | Evaded attack |

| [rs=3]Block | [rs=3]✔ | [rs=3]✔ | 0 | x1 |  |

| 1 | x0.5 | Partially blocked |

| 2 | x0 | Blocked attack |

| [rs=3]Parry | [rs=3]✔ | [rs=3] | 0 | x1 |  |

| 1 | x0.5 | Partially parried |

| 2 | x0 | Parried attack |

| Resist |  | ✔ | [cs=3]See below |

All avoidance stats are rolled twice with the opponent's accuracy or magic accuracy as a counter-stat, except for Resist which is rolled 3 times. Multiple avoidance stats can reduce the damage done during a single attack, e.g. an attack that glances and is partially blocked will deal x0.5*x0.5=x0.25 damage.

### Resist Mechanics

Both offensive spells and deprecating spells can be resisted, where offensive spells will have their damage reduced and deprecating spells will have their duration reduced, possibly not applying the debuff. Every time a player or monster casts a spell, the system will do three separate rolls for resist:

| Successful Rolls | Damage Reduction | Effect Duration |

| 0 | 0% | 100% |

| 1 | 50% | 75% |

| 2 | 75% | 50% |

| 3 | 90% | 0% |

A player's counter-resist can be gained from staffs (Oak, Willow, and from Penetrator charm), from Channeling, Focus, as well as from proficiency. Counter-resist from proficiency is capped at 50%, calculated as follows:

Proficiency counter-resist = ((effective_prof - monster_level) / monster_level) * 50%

## Anti-Avoidance

Custom Monsters can be upgraded to decrease player's effective evade/block/parry/resist chance. These stats are called anti-evade, anti-block, anti-parry and anti-resist.

- For example, A target with 20% evade will have effective 15% evade against an attacker with 25% anti-evade.

## Countering

Custom Monsters have various defenses from their Primary Attributes, which can be bolstered by appropriate the Chaos Upgrade.

The means to counter these when fighting them are as follows:

| Avoidance | Counters |

| Evade | • More accuracy (physical or magical) • Stun (Equipment Proc) - 100% • Sleep and Immobolize (Spell) - 100% • Deep Burns (Stat Effect from Elec spells) - 10% • Channeling - 100% |

| Parry | • More Physical accuracy • Stun (Equipment Proc) - 100% • Overpower Charm • Overwhelming Strikes (One-handed fighting style) • Sleep (Spell) |

| Resist | • More magic accuracy • More proficiency • Stun (Equipment Proc) - 25% • Oak and Willow Staffs (equipment) • Penetrator Charm • Focus (Universal Skill) • Sleep and Immobilize (Spell) - 50% and 25% (Up to 50% with Better Immobilize) • Deep Burns (Stat Effect from Elec spells) - 10% • Channeling - 100% |

## See also

- Damage Types

- Physical Damage

- Spell Damage

| [cs=3]HentaiVerse Navigation |

| [rs=4]Character | Menu | Stats • Training • Settings • Persona • Isekai |

| Abilities | Skills • Spells (Spell Damage‎) • Spirit Stance |

| Levels | Experience Points • Leveling Up • Ranks • Level and Rank Table |

| Info. | Action Speed • Overcharge • Proficiencies • Stamina |

| [rs=2]Services | Bazaar | Equipment Shop • Item Shop • Monster Lab (Monster Stats) • Shrine • MoogleMail • The Lottery • The Market |

| The Forge | Repair • Upgrade • Enchant • Salvage • Reforge • SoulFuse |

| [rs=2]Items | Drops | Loot Drop Rolls • Obsolete Items |

| Equipment | Equipment Basics • Detailed Equip Characteristics • Weapon Procs • Stats • Burden • Interference • Equipment Ranges • Level Scaling |

| [rs=2]Battles | Modes | Arena • Grindfest • Item World • Random Encounter • Ring of Blood • The Tower |

| Info. | Bestiary • Damage Types • Damage (Physical Damage) • Enemy Procs • RiddleMaster |

| [rs=2]Isekai | The Tower | Ranking • Rewards |

| Info. | Seasons • Rewards • Rules |

| [rs=3]Misc. | Currency | Credits • Gallery Points • Hath • Hath Perks |

| Strategy | Play Styles • Advice • Advanced Advice |

| System | Dawn of a New Day • Bugs • Technical Issues • FAQ • Hotkeys • Scripts & Tools |

Retrieved from "https://ehwiki.org/index.php?title=Damage&oldid=64962"
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
		
	

		
		
		
		
		
	
	
	
	
		
			
		
		
			
		
		
			
- This page was last edited on 17 August 2026, at 22:01.
- Content is available under GNU Free Documentation License 1.2+ unless otherwise noted.
			
- Privacy policy
- About EHWiki
- Disclaimers