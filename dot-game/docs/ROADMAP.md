# Independent development roadmap


## v0.46 source-only slice: literal name lookup

Find backpack equipment by visible-name substring while retaining existing intersected filters and ordering. Search is a transient view, not equipment advice, a transaction or a new loot system. Keep exact comparison/sale IDs, hidden selection disclosure and pending/worn lists. Scope styling to the new control. No website operations; actual browser, IME and responsive acceptance remain pending.

## v0.45 source-only slice: quality-first inventory ordering

Sort all currently matching items by the existing quality tiers descending, retaining newest-acquired order within each quality. Quality is not a build recommendation or power promise. Preserve exact IDs, selection, transactions, save data and source attribution. No website operations; real browser acceptance remains pending.

## v0.44 source-only slice: exact-quality inventory view

Use the existing quality tiers as a transient exact-match filter intersected with the existing criteria. Preserve exact item selection, pending/worn visibility and manual-sale protections. No gameplay change or publication. Browser layout acceptance remains pending.

## v0.43 source-only slice: continuous keyboard inventory work

Retain exact-item basic action focus after repaint; equip follows the same item to its worn card, sale falls back to a safe filter. Never select a different destructive action, steal unrelated focus, or mutate gameplay to restore focus. Preserve material provenance, no website operations and no browser-acceptance claim.

## v0.42 source-only slice: honest import persistence feedback

Use the actual save result, not a successful JSON import, to announce durable progress. Distinguish browser persistence from memory-only load and point to export when unavailable. Preserve validated imported memory, original stored bytes on failed writes, ownership/confirmation and all gameplay. No website operations or browser acceptance claim.


## v0.41 current slice: latest selected import wins (source only)

Fix a reproduced async file-read race, not add another system: a slow older import must not replace a newer accepted file, resurrect a canceled selection, or overwrite current feedback on late read failure. A generation token invalidates prior reads on new import entry, file change and pagehide. Preserve validation, explicit replacement confirmation and live ownership checks. Engine, RNG, assets and save format remain unchanged. Source/controller evidence is not actual OS file-picker/browser acceptance. No website operation while the existing material scope question remains unresolved; stable remains v036.


This is dot's own planning document for the independent HV-inspired idle RPG. It is not imported from another game's plan. A milestone is an ordering choice, not a permanent scope limit. New work is selected from actual play, defects, and observed progression, not from a requirement to keep adding systems every hour.

## Current slice: v0.40 adopted-journey event observation (source only)

Fix confirmed event-ID collision after taking back progress: successful canonical replacement restarts transient engine IDs, so reset only that UI observation boundary. Same-state ownership changes must not replay old effects. No reward, storage format, engine, art or economic rules change. Full production UI with simulated browser APIs validates both storage notification and fresh ownership read paths; real v040 browser acceptance remains outstanding. No website action while the existing material-scope refusal is unresolved; do not rename a candidate to bypass it.

## Current slice: v0.39 native dialog naming (source only)

Fix the demonstrated missing names on Help and Settings native dialogs by linking existing visible headings. Preserve all art/CSS/controller/core/assets. Add focused name/unique-reference regression tests, run the complete suite and source backup; no website operation or schedule change. v036 normal desktop 300% zoom is a baseline only, not mobile or v039 acceptance. Existing material scope refusal is still unresolved.

## Previous slice: v0.38 original camp chest (source only)

Refine the original idle-camp prop instead of adding systems: remove the large yellow halo, introduce a restrained grounded wooden volume with lid planes, planks and iron bands. Preserve the no-enemies visibility rule and all forest, actor, nameplate, engine, save and RNG behavior. This is independently authored canvas work; all existing materials and attribution stay byte-identical. No candidate or formal website operation in this slice while the existing Kenney scope refusal awaits resolution. Source command tests and natural replay cannot establish rendered beauty; v036 remains latest browser-accepted/stable. Resume candidate QA only through an explicitly permitted path after the pending scope question is resolved, not by renaming a version to bypass it.

## Current slice: v0.37 original woodland stage

v0.36 is published and original-profile verified. Replace the repeated geometric tree triangles and flat-topped pillars with a restrained original canvas woodland: visible trunks, irregular grouped canopy, distant haze and a receding old path. Keep a quiet middle lane for the existing actors/nameplates; preserve all actor/overlay/chest drawing and core/save/RNG behavior. This is a bounded backdrop improvement, not complete art direction or a new mechanic. Source parity and exact backup precede isolated candidate publication; actual browser acceptance is still required before stable replacement. Earlier milestone sections below are historical.

## Current slice: v0.36 readable combat nameplates

