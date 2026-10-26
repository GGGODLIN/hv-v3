# Independent source audit — v0.21

Reviewed against accepted v0.20 source checkpoint `ee44bf5b2e270e9f71dc62a5567fe7f82053e93b` on 2026-10-26. This document records source/unit evidence, not browser acceptance or publication.

## Result

No remaining source blocker found in the bounded automatic-targeting change. The engine diff adds a pure selection/view function, camp action and optional save validation; only ordinary player-turn target lookup is replaced. Existing counter retaliation, damage formulas, DoT processing, reward settlement, enemy ordering and healing/Protection priority are unchanged. Different selected enemies naturally change later RNG-consuming outcomes; alternative policies are not promised identical encounters or universal improvements.

Independent `target-priority-audit.test.mjs`: **7/7 passed**.

- Caster identity remains preferred while its next action alternates physical/magical; repeated detached views do not change serialized state or RNG.
- Dead enemies are excluded. Lowest absolute current HP differs from HP percentage; ties preserve array order.
- Unknown/malformed, inherited and accessor policy fields are rejected; accessors are not invoked. Explicit default normalizes to absence. Alternatives survive JSON save validation.
- Actual ordinary and cadence-skill player attacks damage the selected actor, not the old first actor.
- Across 120 deterministic incoming-attack fixtures, observed counters target the actual attacker even while the policy prefers a different, stunned caster.
- Off-policy bleed deaths settle once. An all-dead DoT boundary creates the next wave and selects its live actor without duplicate rewards or stale-enemy actions.

These are synthetic correctness fixtures, not earned profiles, balance measurements or actual browser play.

## UI issue found and repaired

A native dropdown change could display an uncommitted value when cached ownership was true but lease acquisition failed inside `dispatch`. The UI owner added a repaint after rejected dispatch and a focused regression test. Rendering now derives selected policy/current target from engine state; camp and read-only guards remain, including an early forged-event guard. Selection does not directly mutate state or preview an uncommitted policy.

Historical renderer tests received dependency injection for the new pure `targetPriorityView` and explicit `_phase: 'fight'` in synthetic live-battle fixtures, plus displayed-version expectation updates only. No existing effect/target/ownership assertions were weakened. The combined independent/target UI/historical affected harness run passed **80/80** tests:

```sh
node --test tests/{role-ui,bleed-ui,commission-ui,counterattack-ui,ranked-abilities-ui,weapon-ui,target-priority-audit,target-priority-ui}.test.mjs
```

Full suite, baseline complete-state/RNG/report parity, earned-profile comparisons, exact source backup and browser/publication evidence are separately recorded by the integration/release owner. No acceptance claim is inferred from these source checks.
