# v0.3 independent acceptance audit

Audit date: 2026-10-25 UTC. Scope: only this independently written `dot-game/` and the explicitly permitted original-HV research. No excluded application implementation, generated constants, monster datasets, artwork, or other authors' single-player proposals were used. This document records source/unit acceptance, **not publication or browser acceptance**.

## Starting evidence

The personal GitHub connection independently returned `refs/heads/bot/dot` at exactly `f2c94634bac72fb9768c30c2ff30c38d7f2c7fba`. README, STATUS, ROADMAP, and ORIGINAL-HV were all read remotely at that exact commit before this audit. They identify v0.2 as the accepted live game and weapon procs/build outcomes as the next gameplay priority.

The selected PA formula is the historical research model, not a claim that all current original-HV mechanics are reproduced. New armor penetration applies **after** the triggering hit, at most three stacks, with `effectiveGeneralPhysicalMitigation = originalGeneralPhysicalMitigation × (1 − .25 × stacks)`. Fixed 25% noncritical chance, seven simulation ticks, shared-duration refresh, and the present single-weapon/automatic-combat integration are disclosed game choices. Positive surviving basic hits qualify; physical criticals guarantee one stack; skills benefit from an existing effect but never apply or refresh it.

## Independent automated coverage

`tests/v03-acceptance.test.mjs` exercises the exported combat and loot APIs plus actual battle/save integration:

- Damage is `50, 62, 75, 87` for four controlled 100-damage hits against 50% general mitigation as stacks accumulate; the first hit gets no new-stack benefit. Base mitigation is not rewritten.
- Strict probability boundary: `.249999` succeeds, `.25` fails. Critical guarantees use no extra proc RNG and do not add one stack per multi-critical count.
- Full avoidance, zero final damage, lethal/dead targets, magic, skills, and unknown/nonrapier weapons cannot apply the effect. Partial evade may proc but retains the original no-critical rule. Lethal damage benefits from existing PA before removing it.
- Existing PA alters only general physical mitigation. Specific mitigation remains multiplicative; Void bypasses only specific mitigation; magic is unchanged. All 41 discrete damage dice and the avoidance/critical order are checked against the existing resolver.
- Nonrapier RNG counts/results remain identical. Frozen starter first-clear signatures for seeds 1, 42, and 999 retain 31.6-second clears, final RNG seeds, rewards, levels, inventory counts, and turn counts.
- Stacks cap at three; successful reapplication refreshes seven ticks; exact-boundary expiry happens before damage. A crossed simulation tick removes stale status even when no player attack occurs. No enemy-to-enemy, wave, retreat/restart, defeat/recovery, or reload carryover.
- Family metadata changes no sheet stats, resources, item power, or comparison score. Generated weapon family survives validation; exact legal old generated names migrate. Near-matching/custom names, illegal quality/affix combinations, invalid explicit metadata, and nonweapon records do not acquire a weapon effect. The explicit unknown `null` sentinel survives repeated save/reload.
- Reload preserves earned progress and weapon identity but returns to camp with no enemy effect or offline reward. Battle damage events precede the proc event and identify the same enemy.
- UI source contracts require proc/status text, truthful score-excludes-effects wording, and candidate/stable v3 save/lock/preference isolation. These are **not** visual layout or screen-reader observations.
- Ordered version migration and corrupt/current protection are also exercised by `tests/version-chain.test.mjs`, existing v0.2/session tests, and independent v0.3 old-writer/corrupt-current cases.

### Controlled same-encounter comparison

With identical 100 attack, zero critical chance, 400 enemy HP, 80% enemy general mitigation, a fixed neutral damage die, and deliberately successful eligible proc draws: rapier clears in **7 hits**, no-proc club in **20 hits**. Against zero mitigation both take **4 hits**. This isolates the mitigation mechanism without changing sheet stats. It is **not** an estimate of average live-game clear time or a promise that every rapier beats every club/axe; the scripted proc success is stated rather than hidden.

### Test execution

At 15:10 UTC the aggregate suite passed **147/147**, including **27 independent v0.3 acceptance tests**, and all four runtime JS files passed `node --check`. No failed check is being represented as passed: two initial independent-fixture errors were corrected (a supposed lethal 50-HP target actually took 40 damage at the `.8` die; the UI uses the score synonym `評分`). Runtime assertions were not weakened.

## Required namespace separation: confirmed, not hypothetical

Continuing to share `save-v2`/`writer-v2` with an already-open v0.2 tab was unsafe. Web Locks serialize writers, but cannot make old validators understand new identity semantics.

The actual old `src/engine.js` was fetched from the exact starting commit above (Git blob `b8e1395e052eb57c5e4d3b32fa02a8de7ee40475`) and its original validator was executed in memory for a bounded reproduction. Only the unused module import/export syntax was adapted for evaluation; item and save validation logic was unchanged:

1. Current validation correctly keeps an explicit unknown family as `weaponFamily: null`, even if its display name is `普通・逐風刺劍`.
2. The old v0.2 validator accepts the same JSON version and drops `weaponFamily` from its whitelist reconstruction.
3. Current validation of the old writer's output then sees absent metadata and incorrectly infers `rapier` from the exact legacy name.

Thus an old-tab takeover of a shared save could convert an explicitly unsupported weapon into a functioning rapier, as well as continue old no-proc combat. This is a demonstrated unknown-identity regression, not merely a cosmetic field loss.

The integrated UI now uses `save-v3`, `writer-v3`, and `preferences-v3`. When no current save exists, it reads v2 then v1 within the **same** stable/candidate scope, writes neither older key, and rejects the first present corrupt version rather than falling through. Old timelines can continue without overwriting v3; their later progress is not merged. Candidate saves never read stable saves. An independent test simulates subsequent v2 writes and verifies v3 gold and unknown identity remain unchanged. Existing-current corruption also stops migration and preserves all bytes.

## Release gates and remaining uncertainty

- **Source/API acceptance:** covered by the automated checks above. Final frozen aggregate rerun and exact-commit readback remain the release owner's responsibility.
- **Browser acceptance:** pending separately. Required observations include visible stacks/tick expiry and proc cause/effect, reduced-motion text feedback, score explanation/cross-family comparison, save migration with an old tab remaining open, reload/import identity, two v3 tabs/takeover, candidate isolation, and no app console errors. A unit clock/lock test is not proof of real browser lifecycle behavior.
- **Known inherited limits:** actual physical-mobile rendering, real OS suspend/resume, and the v0.2 cloud visibility inconsistency are not resolved by this proc feature. Background timers may throttle; no offline progression is claimed.
- **Publication:** this audit made no external write, deployment, branch change, or user-computer operation. A source/test pass is not a live-release claim. Preserve the exact source/assets/recovery package and verify its remote commit before any separately authorized promotion.
