Action Speed - EHWiki

- # Action Speed

			
				From EHWiki
				
				
				Jump to navigationJump to search
				
				

| [cs=2][COLOR:#660000]CHARACTER [COLOR:#660000]Character / [COLOR:#660000]Equipment / [COLOR:#660000]Abilities / [COLOR:#660000]Training / [COLOR:#660000]Item Inventory / [COLOR:#660000]Settings [COLOR:#660000]BAZAAR [COLOR:#660000]Item Shop / [COLOR:#660000]The Shrine / [COLOR:#660000]The Market / [COLOR:#660000]The Armory / [COLOR:#660000]Monster Lab / [COLOR:#660000]MoogleMail / [COLOR:#660000]Weapon Lottery / [COLOR:#660000]Armor Lottery [COLOR:#660000]BATTLE [COLOR:#660000]The Arena / [COLOR:#660000]Ring of Blood / [COLOR:#660000]GrindFest / [COLOR:#660000]Item World [COLOR:#660000]Stamina: 99 [COLOR:#660000]Normal [COLOR:#660000]Lv.123 [COLOR:#660000]Persistent |

| [COLOR:#660000]Organize [COLOR:#660000]Modify [COLOR:#660000]Repair [COLOR:#660000]Soulbind [COLOR:#660000]Purchase [COLOR:#660000]Sell [COLOR:#660000]Salvage | | [COLOR:#660000]New[COLOR:#660000]One-Handed[COLOR:#660000]Two-Handed[COLOR:#660000]Staffs[COLOR:#660000]Shield[COLOR:#660000]Cloth[COLOR:#660000]Light[COLOR:#660000]Heavy[COLOR:#660000]Salvaged | | ## Contents • 1 Effects • 2 Turns • 3 Action Speed • 3.1 Base Action Speeds • 3.2 Increasing Action Speed • 3.3 Monster Action Speed • 4 Time Units • 4.1 Ticks • 5 External Links ## Effects Higher action speed decreases the amount of time units an action takes. This will often lead to being able to perform more actions per tick. This will be most visible with buff durations, as it becomes possible to attack multiple times before the duration decreases by 1. Similarly, vital regeneration, be they from spells, items, or natural regeneration, are also only received when ticks happen. A monster having a high attack speed or an action performed by the player having a long action time, may allow monsters to attack multiple times in a single player action. ## Turns Turns happen almost immediately server-side but may take a few milliseconds user-side. When a player takes an action, the action time is calculated to determine what else happens during that turn: monster attacks, and changes to effect durations. Some things are only effected by turns, for example: • Cooldowns are only decreased by turns, and not based on time units. • Turns made using an item do not reduce cooldowns for spells/skills, but do reduce the cooldowns on other items. They do not increase time units at all. To prevent botting and overloading the server there is a server side restriction which prevents more than 4 turns per second. ## Action Speed Action speed is calculated as: Action speed = 100 / (1 - cast speed) / specific action speed / prof factor speed multiplier * (1 + haste) The proficiency factor is a separate calculation. It uses a scale between 0-25% based on the spell's minimum requirement to use, a spell-specific cap, and your proficiency with that magic school. Prof factor = min( (effective prof - requirement) / (cap - requirement), 1 ) Prof factor speed multiplier = 1 - (0.25 * prof factor) ### Base Action Speeds Most player actions, including attacking, casting spells and using skills in the HentaiVerse increase the time units tally. The base action speeds of various actions are: | Action | Base Action Speed | | [cs=2]Physical Attacks and Weapon Skills | | Physical Attack | 1 | | Fighting Skills | 1? | | [cs=2]Basics | | Using items | n/a1 | | Toggling Spirit Stance | Note 1: Does not increase time units, and only decreases cooldowns for other items. Monsters recovering from stun get a free action the turn after, regardless of the player's action speed during that turn. It is currently unknown how this effects their regular turns. ### Increasing Action Speed The player can find his current Attack Speed and Casting Speed in the Statistics Pane • The Player can increase Attack Speed via: • Using the Haste spell (+25%, +50%) or Scroll of swiftness (+60%). • Using certain weapons such as Wakizashi, which have innate bonuses to attack speed. • Using a Wakizashi or Shortsword with the "of Swiftness" suffix. • Using certain armors or shield with the "Agile" prefix. • Putting the Swiftness Charm on a weapon. • The Light Speed ability, which can increase attack speed when using at least 3 pieces of light armor. This scales with the player's light armor proficiency. • Players who have AGI higher than their current level receive an attack speed bonus, capping at 10% when agility is twice their level. • Bonuses to Attack Speed stack multiplicatively. Having burden above 40 reduces any attack speed bonuses, completely removing them at 130 burden. • Player can increase Casting Speed via: • Using the Haste spell (+25%, +50%) or Scroll of swiftness (+60%). • Using certain armors with "Charged" prefix. • Putting the Spellweaver Charm on a weapon. • The Cloth Castspeed ability, which can increase casting speed when player use only cloth armor. This modification scales with the player's cloth armor proficiency. • Abilities that decrease casting time of specific spells. • The Player can also use Auto-Cast Slots, which improves a player's action economy by maintaining supportive spells without making turns. ### Monster Action Speed Player used six different items and monsters do not attack him in between. Player physically attacked one monster and every monster hit him back at least once. Some monsters attacked him twice, thanks to PFUDOR difficulty, high Swiftness Chaos Upgrade rank and moderate burden. • All monsters have a random initiative of 10-100 time units at the start of a round. A player action that increases time units is required for a monster to be able to attack, so no monster will attack on the round opening. • Monsters receive a free action after leaving a state of being stunned. • Monster's Action Speed may be increased by: • Custom Monsters can increase their action speed with the Swiftness Chaos Upgrade (+2.5% per rank, +50% max). • Playing on PFUDOR difficulty (+25%) • Wailings of the Present status effect increases attack speed of any living monster. • Monster's Action Speed may be decreased by: • Using Immobilize spell (-25%) • Using Slow spell (-30%, -50%) ## Time Units Most actions in the game add between 20-500 time units. For every 100 time units that pass, events happen. For example, buff durations counting down, gaining vitals from draughts, etc. Time units are not visible, but are an internal calculation that determine when things happen. These include: • Spell's duration. • Scroll's duration. • Infusion's duration, when it used as battle item • Other item's duration. • Weapon's proc duration. • Spell's proc duration. • Regen's replenishment effect. Time units = minmax(20, 10000/action speed, 500) ### Ticks Ticks are the equivalent of 100 time units, the point at which events happen. A player may make multiple attacks before a tick happens, due to the attack they are performing with their action speed counting as less than 100 time units. For example, using the action speed and time unit formulae: If a player has: Sheet speed: 14.7% Elemental prof: 643 Specific action speed: 1 Haste: 50% (Innate Arcana) Prof factor: min((643 - 0) / (200 - 0), 1) = 1 Prof factor speed multiplyer: 1 - (0.25*1) = 0.75 Action speed: 100 / (1 - 0.147) / 1 / 0.75 * 1.5 = 234.467~ Time units = minmax(20, 10000/234.467~, 500) = 42.65~ Rounded up, this gives the player 43 time units for a tier 1 spell. Therefore, assuming the starting time unit is 0, the player will be able to cast their tier 1 spell 3 times before the duration of their buffs would decrease by 1, as the total time units would be 129, leaving them on 29 time units. From that same point, the player would only be able to cast a further 2 tier 1 spells, as that would bring them to 115 from 29. ## External Links • Explanation of time units - From Nezu. | |

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

| Strategy | Advice • Advanced Advice |

| System | Dawn of a New Day • Bugs • Technical Issues • FAQ • Hotkeys • Scripts & Tools |

Retrieved from "https://ehwiki.org/index.php?title=Action_Speed&oldid=64923"
				Category: HentaiVerse
				
				
			
		
		
	
	
		
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
		
	

		
		
		
		
		
	
	
	
	
		
			
		
		
			
		
		
			
- This page was last edited on 6 August 2026, at 17:50.
- Content is available under GNU Free Documentation License 1.2+ unless otherwise noted.
			
- Privacy policy
- About EHWiki
- Disclaimers