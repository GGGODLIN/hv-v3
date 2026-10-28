# v069 independent source acceptance

Date: 2026-10-28 UTC. Reviewer: independent source-test agent; runtime implementation was owned by a separate agent. This is source and emulated-DOM verification, **not public browser play, Web Locks acceptance, mobile layout or comprehensive accessibility**.

## Result

`node --test tests/level-goal-audit.test.mjs`: **17 tests passed, 0 failed, 0 skipped**. No blocking issue found in the reviewed growth-goal implementation. The parent must run the complete suite against final files and preserve source before candidate/public browser acceptance.

## Evidence

- A normal level-10 source fixture ran several expeditions with the initial target fixed at level 11. Automatic internal starts did not reset the target. The terminal expedition finished all four waves and returned to camp.
- With XP one below a threshold, the first kill reached the goal during an early wave. The engine continued the current expedition, then credited the ordinary win, 10 adapted fragments and one adapted seed before stopping. A separate ordinary new-game fixture reached level 2 through final win XP and stopped without another expedition.
- Seeds 42, 711 and 908 compared growth-goal runs with ordinary continuous runs at matched 0.1-second engine steps. At goal completion, hero, equipment, loot and pending items, RNG seed, kill/win counts, fragments/seeds, unlock, item ID counter, best times and complete expedition reports matched exactly. Terminal lifecycle/clock fields necessarily differ because only the goal run is in camp; full state equality is not claimed.
- Explicit goal cancellation changed no serialized game data. A current-expedition stop replaced the goal; cancelling that stop did not resurrect the old goal. Intermission cancellation followed by current-run stop did not pay rewards twice.
- Level 500 and malformed action payloads were refused. A pending-loot start failure left no goal. The ordinary single-expedition route remained independent.
- Retreat, validated reload, simulated lethal defeat, UI import and the ownership synchronization handler cleared the goal. Source inspection confirms ownership change invokes that handler; actual cross-tab Web Locks behavior is not proven by the model.
- The actual UI handler discarded preceding camp wall time on start. Repeating the engine start action in battle did not alter the fixed target. Readonly and level-500 UI controls were disabled, and the displayed target explicitly identifies departure-time locking.
- At 2×, actual engine/UI-pump simulation completed one goal expedition and remained in camp across subsequent ticks; no new expedition was started by the second simulation half.
- Existing auto-advance moved the route but not the target. The terminal route matched the final report and was not advanced after camp return.
- A 115-item level-100 fixture hit the existing capacity safety stop before gaining a level. It retained rewards, cleared its target and did not leak that target into a later ordinary start.

## Scope and remaining acceptance

The goal is an explicit local auto-battle adaptation, not a claim about original HV. It does not add persistent save fields, tune XP, AP, equipment, combat or reward formulas, grant offline progress, or promise a fixed completion time. Manually constructed source fixtures are test inputs, not earned browser profiles.

Normal browser acceptance should use a genuine current profile: start the goal, observe its fixed next-level target across any ordinary repeat, finish the whole expedition after reaching the level, and verify camp remains idle. Also verify cancelling restores continuous play, current-expedition stop supersedes the goal, reload clears it, and 1×/2× controls remain usable. Do not infer mobile or screen-reader completeness from the DOM model.
