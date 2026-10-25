## 

## 

| Challenge | Modifiers | Notes |
| --- | --- | --- |
| EXP | Credits | Monster HP | Potency EXP | Monster Damage & Crystals | Quality Roll Bonus | Power Level Ceiling |
| Normal | x1 | x1 | x1 | x1 | x1 | x1 | 0 | Lower drop chance for artifacts and tokens when doing Grindfest and Item World Voidseeker, Aether, and Amnesia shards do not drop? |
| Hard | x2 | x1.25 | x1.1 | x2 | x1.2 | x1.5 | +5? | Lower drop chance for artifacts and tokens when doing Grindfest and Item World |
| Nightmare | x4 | x1.5 | x1.2 | x4 | x1.4 | x2 | +20? | Lower drop chance for artifacts and tokens when doing Grindfest and Item World |
| Hell | x7 | x1.75 | x1.4 | x7 | x1.6 | x2.5 | +30? | Random equipment drops can now be Legendary/Peerless quality |
| Nintendo | x10 | x2.2? | x1.7 | x10 | x2 | x3? | +60? | Random equipment drops will be at minimum Average quality |
| IWBTH | x15 | x3 | x2 | x15 | x2.5 | x5 | +100? |  |
| PFUDOR | x20 | x3? | x2 | x20 | x3 | x6? | +125? | Random equipment drops will be at minimum Superior quality (does not affect arena clear bonus) Monsters have: +25% Action Speed bonus +50% mana/spirit regen +10% resist/parry A higher chance to use skills/magic attacks |

## Display Title

Applies any Title that has been unlocked which will be displayed both in game and on the E-Hentai Forums.

| Min. Level | Title | Bonuses | Additional Requirement to Unlock |
| --- | --- | --- | --- |
| 0 | Newbie | None |  |
| 1 | Beginner | +0.5% Physical Damage |
| 10 | Novice | +1% Physical Damage |
| 20 | Apprentice | +1.5% Physical Damage |
| 30 | Journeyman | +2% Physical Damage |
| 40 | Artisan | +2.5% Physical Damage |
| 50 | Expert | +3% Physical Damage |
| 60 | Master | +3.5% Physical Damage |
| 70 | Champion | +4% Physical Damage |
| 80 | Hero | +4.5% Physical Damage |
| 90 | Lord | +5% Physical Damage |
| 100 | Ascended | +6% Physical Damage <br> +1% Evade | Clear the Arena Challenge "Endgame". |
| 140 | Destined | +8% Physical Damage <br> +2% Evade | Clear the Arena Challenge "Sealed Power". |
| 200 | Godslayer | +10% Physical Damage <br> +3% Evade | Clear the Arena Challenge "The Trio and the Tree". |
| 300 | Dovahkiin | +10% Physical Damage <br> +3% Evade <br> FUS RO DAH Skill | Clear the Arena Challenge "A Dance with Dragons". |
| 500 | Ponyslayer | +12% Physical Damage <br> +4% Evade <br> FUS RO DAH Skill | Clear the Arena Challenge "Secret Pony Level". |

Note: ranks don't provide any bonus for magical damage or spell casting in general.

## Font Engine

Changes the font used for the in-game text. Some scripts require using a custom font (such as Arial or Verdana) and will not function if the default HV font is used.

## Equipment Sets

Ties the assignment of abilities, battle items, and quickcast bars to equipment sets.

## Vital Bar Style

Switches between centered (standard) and left-oriented (utilitarian) bars for the player in combat.

## Shrine Trophy Upgrades

Allows players to set the upgrade tier for shrining trophies.

- Use Default will upgrade trophies dependent on the players level:

- Level 200: Tier 2 => Tier 3 at a rate of 4:1

- Level 300: Tier 3 => Tier 4 at a rate of 2:1

- Level 400: Tier 4 => Tier 5 at a rate of 4:1

- Selecting any upgrade tier overwrites this, and may be selected at any level.

- Do Not Upgrade allows the player to shrine trophies individually at their normal tier.

## Quickbar Slots

Commonly used spells can be placed in the shortcut bar for easier access during battles. These are linked to the current equipment set.

## Auto-cast Slots

Allows players to set certain  supportive spells to be automatically cast at the beginning of battles.

- Slots are unlocked from the start, and don't require the Innate Arcana Hath Perks.

- The spells that can be assigned are: Haste, Shadow Veil, Protection, Spark of Life, Spirit Shield.

- Supportive Proficiency has a chance to be raised with each turn that an auto-cast spell is active. However, auto-cast spells cannot proc Channeling.

- The chance only occurs once per turn and is determined by upkeep cost.

- If a player chooses to manually cast an auto-casted spell, or use a scroll, the spell will be cast normally and the MP upkeep will be suspended. Once the duration of the spell runs out the auto-cast version will be recast at the end of the player's turn, before monster actions.

### Costs

Auto-casted spells deduct MP every battle round as upkeep.

- The base cost for each spell's per turn upkeep is determined by the spell's normal casting cost, its duration, and the action's speed of the player's last turn as follows:
`Upkeep = casting_MP_cost * Speed of action taken in the last turn / duration`

- Each rank of IA grants a 10% discount off of the upkeep, including the first rank.

- Supportive Proficiency helps reduce upkeep since it increases spell duration.

- These spells will dissipate if the player drops below 10% total MP and are recast once the player reaches at least 25%.

- When the player is between 10-24% MP the following will not be recast:

- Spark of Life after it has been triggered.

- Any spell which was manually cast.

## Auto-Sell / Auto-Salvage

Allows the player to automatically sell or salvage equipment dropped in battle, based on type and quality. 

- Equipment sold or salvaged in this way is fully generated for pricing, but not saved to the database and will not appear in the bazaar.

- The setting with the lowest quality is chosen first.

- If both settings are set to the same quality, the equipment will be sold.

Some examples of what will happen depending on your settings:

| Equipment | Sell setting | Salvage setting | Result |
| --- | --- | --- | --- |
| Exquisite Fiery Axe of Slaughter | Superior | Magnificent | Salvaged |
| Exquisite Fiery Axe of Slaughter | Magnificent | Superior | Sold |
| Exquisite Fiery Axe of Slaughter | Magnificent | Magnificent | Sold |

## See also

- Battles

- Character Menu

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
