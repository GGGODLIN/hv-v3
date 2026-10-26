# v0.27 source acceptance — extra emergency supply

This records source tests and deterministic engine play, **not browser acceptance or publication**. Last accepted game is v0.25; v0.27 builds on source-only v0.26. Public staging remains tool-review blocked, as recorded in PUBLICATION-BLOCKER-V026.md. No website, alternate preview, CI, HTTP or browser operation was attempted for this iteration.

## Implementation reviewed

- Default-OFF optional `emergencySupply` preference applies only to Balanced and Assault. At the existing player-turn decision after normal healing, strictly below30% HP and integer stock>1 permits one existing potion. It reserves one for manual use.
- Existing3-per-expedition stock,40%-maxHP restore, manual last-bottle access, normal heal/Protection/attack order, rewards and damage rules remain. Sustain retains its existing automatic rule and can use the last bottle. The engine combines eligibility into a single potion call.
- Camp-only native checkbox is ownership-aware. Sustain disables this control while retaining the user's setting for later. Dynamic tactic text avoids falsely saying all potions are manual when enabled. The live view shows actual stock and consumption, and distinguishes current observed HP from a future after-heal decision.
- Start reports sparsely record true preference and retain actual aggregate potion count (manual+automatic), not an invented attribution. OFF report shape remains exact. Paid Item World entry consent includes the setting, so stale quotes refuse atomically.
- New reader strictly validates the optional boolean, rejecting malformed/accessor/hidden/inherited data without executing getters. Format3 stays. Exact oldv0.26 readers accept supported data but drop the unknown preference; no backward-preservation or refusal claim is made. Existing Exquisite-IW1 and older format guards remain tested.

## Focused source evidence

28 engine tests,11 source-controller/DOM tests and9 independent audit tests were added. Coverage includes exact30%, normal-heal suppression, very-low-HP heal+one-potion behavior, stock0/1/2/3, malformed stock, no sub-turn/render consumption, manual reserve use, Sustain last-stock behavior, Protection action priority, camp/intermission/defeat/new-expedition timing, immutable reports, quote invalidation, migration/import/reload, ownership loss and protected durable bytes.

The UI suite executes the real controller and session code against simulated DOM/storage/locks. It is not a real browser rendering, keyboard/device, background-throttling or cross-tab compatibility guarantee.

Exact current-OFF versus pinnedv0.26 baseline comparisons cover72 ordinary runs /6,568 quarter-second pulses across all three strategies; full state, RNG and reports are compared without exclusions. The earlier focused engine oracle also compares36 ordinary scenario grids /10,800 pulses against exactv0.25, whose ordinary combat remained unchanged in v0.26. The audit's separate natural acquisition cohort compares another120 runs /11,296 pulses exactly to v0.26.

Existing fixture bytes were not rewritten. Three NEW files retain exactv0.26 engine/loot and provenance. The historical prior31-file assertion excludes this new directory just as it excludes the later v0.25 baseline; all original hashes remain. Eight existing UI tests changed only current branding literals from v0.26 to v0.27 source-candidate wording. No gameplay golden expectations were replaced.

## Natural engine play: neutral and adverse outcomes retained

Two independently declared, fixed protocols were executed and preserved separately, not merged as independent population evidence:

1. Mature earned profiles:10 seeds,12 acquisition attempts each, routes capped8. Fork those profiles through routes1/5/8 and all three strategies, OFF versus ON:90 pairs /180 branch wins. All uses and clear-time differences are zero. Acquisition has120 wins; the original no-use result remains intact.
2. Progression snapshots: the same10 seed IDs, snapshots before play and after4/8/12 acquisitions, deepest naturally unlocked route and all three strategies:120 pairs /240 branch wins, plus120 acquisition wins. Assault uses16 extra potions in9 of40 pairs; Balanced and Sustain use none. Every paired win/clear time stays equal; Balanced/Assault never automatically consume the last bottle.

**The policy is not universally safer.** On Assault seed101, observed minimum HP falls16.214%→15.214% despite supply use and18 MP saved, because later healing decisions change. Eight of the nine used Assault pairs improve minimum HP; for example seed55 changes8.214%→27.180% with2 potions,3 fewer heals,18 MP saved and the same44.1-second clear. These are bounded observations, not guaranteed survival or speed benefits. No extra weakened-loadout cohort was introduced to force a positive result.

See EMERGENCY-SUPPLY-MEASUREMENTS.md and the retained complete sharded raw data for the protocols, source fingerprints, reproduction and limitations. Synthetic boundary tests are labeled separately from earned-source play. No edited browser save or hidden browser state was used.

## Final verification and backup

The final whole suite passes1,631/1,631 tests and all four runtime syntax checks. All37 existing fixture files remain byte-identical; the three newv0.26 baseline files are separately pinned. The complete two-cohort data restores from41 small files with indexed byte/SHA256 integrity. Stable input fingerprints, manifest count and source checkpoint identity are recorded in CHECKPOINT.json and the audit receipt. Full source/assets/tests/fixtures/scripts/recovery are backed up to `GGGODLIN/hv-v3` `bot/dot` only, using a non-force expected-HEAD update. Exact changed-file reads plus unchanged Git identities must establish the complete tree and preserve409 outside blobs/modes.

The source gate does not satisfy the blocked candidate/browser gate. No website publication or accepted-release claim follows from these checks.
