The Forge allows players to repair, salvage, reforge, and improve their equipment. It does not allow for the creation of new equipment from scratch.

## Contents

- 1 Repair

- 1.1 Repair Costs

- 2 Upgrade

- 2.1 Materials

- 2.1.1 Basic Materials

- 2.1.2 Rares

- 2.1.3 Bindings

- 2.2 Material Costs

- 3 Enchant

- 3.1 Shards

- 3.2 Infusions

- 4 Salvage

- 5 Reforge

- 5.1 Renaming

- 6 SoulFuse

- 7 Forge Level

- 7.1 Forge Ranks

- 8 See also

## Repair

All equipment has Condition (a.k.a. Durability) which degrades with use. Degradation is a fixed value for every monster killed; difficulty and round/turn count do not have any effect. Being defeated in battle results in a set percentage being lost.

Losses are as follows:

| Level | Degrade Rate | Defeat |
| --- | --- | --- |
| <100 | 0x | 2% |
| 100-199 | 0.5x | 5% |
| 200+ | 1x | 10% |

Example: A player at level 250 that killed 10 monsters on average per round for 1,000 rounds would lose ~50 condition. At level 150 this would be ~25 and at level 50 it would be 0.

The Repair Bear hath perks reduce/prevent the degradation rate but only the 4th rank helps with condition loss caused by being defeated.

If an equipment's condition drops below 50% its effective attributes are reduced until it is repaired. This reduction increases linearly with the loss of condition and will update mid-battle. At 0% condition equipment provides no attributes (except burden and interference). Equipment at 100% condition is not listed in the repair area of the forge.

Every tier has a given range of possible maximum condition values. Rare tier gear are generally more fragile than the corresponding common tiers. The range of possible values is narrower for rare gear than for common gear, with a bonus based on the equipment quality.

Gear dropped from battles will start out at a random wear level between 50% and 100%. Gear from Snowflake's Shrine and the Lottery will always start at 100%.

### Repair Costs

Scrap materials are used to fully restore an equipment piece to its maximum condition. Scrap can be salvaged from unwanted equipment or bought from the Item Shop.

The amount of scrap required depends on the equipment's quality and percentage-wise degradation. Equipment with high max condition need less frequent repairs and comparatively less scrap to maintain over time. Repairing equipment will grant forge experience according to the number of items used in the repair.

`Scraps Needed = 1 + rounddown((100 - condition%) / quality_mod)`

Where condition% is the equipment item's condition in percentage, and the quality_mod value is specified in the table below:

| Quality | quality_mod |
| --- | --- |
| Superior and below | 10 |
| Exquisite | 6 |
| Magnificent | 2.2 - 2.5 |
| Legendary | 1.3 - 1.5 |
| Peerless | 1.3 |

Rare tier armor and shields (Phase/Shade/Power Armor and Force Shields) require Energy Cells in addition to scrap materials. These can be salvaged from other rare equipment or bought from the Item Shop.

- The required number of cells for repair will always be 1/3rd the amount of scrap. The number that can be salvaged from gear is linearly random between 10% and 100% of the salvaged scrap, but always at least 1. Salvaged equipment that does not provide scrap will yield 1 Energy Cell.

## Upgrade

Upgrading is done using the materials brought to players by their monsters, salvaged, or purchased from the Bazaar's item shop. Catalysts are also required.

- Each upgrade level adds roughly the following factor to the base stat (upgrade cap is 1.668 for ADB/MDB and 1.358 for non-ADB/MDB).
`For non-ADB/MDB factors: 1 + 0.2 * ln(0.1 * forge_count + 1)

For ADB/MDB: 1 + 0.278875 * ln(0.1 * forge_count + 1)
`
  Example of ADB gain for every 10 upgrade levels

- Stats can only be increased.

- Only stats that already exist on the gear (including those stats gained from equip prefixes/suffixes) can be increased. No new stats may be added.

- Notable exceptions: Crit damage (both physic and magic), Attack/Cast Speed, Mana Conservation

- Any stats that are gained from Potencies cannot be forged, unless they are ADB/MDB (since they were already present).

- At the beginning, most upgrades are limited to 25 levels, except for physical and magical damage which go up to 50 levels.

- This upgrade cap can be linearly increased by Forge Level up to double (50 and 100 levels respectively).

