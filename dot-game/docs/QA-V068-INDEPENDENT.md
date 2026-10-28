# v068 independent source review — simulation tempo

Reviewed 2026-10-28 22:08 UTC against accepted checkpoint212 source
`73b143ba7038ca184a947f2682170a023b865bb3` (`212-v067-frozen`).

## Result

**PASS at source/model scope; no blocking defect found.** Independent tests in
`tests/battle-tempo-audit.test.mjs`: **12/12 passed, 0 failed, 0 skipped**.
Command: `node --test tests/battle-tempo-audit.test.mjs`.
The reviewer wrote only that test and this report; no runtime changes or website
operations. Aggregate final tests and exact-commit backup are the source owner's
separate responsibility.

## Independently checked

- Exact source adapter calls `advance` once at 1× and at most twice at 2×, with
  identical bounded durations, not a multiplied duration. Unknown tempo values
  cannot enable a second step.
- First-step town/defeat and a simulated ownership loss after the first step
  prevent the second advance. A real-engine lethal fixture expires in the first
  half of a 2× callback and performs exactly one advance, with no win reward.
- A normal source-model single expedition earns exactly one win and returns to
  town; subsequent ticks neither restart nor change its state/rewards.
- Paired seeded runs through the full UI model: 160 2× timer callbacks equal 320
  1× callbacks of the same 0.25-second steps. Entire game state, RNG seed, rewards,
  and expedition reports compare exactly, not merely rounded output. Both run
  actual engine combat and obtain kills.
- Selector changes alone leave game state and save-write count unchanged. Invalid
  and read-only control events refuse the request and restore the displayed value.
- Switching at 240 ms then ticking at 250 ms advances only 0.02 simulation seconds;
  prior observed time is not retroactively doubled.
- A six-second gap grants zero progress; read-only and hidden foreground-only
  callbacks also grant zero. Return to eligible observation advances only the
  newly observed interval.
- Full UI-model import, ownership-selection reset and a fresh loaded page reset
  tempo to 1×. Reduced-motion preference does not disable 2× simulation.
- Markup provides a label and description. The description explicitly calls it
  whole-simulation acceleration, not attack-speed gain, and identifies reports and
  countdowns as simulation time. Exactly one `setInterval` remains, with the
  existing pump supplying the adapter; animation frames are not another clock.
- `engine.js`, `session.js`, and `loot.js` remain byte-identical to accepted v067.
  Therefore original damage/TU/scaling rules and existing pump gap/step bounds
  are not replaced by this UI adaptation.

## Boundaries

This is independent source and DOM-model testing, **not actual browser play**.
The model has no real Web Locks, layout, animation frames, browser throttling or
background scheduler. The between-step ownership case is an explicit injected
source model, not a real tab race. The lethal fixture deliberately sets enemy
strength and low player health; it is not represented as a naturally earned
profile. Candidate browser checks must cover normal 1×/2× use, natural completion,
reset/reload and readable controls; exact Pages/commit and formal publication
remain separate. No mobile, screen-reader, all-seed balance, or wall-clock
throughput guarantee is claimed. Faster real-time rewards are the declared local
simulation-tempo adaptation, not an original-HV mechanic or damage bonus.
