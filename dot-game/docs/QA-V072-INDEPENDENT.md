# v072 independent source review

Result: 16/16 independent tests pass in `tests/quality-hunt-audit.test.mjs`. No blocking implementation defect found. This is engine simulation and the existing focus-aware DOM model, not real browser, layout, mobile, accessibility-tree, or published-site acceptance.

## Verified
- Existing Superior inventory does not satisfy a new hunt; bad payload does not arm one.
- Natural seeded mid-wave qualification keeps combat alive until all four waves and normal XP/gold/fragments/seeds settle. Final guaranteed-drop qualification also works.
- Seeds 1, 3 and 7 have reward, equipment, inventory, RNG and report parity with ordinary repeat at the stopping boundary. Mode/idle timing intentionally differ.
- Multiple completed expeditions can precede the first qualifying drop. Cancellation after qualification is transient and resumes repeat rather than retreating. Detached matched views cannot mutate the goal.
- Finish-current overrides the hunt; canceling that override does not resurrect it. Growth, single-run and ordinary starts cannot retain an old hunt; battle-time attempts do not switch goals.
- Failed starts for full inventory/pending items never arm; defeat, retreat, canonical load, ownership-selection synchronization and normal import clear intent. Capacity safety stop remains effective.
- A controlled full-inventory model places qualifying loot in pending and counts it once. This fixture fills the bag after starting; it is an engine boundary test, not a naturally earned full-bag browser scenario.
- Existing safe automatic sale only supports Crude/Fair/Average. Low-quality auto-sold loot does NOT qualify; qualifying Superior-or-better remains held under current rules. A Superior auto-sale path is therefore not claimed as reachable or tested. The initial broader wording was corrected before acceptance to avoid suggesting otherwise.
- Item World rejects the ordinary hunt action and does not charge additional seeds.
- Source DOM checks start/cancel, aria-pressed, import/sync clearing and readonly refusal. Controlled 2× timer settles and does not restart on its second step or later callbacks.

## Remaining real-browser work
Naturally acquire qualifying loot via the hunt button, observe complete win/rewards and camp, inspect the existing drop report, check cancellation and repeat behavior, then reload and verify permanent progress remains while hunt intent clears. Actual timing, rendering and keyboard accessibility require browser verification. No HTTP per-file hash, mobile, or Library synchronization claim.