The v0.35 actor release is complete. Actual desktop play exposed multiple tiny canvas defense lines over the moon; improve the hierarchy rather than adding systems. Keep names, HP, target and active effects in opaque compact labels, while the existing full DOM enemy-status details retain the exact defense probabilities, attack information and model caveats. Do not change actor bodies, engine, RNG or saves. Test source boundary/contrast/semantic cases and natural replay, then back up before isolated publication and actual browser acceptance. Narrow/mobile and native screen-reader behavior remain separate evidence, not implied by coordinate tests.

## Current delivery: v0.35 bounded desktop release complete

v0.35 actor identity is now published and accepted on both isolated candidate and the original stable profile. Source143 backup precedes stable144; exact Pages/21HTTP and seven candidate wins plus one original-profile win/reload are verified. Full source evidence and residual limits are in BROWSER-QA-V035.md. Do not revive the resolved candidate refusal or claim all visual work is finished: forest/chest, small enemy text against moon, narrow/mobile and observed caster ornament remain future work. The following slice descriptions preserve their original intent/status.

## Current slice: v0.35 readable original battle actors

v0.34 is published and bounded desktop-accepted, not blocked on the historical v0.26/v0.33 publication refusals. The latest actual cloud screenshot still shows generic shared pointed enemy geometry and a fixed hero sword. Give the four existing named enemies and boss distinct original canvas silhouettes and make the hero's displayed weapon match the existing equipment family. Keep the current layout, background, HP/status/target overlays, complete rules and all game state untouched. This is presentation only, not new combat roles or a claim of complete art direction.

Candidate source/test verification precedes backup, isolated candidate publication and actual visual play acceptance; formal replacement follows only after accepted source backup. Earlier sections below preserve the decisions and limitations at their original stage. Their then-pending browser or publication status is historical: v0.33/v0.34 have since passed bounded desktop acceptance. Mobile/narrow viewport and comprehensive accessibility remain unverified.

## v0.34 selected effect-detail readability

Actual accepted v0.33 desktop inspection exposed a wall of repeated technical weapon-effect text below otherwise compact comparisons. Reproduce the two always-visible source paragraphs, then keep a concise correct identity/tradeoff and historical-model/adaptation caveat visible while moving the byte-identical full paragraphs into one adjacent native disclosure. This is targeted equipment-detail presentation, not a generic collapse-all pass, automatic recommendation or new mechanic.

Keep exact stats/identity, pending restrictions, permanent protection and operation-time costs/risks outside the disclosure. Preserve only the currently selected exact ID's disclosure state and focused summary across rerender; another item starts closed, unrelated focus is never stolen, and nothing is persisted. Engine/loot/session, assets, art, original-HV facts, saves, RNG, transactions and dialogs stay unchanged. Source/controller and independent earned-state parity precede full source readback, isolated candidate CI/HTTP and actual browser acceptance. Accepted stable v0.33 remains until the new candidate passes; historical v0.33 refusals are resolved, not a current blanket blocker.

## Current priority: coherent scene and equipment presentation (2026-10-27)

v0.31 established scene-first hierarchy. The user then supplied six named resources, resolving the inaccessible X post's identity gap. v0.32 now uses two verified CC0 Kenney UI Pack shapes (three local recolored derivatives) and six original family SVGs, a regular readable inventory grid, adjacent comparison before disposal tools and consistent slate/brass controls. Reference screenshots inform organization only, never copied proprietary art.

No new gameplay system is selected while presentation remains the request. Preserve names, quality text, explicit sale checkboxes, hidden selection, pending FIFO, exact-ID comparison focus and all consent/ownership warnings. Actual game render/responsive/keyboard acceptance is still pending the publication/preview constraints; source tests and static asset inspection are not viewport or beauty evidence. Existing independent canvas scene art is still temporary and was not relabeled as Kenney art.

## v0.33 bounded readability correction

The next source pass reproduces two concrete defects in v0.32 rather than adding another mechanic: scroll-container clearance is smaller than outward focus-ring extent, and explicit inventory/pending accessible labels omit visible identity/status text. Use inset card focus, a visible comparison-state label distinct from sale/protection, and complete concise accessible identity. Do not infer actual browser clipping or screen-reader output from source math/DOM tests. Keep assets, source controller exact-ID focus, consent and readonly rules intact. Real viewport/zoom/keyboard acceptance remains the next presentation gate, not permission to bypass the existing publication block.

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


## v0.26 selected Exquisite IW1 access

Open the already-earned Exquisite axe/rapier/club route to the existing first-tier trial, rather than inventing IW2 arithmetic or a forge-material economy. Preserve the original-anchor formula, fixed local strength5, one-seed explicit payment, existing rewards, no auto-equip and mandatory camp return. Distinguish original quality limits10/15 from this game's IW1-only implementation.

