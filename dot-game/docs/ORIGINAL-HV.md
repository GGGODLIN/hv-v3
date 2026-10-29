# Original HentaiVerse research boundary

Research checkpoint: 2026-10-25. Target reference is the v0.91-era original HV, with older-source conflicts retained rather than silently reconciled. This is an independently written implementation brief, not another game's implementation or constants export.

## Sources and confidence

The permitted shared source is the original-game research in `GGGODLIN/hv-v3` at commit `8e1ff32097d50ba8e1c30266653234506b98a5f4`, under `.scratch/hv-v3/wayfinder/findings/`:

- [001: source census](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/001-public-sources-census.md)
- [002: character and combat research](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/002-combat-and-character-formulas.md)
- [003: equipment and battle research](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/003-equipment-armory-and-modes.md)
- [004: original economy inventory](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/004-economy-and-singleplayer-gaps.md)

These reports cite public wiki snapshots and community tools. They are not direct access to HV's server code. Their October 22 audit corrections override earlier unqualified claims within the same report. Do not treat every row marked `✓` as certain: several rows have subsequent corrections.

Existing game code, `constants.ts`, monster JSON, pixel assets, and others' single-player proposals are excluded. The custom proposals in 004 and temporary choices in 005 are not this game's design. Original formulas below were transcribed from the allowed research; any new numeric choice belongs in a separate adaptation ledger.

Confidence labels used here:
- **Research-supported**: the report attributes the rule to original wiki text without a known correction contradicting it. Still not independently server-verified.
- **Disputed / estimated**: source conflict, community estimate, or unidentified exact formula.
- **User-requested model**: a specified research approximation retained deliberately, not called exact original HV.

## Character and progression

Source: 002 §1.1–1.2, citing Character Stats, Leveling Up, Level Table, and Spirit & Overcharge.

Let `L` be character level; STR, DEX, AGI, END, INT, WIS are effective primary attributes. With no relevant perks, abilities, or charms:

- `baseHP = 500 + 10*L + 6*END`
- `baseMP = 10 + L + WIS`
- `baseSP = 1 + (STR+DEX+AGI+END+INT+WIS)/5`
- Tank/armor/charms then increase maximum pools. Healing commonly uses **baseHP**, not the inflated maxHP. Full-Cure is an exception that fills maxHP.
- `attributeADB = ln(3330 + 2*STR + DEX)/ln(1.0003) - 27029.81`
- `attributeMDB = ln(3330 + 2*INT + WIS)/ln(1.0003) - 27039.81`
- Weapon/armor ADB and applicable proficiency-ability bonuses add to attributeADB. Do not give a proficiency damage ability before it has been acquired. The 1H Damage ability supplies `prof * 2/3/4` for its three ranks.
- `physicalAttributeMit = min(0.8, 1 - 900/(900 + END + AGI/2))`
- `magicalAttributeMit = min(0.8, 1 - 900/(900 + END + WIS/2))`
- For applicable percentage equipment bonuses, `equipmentCombined = 1 - product(1 - itemPercent/100)`.
- Combined mitigation is `1 - (1-equipmentCombined)*(1-attributeMit)`. Protection and other independent defensive effects multiply the remaining damage, rather than adding percentage points without limit.

The research gives cumulative level EXP as `round((L+3) ** (2.850263212287058 ** (1+L/1000)))` for levels 2–500, with level 1 cumulative EXP 0 and 99 EXP to level 2. Use cumulative thresholds carefully; level 2's next increment is 69, not another 99.

Original primary-stat allocation spends from a reversible EXP budget; it is **not** a fixed number of attribute points awarded at each level. The original expression reported for cumulative attribute cost is `(S+1) ** (2.5475566751265 ** (1+S/950))`. The report's earlier floor and zero-stat special case were additions, not original text. Any simplified auto-allocation or level-based attribute curve in this game must therefore be labeled an adaptation.

Each level grants an Ability Point, and every tenth level grants a Mastery Point. The initial game need not pretend all abilities are implemented merely because its levels increase.

## Time model and proficiency

Source: 002 §2.2 and §4.1, citing Proficiencies and Action Speed.

- A **Turn** is a player action. Skill/spell cooldowns decrement on non-item turns.
- A **TU** is simulation time. Unaccelerated physical attack baseline is 100 TU.
- A **Tick** occurs each crossed 100-TU boundary; timed states, DoTs, and regeneration follow ticks.
- `actionTU = clamp(ceil(100*(1-sheetSpeed)*specificActionMultiplier*proficiencySpeedMultiplier/(1+haste)), 20, 500)` for non-free actions.
- Rendering seconds and auto-play speed are presentation/adaptation choices, not HV TU rules.
- Spell action multipliers in the original source table are marked uncertain; 1.2, 1.4, and similar values must not be advertised as proven.
- Weapon proficiency can grow each turn even without a normal attack; block provides extra 1H training. Armor training can be triggered by incoming attacks even when avoided. Spell schools used in a round gain proficiency at round settlement.
- Exact proficiency growth coefficients are **unknown**. The community calculator's `K=4` is an estimate, not an original server rule.
- The Proficiencies page says base cap `1.2*L`; the Leveling Up page says cap increases by 1 each level. Preserve this conflict if choosing one.
- Effective magical proficiency has a reported `2*L` ceiling. `profFactor = clamp((effectiveProf-monsterLevel)/monsterLevel,0,1)` gives counter-resist `0.5*profFactor` and elemental mitigation reduction `0.5*profFactor^1.5`. Never substitute player level for monster level unless they actually match.

## Damage resolution contract

Source: 002 §5.1–5.2, citing Damage, Battles, Physical Damage, Spell Damage, and Equipment Procs.

The structural sequence is Whiff → Absorb → Evade → Parry → Block → Resist → multi-crit → mitigation → final damage roll. Not every gate applies to every attack. Do **not** invent an extra independent generic hit roll before this sequence.

