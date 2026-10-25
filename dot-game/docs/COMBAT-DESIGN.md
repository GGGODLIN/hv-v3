# Independent combat and progression: v0.8 candidate

This implementation was authored from scratch. No existing game implementation, constants export, monster dataset, artwork, or another author's single-player design was used. The source map is `ORIGINAL-HV.md`; public research is evidence, not access to HV server code. This document distinguishes rules implemented from evidence from explicitly chosen adaptations.

## Research-supported rules implemented

- Primary attributes retain STR, DEX, AGI, END, INT, WIS. Base HP = 500 + 10 × level + 6 × END; base MP = 10 + level + WIS, before this game's equipment bonuses.
- Physical attribute damage uses ln(3330 + 2 × STR + DEX) / ln(1.0003) − 27029.81, then weapon and other attack bonuses add. Proficiency does **not** add damage without a proficiency ability.
- Attribute physical mitigation uses min(0.8, 1 − 900 / (900 + END + AGI/2)). Independent equipment mitigation factors multiply; they do not sum unbounded.
- EXP cumulative thresholds use the documented formula in `ORIGINAL-HV.md`: level 2 requires 99 EXP, next increment is 69. Current content supports levels 1–500.
- Damage resolution exposes ordered trace phases: Whiff → Absorb → Evade → Parry → Block → Resist → MultiCrit → Mitigation → DamageRoll. Whiff is **not** an additional universal accuracy gate: only an explicitly supplied eligible chance can trigger it. Current creatures do not apply blind/shadow.
- Absorb requires magic and a ward chance, never physical damage; eligible critical magic bypasses it. To preserve this dependency, magic pre-samples critical eligibility before the ward gate but applies critical damage at the later phase.
- Evade/Parry/Block each perform two checks (1, 0.5, 0 damage). An evade glance cannot crit. Weapon skills and active stun bypass evade/parry; magic bypasses physical parry. Stun does not disable block.
- Offensive magic resist performs three checks for factors 1, 0.5, 0.25, 0.1. Channeling bypasses resist. A partial block/parry/resist does not incorrectly inherit evade's no-critical rule.
- Player critical damage is 1 + 0.5 × critical count, at most nine counts. Weaken disables criticals. General and specific mitigation multiply; Void skips specific mitigation only.
- Final damage uses 41 discrete rolls from 0.80 to 1.20, then floor. Integer die numerator avoids a floating-point artifact making 100 × 0.81 floor to 80.
- Monster ordinary critical chance 20%, critical bonus +20% follows the newer Battles description rather than mixing the older conflicting attribute formula.

The first slice uses physical combat; magic/ward/resist/void/weaken branches are resolver capabilities covered by deterministic tests, **not** a claim that complete magical builds are playable.

## Independent adaptations, not original HV claims

- This is real-time presentation of automated turn actions. One physical player action every 1.05 seconds represents 100 TU; ticks cross 100 TU. Enemy cadence is 1.9 seconds. The engine caps each update to two seconds; the UI online-time policy is documented separately. Offline earnings are not implemented.
- Six attributes start at 8 and automatically rise by 2 each level. Original HV allocates an EXP budget; this simplified starting allocation is intentional, not the original allocation system.
- Avoidance probability conversion is not fully established by the research. This version chooses small explicit base chances plus dexterity/agility/equipment contributions, all capped. These are not original rating curves.
- First critical probability uses sheet critical chance; continuation is 10%, capped at the researched 25% continuation cap. The exact original accuracy-to-critical mapping is not asserted.
- Flat `defense` on independently generated armor is interpreted as an equipment mitigation percentage divided by 100, capped per item. The original research uses actual item mitigation percentages; this normalized stat is this game's presentation contract.
- Proficiency grows 0.08 per automated player turn, capped at 1.2 × level, choosing one side of a documented source conflict. Exact original gain coefficients are unknown. No proficiency damage ability is silently granted.
- `破勢斬` is an original automated skill: under the default balanced policy, every fifth player action if at least 3 MP, costs 3 MP, deals 2.3 × attack, and bypasses evade/parry. It is **not** Shield Bash, and the disputed original Shield Bash multiplier is not copied.
- `自動治癒` is an original sustain action, not original Cure: under the default balanced policy, below 38% HP with at least 6 MP, spends 6 MP to restore 27% max HP. Each player action restores 0.6 MP. The original Cure unlock/cooldown/baseHP scaling is deferred.
- Three optional supply potions per expedition restore 40% max HP. No purchases or cash transactions exist.
- Four waves per expedition, six independently named creatures in total, with a boss final wave. Creature stats and exponential stage scaling are independently tuned; the excluded monster dataset is not used. Stages 1–30 are currently exposed, not a permanent product scope limit.
- Normal kill equipment chance is 14% and a clear grants one guaranteed equipment item. First clear guarantees the **weapon slot**, not a secretly upgraded quality roll. These rates intentionally support a short idle loot loop and are **not** the original 0.25% ordinary drop baseline.
- First-clear XP/gold, repeatable expedition rewards, sell values, level-dependent creature rewards, full recovery on camp/clear, between-wave 10% recovery, and lossless defeat are independent single-player pacing.
- The first clear can be followed by an immediate camp equipment change; then repeating the same stage demonstrates shorter clear time. Auto advance moves to the next unlocked stage; disabled auto advance repeats the selected stage after a 3-second intermission. It is not an auto-equip system.

## v0.2 automatic tactics: explicit independent adaptation

Choose a policy at camp before departing. This is an original automatic decision layer over the existing independently adapted abilities, **not** an implementation of the original HV skill tree. Changing policy never changes attributes, equipment, damage multipliers, the researched resolution chain, enemy stats, or loot rolls.

| Policy | Burst decision | Paid healing decision | Automatic potion |
| --- | --- | --- | --- |
| Balanced / 均衡 (default) | Every 5th player action, if at least 3 MP | Below 38% HP, if at least 6 MP | Never; manual potion available |
| Assault / 猛攻 | Every 3rd player action, if at least 3 MP | Below 22% HP, if at least 6 MP | Never; manual potion available |
| Sustain / 持久 | Every 5th player action, only if spending 3 MP leaves at least 6 MP | Below 60% HP, if at least 6 MP | After healing, if still below 30% HP and a charge remains |