- No bindings for increasing any proc stats exist.

- Likewise for decreasing Burden and Interference.

- The exact formula is rather complicated and explained here

### Materials

#### Basic Materials

These come in Low, Mid, and High-grade varieties.

| Name | Required to Reforge & Upgrade |
| --- | --- |
| Cloth | Cloth armor |
| Leather | Light armor |
| Metals | Heavy armor and Weapons |
| Wood | Staffs and Shields |

#### Rares

Cannot be retrieved from salvaging (except from those coming from upgrades, with the usual 90% ratio).

| Name | Required to Upgrade |
| --- | --- |
| Crystallized Phazon | Phase armor |
| Shade Fragment | Shade armor |
| Repurposed Actuator | Power armor |
| Defense Matrix Modulator | Force Shield |

#### Bindings

| Name | Upgrades |
| --- | --- |
| Binding of Slaughter | Base Physical Damage |
| Binding of Balance | Physical Hit Chance |
| Binding of Isaac | Physical Crit Chance |
| Binding of Destruction | Base Magical Damage |
| Binding of Focus | Magical Hit Chance |
| Binding of Friendship | Magical Crit Chance |
| Binding of Protection | Physical Defense |
| Binding of the Fleet | Evade Chance |
| Binding of the Barrier | Block Chance |
| Binding of the Nimble | Parry Chance |
| Binding of the Elementalist | Elemental Magic Proficiency |
| Binding of the Heaven-sent | Divine Magic Proficiency |
| Binding of the Demon-fiend | Forbidden Magic Proficiency |
| Binding of the Curse-weaver | Depreciating Magic Proficiency |
| Binding of the Earth-walker | Supportive Magic Proficiency |
| Binding of Surtr | Fire Spell Damage |
| Binding of Niflheim | Cold Spell Damage |
| Binding of Mjolnir | Elec Spell Damage |
| Binding of Freyr | Wind Spell Damage |
| Binding of Heimdall | Holy Spell Damage |
| Binding of Fenrir | Dark Spell Damage |
| Binding of Dampening | Crushing Mitigation |
| Binding of Stone-skin | Slashing Mitigation |
| Binding of Deflection | Piercing Mitigation |
| Binding of the Fire-eater | Fire Mitigation |
| Binding of the Frost-born | Cold Mitigation |
| Binding of the Thunder-child | Elec Mitigation |
| Binding of the Wind-waker | Wind Mitigation |
| Binding of the Thrice-blessed | Holy Mitigation |
| Binding of the Spirit-ward | Dark Mitigation |
| Binding of the Ox | Strength |
| Binding of the Raccoon | Dexterity |
| Binding of the Cheetah | Agility |
| Binding of the Turtle | Endurance |
| Binding of the Fox | Intelligence |
| Binding of the Owl | Wisdom |
| Binding of Warding | Magical Mitigation |
| Binding of Negation | Resist Chance |

### Material Costs

- The first 5 levels of upgrades on any piece of equipment do not require any bindings and will always have the same material costs.

- Past the first 5 levels the material costs gradually rise and 1 binding corresponding to the stat being upgraded is required.

- The amount required varies based on the equipment's Quality and the number of upgrades already done in that stat. As the equipment is upgraded further it will require more high-grade materials, although the total number of materials needed should remain the same.

- Equipment with PXP0 < 313 start out at 6 low-grade materials, PXP0 from 313 to 335 at 4 low/2 mid, PXP0 from 336 to 348 at 2 low/4 mid, and PXP0 > 348 at 6 mid. PXP0 is the Item World Potency Experience required to go from potency tier 0 to potency tier 1.

- For rarer equipment (Phase, Shade, and Power armors) a special component is required to upgrade them by a level in a stat. Doing so however, allows for all other stats to be upgraded to that level without another special component.

## Enchant

- Gives time-limited bonuses to equipment in order to make them more powerful.

- Requires a shard or an Infusion to activate.

- Expires after 1 hour real-time.

- Infusion on weapons expires after 15 minutes real-time.

- Different shard/infusion types can be applied the same equipment simultaneously to get multiple effects.

- However, weapons can only have two different infusion enchantments active at maximum.

- Applying the same shard/infusion type multiple times extends the effect's duration per shard/infusion.

### Shards

