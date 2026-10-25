# Independent development roadmap

This is dot's own planning document for the independent HV-inspired idle RPG. It is not imported from another game's plan. A milestone is an ordering choice, not a permanent scope limit. New work is selected from actual play, defects, and observed progression, not from a requirement to keep adding systems every hour.

## First playable checkpoint

Complete expedition selection → autonomous combat → visible drops → equipment comparison/equip → persistent growth → repeat the same encounter with a measurable improvement. Keep one complete combat style before adding breadth. Distinguish original HV research rules from deliberately chosen idle adaptations in the release notes.

Acceptance evidence:
- The same saved character can start, win or lose, collect rewards once, return, equip, and start again without refreshing.
- A saved game survives reload; malformed imports do not destroy an existing save. Reward settlement cannot duplicate through repeated clicks or reload.
- At least one controlled same-encounter comparison shows a genuine stat/clear-time/survival improvement after equipping a known better item. Do not compare different enemies and call that proof of growth.
- Damage gates, roll boundaries, quality interpolation, affix eligibility, equipment aggregation, and cooldown/status time semantics have focused tests.
- A deterministic simulation samples early progression and several unsuccessful runs, not only a hand-picked winning seed.
- The source checkpoint and recovery instructions are read back from `bot/dot` before deployment. The live site is checked against the expected checkpoint. Existing `/play/hv-v3/` remains untouched.

## Candidate expansions after the loop works

1. **Build choices that change outcomes.** Add a second original-HV fighting style with distinct weapon/proficiency behavior; compare offensive and defensive builds against the same encounter set.
2. **Original-HV system depth.** Add researched abilities, legal affix families, elemental attack and mitigation interactions, and a wider independently transcribed item catalog. Do not label a generic crit bonus as an implemented original skill tree.
3. **Longer-term equipment investment.** Investigate v0.91 Item World, forging, and fusion separately from v0.86 mechanics. Preserve uncertainty in costs and multiplicative/additive interactions; independently design any missing single-player economy.
4. **Better idle controls.** Add understandable auto-skill priorities, retreat conditions, loot filters, and inventory safeguards without making a new player configure a programming language.
5. **Presentation and encounter identity.** Create original artwork and richer boss telegraphs/animations. Auto-play still needs visible cause and effect, recognizable enemies, and readable rare drops.
6. **Progression and economy validation.** Measure time to first upgrade, inventory growth, failure recovery, and currency sources/sinks. Adjust explicitly labeled adaptations rather than silently rewriting researched formulas.
7. **Offline progression, if justified later.** It is excluded only from the first version. Before adding it, establish bounded simulation, save integrity, clear reporting, and no double-counting between active and offline time.

## Iteration rule

Read the current remote checkpoint and known issues, choose one concrete improvement, implement in a non-overlapping ownership area, run relevant regression and play checks, preserve the source, and publish only a validated checkpoint. Record actual evidence and uncertainty. An iteration that only diagnoses a blocker is not a new gameplay release, and backup maintenance alone is not feature progress.

## After v0.2
Prioritize gameplay depth next: independently implement source-supported weapon effects (e.g. rapier armor penetration or club stun) with old-save migration and same-encounter comparisons, rather than another reporting-only iteration. Also retain the unresolved real-device visibility/mobile acceptance task without blocking all other feature work.