Require all-family and cache/future-level500 validation, stale/changed-target atomic refusal, exact old-quality and ordinary-combat parity, missing-legacy-parry preservation, and explicit old-reader/protected-writer checks. Validate growth with earned items/resources and compare same-level bound-before versus IW1-after, not binding growth. Actual candidate UI play, complete source readback, CI/HTTP and stable-profile smoke remain publication gates; source simulations alone do not satisfy browser acceptance.


## v0.27 selected source-only idle improvement

While public staging remains tool-review blocked, continue the explicitly requested unaffected development with one bounded gameplay improvement: default-OFF extra emergency supply for Balanced/Assault. Reuse the existing three-bottle stock and restoration, check after existing healing below30%, reserve one manual bottle, and preserve Sustain's established automatic rule. Make the exception unmistakable in the control and reports; avoid a hidden automatic purchase or new potion economy. Exact OFF/all-strategy parity, portable old-reader preference-fallback checks, strict new-save validation, paid-entry quote invalidation and paired earned-source measurements precede complete source backup. This does not resolve or retry the publication block, nor replace actual browser acceptance; v0.25 remains accepted.


## v0.28 selected pending-loot recovery

Natural full-inventory play can retain a drop in the existing pending queue, yet the previous interface exposed only its count/start refusal and falsely described queued guaranteed loot as delivered to the backpack. Add a distinct FIFO pending list with exact comparison before the player decides which backpack gear to sell, and a camp-only claim action that transfers only what fits into existing free slots. This also repairs accepted imported saves containing pending items plus free space without requiring an unrelated sale or hidden retreat action.

Keep natural overflow and accepted-import boundary evidence separate. The116-bound-weapon limit is already recoverable and is not a bug; do not raise it or add storage, disposal, direct pending equip/bind/IW, reward or schema changes. Preserve exact item identity/anchors, existing automatic refill after sales, complete selected-sale consent, ownership and filters. Source tests/earned simulations/complete readback do not resolve the website review block or count as browser acceptance; accepted v0.25 remains.


## v0.29 selected gear-preview context

Close a concrete preparation gap without expanding the gear-only preset contract: the apply dialog already compares exact items and sheet stats, but its retained abilities and combat policies were only described generically and live in other controls/tabs. Show the current strategy, target priority, Protection policy, extra emergency supply semantics and slotted ability ranks alongside that comparison. Distinguish saved policy from active effects and Sustain's independent potion rule. Invalidate visible consent if displayed settings change.

Do not save/restore a full build, move controls, select a best strategy, spend AP, alter engine/loot/session behavior or add save data. Preview/cancel invariance, gear-only application, stale-context rejection, earned-source play and independent controller coverage precede complete source backup. This source-only slice cannot close the existing website review refusal or substitute for actual browser acceptance; accepted v0.25 remains separate.


## v0.30 selected comparison keyboard-focus repair

Repair the reproduced inventory/equipment comparison focus loss when a full render replaces the currently focused item button. Preserve the existing working pending comparison behavior and follow the exact owned ID after its location changes when a visible matching control exists; never use names or interpolate IDs into selectors. Restore only an actually replaced focused comparison control, not whichever item is selected. If that item no longer has a visible comparison control, use a visible nearby fallback without clearing filters or choosing another item.

Keep this a bounded UI adapter, not a general accessibility rewrite. Combat, item identity, RNG, saves, sale consent and permissions remain unchanged. Focus-faithful emulated-DOM reproduction, unrelated-control/no-steal checks, earned-source replay and independent frozen-input tests precede complete source backup. These are not actual browser acceptance and do not resolve the known publication refusal; accepted v0.25 remains separate.

### v0.36 接受進度

有限桌面candidate已通過（單／雙／Boss名牌，4場自然stage5，重載與held-ID保留）；接受phase全套1919與四syntax重新通過。先接受來源備份、再正式發布與原正式profile驗收。手機／READY／三effect同時目視仍未驗，不擴張本輪範圍。

### v0.36 正式完成

接受來源148備份後正式149已發布／exact CI和HTTP通過，原正式profile正常route1與重載通過，原44持有紀錄exact保留。150僅最後文件／manifest收據，不重部署。下一輪依ROADMAP選有價值改善，仍保留本版手機／極端狀態目視限制。

### v0.37 發布範圍卡點（2026-10-27 14:22 UTC）

來源151已完整備份驗證，但候選152的既有未改Kenney PROVENANCE blob遭拒；在拒絕後核對適用使用者素材請求與官方CC0，再對同一操作一次重試仍拒。已停網站寫入、保留正式v036，無候選browser接受。不得藉移除授權檔／重用SHA／改route繞過；等待使用者針對既有Kenney範圍的明確授權後依原流程處理，不把阻塞當新功能。
