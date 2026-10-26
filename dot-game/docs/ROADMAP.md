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

## v0.3 chosen slice
Rapier identity and historical-model Penetrated Armor shipped in v0.3. This is one weapon effect, not complete all-family balance. Keep ordinary encounter tuning unchanged; assess proc-on/off with equal stats against the same armored fixture and verify the normal browser loop. Next gameplay candidates are club control with carefully researched recovery action semantics, more recognizable enemy defensive roles, and drop/gear decisions that remain meaningful beyond raw score. Avoid claiming small early-stage PA gains prove a balanced second fighting style.

## v0.4 chosen slice
Club stun shipped in v0.4: interruption, avoidance suppression and a clearly signaled recovery attack. Preserve existing stages and equipment statistics, show the non-refresh/recovery tradeoff, and validate multi-enemy scheduling independently. Do not equate reduced attack frequency with an unconditional win-rate improvement or claim full original-HV spell/debuff fidelity. After this slice, assess defensive encounter identities and beginner-facing build choices rather than adding effects without readable tradeoffs.

## v0.5 shipped slice
Make existing build choices readable: stage-3+ armored/agile encounters, faithful camp previews and live defenses after PA/stun. Preserve the first two stages and reward/item systems. Use actual progression seed checks and separate equal-stat proc comparisons from real generated-item comparisons; do not manufacture a universal best weapon. After this slice, evaluate whether the revealed economy/progression needs an equipment-investment sink or clearer loot management, rather than adding arbitrary complexity.

## v0.6 shipped slice
Observed idle runs stop near inventory capacity. Add conservative default-OFF future-drop sales and manually confirmed exact-ID cleanup, with explicit keeper witnesses and strict upgrade/unknown protection. Preserve all generation/RNG and near-full safeguards. Measure actual time/wins until stop; do not claim unlimited idle or a solved economy. Credits still need a separately researched, useful sink later. Safety and understandable review take priority over aggressive disposal rate.

## v0.7 shipped slice
Use earned credits for transparent fixed-spec weapon-family access, with ordinary existing-schema items and exact purchase consent. Preserve stronger random drops, zero-RNG previews, atomic quote/ID/balance checks, safe capacity and optional use. Keep the predeclared natural 100-seed measurement, including slower/equal outcomes and near-empty budgets; do not tune enemies or silently upgrade the catalog to manufacture success. Original AP/mastery, training waits and IW-gated forging remain distinct future systems, not labels for this commission.

## v0.8 chosen slice
Complete the first three weapon identities with the historically documented axe Bleeding Wound, not another generic damage bonus. Snapshot sheet attack, untyped periodic damage, bounded stacks/timing and truthful lethal feedback must remain distinct from direct-hit damage. Preserve ordinary loot/commission formulas, PA/stun and non-axe baselines. Validate DoT death/reward/wave ordering independently, and measure real natural axe access and paired benefit/counterexamples. Current English 200-stack decay is a different model; do not mix it into the selected historical five-stack system. Existing scheduler floating cadence differences are not solved or advertised as fixed by this slice.

## v0.8.1 selected correctness patch
An actual 250 ms online pump loses a due player action at 21 processed seconds because the clock stops at 1.0499999999999998. TU ticks and three-second intermissions also miss exact boundaries; cumulative TU addition drifts over long sessions. Fix numerical equality with a bounded comparison, retain signed clock debt, and compensate TU summation without changing damage formulas or the existing event order. This is not a full scheduler redesign or arbitrary-frame invariance claim. Preserve historical measurements with version labels, quantify new outcomes and keep the already-staged v0.8 candidate immutable. Source-only development/backup may continue, but no HTTP retry or publication occurs while the user's verification decision is pending.

## v0.8.1 UI lifecycle follow-up
Correct manual expedition-start timing independently of the denied public verification gate: a successful Start must not charge preceding camp time to its fight. Rebase only successful manual lifecycle changes, not arbitrary UI interactions, failed/repeated starts or engine-managed next waves. Keep source-only and accepted-release evidence separate. Do not turn repeated idle wakes into needless feature accumulation while publication is blocked.

