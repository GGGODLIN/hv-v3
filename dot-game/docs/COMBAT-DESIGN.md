# Independent combat and progression: v0.4 candidate

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

Weapons now persist allowlisted `weaponFamily` metadata. The loot helper recognizes only complete legal names generated by this game's older versions when metadata is absent. It does not guess from an arbitrary substring or rename. Unknown or invalid explicit metadata is canonicalized to `null`, so successive save/load cycles cannot silently reactivate name-based inference. Generic starter equipment and axes remain without a proc; clubs receive the separate v0.4 effect below. Paths with no implemented weapon proc consume no additional random draws; their earlier seeded combat behavior is preserved. Save import still ignores enemy status and returns to camp.

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

## Persistence and safety

Only JSON-shaped state is used. `validateSave` reconstructs known fields, bounds numbers/strings, rejects invalid item slots/quality/rates, rejects duplicate item identifiers and unsafe numeric identifiers, preserves the generated affix metadata via a whitelist, and ignores arbitrary unknown properties. This is validation for a local single-player save, not tamper-proof competitive security.

Import/load returns to camp with preserved progress and equipment but fresh HP/MP. It does not replay unfinished combat or calculate wall-clock gains. User data export/import is owned by the UI. Battle state is deliberately not restored.

v0.4 reuses the compatible v3 storage namespace and the existing save schema version. Club identity was already allowlisted in v0.3; the new enemy stun/pending/recovery-turn fields are volatile encounter state and are deliberately discarded by `validateSave`, so no persistent data-schema migration is needed. Invalid unknown imported properties never activate a deferred recovery on load.

Equipment changes, sale, and stage selection require camp/defeat; retreat is safe. Locked items cannot be sold. At 120 inventory items the game refuses another expedition rather than discarding valuables. Space is reserved before entry; overflow is held in pending loot and forces a safe camp stop. IDs increment and safely wrap while checking every equipped/inventory/pending ID, so imported counters cannot cause collisions. Events/logs retain at most 30 entries.

## Verified slice and future work

`node --test tests/*.test.mjs` exercises the resolver's eligible/negative branches, deterministic rolls, progression, first clear, equip/faster replay, safe defeat, repeated auto runs, malformed saves, pending/cap safety, and bounded event queues. Browser integration is an independent acceptance step; unit test success alone is not a playable-game claim.

Original active stat allocation, armor families, full proficiency abilities, overcharge, original Shield Bash, stun's magical resist reduction, exact current-server proc scaling, spell schools, the rest of the original status/cooldown inventory, and broader encounter systems remain future self-iteration work. They are not silently claimed implemented. See ROADMAP.md for evolving next slices.
