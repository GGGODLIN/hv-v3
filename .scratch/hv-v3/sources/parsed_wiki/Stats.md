Character Stats - EHWiki

- # Character Stats

			
				From EHWiki
				(Redirected from Stats)
				
				Jump to navigationJump to search
				
				

| [cs=2][COLOR:#660000]CHARACTER [COLOR:#660000]Character / [COLOR:#660000]Equipment / [COLOR:#660000]Abilities / [COLOR:#660000]Training / [COLOR:#660000]Item Inventory / [COLOR:#660000]Settings [COLOR:#660000]BAZAAR [COLOR:#660000]Item Shop / [COLOR:#660000]The Shrine / [COLOR:#660000]The Market / [COLOR:#660000]The Armory / [COLOR:#660000]Monster Lab / [COLOR:#660000]MoogleMail / [COLOR:#660000]Weapon Lottery / [COLOR:#660000]Armor Lottery [COLOR:#660000]BATTLE [COLOR:#660000]The Arena / [COLOR:#660000]Ring of Blood / [COLOR:#660000]GrindFest / [COLOR:#660000]Item World [COLOR:#660000]Stamina: 99 [COLOR:#660000]Normal [COLOR:#660000]Lv.123 [COLOR:#660000]Persistent |

| [COLOR:#660000]Organize [COLOR:#660000]Modify [COLOR:#660000]Repair [COLOR:#660000]Soulbind [COLOR:#660000]Purchase [COLOR:#660000]Sell [COLOR:#660000]Salvage | | [COLOR:#660000]New[COLOR:#660000]One-Handed[COLOR:#660000]Two-Handed[COLOR:#660000]Staffs[COLOR:#660000]Shield[COLOR:#660000]Cloth[COLOR:#660000]Light[COLOR:#660000]Heavy[COLOR:#660000]Salvaged | | ## Contents • 1 Primary Attributes • 1.1 Limits • 1.2 Experience Point Allocation • 2 Derived Attributes • 2.1 Base Damage • 2.2 Accuracy • 2.3 Attack Speed • 2.4 Cast Speed • 2.5 Evade • 2.6 Parry • 2.7 Resist • 2.8 Block • 2.9 Mitigation • 2.10 Vitals • 2.10.1 Battle Regen • 3 Other Stats • 3.1 Elemental Resistance • 3.2 Compromise Stats • 3.3 Mana Conservation • 4 See also ## Primary Attributes Primary Attributes are the base stats for the calculation of all derived stats. Players can increase their Primary Attributes by four means and are displayed in 3 colors on the UI: • Experience Points ([COLOR:#5c0d11]brown). These can be freely allocated as explained below. • Shrining artifacts ([COLOR:red]red). This has a chance to grant a point permanently to a random attribute. The maximum bonus each attribute can receive is increased by 1 every 10 levels gained, up to a maximum of +50 at level 500. • Equipment ([COLOR:#0030CB]blue). Any pieces that have Primary Attribute Bonuses will grant these when worn. • Isekai Bonus ([COLOR:#5c0d11]also brown but listed below the others). Increased by clearing Floors in the Isekai game mode and applies to every primary attribute. The sum of all 4 sources is listed under Effective Primary Stats which is visible down the right side of the character stats screen. These stats are those that are taken in consideration in all formulas. There are six Primary Attributes: | Strength (STR) • 1 point = +2 to Physical Damage formula • (1H only) 100 points = +1% Overwhelming Strikes Chance • (1H only) 50 points = +1% Counter-Attack Chance • (2H/Niten only) 50 points = +1% Domino Strike Chance | Endurance (END) • 1 point = +6 Health Points • 1 point = +1 to Physical Mitigation formula • 1 point = +1 to Magical Mitigation formula • (1H only) 100 points = +1% Overwelming Strikes Chance | | Dexterity (DEX) • 1 point = +1 to Physical Damage formula • 1 point = +0.5 to Attack Accuracy • 1 point = +0.4 to Parry • (1H only) 50 points = +1% Counter-Attack Chance • (2H/Niten only) 50 points = +1% Domino Strike Chance • (DW/Niten only) 100 points = +1% Offhand Strike Chance | Intelligence (INT) • 1 point = +2 to Magical Damage formula • (Staff only) 100 points = +1% Coalesced Mana Chance | | Agility (AGI) • 1 point = +0.5 to Physical Mitigation formula • 1 point = +0.4 to Evade • 1 point above the player's level = +(10%/level) Attack Speed • (DW/Niten only) 100 points = +1% Offhand Strike Chance | Wisdom (WIS) • 1 point = +1 Magic Points • 1 point = +0.04 Magic Regen • 1 point = +1 to Magical Damage formula • 1 point = +0.5 to Magical Mitigation formula • 1 point = +0.5 to Magic Accuracy • 1 point = +0.4 to Resist • (Staff only) 100 points = +1% Coalesced Mana Chance | | [cs=2]Every point invested in any attribute: • +0.2 Spirit Points • +1/600 Spirit Regen | ### Limits • Proc chances from fighting styles are capped at various values. • Mitigation from Primary Attributes are capped at 80%. • Attack Speed from AGI is capped at 10%, which occurs at 2x level. • Any percentage effects on Mitigation stats and Attack Speed are added multiplicatively. It becomes increasingly harder (technically impossible) to reach 100% in any of these derived stats. The Protection spell, for example, grants an additional 25% damage mitigation, but this is applied after all other forms of damage mitigation. ### Experience Point Allocation Clicking on the "+/-" near a Primary Attribute allows players to allocate their experience points to/from said attribute. Holding Shift while clicking moves by 10 points instead of 1 and Ctrl by 100 points. The EXP needed to raise an attribute increases as it goes up. The amount of EXP needed to level up begins to exceed the amount of EXP needed to raise all primary attributes by one point as the player rises in level. The total EXP cost required to raise an attribute from zero to the next level is: (current_stat + 1)^(2.5475566751265^(1+(current_stat/950))) The EXP cost to raise an additional point is: (current_stat + 2)^(2.5475566751265^(1+((current_stat + 1)/950))) - (current_stat + 1)^(2.5475566751265^(1+(current_stat/950))) ## Derived Attributes Derived attributes are stats calculated from the player's effective primary attributes. These stats are displayed on the player's Character page of the HentaiVerse. These formulae may be partially inaccurate. For mitigation and attack speed, the effect of equipment bonus, ability, and base value from the Primary Attributes are all applied as "layers". For everything else, the bonus granted is the sum of the values on the player's current equipment, abilities, and base value from the Primary Attributes. ### Base Damage The base damage granted by Primary Attributes, equipment's Attack Damage Bonus (ADB), and abilities are all added together. The Title bonus, Hath Perk bonus, and Tower bonus are not included here. Attack base damage = (log(3330 + STR * 2 + DEX , 1.0003) - 27029.81) + (weapon_prof * TYPE) + (weapon_Attack_Damage_Bonus) + (helmet_Attack_Damage_Bonus) + ... + (feet_Attack_Damage_Bonus) • Where TYPE = 5 for Dual Wielding, 4 for 1-Handed, and 3 for the rest, when the associated weapon ability is maxed out. For Unarmed this is a flat bonus of +10. • Where weapon_Attack_Damage_Bonus is multiplied by (1-0.2*(600-dw_prof)/600) for offhand attacks using a weapon other than a dagger or wakizashi. • When using the maxed out 2H Accuracy Ability this is then multiplied by (1+0.0004*2h_prof) Magic base damage = (log(3330 + INT * 2 + WIS , 1.0003) - 27039.81) + (staff_prof * 0.5) + (main_hand_Magic_Damage_Bonus) + (off_hand_Magic_Damage_Bonus) + (helmet_Magic_Damage_Bonus) + ... + (feet_Magic_Damage_Bonus) ### Accuracy The accuracy granted by Primary Attributes, equipment, and abilities are all added together. Accuracy is rolled against a monster's avoidance stats to determine how much Damage is dealt. Physical Attack Accuracy = DEX * 0.05 + proficiency_bonus + (weapon_Attack_Accuracy) + (helmet_Attack_Accuracy) + ... + (feet_Attack_Accuracy) Magic Attack Accuracy = WIS * 0.05 + proficiency_bonus + (main_hand_Magic_Accuracy) + (off_hand_Magic_Accuracy) + (helmet_Magic_Accuracy) + ... + (feet_Magic_Accuracy) • A weapon's Attack Accuracy bonus is applied only to the attack for which it is used. In other words, the offhand weapon's Attack Accuracy bonus will not affect the mainhand attack's Accuracy, but any dexterity bonus it provides will apply to both. • The Attack Accuracy bonus for an offhand weapon is multiplied by (1-X*(600-dw_prof)/600) where X = 0.2 for daggers and wakizashis, and 0.5 for everything else. • There is currently no shield that grants an Attack Accuracy bonus. • Offhand Magic Accuracy can be achieved with a Buckler or Kite Shield of the Battlecaster for the One-handed playstyle, or any Battlecaster or of Focus weapon for Dual Wielding/Niten. • The Magic Accuracy bonus of the offhand weapon is applied to the Magic Attack Accuracy without penalty. ### Attack Speed All bonuses are applied multiplicatively as "layers". Attack Speed = (1 - (1 - Min(0.1, Max((AGI - level) / level, 0) * 0.1)) * (1 - proficiency_bonus) * (1 - main_hand_Attack_Speed) * (1 - off_hand_Attack_Speed) * (1 - helmet_Attack_Speed) * ... * (1 - feet_Attack_Speed)) * f(Burden) • Where f() is some function that still needs to be discovered. ### Cast Speed Unlike Attack Speed, Cast Speed is additive. Cast Speed = (1 + equipment_bonus + proficiency_bonus) ### Evade Evade = (AGI * 0.4 + (helmet_Evade) + ... + (feet_Evade) + title_bonus) * f(Burden) • Where f() is some function that still needs to be discovered. ### Parry Parry = DEX * 0.4 + (main_hand_Parry) + (off_hand_Parry * off_hand_bonus) + proficiency_bonus Where off_hand_bonus = 1.5 for daggers and wakizashis, 1.2 for shortswords, and 1 for everything else. ### Resist Resist = WIS * 0.4 + (helmet_Resist) + ... + (feet_Resist) ### Block Block = (main_hand_Block) + (off_hand_Block) + (helmet_Block) + ... + (feet_Block) + proficiency_bonus ### Mitigation Mitigation is a multiplier that reduces each instance of damage of the corresponding type. Physical Mitigation = 1 - (1 - equipment_bonus) * (900/(900 + END + (AGI/2))) Magical Mitigation = 1 - (1 - equipment_bonus) * (900/(900 + END + (WIS/2))) ### Vitals Health Points keep the player alive. Magic Points are used to cast Spells and maintain Innate Arcana slots. Spirit Points are used to maintain Spirit Stance, and as cost for the effects of Spirit Shield and Spark of Life. Health Points = (500 + (Level * 10) + (END * 6)) * HP Tank * vigorous_vitality Magic Points = (10 + Level + WIS) * MP Tank * effluent_ether Spirit Points = (1 + (STR + DEX + AGI + END + INT + WIS) / 5) * SP Tank * suffusive_spirit Mana Cost = 100% * (1 + Interference * 0.5%) * (1 - mana_conservation) • Any potions/gems/spells modifying player's HP/MP/SP refers to player's base HP/MP/SP (i.e. before ability bonuses are applied). • The Hath Perk bonus is 1.10 if the appropriate perk is possessed. Otherwise it is 1. #### Battle Regen A 'tick' is not equivalent to a turn; it represents 100 time units in the game, which is equivalent to the base action time before any speed bonuses are applied. MP gained per tick = 5 + (WIS/25) * perk_bonus SP gained per tick = 1 + (Sum of all attributes / 600) * perk_bonus • The perk_bonus is 1.50 if Resplendent Regeneration (or Gold star) is obtained, 2 if both are possessed, and otherwise is 1. ## Other Stats ### Elemental Resistance For the series, see here. / Elemental Resistance (or Elemental Mitigation) is a stat that is provided by various Equipment, Charms, Infusions, and Abilities. • Each 1% of resistance increases the player's mitigation against attacks of that element by 1%. • These resistances are before any effects of equipment. • This is multiplicative. ### Compromise Stats • Burden • Interference ### Mana Conservation • Reduces the cost of all spells. Found on certain weapons and cloth armor with the prefix "Frugal" as well as via the Economizer Charm. • This is multiplicative. ## See also • Character Menu‎ • Experience Points • Proficiencies • Damage | |

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

Retrieved from "https://ehwiki.org/index.php?title=Character_Stats&oldid=65166"
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
		
	

		
		
		
		
		
	
	
	
	
		
			
		
		
			
		
		
			
- This page was last edited on 22 September 2026, at 21:03.
- Content is available under GNU Free Documentation License 1.2+ unless otherwise noted.
			
- Privacy policy
- About EHWiki
- Disclaimers