1. **Whiff:** an independent shadow/blind gate, mainly documented for enemy attacks against the player. Ordinary attacks do not automatically have a universal whiff chance.
2. **Absorb:** applicable to magic with an Absorbing Ward, not physical damage; critical magic cannot be absorbed. An implementation may need to pre-sample critical eligibility to respect this exception while retaining the documented resolution behavior. Do not consume Ward or report absorption for an ineligible physical hit.
3. **Evade:** two independent checks. Zero successes → full hit; one → 0.5 damage and no critical; two → 0. Weapon/OC skills ignore evade. T2 offensive spells cannot be fully evaded; T3/channeling spells bypass it.
4. **Parry:** physical only, two checks yielding 1, 0.5, or 0. Weapon/OC skills and 1H counterattacks bypass parry. Stun/sleep disable parry.
5. **Block:** two checks yielding 1, 0.5, or 0, applicable to physical and magic for an actor that has block.
6. **Resist:** offensive/debuff magic only, three independent checks. Damage factors for 0/1/2/3 successes are `[1, 0.5, 0.25, 0.1]`. Debuff duration factors instead are `[1, 0.75, 0.5, 0]`. Channeling bypasses resist.
7. **Critical:** full evade hit is required; a glance cannot crit. Weaken suppresses criticals. A successful first critical can chain up to nine critical counts. Multiplier is `1 + count*critBonus`, **not** repeated multiplication of 1.5. Default player bonus is 0.5, so nine counts give 5.5x. Additional critical rolls have a reported cap of 25%; the exact accuracy-to-first/multi-critical mapping is not fully established by this brief.
8. **Mitigation:** multiply `raw * avoidance * (1-generalMit) * (1-specificMit)`. Void ignores specific damage-type mitigation, not general physical/magic mitigation.
9. **Random damage:** choose uniformly among **41 discrete** multipliers `[0.80, 0.81, ..., 1.20]`, then floor final damage. Do not use a continuous ±20% roll and claim the exact documented model.

Partial avoidance factors can multiply, e.g. evade glance plus partial parry leaves 0.25 of the base damage. The research's exact Accuracy-to-avoidance probability curve is missing; numeric probabilities used by the independent game need an explicit adaptation note. Equipment avoidance rating must not simply be treated as a probability without specifying the conversion.

Monster criticals are described in the newer Battles text as fixed 20% rate and +20% damage. The older Monster Stats attribute-based critical formula conflicts; choose and disclose a version rather than applying both.

### Physical weapon effects and 1H skills