## v0.8.1 repaired-save takeover follow-up
Prioritize a reproduced lost-progress defect over new breadth: a protected follower must revalidate durable bytes when it acquires ownership after another tab repairs the save. Valid recovery may restore persistence; missing, unreadable or unsupported data must not become permission to overwrite. Preserve source-only/public acceptance separation.

## v0.9 chosen slice
Make the three weapon routes easier to evaluate: show bounded recent expedition reports with start build context, actual basic/skill/bleed HP removal, incoming HP loss/minimum HP, action/resource counts and proc applications. A local pinned baseline survives the automatic loop until replaced; it is observation, not a causal best-build ranking. Preserve combat/RNG/rewards exactly and show session-only lifetime. This is a gameplay feedback feature, not a backup巡檢 milestone.

## v0.10 chosen slice
Introduce the first original-research-supported AP abilities: rank1 HP Tank, MP Tank and1H Damage. Preserve five Major slots and separate learning/equipping; show actual current effects and one-time AP costs. Initial1AP plus level growth, strict optional save data, free camp refund adaptation and legacy behavior must be explicit. This is the foundation for later ranks/ability breadth, not the entire original tree or a fabricated permanent specialization system.

## v0.11 chosen slice
Extend the three researched ability lines to their full original rank tables, giving visible level25/30 milestones and later gates without inventing more low-level scarcity. Show incremental next-rank cost separately from cumulative refund; upgrades retain slot state and never stack prior rank totals. Preserve exact rank0/1 gameplay, validate new optional rank data strictly and measure natural earned progression. This is three completed lines, not a complete HV tree; larger systems remain future work.

## v0.12 chosen slice
Actual browser progression repeatedly filled the inventory and required many singleton sales. Add deliberate per-item multi-selection with exact reviewed batch consent, clear comparison and atomic rejection of stale selections. Do not widen safe-sale heuristics or choose items by score. The player decides which tradeoffs to discard; quality, pricing, rewards, inventory limit and combat stay unchanged.

## v0.13 chosen slice
Give block/parry equipment an offensive-defense interaction through the original-shaped one-handed Counter-Attack damage subset. Use sourced chance/proficiency caps, actual gate evidence, bounded player-turn budgets and exact death/wave settlement; partial-defense eligibility and current three-slot weapon classification are explicit integration choices. Keep original counter-stun/OC/OS deferred rather than invent their missing constants. Report actual counters separately and measure naturally earned outcomes without promising a universal buff.

## v0.14 chosen slice
Make offensive, defensive and weapon-family alternatives easier to revisit with three gear-only camp presets. Store existing item IDs, not copies or stat snapshots; switch the complete set atomically even with a full backpack. Explicit save locks and cross-preset protection prevent accidental disposal. Abilities/tactics remain separate, and original Equipment Sets/Personas have broader scope than this adaptation.

## v0.15 chosen slice
Add original-supported raw rapier parry and legal Nimble affix with honest adapted rating-to-probability integration. Preserve old gear and expose the seventh tradeoff in all disposal/preset comparisons. Do not pretend the complete original Accuracy/interception model is implemented or alter quality weights to manufacture success.

## v0.15 next action after staging decision
Source is backed up; runtime development is complete for this slice. Do not start another feature to avoid the blocked acceptance step. Resolve the explicit isolated test-page permission recorded in RECOVERY-V015.md, then exact CI/HTTP and ordinary browser QA, acceptance source backup, and only then root promotion. Until then retain accepted v0.14.

## v0.15 departure feedback follow-up
Correct the observed enabled-but-refused camp Start control while staging authorization is pending. Surface the existing five-slot reserve and pending-loot requirement, and play the departure sound only after an actual transition into battle. This is a bounded UI correction, not another gameplay system or permission to retry staging.

## v0.15 release loop closed — 2026-10-26 12:07 UTC
Explicit staging authorization, exact candidate CI/HTTP, actual browser acceptance, acceptance-source backup, root publication, root smoke and final source receipt are complete when the final receipt readback is verified. The earlier staging blocker is historical. Future work may select the next supported gameplay improvement; do not repeat the old permission loop or replace the declared adapter with an unverified accuracy formula.

