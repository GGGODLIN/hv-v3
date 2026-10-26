# Protection — one optional defensive decision (v0.17)

## How to play
At level10, open 成長 and enable 自動護盾 in camp. It is OFF by default. On the next eligible turn, spend `ceil(level × 0.25)` MP and give up that turn's attack to gain25% independent damage reduction for15 globalTicks. The policy recasts only after expiry; insufficient MP falls back to the usual attack. A successful automatic heal takes priority and prevents casting Protection on that same turn. This does **not** reserve six MP for a future heal: a low-HP character unable to heal may still afford Protection.

The tradeoff is reduced incoming damage versus MP and attack time. It is not a promise of faster clears or better outcomes for every build. Ordinary one-handed proficiency increases on weapon actions, not Protection casts. Buff timing uses the existing globalTick clock, not clicks or incoming attacks. Waves share the buff; a new expedition, victory, defeat, retreat or reload clears it. Settings can be changed only in camp by the owning tab. The on/off choice persists; active buffs and observed counters do not.

The compact battle readout shows active ticks, casts and observed damage prevented. The report's prevention count compares the same attack's protected and unprotected HP loss, capped at HP before that hit. It uses the same random roll, does not count a full block as prevented damage, and is not a second simulated expedition. Character sheet and equipment previews retain base mitigation, not a temporary buffed score.

## Source facts, research models and adaptations

Permitted research: findings002 §4.1(C), §4.3(A/E), §3.2, pinned at `8e1ff32097d50ba8e1c30266653234506b98a5f4`. No other implementation, constants, monster pool or artwork was reused.

Primary sources checked2026-10-26:
- [Spells / Spell Costs](https://ehwiki.org/wiki/Spells#Spell_Costs): “Spell costs are all a percentage of the player's level, rounded up.” Protection's baseCost is25 and cooldown0. The visible page footer identifies revision66314; the oldid URL did not read successfully in this check. The formula is level×baseCost/100 before listed adjustments, not25% of base/maxMP. Thus level10 costs3MP and level20 costs5MP; MP Tank does not increase this base cost.
- [Spells](https://ehwiki.org/wiki/Spells): Protection reduces physical/magical damage by25%. It is an independent remaining-damage multiplier, not25 percentage points added to equipment reduction. Our current enemy attacks are physical; no new enemy magic system is implied.
- [Action Speed](https://ehwiki.org/wiki/Action_Speed): oneTick=100TU; buff duration follows ticks. Protection's listed0.2? cast speed is uncertain.
- [Proficiencies](https://ehwiki.org/wiki/Proficiencies#Effects): supportive proficiency can improve duration and some spell mana/time costs. This release uses the zero-supportive-proficiency baseline and does not implement those modifiers.

**Research uncertainty:** Protection's source level and base duration are written `10?` and `15?`. Level10 and15Ticks are our selected research model, not newly established original facts. Better Protection's18/21/24/27/30Ticks do not prove the uncertain unmodified duration. We do not implement that ability line.

**Explicit adaptation:** optional automatic reapplication, a full current player-action cost, free camp toggle, and integration with the existing adapted heal/potion policy are this game's decisions. This is not original Innate Arcana: original Auto-cast Slots have upkeep rather than this recast policy. Current base fee excludes interference, mana conservation, Spirit Stance, Coalesced Mana, Channeling and supportive-proficiency discounts. Do not describe it as a complete original spell-cost model. No new currency, item, spell tree, slot or permanent buff is awarded.

## Save and recovery
The optional strict boolean `autoProtection` defaults to false for legacy saves. Invalid values are rejected. Active duration and counters are session-only and never trusted from import. Older versions do not understand the optional setting and may omit it on saving; refresh old writer tabs before taking over. Existing item/ability/preset IDs and v3 save namespace are unchanged. Source recovery does not recover a personal browser save; use the normal export before upgrading.

## Acceptance scope
Focused automated checks cover the multiplier, same-RNG accounting, no overkill inflation, global expiry, single cast, shortage fallback, healing priority, lifecycle clearing, save validation and UI ownership. Default-OFF equivalence is compared directly against accepted v0.16. Actual candidate browser checks and exact source/publication evidence are recorded separately; this guide alone does not assert publication or device coverage.