All policies recover the existing 0.6 MP each player action; burst costs 3 MP and uses the existing 2.3× attack; healing costs 6 MP and restores 27% maximum HP. Each expedition has exactly three shared manual/automatic potion charges, each restoring 40% maximum HP. A support action and attack can occur on the same turn: this is the **existing v0.1 adaptation**, explicitly preserved rather than silently introducing a new original-HV action-economy claim. Multiple heals are not cast in a single turn. A potion may follow that one heal only if the emergency threshold remains unmet.

Assault's shorter cadence is a deliberate policy pacing adaptation, not a claim that original HV skill cooldowns are policy-dependent. More burst is not universally better: it drains the pool needed to heal. Sustain gives up some burst opportunities and spends finite consumables, but does not guarantee a win. Policies cannot be changed mid-battle or while defeated; retreat to camp first. Default balanced preserves the v0.1 sequence.

### Reproducible tradeoff evidence

`tests/tactics.test.mjs` creates identical seed 42 level-1 starter characters, uses the same 0.1-second updates, and replaces only the test encounter with one final-wave enemy (5 defense, zero evade/parry/block). These are controlled **test fixtures**, not new selectable encounters or universal balance promises:

- 2,000 enemy HP / 0 attack: balanced wins in 43.1 s spending 24 MP on 8 bursts; assault wins in 41.0 s spending 39 MP on 13 bursts. Both use no heal/potion. Clear recovery resets the MP pool, so the per-expedition expenditure counter, not post-clear MP, is compared.
- 3,000 enemy HP / 60 attack: balanced loses at 36.1 s; assault loses at 30.4 s; sustain wins at 83.0 s, using 2 bursts, 9 paid heals, and all 3 potions. This shows survival at a resource/offense cost, not a claim that sustain always wins.
- `battle.actions` tracks attacks, skills, heals, potions and MP spent for the current expedition; it resets on the next departure and on load. It is observational and never feeds combat outcomes. Strategy is preserved in saves; missing/invalid values safely default to balanced.

## v0.3 rapier identity: explicitly selected historical model

This slice adds only rapier **Penetrated Armor / 穿透護甲**. It follows the permitted historical research at `8e1ff32097d50ba8e1c30266653234506b98a5f4`, report 002 §5.2, not a claim that every current original-HV page agrees. That report and the cited Chinese Equipment Procs text describe post-hit PA with a maximum seven-tick duration; the live English page found during this iteration instead describes permanent PA and physical-mitigation bypass on the triggering hit. These are incompatible models. This implementation deliberately retains the pinned historical model; it does not mix permanent status or triggering-hit bypass into it. See `ORIGINAL-HV.md` for the source-conflict record.

### Supported shape versus our numeric and eligibility decisions

- **Research-supported shape:** at most three stacks; each stack reduces the target's **original general physical mitigation rate** by 25% relatively: `effectiveMit = baseMit * (1 - .25 * stacks)`. An 80% rate becomes 60%, 40%, then 20%. This is neither 25 percentage points per stack nor a 25% direct damage bonus. Specific mitigation and magical mitigation are unchanged. Void still respects the reduced general physical mitigation.
- **Historical ordering:** damage is resolved using the stacks that were active before the attack. Only after that damage is determined may the attack add a stack. The triggering hit gets no newly granted mitigation bypass. The existing Whiff → Absorb → Evade → Parry → Block → Resist → MultiCrit → Mitigation → DamageRoll chain is unchanged.
- **Chosen rate and duration:** each eligible noncritical basic attack rolls a fixed **25%**, and each successful proc sets a shared **seven-tick** expiry for all active stacks. The report gives these as maximum values, but does not supply the low-level or equipment scaling formula; using those maxima for every rapier is our explicit balance adaptation, not a recovered original coefficient. The shared refresh, including successful procs at the three-stack cap, is also an independent choice because the permitted source does not establish the refresh policy.
- **Critical guarantee:** an eligible landed critical guarantees one PA proc without a second proc random draw. Nine critical counts still add only one stack, not nine.
- **Chosen eligibility:** the attack must be a basic physical attack using a resolved rapier identity, deal positive damage, and leave the target alive. Partially avoided positive-damage hits are eligible by our explicit adaptation; full whiff/evade/parry/block, floor-to-zero damage, magic and lethal hits do not proc. The evade-glance rule still suppresses criticals.
- **Skill boundary:** the game's original `破勢斬` is not an original-HV rapier attack or Rending Blow. Existing PA can improve its physical damage, but the skill never adds or refreshes PA and never consumes a proc RNG roll. No unknown original skill-to-proc relationship is silently assumed.

### Clock, lifecycle, identity and presentation contract

`PENETRATED_ARMOR_RULES` exposes immutable chosen constants. An enemy may hold `penetratedArmor: {stacks, expiresAtTick}`; `penetratedArmorStatus(enemy, timing.ticks)` returns only a validated active view `{stacks, ticksRemaining, mitigationMultiplier}`. Status numbers are bounded, and no imported per-item proc coefficient is accepted.

Expiry uses the simulation's absolute `timing.ticks` counter. Each crossed 100-TU boundary is processed before an attack occurring at that boundary. A proc created at tick 10 is active through tick 16 and absent at tick 17; a new proc at tick 17 is applied after that hit and lasts until tick 24. Rendering frequency, foreground animation, elapsed wall time, and catch-up seconds do not directly decrement status. The existing two-second `advance` bound and the UI's online/suspension rules are unchanged. One tick in the current unaccelerated presentation is approximately 1.05 seconds of actually processed combat time; this is not a wall-clock/offline guarantee.

State belongs to a particular enemy object. A lethal hit removes that enemy's prior PA; the next enemy does not inherit it. New waves create fresh enemies; retreat, new expeditions and safe save load discard encounter status. Expired state is removed on a tick even if no player attack occurs. Events remain bounded to 30 entries, with the damage event before its optional `proc` event. The proc event includes the target ID and stack count; it is feedback, not another attack.

