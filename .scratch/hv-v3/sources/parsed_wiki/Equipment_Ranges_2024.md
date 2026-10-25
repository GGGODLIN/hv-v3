This page is a hub for Equipment Ranges. These are the minimum and maximum known base values for each equipment type at every quality.

The tables are a work in progress; not every minimum and maximum value are truly known. However, the Legendary Max (Peerless quality) should be accurate for most stats.

Pre-0.82 values should not be included.

## Contents

- 1 Equip Range Tables

- 2 How to scale stats

- 2.1 Quality Bonus

- 2.2 Forge Coefficient

- 2.3 Level Scalar

- 3 See Also

## Equip Range Tables

The tables are extremely large, and have been split into these pages:

- Equipment Ranges Weapons - Weapons & Shields

- Equipment Ranges Clothes - Cotton & Phase

- Equipment Ranges Light - Leather & Shade

- Equipment Ranges Heavy - Plate & Power

## How to scale stats

Transforming a base value to a scaled value (the final stat shown on an equipment piece) can be done using the formulas given on the Level Scaling and Forge pages.

These formulas may have very slight fluctuations compared to a real item - possibly due to some values being rounded or cut off.

The formula is as follows:

`Final Stat = ((baseValue - qualityBonus) * forgeCoeff + qualityBonus) * levelScalar`

For example, scaling the Elec EDB on a Shocking Willow of Destruction would look like this:

`Base Value: 18.55
Quality Bonus: 0.871536
Forge Coefficient: 1.358351893845611
Level Scalar: 3.5

((18.55 - 0.871536) * 1.358351893845611 + 0.871536) * 3.5 = 87.0978886913851`

Note: In reality, a max forged PSWD displays 87.09, so it can be considered that HV simply cuts off the rest of the decimal places.

The baseValue is the value taken from the Equipment Ranges tables. The rest of the values used are determined as follows:

### Quality Bonus

`qualityBonus = ((pxp0 - 100) / 25) * baseCoeff`

pxp0 is the item's PXP at level 0 (these vary by item - for Peerless values, see Peerless PXP Table). The baseCoeff varies by stat (see Equipment Base Coefficients).

As an example for the quality bonus on EDB for a Peerless staff:

`((371 - 100) / 25) * 0.0804 = 0.871536`

### Forge Coefficient

`For non-ADB/MDB factors: 1 + 0.2 * ln(0.1 * forge_count + 1)

For ADB/MDB: 1 + 0.278875 * ln(0.1 * forge_count + 1)`

forge_count is simply the level to which the stat has been forged (ie, up to 100 for ADB/MDB, or 50 for non-ADB/MDB stats.)

As an example for level 50 EDB:

`1 + 0.2 * ln(0.1 * 50 + 1) = 1.358351893845611`

### Level Scalar

`levelScalar = (1 + Desired Level / Level Factor)`

For example, to scale EDB to level 500 uses 500 as the Desired Level, and 200 as the Level Factor (see Level Scaling to see these listed by stat).

`1 + 500 / 200 = 3.5`

## See Also

- Level Scaling

- Forge Upgrades

- Peerless PXP Table

- Equipment Base Coefficients

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