- Lasts 1 hour per shard (besides Amnesia which is permanent).

| Name | Weapons | Armors | Effect |
| --- | --- | --- | --- |
| Voidseeker's Blessing | ✔ |  | The weapon's damage type is changed to void, and a +50% physical accuracy bonus. These bonus do not stack when dual-wielding enhanced weapons. |
| Suffused Aether | ✔ |  | Gives +10% mana conservation bonus and a +50% magic accuracy bonus. These bonus do not stack when dual-wielding enhanced weapons. |
| Featherweight Charm | ✔ | ✔ | Reduces the equipment's burden and interference by 7 or 50%, whichever is higher. |
| Amnesia Shards | ✔ | ✔ | Resets an equipment's Item Potency completely back to 0. |

### Infusions

- Weapons can have up to two different elemental strike effects active at the same time, in addition to the weapon's Void Strike. Lasts 15 min. per infusion.

- Armors can have any number of different infusion types active at the same time. Lasts 60 min. per infusion.

| Equip type | Effect |
| --- | --- |
| Weapons | The infused weapon gains a corresponding elemental strike effect. |
| Armors | The infused armor gains 5% resistance to the corresponding element. |

## Salvage

Salvaging retrieves materials from higher-quality equipment pieces and scrap from all pieces. Only low/mid/high-grade base materials can be directly acquired this way. Rare tier armor can also give Energy Cells (see above).

- Salvaging yields between 1 and 50 scrap per Average or lower quality equipment depending on its sale value. This scales such that it is always more economical to salvage for scrap rather than sell equipment that provides scrap in order to buy the same amount of scrap from the bazaar.

- For equipment of Average quality or lower, Scrap is given with the following formula: roundup(sale_value / 100); e.g. if the equipment's sale value was 101 a player would receive 2 scrap.

- For equipment of Superior quality or higher, you get one graded material (see below).

- Salvaging equipment with upgrades will always return 90% of the materials spent on upgrading rounded down (but never any catalysts).

| Quality | Salvage Result |
| --- | --- |
| Average or lower | Only Scrap |
| Superior | Low-Grade |
| Exquisite | Mid-Grade |
| Magnificent | High-Grade |
| Legendary | High-Grade + Legendary core |
| Peerless | High-Grade + Peerless core |

- Shade armor, Power armor, Phase armor and Force Shield will give 5 armor cores, all other legendary and peerless equipment will give 1 core.

- Cores have no use in the current version of Hentaiverse, but legendary cores are tradable.

Salvaged equipment can be bought from the bazaar for up to 24 hours after it was salvaged. It will only be visible to the salvager and will be fully repaired but also account-bound. The equipment will be wiped entirely of its potencies and forge benefits. The buyback cost is 5 times the normal buy cost or 10k credits, whichever is higher.

- Note: Any currently slotted equipment cannot be salvaged even if it is unlocked. This applies across all equip sets on each persona.

Equipment that is salvaged in Isekai will retain the salvaged status when transferred to persistent (i.e. soulfused or peerless equipment)

## Reforge

Reforging can reset the Item Potency experience and unlocked potentials of an equipment. Equipped items cannot be reforged. Locked equipment can be reforged but will request a confirmation each time.

- Reforging requires Amnesia Shards. The number of shards required is equal to the equipment's Item Potency level.

- This amount is cut in half for players with the Dark Descent Hath Perk.

- Players can only choose to forfeit all the existing Item Potency levels or keep all of them.

- If any potencies had their stats increased via forging they will become inactive.

### Renaming

A custom name can be given to the equipment.

- The equipment needs to have its potency maxed.

- The original name of the equipment will always be preserved, and will be displayed on the equipment popup below the custom name.

- The custom name can be removed by renaming to blank or the same as the original name.

- Sending the equipment through the MoogleMail will also remove the custom name.

## SoulFuse

By consuming Soul Fragments players can bind a piece of gear to their character and make it level up as they do. The number of soul fragments needed can be found here: https://ehwiki.org/wiki/Items#Soul_Fragments

- When equipment is soulfused, its stats will be immediately scaled to the player's level, and will continue scaling as the player levels up.

- This means that if the item has a level higher than player's level, its stats will lower and vice versa. Base stats will always remain the same though.

- Soulfused equipment also gains double the PXP gains in Item World and from upgrades.