Weapons now persist allowlisted `weaponFamily` metadata. The loot helper recognizes only complete legal names generated by this game's older versions when metadata is absent. It does not guess from an arbitrary substring or rename. Unknown or invalid explicit metadata is canonicalized to `null`, so successive save/load cycles cannot silently reactivate name-based inference. In v0.3, generic starter equipment and axes had no proc; clubs received the separate v0.4 effect below, and axes receive the v0.8 historical wound described later. Paths with no implemented weapon proc consume no additional random draws; their earlier seeded combat behavior is preserved. Save import still ignores enemy status and returns to camp.

The comparison score remains a scalar sum of existing stats, not a PA value estimate; rapier armor utility cannot be judged as a universal upgrade from that number alone. No shipped monster stats, stages, loot probabilities, item stat rolls, or skill multipliers were changed for the PA slice. Axe bleed and the distinct current-English PA model remain **unimplemented**; the following club slice does not alter historical PA.

### Deterministic same-encounter evidence

`tests/weapon-procs.test.mjs` pairs seed-42 level-one characters with identical starter stats and balanced policy against a controlled final-wave fixture: 1,500 HP, 80% general physical mitigation, no evade/parry/block, and zero attack. The sole treatment change is explicit `weaponFamily: null` versus `weaponFamily: 'rapier'` on the same stat block. This synthetic enemy is not a selectable encounter or an imported monster definition.

| Treatment | Clear time | Attacks | Bursts | MP spent | PA procs |
| --- | ---: | ---: | ---: | ---: | ---: |
| No weapon proc | 173.3 s | 165 | 33 | 99 | 0 |
| Rapier PA | 62.0 s | 59 | 11 | 33 | 11 |

Both complete and exact replays reproduce the same state. The rapier legitimately consumes additional RNG draws for proc checks, so the two treatments share the initial seed but not every subsequent attack die. The test demonstrates repeatable armor-specific utility, not a universal clear-speed multiplier. Separate constant-die tests hold every attack roll fixed and verify the exact damage progression 20 → 40 → 60 → 80 for 100 raw damage against 80% mitigation, proving the relative reduction and post-trigger order without RNG-stream confounding. Against zero general mitigation PA provides no direct damage benefit.

## v0.4 club identity: bounded stun and earned recovery

This slice adds only the club's built-in **Stun / 暈眩**. The permitted historical research at `8e1ff32097d50ba8e1c30266653234506b98a5f4`, report 002 §4 and §5.2, supports weapon maximum 25% chance / four ticks, a critical built-in-proc guarantee, no refresh while already stunned, disabled evade/parry and offensive actions, and a free enemy action on the next player turn after recovery. The [Chinese Equipment Procs revision 57814](https://ehwiki.org/index.php?title=Equipment_Procs/Chinese&oldid=57814) retains a level-scaled chance/duration table; [English revision 65024](https://ehwiki.org/index.php?title=Equipment_Procs&oldid=65024) describes chance using weapon type and average Base Stat Roll instead. These are not evidence for a universal fixed rate at every level. [Action Speed](https://ehwiki.org/wiki/Action_Speed#Base_Action_Speeds) explicitly leaves the interaction between recovery and regular enemy turns unknown. The implementation must therefore distinguish the supported shape from the chosen coefficients and scheduler below.

### Supported shape and explicit adaptations

- `CLUB_STUN_RULES = {chance: .25, durationTicks: 4}` is immutable. Applying these historical maximum values to every club, rather than reconstructing unknown low-level/equipment scaling, is an **independent balance adaptation**, not exact current HV.
- The eligible attack is a basic physical attack from a resolved club identity, dealing positive damage to an enemy that survives. Positive partially avoided hits qualify by adaptation; full whiff/evade/parry/block, zero damage, magic, and lethal hits do not. Damage resolves before the proc; the triggering hit does not retroactively bypass evade or parry.
- An eligible critical guarantees exactly one stun, including nine-count criticals, without another proc random draw. A noncritical eligible hit rolls strictly below 25%. An evade glance still cannot critical, and Weaken still disables criticals.
- An already active stun cannot stack, refresh, or roll another proc, even on a critical. A queued recovery action also prevents a new proc until that earned action has been delivered. This pending-state rule is an explicit scheduler choice, not a new original immunity claim.
- While active, stun disables the enemy's evade and parry but leaves block and both mitigation factors unchanged. The existing resolver phase ordering and historical PA formula remain intact. `破勢斬` benefits from active stun/PA, but it remains this game's independent skill and cannot trigger either built-in weapon proc.
- While active, an enemy skips ordinary attacks without consuming attack RNG; skipped attacks are discarded, never banked. Stun is not an attack debuff and does not modify the enemy's source stats.
- This physical-combat slice does **not** implement the English page's 25% resist reduction, Shield Bash, a full monster magic/skill system, suffix Siphon, or axe bleed. No disputed Shield Bash multiplier is borrowed.

### Tick state, next-player-action recovery, and collision policy

Each enemy independently owns `stun: {expiresAtTick}`. `stunStatus(enemy, timing.ticks)` is a read-only UI/test view: active status returns `{ticksRemaining: 1..4, recoveryPending: false}`, an earned queued action returns `{ticksRemaining: 0, recoveryPending: true}`, and inactive/dead/invalid status returns `null`. Pending recovery is **not** active stun: its evade/parry have already returned. As with PA, expiry uses processed TU ticks, not rendering frames or elapsed wall-clock time. A proc at tick 10 is active through tick 13 and expires at tick 14. A crossed tick is processed before a player action on that boundary; a valid status skipped over by a late tick observation expires once, not repeatedly.

The live `advance` scheduler removes the expired active status and sets `stunRecoveryPending: true`. Expiry alone does not attack. Pending enemies wait rather than taking an earlier ordinary attack; manual potion use, inert commands, and zero-time updates do not deliver this action. Immediately before the **next automated player action**, each living pending enemy takes one ordinary-damage free action, with the pending flag removed first. If expiry and that player action share a boundary update, this is the next action and recovery runs first. That ordering is an explicit adaptation: it prevents a new player stun from canceling an already earned recovery and makes a fatal recovery interrupt healing, attacking, kills, loot, and all remaining queued enemy actions cleanly.