- Rapier Penetrated Armor stacks at most three, reducing general physical mitigation by 25% per stack (`baseMit*(1-.25*stacks)`). It is not a 25% direct damage multiplier. **Version conflict found 2026-10-25:** the permitted research 002 §5.2 and [Chinese Equipment Procs revision 57814](https://ehwiki.org/wiki/Equipment_Procs/Chinese) describe the historical post-hit model with maximum 25% chance / seven ticks. The [English Equipment Procs revision 65024](https://ehwiki.org/wiki/Equipment_Procs) inspected today instead describes permanent PA and a proc-triggering hit bypassing physical mitigation. These are not interchangeable claims about one current version.
- v0.3 deliberately implements the **historical research model**, not a claim of current-server equivalence: new stacks apply after the triggering hit. Fixed 25% chance and seven ticks at every level, one shared timer refreshed by successful procs, positive-damage basic hits against surviving targets eligible (including partial avoidance), and no proc from the independently designed 破勢斬 are explicit game adaptations. An eligible critical guarantees one stack, not one per multi-crit count. Exact original low-level scaling and refresh semantics remain unestablished. Existing PA benefits subsequent physical skill damage without being refreshed by it.
- Club Stunned is supported by pinned research 002 §5.2 and [historical Chinese Equipment Procs revision 57814](https://ehwiki.org/index.php?title=Equipment_Procs/Chinese&oldid=57814): maximum 25% chance/four ticks, a critical built-in proc guarantee, inability to attack/evade/parry, and non-refresh regardless of source. [English revision 65024](https://ehwiki.org/index.php?title=Equipment_Procs&oldid=65024) retains no-action/no-evade/no-parry/no-refresh and says the monster attacks on the turn after expiry; its chance description depends on weapon type and average Base Stat Roll and the older duration table is absent. A built-in critical proc guarantee does not guarantee suffix Siphon.
- [Action Speed](https://ehwiki.org/wiki/Action_Speed#Base_Action_Speeds) explicitly describes a free recovery action on the next turn regardless of player speed, but interaction with regular turns is **unknown**. Equipment Basics still uses the wording “4 Turn Stun”; this implementation uses simulation ticks/TU, not four player actions. v0.4 chooses fixed 25% / four ticks, basic positive-damage surviving-target eligibility, and an explicitly documented per-enemy recovery/coalescing scheduler as game adaptations. The source-described magic-resist reduction is deferred with magical combat; do not claim the entire original Stunned debuff is reproduced.
- 1H Shield Bash: 25 OC cost, 10-turn cooldown, five-tick stun, ignores evade/parry, does not actually require a shield. The commonly listed 4x multiplier is **estimated/disputed** because Missing Data lists offensive-skill multipliers as unknown. If used, label the value chosen by this game.
- Vital Strike's reported bleed units conflict across pages (100/90 versus five stacks); do not import an unexplained conversion.
- Cure: reported unlock level 5, base coefficient 55% baseHP before proficiency, five-turn cooldown before abilities. Cost scales with level from the spell base-cost rule; do not conflate base cost 20 with a flat 20 MP at every level.

## Equipment quality and affixes

Source: 003 §1.1, §1.4, §1.5(B), §1.6; citing Detailed Equip Characteristics, The Armory, Level Scaling, and equipment-range research.

Documented roll ranges: Crude 0–40, Fair 30–70, Average 60–100, Superior 90–130, Exquisite 120–160, Magnificent 150–180, Legendary 170–200, Peerless exactly 200. Legendary's upper endpoint conflicts with a Chinese table's 199. Peerless+ 201–249 (another table begins at 200) and Ultimate exactly 250 are fusion progression, **not normal drop tiers**.

Crude has no prefix, suffix, or primary-attribute bonuses. Superior and above guarantee a suffix. Legendary and Peerless guarantee a prefix and suffix, and the available PAB set with a shield exception. Prefix/suffix legality is base-specific: do not attach every suffix to every equipment family.

### User-requested research model, not exact original formula

For a positive stat with endpoints `B0` and `B200`, the user's specified model is:

`stat(R) = B0 + (B200-B0) * (R/200)^1.52`, for R ≤ 200.

The permitted research explicitly describes exponent 1.52 as a fit to 2,088 wiki table points (best-fit exponent 1.516), not a directly published server formula. It reports mean relative error 0.52%, with outliers. R>200 has no cited public numeric samples; any continuation above 200 is an extrapolation. Keep this model because the user requested it, but describe it honestly.

Roll each binding-backed stat separately within the quality range. Unbound compromise stats use the mean applicable rolls. Burden/interference decrease with higher quality; do not accidentally make better quality heavier.

Level scaling is `baseStat * (1 + equipmentLevel/scaleFactor)`. Research scale factors include ADB `50/3`, MDB `250/11`, PAB `250/7`, accuracy 5000, crit chance/general mitigation/avoidances 2000, and no level scaling for attack speed, crit damage, burden, interference, or specific damage-type mitigation. These factors are sourced through the report's wiki/community-tool comparison, not imported from excluded structured data.

### Small independently transcribed weapon baseline

From 003 §1.6(A), these are `Base Rolls [min,max]`, then multiplied by the listed fluctuation factor. They are **endpoints**, not the quality R roll itself:

| Base / stat | Ordinary suffix | Special suffix | fluc |
|---|---:|---:|---:|
| Axe ADB | 350–701 | Slaughter 470–888 | 0.0854 |
| Club ADB | 250–621 | Slaughter 353–792 | 0.0854 |
| Rapier ADB | 150–461 | Slaughter 230–601 | 0.0854 |
| Club accuracy | 80–211 | Balance 216–511 | 0.06069 |
| Rapier accuracy | 150–361 | Balance 330–736 | 0.06069 |
| Club crit chance | 124–511 | Balance 344–991 | 0.0105 |
| Rapier crit chance | 124–511 | Balance 342–991 | 0.0105 |
| Rapier parry | 75–211 | Nimble 137–301 | 0.0894 |

Displayed wiki endpoint rounding sometimes differs slightly from multiplying these rounded fluc values. The game should record which representation it uses, not claim exact equality to all displayed table decimals.

## Monsters and economy: reliable shape, unknown rates

Source: 003 §4.1 and 004 original-inventory sections. The existing monster JSON is excluded. A small set of independently created creatures can use original class rules while their names, encounter sequence, and balance role remain this game's original content.

Reported original monster attribute scaling is `floor(.01*baseAttribute*L + .3325*L^1.076675)`. At low levels (≤200), reported ordinary HP before difficulty/class boosts is `100 + 10*L + 5*scaledEND`. Monster general mitigation uses denominator 1000 rather than the player's 900. These formulas come from a pre-v0.91 Monster Stats page; version uncertainty must remain visible. The research's claim that every monster level equals player level conflicts with the separately documented expanding encounter-level range and must not become a hidden invariant.

Original loot has a general drop roll followed by an equipment subtype roll, not a guaranteed item every kill. Low-PL untrained baseline is `10% * 2.5% = 0.25%` ordinary equipment per kill. Training effects and low-quality distributions are disputed/unknown. Arena/Ring-of-Blood clear rewards are distinct from per-kill drops. Do not silently multiply the ordinary drop rate and call it original HV.

Credits are distinct from experience. Original shops rely on player-supplied stock for some goods; a single-player game cannot assume that market supply exists. Any new repeatable expedition reward, deterministic first-clear equipment, sell price, material sink, shop stock, stamina policy, or shortened progression schedule is an explicitly named independent adaptation. The 004/005 proposals made by other authors are not imported.

## Required adaptation ledger before a release

Record the actual game choices for: real-time-to-TU pacing; auto-skill decisions; character stat allocation; avoidance-rating conversion; critical roll probabilities; proficiency growth coefficients; creature encounter layout and difficulty; skill coefficients where unknown; reward cadence and quality distribution; economy; save/import rules. Record unimplemented original systems separately from altered ones.

Use this brief as a source map, not as a claim that the first playable version implements all of HV. Tests should cover the selected formulas and negative cases (ineligible absorb, glance/no crit, skill evade/parry bypass, non-refreshing stun, mitigation boundaries, save validation), alongside complete gameplay-loop tests.

## v0.5 encounter-role boundary

The original has differentiated monster classes: the permitted report 003 §4.1(B–C), [Monster Lab revision 63173](https://ehwiki.org/index.php?title=Monster_Lab&oldid=63173#Monster_Classes) and [Monster Stats revision 63858](https://ehwiki.org/index.php?title=Monster_Stats&oldid=63858) describe END-heavy Arthropod/Giant and AGI/DEX-heavy Avion/Sprite shapes. END relates to mitigation, AGI to evade and DEX to parry; exact old derived formulas retain the previously stated uncertainty. This supports class differentiation, **not** our particular monster population, names, role constants or schedule. No existing monster dataset, population statistics or structured constants are imported.

This game's independently chosen v0.5 roles begin at stage 3. Stages 1–2 retain their prior combat numbers and RNG behavior. The existing beetle archetype and odd-stage boss are armored: add 18 percentage points to the existing general physical defense percentage, set per-check evade/parry to 1%/1%. The shadow archetype and even-stage boss are agile: subtract three defense percentage points (minimum zero), set per-check evade/parry to 10%/7%. Other normal enemies remain baseline. HP, attack, block, resist, wave counts, scaling, rewards, timing and existing proc rules stay unchanged. These numbers and route schedule are adaptations, not original HV monster definitions.

Displayed evade/parry/block rates are each independent check's probability. They are not the probability of fully avoiding an attack: the established resolver performs two checks. Route preview uses the same deterministic descriptors as spawning, without RNG. During combat, the defense view accounts for current historical-model PA and active stun; pending recovery is no longer active stun. Preview/current-defense views are explanatory, not a new damage calculation or gear score.

## v0.6 conservative loot-management boundary

Original HV has equipment sales, credits and multiple credit sinks, as catalogued in permitted report 004. It does not establish this independent game's fixed sale-price formula or an automatic dominance filter. v0.6 retains our existing sale values and all generation/quality/RNG rules; its opt-in disposal policy, keeper selection, UI confirmation and strict import handling are explicit single-player adaptations. It does not implement an original forging economy or solve unused credits.

Automatic sale defaults OFF and applies only to future drops after generation and unique-ID assignment. Only unlocked low-quality items (Crude/Fair/Average) may qualify, with a recognized same-base equipped or explicitly locked keeper whose six implemented stats are all no worse and at least one better. Score is not a dominance criterion. Equal-stat items, cross-base alternatives, tradeoffs, unknown records and Superior+ remain. Existing inventory is never swept merely by enabling the option. The manual path previews exact IDs and values, then atomically revalidates that exact batch before any change; stale evidence aborts the whole batch. Existing near-full/pending safeguards still apply; this is not unlimited idle storage.

Unknown or unsupported supplied item/stat/roll schema is rejected before validation can silently strip it into an apparently known sale candidate or keeper. Existing failed-load/import behavior retains the stored bytes/current progress. Known legacy optional fields remain supported, and unsupported names/families with otherwise supported schema are not eligible for cleanup. No invented negative protection marker, quarantine or durable sale ledger is added. A historical old version may already have discarded unsupported data; this version cannot recover that lost provenance. Older shared-v3 validators drop the new opt-in flag, safely returning the policy to OFF while retaining supported items/gold/locks.

## v0.7 weapon commission: original systems versus adaptation

Pinned original research separates these systems; they must not be collapsed into a claimed original credit-for-damage formula:
- Findings 004 §1.2 (lines63–68) and the original Equipment Shop statement (line507): equipment stock is supplied by player sales, not automatically generated NPC stock.
- Findings 002 §3.2 (lines339–391): HP Tank rank1 costs1AP for +10% maximum HP; 1H Damage rank1 costs2AP for +2ADB per proficiency. Abilities require an appropriate unlocked slot.
- Findings 002 §3.3 (lines468–497) and 004 §2.5 (lines446–472): Ability Boost is a credit-to-AP training bridge, first rank100C with a two-real-hour wait and character-level cap. An honest system needs AP/slots/eligibility, not merely spending credits for attack.
- Findings 003 §2.3 (lines533–589): v0.91 forging increases base stats by1% per tier, ADB/MDB by2%, with Item World/material/credit requirements. The older logarithmic per-stat system is distinct.
- Findings 003 §2.4 audit (lines679–690) retracts apparent exact fusion-price formulas as community-estimator constants. Neither15000×average roll nor20000C/Core is established as an original server price; 005's corresponding tool row does not override that correction.

The v0.7 **weapon commission** is independently designed: after one completed expedition, the player may preview/purchase an ordinary current-character-level axe, rapier or club, Superior quality, each applicable statR110, Slaughter suffix, no prefix. Exact stats use the existing fitted quality/endpoint/scaling model. Catalog output is fixed, not a reroll or rotating stock; it does not consume the combat/drop RNG. Price is `max(250,4*existingSaleValue)` credits, explicitly adaptation tuning. Resale returns at most25%, preventing a profitable immediate buy/sell loop. Delivery is one locked inventory item, never auto-equipped, without new durable provenance/upgrade fields.

The purchase can spend the player's entire current gold balance; exact post-purchase balance is shown and confirmation is required. Expeditions remain free, so zero balance does not prevent play. Strong naturally rolled loot may be better. This is deliberate family/current-level access and one credit sink, not a universal upgrade, original Bazaar behavior, full Training/Forging/Fusion, or a complete long-term economy. Natural earned-credit acceptance must be measured separately from fixed-spec statistical examples.

## v0.8 historical axe Bleeding Wound boundary

Pinned research 002 §5.2, line 787, and 003 §1.3, line 102, identify axes as Slashing weapons with Bleeding Wound: historical maxima of 25% chance, seven ticks and five stacks, with a 20% DOT coefficient. Report 002, lines 30–31, corrects report 001's erroneous 0.25 multiplier to 0.4. Report 002, line 737, records the eligible-critical built-in proc guarantee; line 277 excludes bleeding from original 1H counterattacks. This game has no player counterattack system yet.

[Historical Chinese Equipment Procs, revision 57814](https://ehwiki.org/index.php?title=Equipment_Procs/Chinese&oldid=57814) uses character-sheet ADB, not weapon-only ADB or inflicted hit damage: `sheetADB × 0.20 × 0.4 × stacks × applicable buffs`. Damage snapshots on application and remains unchanged after buffs expire until reapplication; it precedes newly triggered Overwhelming Strikes. It is fixed untyped damage, bypassing monster mitigation/stats, paid at global game-tick boundaries. Chance and duration scale toward weapon maxima, so applying fixed maxima at every level is our adaptation. Applicable attack buffs and Overwhelming Strikes are not implemented here.

[Current English revision 65024](https://ehwiki.org/index.php?title=Equipment_Procs&oldid=65024) instead describes 200 maximum stacks, 50 initial weapon stacks, +40 on reapplication, 20% decay per tick and `ADB × stacks / 100`, plus weaker-reapplication protection. This is not the historical five-stack/seven-tick model. Do not mix them or claim current-original fidelity. Historical weaker-refresh protection, shared timers, cap refresh, final-tick ordering and rounding are not established by our sources. Vital Strike conversion/duration remain disputed and unimplemented.

Explicit v0.8 adaptations:
- Only positive-damage basic axe hits against surviving targets can apply bleeding. Partially avoided positive hits are eligible; skills, magic and direct killing blows are not. Player counterattacks remain unimplemented.
- Eligible noncritical hits receive one 25% roll. Eligible criticals guarantee one application regardless of multi-critical count.
- Add one stack, capped at five, and refresh a shared seven-future-tick timer even at the cap.
- Snapshot `floor(unbuffed sheet basic attack × 0.08 × stacks)`. Zero is allowed; do not add a minimum of one or multiply by crit, hit randomizer or mitigation. Reapplication may lower stored damage.
- First payment is at the next crossed global tick. Pay the seventh tick before removal; no immediate application damage. Pulses have no hit gates, criticals, new procs or damage RNG.
- A lethal pulse settles the existing XP/credit/drop reward exactly once. An old-wave batch cannot affect replacement enemies. A terminal bleed-wave transition consumes that boundary; ordinary actions resume on later processing steps. These are integration rules, not original-source facts.
- Bleeding is encounter-only state, cleared on defeat, retreat, replacement waves and save loading. No persistent item or restored-combat schema is introduced.

Full arbitrary call-partition invariance was already absent in v0.7. A read-only seed-42 high-HP/no-defense boss fixture at 21 seconds produced 20 hero turns with 0.05-second calls versus 19 with 0.1-second calls, despite 20 global ticks in both. This slice preserves the established scheduler rather than silently retiming all weapons. New assertions cover exact-once bleed payments at equal processed integer ticks, not universal combat timing equivalence.

## v0.8.1 numerical clock correction
The one-tick-per-100-TU research basis and this game's 1.05-second mapping are unchanged. A floating-point equality repair is an implementation correction, not a new original-HV rule or numerical balance coefficient. The patch uses a one-nanosecond comparison window, preserves signed player/enemy residual debt, and compensates accumulated TU addition. It does not add elapsed time, change proc durations or award offline progress. Intermission equality can resolve at most one nanosecond early per transition; the older coarse-step crossing-overshoot policy remains. Full caller-partition invariance is still not claimed. Historical measured trajectories in earlier version sections remain historical, not newly measured current outcomes.

## v0.9 expedition feedback boundary
Recent expedition reports and a local pinned comparison are independent observational UI, not a new HV ability, formula or reward system. They count actual HP removed/lost and successful proc applications/refreshes; they do not estimate counterfactual PA bonus damage, stun-prevented damage or DPS. Start build context and end level expose progression differences. Bounded session-only reports are deliberately omitted from durable saves and discarded on reload/import/ownership resynchronization. Random rolls and differing conditions mean two observed runs cannot prove a universally better weapon. All existing historical proc/rating models and combat/reward rules remain unchanged.

## v0.10 first AP abilities: original facts and integration choices
Pinned findings 002 lines65–68 explicitly grant 1 AP at level1 and one per subsequent level, so untrained earned AP equals character level. Lines341–350 require learning with AP and separately equipping an ability into an eligible unlocked slot. Initial slots are five Major plus five Supportive (lines345–351); general/weapon nodes use Major. Mastery points and slot purchases are separate, not implemented here.

Selected rank1 original entries: HP Tank costs1AP, Lv0, +10% baseHP; MP Tank costs1AP, Lv0, +10% baseMP (lines368–369). 1H Damage costs2AP, Lv0, +2ADB per actual 1H proficiency (line379). Later ranks exist but are not implemented, so rank1 is not advertised as the original maximum. The [Abilities revision64891](https://ehwiki.org/index.php?title=Abilities&oldid=64891) corroborates these entries and slot/learning rules.

Pool research lines145–155 uses floor(basePool × (1 + Tank + applicable armor/charm ability bonuses)); Tank does not recursively multiply yesterday’s maximum. Lines177–180 and [Character Stats revision65166](https://ehwiki.org/index.php?title=Character_Stats&oldid=65166) place the 1H proficiency bonus additively in sheetADB. This game adds it once in stats; basic hits, the existing2.3x skill and later bleed snapshots naturally use that sheet value. Preserve the existing stats-before-turn-proficiency-increment order. The existing chosen1.2×level proficiency cap bounds the ability input; disputed alternative cap evidence remains noted above.

Explicit adaptations: only the first three rank1 Major nodes are currently available, with no automatic allocation. Five Major slots are retained, not an invented single-slot restriction; level4 can afford all three, so this is early purchase order/growth, not lasting specialization. Learning/slotting/refunding is camp-only. Unlimited free refunds differ from the known original first10 single/first1 full free resets followed by Soul Fragment costs (002 lines355–357). No Training, Mastery spending, Supportive nodes, paid slot expansion, personas or Soul Fragments are implemented.

Our invented flat equipment HP remains outside the Tank-scaled researched base pool, with its existing final rounding; original sources do not specify this invented item's combination rule. Starter baseHP558 plus17flatHP becomes floor(558×1.1)+17=630 rather than scaling all575. BaseMP19 becomes20. Existing automatic heal, potion and wave restoration deliberately remain the game's27%/40%/10% maxHP adaptations, so Tank increases those restores. Original restorative rules generally use pre-Tank bases; these game actions are not claimed as original Cure or potion fidelity.

The optional learned/slotted allocation is bounded and strictly validated; AP budget is derived from validated level, not trusted saved point counters. Historical shared-v3 builds do not understand the new allocation and may omit it when saving, which returns the derived AP budget on the new build rather than consuming credits or items; avoid running old builds as writer if retaining the allocation matters. This is save integration behavior, not an original HV mechanic.

## v0.11 complete ranks for the existing three ability lines
Pinned findings002 §3.2, lines364–379, explicitly labels each rank's effect as a replacement total. Official Abilities revision64891 corroborates the table and summed AP costs. HP Tank level gates are [0,25,50,75,100,120,150,200,250,300]; MP Tank [0,30,60,90,120,160,210,260,310,350]. Both have incremental AP costs [1,2,3,3,4,4,4,5,5,5] and replacement bonuses +10% through +100%, total36AP each. 1H Damage gates [0,100,200], incremental costs [2,3,5], replacement per-proficiency ADB [2,3,4], total10AP. Full selected lines total82AP. Original learning/slotting separation and five starting Major slots remain.

One ability occupies one slot across ranks, not one slot per purchased rank. Sources do not establish exact rank-skip or lower-rank-selection UI semantics; buying only the next rank, paying every preceding cost and refunding the entire line are this implementation's conservative interactions. Unlimited free camp reset, the existing support/maxHP formulas and flat equipmentHP integration remain adaptations. No new Training/Mastery/Supportive tree is implied. Rank0/1 arithmetic is preserved; new rank2+ pool multiplication uses an integer ratio before flooring to avoid binary floating-point errors at exact integer boundaries.

Old rank1 allocation shape remains valid. A strict optional sparse ranks map records only learned rank2+; gates and cumulative cost are revalidated against level. v0.10 rejects this new field rather than understanding upgraded progress; refresh old tabs before writer takeover. Current AP is still derived, never a saved authority.

## v0.12 explicit selected-sale boundary
Original equipment sales and credits are established by permitted findings004. Our multi-selection, exact item comparison/quote and confirmation workflow are independent interface adaptations, not a sourced original automatic sale policy. The existing independent sale-price formula and every quality/drop/combat rule remain unchanged. Selection may intentionally include high-quality or statistically better gear, unlike conservative safe cleanup; it is never auto-selected by score and is not advertised as guaranteed downgrade disposal. Locked/equipped items remain protected. No persistent schema or new currency sink is introduced.

## v0.13 one-handed counterattack damage subset
Permitted findings002 §2.1 at commit8e1ff32097d50ba8e1c30266653234506b98a5f4 and official Fighting Styles revision67008 support a one-handed weapon with optional shield, passive retaliation after block/parry, chance min(75,25+.02×(STR+DEX)+1H proficiency/10) percent, and per-player-turn attempt caps1/2/3 at proficiency100/200. The pinned report includes exactly200; current wiki wording leaves that endpoint ambiguous. Current sheet physical attack supplies the counter damage once; it cannot crit, evade or parry, and cannot create PA/bleed/elemental weapon procs. Existing PA can reduce target mitigation without refreshing.

This implementation explicitly chooses any actually reached Parry/Block gate with at least one successful check, including partial defenses; original partial eligibility is not established. Current recognized axe/rapier/club identity stands for the implemented single-handed style, with no invented shield requirement; the unknown starter sword is excluded. Existing effective proficiency cap1.2×level remains an adaptation. Count initiated counters even when blocked to zero; reset a shared budget before the upcoming player's stun-recovery actions, not perTick/enemy/wave. No extra turn, MP, proficiency or ordinary attack/skill count is awarded. Original counter-stun, Overcharge and Overwhelming Strikes are explicitly not implemented.

Counter observations and budgets are session-only and separate from basic/skill/bleed totals. Damage-triggered RNG changes can alter later combat and drop results; extra retaliation is not a universal win-rate or speed guarantee. Full evidence, endpoint discrepancy, withheld stun constants and integration boundaries are in COUNTERATTACK-GUIDE.md.

## v0.14 gear-only preset boundary
Permitted findings002 at commit8e1ff32097d50ba8e1c30266653234506b98a5f4 line498 records three initial Equipment Sets and up to four extra from Set Collector. Line823 and [Persona revision65281](https://ehwiki.org/index.php?title=Persona&oldid=65281) distinguish broader per-Persona attributes, equipment sets, abilities and other configuration. [Character Menu revision64958](https://ehwiki.org/index.php?title=Character_Menu&oldid=64958#Equipment) states that original set changes also involve quickbar, battle inventory and abilities. [Armory revision67000](https://ehwiki.org/index.php?title=The_Armory&oldid=67000) identifies gear used by other sets/personas and separate lock/protection.

This game implements three fixed gear-only presets A/B/C for its weapon/armor/accessory abstraction. It does not implement full original Equipment Sets, Persona, extra purchased slots, quickbars or battle-item allocations. Camp-only ID references, exact whole-set preview, automatic item locks on explicitly labeled save, prohibition on unlocking/selling referenced gear, and retained locks after clearing/overwriting are independent convenience/safety decisions. No copying, free storage, stat reroll, fee, AP/tactic change or automatic loadout selection is introduced. Old readers may discard preset metadata; existing item locks survive, not the presets themselves.

## v0.15 rapier parry: rating versus chance
Pinned003 lines235/287/382 establish legal Nimble rapier, level divisor2000, ordinary75–211 and Nimble137–301 rolls with0.0894 fluctuation. These are raw ratings, not per-check percentages. Current official Damage revision66419 now publishes Accuracy-relative interception formulas; pinned002 line804 is an historical research gap, not proof no formula exists today. This game lacks that complete Accuracy/rating model and explicitly adapts final chance to legacy0.035 plus equipment rating/100, capped0.5. New rapier generation/commissions add ratings and a seventh comparison dimension; old items are never retrofitted. Existing score gains1.8/rating, changing new rapier prices under unchanged sale/commission equations. New rapier draws/suffix choices alter subsequent RNG. See PARRY-GEAR-GUIDE.md for exact formulas, restrictions and compatibility.

## v0.17 Protection baseline and automatic-casting adaptation
Protection uses the sourced25% independent remaining-damage multiplier and base fee `ceil(level × 25/100)`, not a percentage of maxMP. The primary Spells page explicitly defines costs as percentages of player level rounded up. We currently exclude supportive-proficiency, interference and other cost modifiers. Source level `10?`, duration `15?` and cast speed `0.2?` remain uncertain; level10/15Ticks are the selected research model and a whole player-action cast is an explicit adaptation. Default-OFF automatic recasting is not Innate Arcana upkeep. Healing priority means a successful heal suppresses casting that turn, not reserving healing MP. See PROTECTION-GUIDE.md for checked sources and limitations.

## v0.18 supported commission suffix subset
Existing researched Slaughter/Balance/Nimble endpoints now become deliberate paid commission choices; no new loot/combat rules. Six supported pairs are not the full original legality table (Axe Balance and Club Nimble also legal in original but not catalogued here). See COMMISSION-AFFIXES-GUIDE.md and ACCEPTANCE-V018.md for original evidence versus quality model and commission adaptation.


### v0.18 one-shot return-to-camp control — adaptation

Finish-current-expedition-and-camp is an independently designed idle convenience, not a researched original-HV mechanic. It changes only the post-victory auto-repeat decision. All normal win loot, credits, XP and reports settle exactly once before returning; it does not alter attacks, RNG, difficulty, item formulas, or saved automatic stage advancement. Intent is transient and never a saved preference.

## v0.20 physical attacks versus magical skills

Original monster normal attacks are physical (Monster Stats revision63858); Monster Lab distinguishes physical/magical skills independently of damage element. The later-route 赤砂術式 is therefore explicitly a magical **skill**, not a magical basic attack. Its independently authored alternating cadence and no-MP-model implementation are adaptations. Magic skips Parry, retains Evade/Block/Resist, and uses `min(.8,1-900/(900+END+WIS/2))` magical attribute mitigation rather than physical gear defense. Protection's25% independent reduction applies to both. Current player resist probability remains unimplemented0, not the original `.4WIS+equipment` raw Resist converted to chance. Magic-block counter eligibility is an inference from Fighting Styles' general blocked/parried-attack rule; partial-block eligibility remains our prior adaptation. See [sources, choices and limits](MAGICAL-ENCOUNTERS-GUIDE.md).

## v0.21 automatic targeting boundary

The optional camp target-priority policies are independently designed idle-game adaptations. No original-HV automatic enemy-selection rule, skill, probability or server AI is asserted. The underlying researched attack/proc/defense rules remain unchanged. Persistent caster identity (the existing alternating-pattern enemy), not its immediately upcoming action, drives caster-first; cleanup compares current absolute HP rather than percentages. Counter retaliation and existing damage-over-time retain their own recipients.


## v0.22 observation-only adaptation

Start-build report snapshots are independent session feedback, not an original-HV mechanic. Existing validated choices are observed without formula/effect/RNG/reward/save changes. Protection policy does not prove active buff; only slotted Major abilities are reported as enabled configuration.

## v0.23 Soulbind investment boundary

Current official Items revision67045 lists Soul Fragment base costs100 for Crude through Exquisite,250 Magnificent,500 Legendary and1000 Peerless; the additional cost is2% of that base per item level above the character. Older cached250-cost Superior/Exquisite tables are not current evidence. The Armory revision67000 / Equipment Basics describe nontradeable bound gear following character level. Conflicting original100-level eligibility wording is avoided by accepting only owned recognized axe/rapier/club items no higher than the character. No accessory/armor original-type mapping is fabricated.

Normal-clear10fragment rewards, no historical grants, no fragment shop, and forbidding every disposal/unlock path are this game's adaptations. Original fragment shop price1000credits is not repurposed as a cheap credit damage upgrade. An explicit quote/confirmation preserves item identity/rolls/affixes/preset references; no automatic binding. Binding is not IW or forging, and no World Seeds/materials/charm rewards are invented in this slice.

Effective levels/stats are recalculated from an immutable pre-binding displayed-stat anchor, retaining this game's level-scale model. Attack50/3 versus current wiki16.60027 is a deliberate compatibility approximation, not a claim of exact server precision; rate/parry2000, inventedHP12/defense20, whole-prefix scaling, existing rounding/caps and unrecoverable earlier rounding are documented in SOULBIND-GUIDE.md. Missing old parry remains missing. Version2 save protection, v1 migration withzero fragments, cache validation and old-reader rejection are engineering contracts, not original game mechanics.

The v0.23 conservative no-disposal policy additionally requires a116-total bound-weapon cap across all held locations: one equipped plus115backpack items preserves a route to the existing five-free-slot start condition. Without it117permanent weapons could make further expeditions impossible. This cap, atomic refusal and overcap import rejection are storage-safety adaptations, not original HV limits.


## v0.24 first-tier Item World boundary

Official Item_World67048 (marked WIP) shares the Fair/Average/Superior table: targets1–10 require rounds5,6,7,8,9,10,10,10,10,10; monster levels100–190; Hard1–4/Nightmare5–10; one seed each. Soulbound-only, quarter credits and2% more damage per round are explicit. Battles66324 instead says1%, a preserved conflict; this slice chooses the dedicated page. Armory67000 gives +1% base stats except +2% physical/magical attack per clear, plus1IW/CP/max-forge. No verified cumulative equation is claimed: IW1 only avoids additive/compound ambiguity. Later original tiers and other qualities remain unimplemented, not originally illegal.

One deterministic seed per normal clear, fixed local strength stage5, round1 damage1.00 then+.02 per round, existing HP/defense/whole-prefix stat mapping, integer floor of quarter kill credits, no normal completion bonuses, always return-to-camp and no refunds on defeat/retreat/reload are explicit adapters. Pinned003 line870 retracts its earlier failure/escape-no-refund claim as unsourced; no source establishes the target must be worn. Equipped and backpack targets are both accepted without auto-equip. Original consume-to-enter is sourced, but interrupted-session persistence is ours.

Items67045 lists World Seeds from Hard+ random drops (unknown rate), Lv200+ Arena clear, Shrine Collectables10% and Monster Lab gift5%; no verified NPC price is used. This slice adds no shop, CP, forge, stamina, charms or salvage. Stats derive from the unchanged original Soulbind anchor, including the level ratio and first-tier1.02attack/1.01others before final rounding; no missing old stat is invented. Format3 seeds and sparse IW1 metadata are strictly validated, including future Lv500 representability before payment. See ITEM-WORLD-GUIDE.md for sources and full scope.

## v0.25 inventory workbench boundary

Family/investment filters, matching counts, hidden inspection/sale notices and commission reveal are independent interface conveniences, not original-HV mechanics. They classify existing owned data using the implemented family resolver and binding/IW metadata; they do not invent missing legacy stats, mutate items, score a best build or expand original legality. Selection still survives filtering and the complete exact-ID sale preview is authoritative. Engine/loot/session rules, save format3 and the existing IW1-only scope are unchanged. See INVENTORY-WORKBENCH-GUIDE.md for controls and limits.


## v0.26 Exquisite first-tier access

The [current Item World table](https://ehwiki.org/wiki/Item_World#Item_World_Level), revision67048, gives Exquisite the same IW1 entry row as the three previously supported qualities, but an original maximum15 instead of10. This supersedes pinned003's grouped Sup/Exq max10 claim for current scope; it is not inferred from forge-cost rows. The table remains WIP. [Items revision67045](https://ehwiki.org/wiki/Items#Soul_Fragments) retains the existing Exquisite100-fragment binding cost.

v0.26 extends eligibility only. Five rounds, fixed local strength5, one paid seed, quarter kill credits, immutable-anchor1.02attack/1.01other-present-stats and no ordinary completion bonus are unchanged adaptations. No IW2+, new stat field, quality generator, forge or economy is added; legacy missing parry stays missing. Same-level pre/post IW observations must not misattribute Soulbind level growth to the trial. Historical v0.24/v0.25 scope descriptions remain historical.

Same-shaped format3 data does not mean old v0.24/v0.25 readers understand Exquisite IW1. Refresh old tabs before loading new progress; the release acceptance evidence must establish old-reader refusal and protected persistence rather than asserting backward compatibility.


## v0.27 extra emergency supply boundary

The optional Balanced/Assault policy is an independent idle-control adapter, not an original-HV potion system. Existing3-per-expedition stock and40%-maxHP restoration remain unchanged. Default OFF preserves every strategy's prior behavior; ON checks strictly below30% after normal healing and only consumes stock above1, reserving one manual bottle. Sustain retains its own existing below30% rule, including the last bottle, and is explicitly outside the new control. No purchase, cooldown, item schema, formula, turn cost or currency is invented. Source playthroughs must retain no-use/loss outcomes rather than promising survival. Historical readers drop the new optional preference, while existing invested-item incompatibility and format3 guards remain. See EMERGENCY-SUPPLY-GUIDE.md.


## v0.28 pending-loot visibility and recovery boundary

The separate pending tray, exact held-item comparison and explicit camp-only FIFO claim are independent inventory-interface adaptations, not claims about original-HV storage or pickup rules. They expose the pre-existing queue without changing its validation limit8, backpack limit120, five-free-slot departure reserve or116-total Soulbound protection cap. Original quality/roll/affix/investment data remain untouched. Claim transfers existing objects into available backpack slots only; it neither grants rewards nor spends currency. Existing manual-sale refill remains unchanged, and pending objects stay ineligible for equip/sale/lock/Soulbind/Item World until actually in the backpack.

Normal local encounters have five nonboss drop opportunities plus one guaranteed clear drop, so starting with exactly five free slots can retain one pending item. The existing five-round Item World has seven nonboss opportunities and no normal guaranteed clear reward, permitting at most two pending drops from that starting occupancy. These are properties of this independent encounter adapter, not original drop-rate facts. Valid imported free-space/pending states are a separate recovery boundary; they are not evidence of a naturally earned permanent-item deadlock. No new save field, old-reader behavior or researched progression system is introduced.


## v0.29 retained-context display boundary

The additional combat context in a gear-set apply preview is an independent interface adaptation. It displays current validated choices; it does not add those choices to the three stored gear-ID records or implement broader original Equipment Sets/Personas. The original-versus-adapted scope documented for v0.14 remains unchanged. No new original-HV rule, statistic or source assertion is introduced.

Only slotted abilities are presented as enabled configuration, with their current rank. Protection policy is not an active-buff claim; level eligibility remains separate. Extra emergency supply's stored choice is not effective under Sustain, whose existing automatic potion rule can use the last bottle. These distinctions reuse already implemented rules. Invalidating confirmation when displayed context changes is a local consent safeguard, not a gameplay mechanic or saved configuration migration.


## v0.30 comparison keyboard-focus boundary

Retaining keyboard focus on the same exact owned item after replacing comparison controls is an independent interface repair, not an original-HV mechanic. A visible fallback is used only for a replaced focused comparison control when no visible exact-item control remains. It does not select, equip, claim, filter, sell or invest in an item, and adds no state, RNG, save or progression rule. No new original-game research assertion is made.


## v0.32 presentation and asset boundary

Kenney UI Pack shapes and independently authored equipment icons are presentation-only; they introduce no original-HV mechanic or data claim. References to Elden Ring and Slay the Spire are structural interface study, not licensed game artwork. The unknown weapon silhouette is not an invented family classification. Candidate/current comparison values reuse the existing owned-item stats and signed difference; no gameplay, ownership or persistent schema changes are introduced. See ASSET-CREDITS.md for exact provenance.


## v0.34 effect-reading boundary

No original rule or adaptation changes in this presentation-only slice. The equipment detail retains concise effect identity, meaningful tradeoffs and an always-visible historical-model/game-adaptation caveat. The existing full trait and numeric rule paragraphs remain byte-identical in a neighbouring native disclosure, including the axe's delayed snapshots and possibly weaker reapplication, PA's subsequent physical mitigation semantics, and stun's non-refreshing recovery action. This is not a new original-HV formula, damage recommendation, proc guarantee beyond established conditions, or removal of the source uncertainty above. Resource costs, pending restrictions and irreversible investment warnings remain outside this technical disclosure at their existing operations.

## v0.40 event observation recovery

This repairs a UI lifecycle defect, not original HV mechanics. Canonical save loading deliberately restores camp state and starts new transient event IDs; the UI now starts a new observed-ID set only on successful state replacement. Equipment, loot, rewards, RNG and save-format rules remain unchanged. No new original-game claim or adaptation is introduced.

## v056 adaptation correction: post-growth wave recovery

The existing 10% inter-wave HP recovery is this game's adaptation, not an original-HV fact. A killing action can award XP, increase attributes and synchronize soulbound equipment before the next wave. Recovery now reads max HP after those updates, preventing the stale pre-kill cap from removing earned health. Counter, ordinary hit and bleed all share this settlement point. Original attribute/proficiency/quality/damage rules are unchanged.

## v065 inventory raw-stat sorting boundary

Descending sorting by the seven existing equipment stat fields is an independent inventory-interface adaptation. It does not assert an original-HV sorting rule or change stat interpretation, item generation, growth, effective character calculations, or combat. It compares owned displayed item values (including existing bound/IW-adjusted values), not hypothetical character deltas, DPS, or win probability. Missing fields compare as zero without adding fields to legacy items. Equal values retain newest-acquired display order. The preference is transient page UI state, not a saved build configuration.

## v067 next-level weapon observation adapter

The original-research-backed soulbinding concept and the existing local immutable-anchor growth integration are unchanged. This view calls the very same `scaleSoulboundItem` used for actual growth at character level + 1, retaining existing IW1. It reports this weapon's stats only, not a future character build, future drops or original-HV UI. Rounding and capped rates can produce unchanged individual values. Level 500 has no next level in this game. No prediction is committed and no resource is spent.

## v068 simulation-tempo adapter

A local 1× / 2× timer option changes real waiting time, not the original TU/action-speed formulas or equipment stats. At 2× each accepted bounded timer interval can execute two identical engine calls. The second is skipped after camp, defeat or writer loss. Per-expedition loot/reward rules and RNG remain unchanged for the same simulated steps. Report elapsed time, best records and countdowns are simulated time, not wall-clock timing. The existing no-offline-credit gap rule remains; no durable preference or new save schema is introduced. This is an explicit idle-game adaptation, not an original-HV feature.

## v070 expedition drop receipt adapter

The session-only drop list observes this game's existing generated-loot delivery and completed automatic sales. It adds no original-HV loot claim, probability, reward, storage or economic rule. Entries describe the handling at acquisition time, not current item ownership. Later equip/sale/claim operations do not rewrite the historical receipt. Ordinary and Item World reward differences are retained; no additional loot is granted by reporting.
