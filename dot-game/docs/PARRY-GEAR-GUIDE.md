# Rapier parry rating and Nimble — v0.15


## Literal source labels and conversion boundary

**The final equipment-input-to-probability conversion remains a game adaptation.** The original table labels the item attribute `Parry Chance`; it does not literally call that field a `rating`. This game calls its stored numeric input **招架值** to keep it distinct from the actual probability after character conversion. The original accuracy-dependent interception system is not implemented here; no example below implies full original avoidance fidelity.

Pinned source commit `8e1ff32097d50ba8e1c30266653234506b98a5f4`, `.scratch/hv-v3/wayfinder/findings/003-equipment-armory-and-modes.md`, exact table header L361 and rapier row L382:

```markdown
| 基底 | 屬性名稱 | 詞綴條件 | Base Rolls `[Min, Max]` | `fluc` | Crude `[Min, Max]` ($R=0..40$) | Leg Min / Peerless Max ($R=170..200$) |
| **Rapier** | `Parry Chance` | `Nimble` / `Others` | `[137, 301]` / `[75, 211]` | `0.0894` | `—` / `[6.72, 7.79]` | `[23.81, 26.94]` / `[16.29, 18.89]` |
```

This supports the equipment roll endpoints and fluctuation factor, not the game's independent `0.035 + input/100` mapping or50% cap. The displayed original equipment endpoints and the final per-check probability must not be conflated. [Original Damage revision66419](https://ehwiki.org/index.php?title=Damage&oldid=66419#Avoidance_Calculation) separately documents the attacker-Accuracy-dependent interception calculation.

## What changes
Newly generated rapiers, including new fixed Slaughter commissions, now carry a numeric **Parry equipment input** (named 招架值 in this game). Random rapiers may have the legal Nimble (靈巧) suffix instead of Slaughter or Balance. Nimble uses stronger parry endpoints, not an extra multiplicative damage bonus. Existing weapons are preserved exactly: a saved rapier without this stat receives no retroactive rating.

The item displays **招架值**, a number, while the character and preset preview display **招架判定率**, the final chance used by this game. They are different units. More parry can prevent damage and create opportunities for the existing conditional counterattack; neither avoidance nor a counter is guaranteed.

## Original facts and fitted model
Only original-HV research was used. Pinned findings003 at commit `8e1ff32097d50ba8e1c30266653234506b98a5f4`, §1.6 / line382 gives ordinary rapier parry base rolls75–211 and Nimble137–301 with fluctuation factor0.0894. Line287 gives the researched level scaling denominator2000 (the official Level Scaling table describes historical derivation rather than developer verification); line235 lists Nimble as legal on rapiers (also on some other original bases, not added here). These produce raw base endpoints6.705–18.8634 and12.2478–26.9094 respectively, before quality interpolation and equipment-level scaling.

As elsewhere in this game, interpolation is the requested research fit `(R/200)^1.52`, not a directly published server equation. Each parry stat receives its own quality-range R. Compute `(low+(high-low)*qualityFactor(R))*(1+equipmentLevel/2000)`, then round to four decimals. Do not divide the source endpoints by100 and call them original avoidance probabilities. Do not apply the old game's16% cap for generated fraction-valued crit/evade/block to this raw rating.

[Official equipment characteristics revision66982](https://ehwiki.org/index.php?title=Detailed_Equip_Characteristics&oldid=66982) and the source report support equipment ranges, not this game's final chance mapping. [Character Stats revision65166](https://ehwiki.org/index.php?title=Character_Stats&oldid=65166) describes parry as an attribute/equipment/proficiency rating. [Damage revision66419](https://ehwiki.org/index.php?title=Damage&oldid=66419#Avoidance_Calculation) publishes interception calculations involving attacker Accuracy and defender interception rating. This newer evidence supersedes the pinned002 report's historical statement that the exact conversion was unavailable. The current game lacks enemy Accuracy and a complete player rating model, so this slice does not claim that original probability calculation is implemented.

## Explicit integration adaptations
- Retain the established3.5% legacy player parry baseline. New equipment rating contributes `rating/100`; the final per-check probability is `clamp(0.035 + sum(equipment.parry)/100,0,0.5)`. The mapping and50% cap are independently chosen adaptations, not original-HV constants. No new Dexterity/proficiency contribution is added a second time.
- Existing resolver ordering, two checks, partial defense and counter eligibility remain unchanged. A displayed15% per-check chance is not15% total avoidance or15% chance of countering every incoming attack.
- Only new rapier items receive this original-supported stat in this bounded slice. Axe/club and armor/accessory generation remain unchanged for identical per-item RNG inputs. Original additional parry-bearing bases and the full accuracy system remain future work.
- Existing quality weights are unchanged. Rapier suffix choices are uniformly selected through the existing mechanism; the new third option changes rapier suffix outcomes. An extra independent parry draw changes later shared RNG after a new rapier is generated. Later combat/drop differences are not all caused by parry effectiveness.
- Existing flat comparison score adds1.8 per parry rating point. This score is a convenience, not original power or proof of a superior build. Since sale value and commission price derive from this score, **new rapier prices increase**. The old price equations are unchanged; old saved item scores/prices are not recomputed. New commission rapiers remain Superior/R110/Slaughter, not Nimble, and purchase still requires exact consent.

## Safety and persistence
Parry is the seventh implemented comparison dimension. Safe downgrade disposal must compare it as well as the original six, preserving any parry tradeoff. Manual selected-sale and preset previews include it. The strict item validator accepts this known numeric field and its optional quality roll while still rejecting unknown future fields. Missing parry means zero equipment rating.

Existing v0.14 and earlier strict readers reject items with this new field. This is **not downgrade-compatible**. Refresh old tabs before writer takeover and keep a normal exported save. New code preserves old item data; source backup does not back up a personal browser save.

## Verification
See ACCEPTANCE-V015.md for original-unit boundaries, strict schema/dominance/quote checks and naturally earned paired outcomes. Browser observations and publication evidence are separate. No universal improvement, perfect original fidelity, or all-device acceptance is claimed.
