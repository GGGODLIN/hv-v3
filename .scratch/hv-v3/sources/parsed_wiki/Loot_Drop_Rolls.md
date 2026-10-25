These are the drop formulas for the HentaiVerse. All drops go through several rolls to determine what the player will receive.

## Contents

- 1 Loot Rolls

- 2 Occurrences

- 2.1 Limits

- 3 Increased Drop Chances

- 4 Credits

- 5 Events

- 6 Trivia

- 7 See also

## Loot Rolls

| Roll | Base | Affected By |
| --- | --- | --- |
| Drop Roll | 10% | Scavenger training (up to +5%) Monster's Power Level bonus ((PL - 500) / 50); capped at +15%) Arena clear / Random Encounter bonus One additional roll for crystals in Grindfest (forward to C.Type Roll) |
| Equipment Roll | 2.5% | Quartermaster Training (up to 2x) Guaranteed for Arena clear Guaranteed for Ring of Blood clear Will auto-fail if 1,000 equipment pieces are owned |
| E.Quality Roll | 0 | Difficulty Nintendo and above have 0% chance for Fair/Crude Nightmare and below have 0% chance for Legendary/Peerless Arena clears have a very low chance for Legendary even on Normal Arena and Ring of Blood clear bonus Equal to a T1 trophy on Endgame challenge and below. Becomes T2+ with any higher challenge on Nightmare difficulty or higher. Longest Journey and above get +1 tier at Nightmare and above, and the three (?) highest arenas get an additional +1 tier at IWBTH/PFUDOR. A Dance with Dragons on PFUDOR is T7, Post Game Content is two T7s, and Secret Pony Level is three T7s. Trophies are pre-determined based on trophy tier and are not affected by anything else All trophies have 0.0001% chance for Peerless T6 estimated rates: Legendary = 2%[1] Magnificent = 20% Exquisite = 78% |
| Slot Roll | Weighted: 9 / 3 / 3 / 3 / 15 / 15 / 15 <br> (1H / 2H / Staff / Shield / Cloth / Light / Heavy) | N/A; Trophies allow for manual selection |
| Tier Roll | Every quality rank has a specific base Rarity Chance | Probabilities to get a rare equipment (Force Shield, Phase clothes, Shade armor, Power armor) over a non-rare: Peerless = >25% base chance Average = 2%? base chance Fair/Crude = 0% chance Rarity Chance is multiplied directly by Luck of the Draw training (up to +25%) Since there aren't any rare 1H/2H/staffs, this roll isn't done for these types of equipment. |
| Suffix Roll | None | Limited selection based on type Quality must be Fair or higher; guaranteed at Superior or higher |
| PAB Rolls | 0 | Quality and Tier Certain PABs cannot be rolled depending on the slot (e.g. STR on Staffs) Phase has ~3.5% chance of having 0 Staffs have 5% or 6.25% chance of having 0, depending on the type Maximum of 2 at Superior/Exquisite quality At Legendary/Peerless quality will always have 3 (4 for Light armor) Suffixes may add additional PABs (e.g. Arcanist) |
| Prefix Roll | Pre-determined, requires "Superior" or higher | See chart |
| Artifact Roll | 0.2% | Archaeologist training (up to 2x) Random Encounter bonus (2.5x) |
| Collectable Roll | 1%? | N/A |
| Token Roll | 0.2% | Does not involve Soul Fragments which are solely from Random Encounters Random Encounter bonus (2.5x) Arena Challenge / Ring of Blood clear bonus (15-25%?) Tokenizer hath perks (up to 4x) |
| T.Type Roll | 20% / 80% <br> (Blood / Chaos) | Tokenizer hath perks increases relative Chaos drop rate |
| I.Type Roll | 35% / 35% / 10%? / 10% / 4%? / 4% / 2% <br> (Restoratives / Crystals / Scrolls / Food / Infusions / Shards / Special Items) | N/A |
| R.Quality Roll | 79% / 19% / 2% <br> (Draught / Potion / Elixir) | N/A |
| C.Type Roll | Equal | N/A |
| C.Multiplier | 1x | Difficulty (up to 3x) Grindfest round bonus (up to 3x) The two above cannot combined to more than 5x Crystarium Hath Perks (up to 10x) |

## Occurrences

- Loot drop rolls only occur after clearing a battle round (with the exception of power-ups, which drop immediately after defeating a monster). There is a maximum of 1 drop per defeated monster.

- Guaranteed drops occur after clearing Random Encounters, Ring of Blood, and Arena challenges in addition to the last round's normal drop chances.

- For trophies, the drop is guaranteed except in the non-final rounds of the level 225+ arena challenges where it is a static 10% chance.

- No drops occur if the player is at 0 stamina.

### Limits

Grindfest and Item World have a fixed "rare drop" decrease modifier for artifact and token drop rates at Nightmare and lower difficulties.

## Increased Drop Chances

Scavenger, Quartermaster, and Archaeologist training affect the base chances of drops. Base chance of getting any loot at all is 10%; maxing out Scavenger can bring this up to 15%. Scavenger increases a player's chance of getting both equipment and artifacts as there will be more rolls occurring after the initial loot roll, but their individual percentages will remain the same. Fighting more difficult monsters also gives an additional 0-15% drop rate, making the maximum drop rate 27.5% with maxed Scavenger and a monster with at least 1250PL. Additionally, because equipment rolls occur before artifact rolls, increasing Quartermaster will slightly reduce a player's chance of getting artifacts and other items.

Drop chance can be determined by the following formula (Base_loot_drop = 0.10):

`Loot_drop = Base_loot_drop * (1 + Scavenger_level * 0.01) + Monster_PL_bonus
`

True equipment drop chance can be determined by the following formula (Base_equipment_drop = 0.025):

`Equipment_drop = Loot_drop * (Base_equipment_drop * (1 + Quartermaster_level * 0.05)
`

True artifact drop chance can be determined by the following formula (Base_artifact_drop = 0.002):

`Artifact_drop = (Loot_drop - Equipment_drop) * (Base_artifact_drop * (1 + Archaeologist_level * 0.1))
`

Other loot always has a 100% chance of dropping when a player rolls for a drop, and subsequent equipment and artifact rolls fail. More information about drop chances can be found here.

Formula for other loot:

`Other_drop = (Loot_drop - Equipment_drop - Artifact_drop) * (Base_other_drop)
`

(Base_other_drop is the numerical value for a specific item, i.e. percentage_value / 100. It is possible to also combine the base drop chances of several items to get their true combined drop chance).

## Credits

Credits can only drop from monsters that did not drop anything else; however, the credit drop chance is static (~20%?) and is not affected by anything (e.g. increasing Scavenger does not negatively impact credit drop chance in any significant way).

## Events

- Easter events strictly use difficulty as the only modifier for event item drop chance.

## Trivia

On generating equipment with the same stats:

  
    

      So the reason the RNGoddess was originally named "Snowflake" is that the equips were supposed to be more or less unique, since the RNG can have 2^32 possible seeds. But due to the birthday paradox, there will inevitably be collisions of sorts when enough equips have been generated.

      With the same parameters, the odds of getting the same seed twice at least one time is about 50% with 80000 runs.
    
  
  

—Tenboro [2]

## See also

- Items

- Equipment

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