## v0.16 chosen slice
Reduce accumulated camp UI complexity without removing depth: put secondary battle reports, gear planning and abilities into three accessible transient tabs. Keep the core combat/loot loop visible and every original rule disclosure reachable. Verify live combat while secondary panels are hidden, keyboard navigation, dialogs, ownership and import/reload. This is an interface improvement, not a new game system or a final limit on expansion.

## v0.17 chosen slice
Add the first supported defensive spell decision: optional Protection, with independent25% damage reduction but an MP and attack-turn cost. Keep one understandable switch instead of a scripting/configuration system. Preserve uncertain source unlock/duration labels and the distinction from original Auto-cast Slots. Test legacy OFF equivalence and active timing/ownership before source backup and isolated actual play; do not expand the spell tree until this integration is accepted.

## v0.18 chosen slice
Expose existing supported weapon suffixes as intentional paid commission choices, keeping default Slaughter and existing quality/economy. Preview real attack/crit/parry tradeoffs, invalidate stale consent, preserve stronger randomized drops. Next breadth remains open; do not claim this partial catalog or small natural-play samples establish universal balance.


## v0.18 bounded quality-of-life follow-through

Implemented alongside suffix-choice commissions: a transient finish-current-expedition-and-camp intent, avoiding timing the three-second intermission to keep all victory rewards. It adds no offline progression or original-HV rule. Source tests and exact backup precede a rebuilt isolated candidate and actual browser acceptance; stable v0.17 remains separate. No further gameplay expansion is bundled into this checkpoint.

## v0.20 chosen slice

Add one clearly telegraphed mixed physical/magical-skill enemy pattern on stage5+ without retuning firstfour routes or rewards. Make physicalarmor/parry limits legible while block, control, offense and Protection retain tradeoffs. Preserve original monster physical normal attacks; no invented original MP costs. Full player Resist/Accuracy, magical equipment and elemental systems remain separate researched expansions rather than fabricated completed features.

## v0.21 chosen slice

Give existing mixed-encounter roles a simple camp target-priority decision: default first-alive, caster identity first, or lowest-current-HP cleanup. Deterministic original-order ties, unchanged heal/buff priority, actual-attacker counters and recipient-bound bleed preserve understandable causality. Compare naturally earned profiles across routes without tuning a universal winner; source parity and actual browser choice/reload/ownership checks precede publication. This is an explicit idle adaptation, not a claim to original-HV AI.


## v0.22 selected bounded improvement

Close the v0.21 report-context gap: actual start targeting / Protection policies, slotted ability ranks, and equipped identities in collapsed session-only details. Combat and bounded storage unchanged. Observation only, not full loadout replay or causal ranking; browser acceptance and source backup precede promotion.

## v0.23 selected investment slice

Make one complete resource-to-growth loop: earn explicitly adapted Soul Fragments from normal clears, confirm binding a known owned weapon, and keep its original identity/rolls while it follows character level. Preserve original quality-based fragment costs, restrict eligibility to weapons no higher than the character, and forbid automatic spending. Immutable anchors prevent cumulative rounding; strict versioned saves and disposal protection preserve invested gear. Do not simultaneously add IW, forging, salvage or unused materials. Those systems need their own complete prerequisites and earned-play acceptance.


## v0.24 first-tier Item World slice

Complete one explicit seed-to-challenge-to-permanent-upgrade loop. Normal clears earn one locally paced seed; Soulbound Fair/Average/Superior weapons can spend one for a five-round adapted challenge and IW1 only. Preserve original max10 as future work rather than illegal tiers, and keep unproven multi-tier arithmetic out of scope. Fixed entry difficulty, separate route records, no automatic retry, strict version3/immutable anchors and honest failure persistence precede natural measurements and browser acceptance. Do not bundle forge, salvage, CP, stamina, charms or unsupported equipment families.

## v0.25 selected inventory workbench

Address actual earned-play friction: the accepted v0.24 browser profile holds84backpack items, including28weapons across three known families and one legacy unidentified starter. Add AND-combined weapon-family/investment filters, truthful backpack-only matching counts, an explicit transient/reset/empty state, and full hidden selected-sale disclosure. Preserve item inspection, manual exact-ID consent and safe commission delivery discovery. No automatic best-gear decision, stat/economy/tier expansion or save migration belongs in this slice. Engine/loot/session byte parity and unchanged earned-profile evidence precede actual candidate play and promotion.
