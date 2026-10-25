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

- Rapier Penetrated Armor stacks at most three, reducing general physical mitigation by 25% per stack (`baseMit*(1-.25*stacks)`). The new stack applies **after** the hit that produced it. It is not a 25% direct damage multiplier.
- Club stun can reach 25% proc chance and four ticks. Stun does not refresh while active; recovery grants the monster a free action. A critical triggers built-in weapon proc but does not guarantee suffix Siphon.
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
