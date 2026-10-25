# Independent combat and progression: v0.2 candidate

This implementation was authored from scratch. No existing game implementation, constants export, monster dataset, artwork, or another author's single-player design was used. The source map is `ORIGINAL-HV.md`; public research is evidence, not access to HV server code. This document distinguishes rules implemented from evidence from explicitly chosen adaptations.

## Research-supported rules implemented

- Primary attributes retain STR, DEX, AGI, END, INT, WIS. Base HP = 500 + 10 × level + 6 × END; base MP = 10 + level + WIS, before this game's equipment bonuses.
- Physical attribute damage uses ln(3330 + 2 × STR + DEX) / ln(1.0003) − 27029.81, then weapon and other attack bonuses add. Proficiency does **not** add damage without a proficiency ability.
- Attribute physical mitigation uses min(0.8, 1 − 900 / (900 + END + AGI/2)). Independent equipment mitigation factors multiply; they do not sum unbounded.
- EXP cumulative thresholds use the documented formula in `ORIGINAL-HV.md`: level 2 requires 99 EXP, next increment is 69. Current content supports levels 1–500.
- Damage resolution exposes ordered trace phases: Whiff → Absorb → Evade → Parry → Block → Resist → MultiCrit → Mitigation → DamageRoll. Whiff is **not** an additional universal accuracy gate: only an explicitly supplied eligible chance can trigger it. Current creatures do not apply blind/shadow.
- Absorb requires magic and a ward chance, never physical damage; eligible critical magic bypasses it. To preserve this dependency, magic pre-samples critical eligibility before the ward gate but applies critical damage at the later phase.
- Evade/Parry/Block each perform two checks (1, 0.5, 0 damage). An evade glance cannot crit. Weapon skills bypass evade/parry; magic and stunned defenders bypass physical parry.
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

## Persistence and safety

Only JSON-shaped state is used. `validateSave` reconstructs known fields, bounds numbers/strings, rejects invalid item slots/quality/rates, rejects duplicate item identifiers and unsafe numeric identifiers, preserves the generated affix metadata via a whitelist, and ignores arbitrary unknown properties. This is validation for a local single-player save, not tamper-proof competitive security.

Import/load returns to camp with preserved progress and equipment but fresh HP/MP. It does not replay unfinished combat or calculate wall-clock gains. User data export/import is owned by the UI. Battle state is deliberately not restored.

Equipment changes, sale, and stage selection require camp/defeat; retreat is safe. Locked items cannot be sold. At 120 inventory items the game refuses another expedition rather than discarding valuables. Space is reserved before entry; overflow is held in pending loot and forces a safe camp stop. IDs increment and safely wrap while checking every equipped/inventory/pending ID, so imported counters cannot cause collisions. Events/logs retain at most 30 entries.

## Verified slice and future work

`node --test tests/*.test.mjs` exercises the resolver's eligible/negative branches, deterministic rolls, progression, first clear, equip/faster replay, safe defeat, repeated auto runs, malformed saves, pending/cap safety, and bounded event queues. Browser integration is an independent acceptance step; unit test success alone is not a playable-game claim.

Original active stat allocation, armor families, full proficiency abilities, overcharge, original Shield Bash/stun lifecycle, spell schools, original status/cooldown inventory, and broader encounter systems remain future self-iteration work. They are not silently claimed implemented. See ROADMAP.md for evolving next slices.
