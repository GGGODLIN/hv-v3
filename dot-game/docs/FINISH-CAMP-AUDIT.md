# Finish-current-expedition independent engine acceptance

Date: 2026-10-26 UTC. This is a source-only audit, **not browser acceptance or publication**.

## Scope and provenance

The one-shot finish-then-camp control is an original implementation of this game's idle UX adaptation, not an original-HV rule. Audit compared the new engine with our unchanged full-source checkpoint `50d37a0eac4189bbdecd70ccd29dc06bee82c7af` (frozen `078-v018-staging-blocked-receipt`). No outside game implementation, constants, monsters or assets were used.

`tests/finish-camp-acceptance.test.mjs` runs independently of the workspace: it embeds SHA-256 trace expectations produced from that prior engine, not absolute imports or inaccessible files. Each trace includes the complete ordinary game object (including RNG seed) plus expedition reports at 600 successive observations. Cases span three seeds, four weapon-family settings, Protection ON/OFF and autoAdvance ON. Delays mix 0.1 and 2 seconds. The normal full regression command includes this suite:

```sh
node --test tests/*.test.mjs
```

## Actual independent results

- Focused suite: **38 tests passed**, no failures or skips.
- Separate direct old/new engine comparison: **24 paired runs / 14,400 observations**, exact full state, RNG seed and report equality while the new control is unused. These same traces are the portable digest tests.
- Six natural starter expeditions (seeds 2, 29, 42; autoAdvance OFF and ON) finish in camp with one win, no stage jump, and exactly the same hero growth, gold, loot, pending loot, kills, elapsed/actions, timing, events, RNG seed and report as ordinary completion. Queueing is absent from serialization and does not change any ordinary game field.
- Queue then cancel preserves byte-equivalent normal looping; pending intention survives normal advancement. Repeated button calls and camp ticks cannot repeat awards.
- Already-won intermission exits directly without re-awarding or re-reporting. Town/defeat calls and malformed payloads are inert.
- Retreat, explicit ownership-reset hook and validated reload/import discard the intention. A subsequent expedition does not inherit it. Actual defeat also discards it.
- Synthetic final-wave fixtures separately exercise normal attack, bleed pulse and counterattack endings under a 2-second update. Each produces one kill, one win and one completion report, then remains settled. These controlled fixtures are boundary tests, **not claims of natural player progression**.

## Review conclusion and limitations

No engine blocker found within this bounded addition. The new queue lives in a WeakSet, so ordinary save payloads cannot revive it. Winning rewards and the completed report are settled by the existing path before the one-shot camp transition; autoAdvance cannot run after mode changes to town. Immediate retreat remains separate. The sole deliberate lifecycle difference from manual post-win retreat is that the completed camp transition resets its unused intermission countdown to zero.

The UI agent separately owns native-button, read-only and ownership/import/reload integration tests. Browser keyboard use, visible status presentation and actual candidate page acceptance remain pending; no engine test substitutes for those checks. The previously prepared v0.18 website staging snapshot is stale after this runtime/UI addition and must be rebuilt from the latest verified full-source checkpoint before browser acceptance. The accepted public v0.17 is unchanged by this source-only work.

## Integrated regression

The complete suite passed **1,253 / 1,253 tests**, with zero failures or skips, including eight UI mock integration checks. Four runtime JS syntax checks passed. The existing commission UI partial test harness received the new real clear-hook dependency; its existing assertions were retained. No actual browser or publication verification is claimed.