- Soulfused equipment becomes untradeable but can still be salvaged.

- Soulfusion is permanent and cannot be undone.

- All equipment rewarded from the Lotteries or the Follower of Snowflake hath perk are automatically soulfused.

Equipment pieces that are already soulfused cannot be seen on this pane.

## Forge Level

Every time a player upgrades an equipment the forge will gain a certain amount of experience.

- The Forge level is capped at 50.

- The upgrade cap will be increased by Forge level.

- The amount of experience gained depends the level of the materials used for the upgrade: +2 per low-grade, +10 per mid-grade, and +40 per high-grade; this means an effective cap of 250? per upgrade. It is not affected by bindings or rare materials used.

- The amount of EXP that will be gained is shown when hovering over an upgrade.

- This also gives potency EXP to the equipment being upgraded equal to 1/10 of the forge EXP gained.

### Forge Ranks

`Experience to reach next forge level = 250 * (Current forge level + 1)`

- The upgrade cap increases by 2% per forge level, rounded down

| Level | Rank | EXP required | Upgrade Cap |
| --- | --- | --- | --- |
| WD/ADB/MDB | Others |
| 0 | Novice | 250 | 50 | 25 |
| 1 | Novice | 500 | 51 | 25 |
| 2 | Novice | 750 | 52 | 26 |
| 3 | Novice | 1000 | 53 | 26 |
| 4 | Novice | 1250 | 54 | 27 |
| 5 | Novice | 1500 | 55 | 27 |
| 6 | Novice | 1750 | 56 | 28 |
| 7 | Novice | 2000 | 57 | 28 |
| 8 | Novice | 2250 | 58 | 29 |
| 9 | Novice | 2500 | 59 | 29 |
| 10 | Apprentice | 2750 | 60 | 30 |
| 11 | Apprentice | 3000 | 61 | 30 |
| 12 | Apprentice | 3250 | 62 | 31 |
| 13 | Apprentice | 3500 | 63 | 31 |
| 14 | Apprentice | 3750 | 64 | 32 |
| 15 | Apprentice | 4000 | 65 | 32 |
| 16 | Apprentice | 4250 | 66 | 33 |
| 17 | Apprentice | 4500 | 67 | 33 |
| 18 | Apprentice | 4750 | 68 | 34 |
| 19 | Apprentice | 5000 | 69 | 34 |
| 20 | Journeyman | 5250 | 70 | 35 |
| 21 | Journeyman | 5500 | 71 | 35 |
| 22 | Journeyman | 5750 | 72 | 36 |
| 23 | Journeyman | 6000 | 73 | 36 |
| 24 | Journeyman | 6250 | 74 | 37 |
| 25 | Journeyman | 6500 | 75 | 37 |
| 26 | Journeyman | 6750 | 76 | 38 |
| 27 | Journeyman | 7000 | 77 | 38 |
| 28 | Journeyman | 7250 | 78 | 39 |
| 29 | Journeyman | 7500 | 79 | 39 |
| 30 | Artisan | 7750 | 80 | 40 |
| 31 | Artisan | 8000 | 81 | 40 |
| 32 | Artisan | 8250 | 82 | 41 |
| 33 | Artisan | 8500 | 83 | 41 |
| 34 | Artisan | 8750 | 84 | 42 |
| 35 | Artisan | 9000 | 85 | 42 |
| 36 | Artisan | 9250 | 86 | 43 |
| 37 | Artisan | 9500 | 87 | 43 |
| 38 | Artisan | 9750 | 88 | 44 |
| 39 | Artisan | 10000 | 89 | 44 |
| 40 | Expert | 10250 | 90 | 45 |
| 41 | Expert | 10500 | 91 | 45 |
| 42 | Expert | 10750 | 92 | 46 |
| 43 | Expert | 11000 | 93 | 46 |
| 44 | Expert | 11250 | 94 | 47 |
| 45 | Expert | 11500 | 95 | 47 |
| 46 | Expert | 11750 | 96 | 48 |
| 47 | Expert | 12000 | 97 | 48 |
| 48 | Expert | 12250 | 98 | 49 |
| 49 | Expert | 12500 | 99 | 49 |
| 50 | Master | - | 100 | 50 |

## See also

- Equipment

- Monster Lab

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