The free action is tagged with the upcoming player-turn index in `stunRecoveryTurn`. Only that enemy's ordinary strike is suppressed while that index remains current, until the following player action advances it. Thus a near-coincident regular action and recovery count as one action in that **player-turn interval**, not as an accidental double hit that depends on how the caller partitions `advance` into 0.1-, 0.25-, or 2-second calls. Other enemies keep their attacks, and the shared `_enemyClock` is neither reset nor delayed by recovery. Suppressed ordinary strikes are not banked. This precise collision policy is an **independent action-economy adaptation** because the original research does not establish it. It does not claim full frame-invariance for every pre-existing real-time rounding boundary in the game.

`resolveWeaponAttack` is deliberately a bounded damage/proc helper, not a second encounter scheduler: it validates current active state, resolves the hit, and may mutate defender status, but does not subtract HP or execute a free recovery action. It removes stale expired stun when called alone and preserves a pre-existing pending obligation on nonlethal hits. The live next-turn recovery guarantee belongs to `advance`; callers needing that guarantee must not replace it with isolated damage-wrapper calls.

Lethal hits clear active stun, queued recovery, the recovery-turn marker and PA on that enemy. Death/defeat interrupts further actions. New waves, retreat, fresh expeditions and validated save loads cannot carry an old enemy's recovery to another target. Proc feedback remains after the triggering hit; `proc` and `recovery` events identify `effect: 'stun'` and the enemy ID. A recovery combat-log entry also explains fatal recoveries after the battlefield view closes. Events and logs remain capped at 30.

### Reproducible same-stat survival evidence

`tests/club-stun.test.mjs` pairs identical seed-42, level-one starter characters with balanced policy against one controlled final-wave fixture: 2,000 HP, 50 attack, 5 defense, no evade/parry/block. The only treatment change is `weaponFamily: null` versus `'club'` on the identical weapon stats. This is a synthetic test enemy, not a shipped encounter, imported dataset, or new selectable stage.

| Treatment | Outcome / time | Attacks | Bursts | Heals | MP spent | Stuns / recoveries | Lowest observed combat HP |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| No weapon proc | Defeat at 43.7 s | 41 | 7 | 3 | 39 | 0 / 0 | 0 |
| Club stun | Clear at 45.2 s | 43 | 8 | 2 | 36 | 7 / 7 | 234 |

Neither treatment uses a potion. Clear recovery is excluded from the minimum-HP observation. Both exact replays reproduce their full state. This demonstrates a bounded survival benefit with recovery actions actually paid, not a universal victory or speed guarantee. Club procs and skipped attacks legitimately change RNG consumption after the common initial seed; a paired seed is not a claim that all later dice are identical. Constant-die tests separately isolate proc boundaries, critical guarantees, nonrefresh, avoidance suppression and unchanged damage ordering. The frozen starter/nonproc regression signatures and prior PA/tactics tests remain unchanged. No shipped creature stats, stage layouts, item stat rolls, item scores, loot rates or skill multipliers were adjusted to manufacture this result.

## v0.5 defensive roles: visible choices without new damage gates

This slice differentiates a small part of the existing encounter population, starting at **stage 3**, and makes the route and active defenses inspectable. The permitted report [003 §4.1(B–C)](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/003-equipment-armory-and-modes.md), [Monster Lab revision 63173](https://ehwiki.org/index.php?title=Monster_Lab&oldid=63173#Monster_Classes), and [Monster Stats revision 63858](https://ehwiki.org/index.php?title=Monster_Stats&oldid=63858) support the **shape** of differentiated monster defenses: END-heavy classes versus AGI/DEX-heavy classes, with END related to mitigation, AGI to evade and DEX to parry. The older derived formulas retain their documented uncertainty. This is not evidence for our particular names, profiles, rates, or placement. We do not import the excluded monster dataset, copy population statistics, or claim that these three roles implement original monster classes.

### Entirely independent role coefficients and schedule

Let `baseDefense = round(3 + 1.3 × stage + (boss ? 3 : 0), 2)`. This existing game's defense points are interpreted as general mitigation percentage points, not a new original-HV rating conversion.

| Role | Defense points | Evade per check | Parry per check | Block per check |
| --- | --- | ---: | ---: | ---: |
| 均衡 / `baseline` | Existing base defense | 2.5% | 2% | Existing normal 1.5% / boss 6% |
| 厚甲 / `armored` | Existing base + 18 | 1% | 1% | Unchanged |
| 靈巧 / `agile` | max(0, existing base − 3) | 10% | 7% | Unchanged |

- **Stages 1–2 remain numerically unchanged**, including all encounter stats and RNG behavior. They display the baseline role even when the same name acquires a different role later.
- From stage 3, the existing 碎晶甲蟲 archetype is armored and 荒野影獸 is agile. 灰霧獵犬 and 赤砂守衛 retain baseline defenses. The shared stable archetype index selects identity; combat does not infer it from a name substring or imported label.
- From stage 3, odd-stage bosses are armored and even-stage bosses agile. The existing creature names, deterministic placement, four waves, and enemy counts `1 / 2 / 2 / 1` are unchanged. Stage 3 therefore has roles `baseline / armored + agile / agile + baseline / armored`; stage 4 has `armored / agile + baseline / baseline + baseline / agile`.
- HP, attack, resist, cadence, XP, gold, loot probability, item rolls, item scores, automatic policies, skill multipliers, weapon proc rules and all damage phases are untouched. No weakness multiplier, mandatory counter-weapon, immunity, extra hit gate, new magic capability, or role-specific reward is added. Only the table's defense, evade and parry treatment changes.
- Each avoidance number is a **single-check probability**, not a net full-miss chance or a percentage damage reduction. The existing two-check resolution still determines full/partial avoidance. The preview does not sum these percentages or present them as DPS.

The intention is to make already implemented choices matter in ordinary encounters, not to guarantee one weapon's superiority. PA can reduce the armored role's existing mitigation; stun temporarily suppresses the agile role's evade/parry and offensive actions, but leaves block and the earned recovery action intact. The existing skill already bypasses evade/parry; it remains unable to trigger either proc. Axes retain their generated stat tradeoff with no invented bleed effect. These are context-dependent benefits, not a universal equipment score or forced build check.

### One encounter descriptor, two read-only views

`previewStage(stage)` returns `{stage, waves: [{wave, boss, enemies: [descriptor]}]}` with exactly four wave entries. Each enemy descriptor contains `{name, boss, roleId, roleLabel, defense, mitigation, evade, parry, block}`. It is a fresh, detached snapshot of base values: no active statuses, HP, attack, reward forecast, seed mutation or random draw. Numeric stage input is floored and bounded to 1–30; nonfinite or nonnumeric input defaults to 1. Changing the returned object cannot affect later previews or spawns.

The real encounter factory uses the **same internal wave descriptor**. Preview mitigation is computed from defense for display only; live enemies do **not** acquire a new `mitigation` property. This preserves the existing resolver contract: explicit finite `mitigation`, if a controlled fixture supplies one, overrides the fallback `defense / 100`; otherwise editing defense still changes damage. No stale duplicate stat shadows it.

`enemyDefenseView(enemy, tick)` returns `{baseMitigation, mitigation, baseEvade, evade, baseParry, parry, baseBlock, block, stunned}`. Rates are fractions in `[0, 1]` (general mitigation retains its existing 95% cap). The unprefixed fields are current values for an ordinary physical attack: active historical PA reduces general mitigation, and active stun sets evade/parry to zero without changing block. The helper shares the existing status validators; expired/invalid PA and active-stun state have no effect, and a pending recovery is **not** active stun. Explicit `stunned` already supported by the low-level resolver is also reflected. Skill-specific bypass and specific mitigation remain separate resolver behavior. Reading this view cannot mutate source stats, expire a status, consume RNG, deal damage, or discharge recovery.

### Bounded engine acceptance

`tests/enemy-roles.test.mjs` checks all 30 stages and all four actual waves against the shared preview, the unchanged HP/attack/resist/block/gold formulas, detached/no-RNG previews, defense override semantics, and PA/stun expiry and pending-recovery views. Eighteen canonical full-state hashes were frozen from **our own verified v0.4** for stages 1–2 × seeds 1/42/999 × plain/rapier/club. Only the two newly added display fields `roleId`/`roleLabel` are excluded; every prior state field, including RNG seed, items, events, timing and proc state, remains compared.

Constant-die tests isolate the mechanisms: a stage-3 armored normal has 24.9% mitigation, so 100 raw physical damage with no avoidance/critical resolves to `75 → 81 → 87 → 93` at zero through three existing PA stacks. Active stun bypasses an agile target's evade/parry but still cannot bypass a guaranteed block. There is no role-specific proc adjustment.

Six seed journeys (1, 2, 3, 42, 123, 999) clear stage 1, equip only the genuinely earned first weapon, replay stage 1, then clear stages 2–5 while retaining that same weapon. No enemy replacement, stat grant, direct unlock, manual potion or later auto-equip is used; complete replay states match. This is bounded engine acceptance, not a promise for every seed/build or a substitute for browser play acceptance. Wider paired comparisons and browser evidence are recorded separately.

## v0.6 conservative loot handling: explicit opt-in, not a stronger-item score

This slice changes inventory handling, not combat, item generation, reward rates, or original-HV fidelity claims. The eligibility policy and existing price `max(1, round(level × 3 + power))` are this independent game's choices. Credits retain their existing uses; this feature does not implement an equipment-forging or wider credit-sink economy.

### A retained same-base witness, never a scalar comparison

Only an **unlocked inventory item of Crude, Fair or Average quality** can be a manual sale candidate. Its complete generated name and supported metadata must identify the same recognized base as an item currently equipped or explicitly locked in inventory. Armor and accessories use their actual individual bases, not just their slot. Weapons also require matching implemented family identity; an axe's attack score cannot establish that a rapier or club is redundant.

Across the six implemented stats—attack, defense, HP, critical chance, evade and block—the protected keeper must be no worse in every component and strictly better in at least one. Missing supported stats mean zero. Equal items and any tradeoff remain; quality rank, level, mean roll and aggregate `power` are **not** dominance evidence. Superior+ items, unknown identities/metadata and equipped/locked items cannot be candidates. The policy only reasons about supported current-schema semantics, not unimplemented proc utility or future fields.

An unlocked stronger inventory item cannot witness another sale: both might otherwise leave together. Pending loot is neither a sale candidate nor a keeper. Every actual witness survives a safe batch because witnesses are equipped or locked. The legacy broad `sellCommon` engine command remains for compatibility, but is distinct from this safe policy and is no longer the ordinary bulk-sale UI entry.

### Pure preview and atomic camp-only commit

`previewSafeSale(state)` returns a fresh `{items, total}` snapshot. Each entry contains `{id, name, slot, quality, keeperId, keeperName, value, strictlyBetterKeys}`. No original item/stat array is returned. The helper neither mutates state nor consumes random draws, and duplicate live IDs fail closed. Unsupported item accessors are inspected as descriptors, never evaluated while reading IDs or selecting protected keepers. It is a read-only view; opening or canceling a preview cannot sell anything.

`act(state, 'sellSafe', {ids})` accepts a nonempty set of unique, exact string identifiers only at camp, not during battle or defeat. Immediately before mutation it recomputes eligibility and current price for **every** requested ID against current protected keepers. Any malformed, missing or newly ineligible entry rejects the entire batch with a clear cancellation log; no partial item removal or credit occurs. Successful commits remove only the requested inventory IDs, credit their current exact price once, then refill existing pending loot normally. Newly refilled items are not swept. Repeating the old request cannot award gold again. The UI additionally owns showing and confirming the specific preview; the engine never trusts client-supplied witness names or prices.

### Future-drop auto-sale, default OFF

`act(state, 'setAutoSell', boolean)` is camp-only and accepts a real boolean, not truthy strings/numbers. A fresh game has **no** `autoSell` property. Enabling adds `autoSell: true`; disabling removes it. Import only preserves literal `true`. This keeps the default state shape, default logs, seeded full-state baselines and RNG stream unchanged.

With that explicit opt-in, each future drop follows the old `generateItem` call and existing unique-ID allocation first. Only then, before insertion, the same conservative witness rule may convert that one newly generated item into the existing sale price. No extra random draw, regenerated roll, altered drop probability, retroactive inventory/pending sweep or audit/holding array is added. IDs advance even for sold drops. Sales log the actual item name and credited value; a sold guaranteed drop is never described as retained in the backpack.

The 120-item cap, five-slot entry reserve, pending-loot retention and near-cap forced return remain unchanged. Auto-sale cannot start an expedition with insufficient reserved space and is not a promise of endless unattended play: equal items, tradeoffs, high-quality drops and unsupported identities still accumulate safely.

### Bounded engine evidence

`tests/safe-loot-actions.test.mjs` covers detached/frozen preview inputs, equipped-versus-locked witnesses, stale whole-batch cancellation, malformed/duplicate IDs, repeat-click credit prevention, exact subset sales, pending refill, camp-only controls, strict default-OFF persistence and unsupported-import refusal. Three hundred paired seeded controlled drop paths cover first guaranteed weapons, later guaranteed drops and probabilistic ordinary drops across all three slots. Each pair keeps the same RNG state and ID counter, preserves every unsold item byte-for-byte, and differs in gold only by the eligible new item's existing price. Separate overflow/start-guard cases verify retention and safe stop. These are synthetic engine fixtures, not browser acceptance or a claim that every natural expedition has the same sale rate.

## v0.7 fixed weapon commission: deliberate family access, not a universal upgrade

This camp-only credit sink is an **independent adaptation**, not original Bazaar replenishment, Training, Forging or Stat Fusion. Completing the first expedition opens three existing weapon families: axe, rapier and club. The offer uses the **current character level**, Superior quality, R110 for every applicable stat, the Slaughter suffix and no prefix. Existing weapon endpoints, level scaling, quality curve, names, score and family mechanics determine the ordinary item; no additional combat power or hidden effect is attached to its origin.

The exact price is `max(250, 4 × itemSalePrice(canonicalOffer))` credits. Both the 250-credit floor and multiplier are adaptation tuning. The existing resale formula remains `max(1, round(level × 3 + power))`, so resale returns at most 25% of that purchase price. The engine recomputes both the canonical item and price; submitted item stats, score, cost or resulting balance are never accepted. Buying and reselling loses credits. This does not promise that the fixed offer beats a strong random drop: compare the individual stats and family effect, not the aggregate score alone.

### Read-only exact quote and immediate atomic delivery

`previewWeaponCommission(state, family)` returns a detached `{family, item, price, goldAfter, available, reason, quoteBasis, currentWeapon}` snapshot. A valid catalog specification remains visible while unavailable due to first-clear, camp, balance or capacity requirements. `reason` is the specific human-readable explanation; an available offer has an empty reason. `goldAfter` is the quoted balance minus cost (negative when unaffordable), not a balance the engine has changed. Malformed family, level or transaction/identity data fails closed with null item/price/quote fields. `currentWeapon` is a detached equipment snapshot for the exact six-stat comparison. It never invokes unsupported item accessors.

Opening, canceling or repeatedly reading a quote spends no RNG, gold or IDs, changes no state, and adds no logs/events. The current-level/family item specification is deterministic across reopening and supported save reload. Its displayed `loot-N` ID is only a prediction using the unchanged existing counter, wrap and live-ID collision rule; no ID is allocated by reading it. Ordinary random generation and the existing drop allocation path remain unchanged.

`act(state, 'commissionWeapon', {family, quoteBasis})` accepts only those two plain data fields. It reconstructs a fresh trusted quote, then verifies all requirements **before** mutation:

- Mode is exactly `town`, with at least one completed expedition. Battle, intermission and defeat do not qualify.
- The family and current hero level are supported; funds cover the complete canonical cost.
- Pending loot is empty and inventory has **at least six free slots before purchase**: one immediate delivery plus the original five-slot expedition reserve. Thus the maximum pre-purchase inventory count is 114 of 120, and the resulting 115-item bag can still start an expedition. A full/reserved bag or any pending loot rejects payment rather than queueing an undelivered purchase.
- The opaque `quoteBasis` still matches current family, level, balance, allocation counter, predicted collision-safe ID, canonical price and the entire displayed current-weapon comparison. Changed weapon identity/stats/locks/prose also revoke the old comparison. Unrelated armor/accessory or bag changes need not invalidate that weapon-only comparison, but current capacity/pending/ID guards always run again.

A success synchronously deducts the exact cost, commits the predicted standard `loot-N` counter and inserts **one locked item directly into inventory**. It never equips it, changes an existing item, sends it to pending loot, or runs future-drop auto-sale on it. The ordinary explicit equip/unlock/sell controls remain separate. Bounded loot feedback explains the cost, lock and unequipped delivery. Failure may add a cancellation log, but cannot change gold, items, ID/event counters, RNG, combat state or pending delivery.

The first success changes the existing balance and counter, invalidating repeated use of that quote; restoring the old balance alone or selling the new item does not restore consent. A deliberate second purchase requires a new quote. The UI separately consumes confirmation and revokes it on ownership/import/reload/navigation changes. This is local-game transaction consistency, not protection against deliberate save rollback or manual editing. No permanent receipt ledger, stock, timer, wall-clock refresh, new durable state/item field or description-encoded mechanic is added.

### Bounded transaction evidence

`tests/commission-actions.test.mjs` covers frozen-input/detached/RNG-free previews; deterministic reopen/reload; every family and all 500 supported hero levels; exact-price and repeated purchases; malformed/accessor/forged payloads; stale level/balance/counter/weapon comparison; camp/first-clear/cap/pending failures; original ID wrap/collisions; locked delivery and explicit loss-making resale; and unchanged complete seeded no-purchase trajectories. All 1,500 level/family purchases roundtrip the strict validator with exact item, gold, family and lock preservation, and no new persistent keys. An additional compatibility run imported the **actual own v0.6 engine** (SHA-256 `61d6d04f276e20b7e81542c6e091fead333cfbcf8bac249c6351a47dabaf2b0b`) and passed all 1,500 purchases; its `sanitizeItem`/`validateSave` source block is byte-identical in v0.7. This is engine/schema evidence, not browser acceptance or proof of natural affordability/usefulness; the separate commission guide and release acceptance record those outcomes.

## v0.8 axe Bleeding Wound: historical damage over time

This slice completes the existing axe's built-in **Bleeding Wound / 流血傷口**, without altering equipment rolls, family attack endpoints, commission prices, enemy stats, loot/reward formulas, skill multipliers or save schema. The permitted pinned research at `8e1ff32097d50ba8e1c30266653234506b98a5f4`, report 002 §5.2 and its 0.4 damage-coefficient correction, supports five maximum stacks, 25% maximum proc rate, seven maximum ticks, and the historical per-tick expression `unbuffed sheet ADB × 20% × 0.4 × stacks`. Report 003 §1.3 supports attack snapshotting on application. This historical shape is consistent with this game's existing historical PA/stun choice; it does **not** combine the current English wiki's 200-stack/decay or weaker-refresh protection into the older model. See `ORIGINAL-HV.md` for the dated source/conflict record.

### Explicit rate, snapshot and refresh adaptations

`AXE_BLEED_RULES` is the frozen object `{chance: 0.25, durationTicks: 7, maxStacks: 5, damageFractionPerStack: 0.08}`. Applying the researched maxima uniformly at every level is this game's fixed tuning, not a recovered original equipment/level scaling formula. The following exact choices are also adaptations where the available historical evidence does not establish this game's scheduler, rounding or refresh behavior:

- Only a **positive-damage basic physical axe hit against a surviving target** is eligible. Ordinary eligible hits use one strict-below-25% draw. An eligible critical guarantees exactly one added stack without a proc draw, even for multiple critical counts. Partial evade/parry/block may proc if damage remains positive. Whiff, full avoidance, zero damage, a lethal hit, magic, `破勢斬`, unknown/invalid identity and non-weapon slots cannot proc. Existing PA and active stun still affect the triggering physical hit normally.
- Each success adds one stack up to five and refreshes a shared **seven-future-tick** lifetime, including successes already at the cap. A failed roll does not refresh. Expired wounds restart at one stack.
- The whole wound snapshots `floor(basic sheet attack × 0.08 × resulting stacks)` on each success. The source is the unmultiplied basic attack supplied by the live player turn, **not** mitigated hit damage, critical/glance/damage-die output, enemy max HP, a skill multiplier, or future hero growth. Changing stats after application does not change an existing snapshot. Floor is applied after multiplying the total stacks, not separately to each stack.
- A later success may replace the whole wound with a **weaker** snapshot. This shared-refresh policy is deliberate; stronger-per-stack retention and the current wiki's weaker-refresh protection are not silently implemented. A legitimate snapshot may be zero: it still stacks, refreshes and displays, but never receives an invented minimum of one damage. Unsafe/nonfinite snapshots fail closed rather than installing unbounded damage.

The transient enemy field is exactly `bleeding: {stacks, expiresAtTick, damagePerTick}`. Stacks are integers 1–5; the snapshot is a nonnegative safe integer; expiry must lie within the next seven valid simulation ticks. `bleedStatus(enemy, tick)` returns a fresh `{stacks, ticksRemaining, damagePerTick}` or `null`. It does not mutate the enemy, pay a pulse, consume RNG, or alter any defense. Invalid/dead/expired status is inactive, and malformed overlong status is removed before it could age into an apparently valid timer. No per-item proc coefficient or durable status field is added.

### Seven future pulses and chronological settlement

A wound applied at tick 10 pays **no immediate damage**. It pays once at each crossed global boundary 11, 12, 13, 14, 15, 16 and **17**, then is removed. Thus expiry at 17 includes the seventh payment; removing it before payment would incorrectly shorten the effect. The read-only view at tick 17 is already inactive. `advance` owns the final pulse; an isolated `resolveWeaponAttack` call is only a damage/proc helper and does not replay missed scheduled damage.

Each positive pulse directly subtracts the lesser of remaining HP and its snapshot. It makes no accuracy, evade, parry, block, resist, critical, mitigation or damage-die check, spends no RNG and can never trigger another proc. PA does not amplify it; stun cannot stop it. A zero snapshot only ages its timer, without a damage event, RNG, attack count, proficiency, MP gain or reward. If multiple boundaries are crossed, owed pulses replay in ascending integer-tick order, with bounded work: a valid observed wound can owe no more than seven future payments.

At each tick, the engine processes a **captured old-wave enemy batch**. A live-to-dead HP edge clears that enemy's PA, bleed, active stun and recovery markers and settles its ordinary kill/XP/gold/drop once. The same central death and wave settlement is also used by direct attacks, preserving their prior ordering and reward arithmetic. A subsequent pulse, repeated zero-time update, dead enemy or stale marker cannot repeat a reward. After all old enemies for that tick are processed, an all-dead wave transitions exactly once; the boss clear uses the existing guaranteed loot, first-clear weapon guarantee, win rewards, recovery, reserve/cap rules and intermission.

**Terminal tick policy is an explicit action-economy adaptation:** when bleed clears a wave, no new-wave player action, ordinary enemy attack or recovery executes on that same boundary. Player clock time already accrued is retained, the new wave receives its ordinary fresh enemy clock, and actions resume on the next processed substep. New enemies never inherit an old pulse. When the wave remains alive, normal pending-stun recovery still runs before the player action. A wound that kills its stunned target therefore removes that target's recovery, while a surviving neighbor can still recover and fatally interrupt the player. Victory/defeat prevents further same-boundary combat actions.

### Feedback, lifecycle and regression scope

The live hit event comes before its optional `proc` event. A wound proc uses `effect: 'bleed'`, target ID and stack count; its text reports stacks, duration and snapshotted damage per tick. Every positive payment emits `type: 'bleed'`, `effect: 'bleed'`, the old target ID and **actual HP-subtracted** damage, with the enemy name in its text so final-wave feedback remains meaningful after the enemy panel disappears. Lethal bleed also leaves a bounded expedition-log entry. Nonlethal pulse messages are transient event feedback, not a claim of an unlimited damage-history log. Both queues retain the existing 30-entry cap.

Ordinary lethal hits, bleed death, defeat, retreat, new waves/expeditions and validated load discard the encounter wound. Raw live-state export may contain it, like PA/stun, but the unchanged validator drops the entire encounter and returns to camp. Item metadata, v3 storage namespace, migration/ownership policy and commissioned-item compatibility remain unchanged.

`tests/bleed.test.mjs` checks eligibility/RNG, partial avoidance, critical guarantees, exact formula/rounding, stack cap/shared weaker refresh, zero snapshots, malformed bounds, seven future payments, direct defense bypass, bounded chronological replay, death/XP/gold/loot/win/cap settlement, simultaneous deaths, new-wave boundary suppression, stun recovery interactions, cleanup and bounded feedback. Independent `tests/v08-acceptance.test.mjs` adds separate acceptance oracles. Old source-freeze checks are narrowed only around deliberately changed proc/scheduling integration; all retained non-axe trajectory hashes remain compared to their historical originals. Historical axe-without-proc expectations are explicitly labeled as historical rather than rewritten as if they were the old behavior.

**Partition guarantee is deliberately narrow:** a preloaded wound with player/enemy actions suppressed yields the same seven pulse sequence and damage at identical observed integer ticks across 0.05-, 0.1-, 0.25-, 1- and bounded 2-second caller partitions. This is not a claim of full-engine arbitrary-frame invariance. A read-only v0.7 baseline probe at exactly 21 seconds already produced 20 player turns with 0.05-second updates versus 19 with 0.1-second updates due to inherited floating cadence boundaries, despite both showing 20 TU ticks. The exact 8.4-second TU boundary can similarly round differently. This slice does not rewrite that global scheduler or change non-axe trajectories to conceal the limitation. Tests compare matched **processed ticks**, away from the ambiguous floating endpoint; the existing two-second cap and no-offline-income policy remain unchanged.

## Persistence and safety

Only JSON-shaped state is used. `validateSave` reconstructs known fields, bounds numbers/strings, rejects invalid item slots/quality/rates, rejects duplicate item identifiers and unsafe numeric identifiers, and preserves the generated affix metadata via a whitelist. Unknown non-item fields and volatile encounter state are ignored. Since v0.6, unsupported item/stat/roll fields or formats are instead rejected before sanitation, as described below. This is validation for a local single-player save, not tamper-proof competitive security.

Import/load returns to camp with preserved progress and equipment but fresh HP/MP. It does not replay unfinished combat or calculate wall-clock gains. User data export/import is owned by the UI. Battle state is deliberately not restored.

v0.4 reuses the compatible v3 storage namespace and the existing save schema version. Club identity was already allowlisted in v0.3; the new enemy stun/pending/recovery-turn fields are volatile encounter state and are deliberately discarded by `validateSave`, so no persistent data-schema migration is needed. Invalid unknown imported properties never activate a deferred recovery on load.

v0.5 retains that same v3 namespace, schema version and unchanged validator. Role identity and defense treatment are reconstructed from stage/archetype when a new encounter starts; they are never trusted from an imported enemy or equipment field. The existing raw live-state export can contain enemy role/status bytes, but validated loading discards the entire encounter and returns safely to camp. This is encounter-only state, not a claim that raw export JSON omits it. No save migration or live-battle restoration is added.

v0.6 retains v3 and adds only optional `autoSell: true` as durable state. An older validator drops this unknown opt-in field, reverting auto-sale to OFF; existing gold, items and explicit locks use the old schema. Older open tabs still run their old rules until refreshed, and single-writer ownership remains required. This is compatible supported-schema progress, not a guarantee that a future unknown equipment extension can be safely downgraded.

v0.7 retains the same v3 namespace and unchanged strict validator. Commissioned items are ordinary existing-schema weapons with standard numeric loot IDs and `locked: true`; the changed gold and allocation counter already existed. Quote/confirmation data is transient UI state and is not saved. No origin marker, purchase-price field or receipt is needed for compatibility. Older v0.6 readers can preserve supported purchased progress, but old tabs still lack the new commission action until refreshed; the shared single-writer and existing corruption-preservation rules still apply.

Before the old item whitelist can discard information, `hasUnknownSaleMetadata(raw)` checks every equipped, inventory and pending item. Unknown item/stat/roll keys, non-record stat/roll shapes, malformed supplied stat/roll values, slot-inapplicable weapon-family fields, nonboolean supplied locks, nonfinite/nonnumeric supplied level/power/roll, and non-string supplied names/descriptions/colors/affixes reject the **entire** load/import with `不支援的裝備欄位或格式，未載入；請保留原存檔。` Existing load/import failure guards retain the original save/current progress rather than writing a sanitized replacement. Nothing is silently auto-locked and then reused as a trusted keeper. Optional absent legacy diagnostic fields remain supported; unfamiliar names and explicit unsupported weapon identities with otherwise supported fields still load, but remain ineligible for safe sale. The established finite numeric/string normalization for supported fields otherwise remains in effect.

This stricter forward-schema boundary is deliberate. It avoids turning a future effect into a seemingly ordinary item through unknown-field stripping. It cannot recover metadata already discarded by a historical old version; keep original exports if such data may exist. No negative protection marker, repurposed description, durable sale ledger or hidden holding collection is introduced.

Legacy equipment changes, individual/broad sale, and stage selection require camp/defeat; the new safe batch sale and auto-sale setting require **camp** specifically. Retreat is safe. Locked items cannot be sold. At 120 inventory items the game refuses another expedition rather than discarding valuables. Space is reserved before entry; overflow is held in pending loot and forces a safe camp stop. IDs increment and safely wrap while checking every equipped/inventory/pending ID, so imported counters cannot cause collisions. Events/logs retain at most 30 entries.

## Verified slice and future work

`node --test tests/*.test.mjs` exercises the resolver's eligible/negative branches, deterministic rolls, progression, first clear, equip/faster replay, safe defeat, repeated auto runs, malformed saves, pending/cap safety, and bounded event queues. Browser integration is an independent acceptance step; unit test success alone is not a playable-game claim.

Original active stat allocation, armor families, full proficiency abilities, overcharge, original Shield Bash, stun's magical resist reduction, exact current-server proc scaling, spell schools, the rest of the original status/cooldown inventory, and broader encounter systems remain future self-iteration work. They are not silently claimed implemented. See ROADMAP.md for evolving next slices.
