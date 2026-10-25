# Browser acceptance — v0.1

2026-10-25, dedicated cloud Chrome. Tested staged source checkpoint 82aaec41a926de697e953d3151153f6894866502 (site 5c6301c0a8e72cdad96fcca64b2922d7a9c317a4). This is desktop testing, not a claim of real-device/mobile acceptance.

## Observed pass
- Page loads with player, independently drawn forest/battle scene, inventory and controls. Desktop screenshot inspected with no main-content clipping.
- New expedition automatically attacks, shows damage and enemies, completes first stage in 31.5 seconds; receives weapon, levels up, unlocks stage 2.
- Return to camp, inspect stat difference, equip loot: displayed attack 43 → 112; same-stage replay clears in 14.8 seconds. Automatic repeat works; stage selection can choose unlocked stage 2.
- Help opens and closes; battle/control state remains usable. In-battle equip/sell are disabled, retreat enables management.
- Settings opens; export downloads JSON. Import of that exported test save parses, asks confirmation and restores; close dialog and reload retain level4, attack124, kills19, wins3 and equipment/inventory. Restore intentionally returns to town and adds no offline earnings.
- No application-origin error appeared in inspected console entries; extension metadata errors are not reported as game errors.

## Follow-up patch
Browser found inconsistent localized quality labels. UI now derives all eight labels from loot module rather than duplicating a table; extra static regression passes. Release suite55/55. This patch changes presentation lookup only, not saved schema or combat; live release must smoke-check module loading and labels after publication.

## Limits / next acceptance work
- True hidden-window pause/resume was not conclusively exercised: creating another remote tab did not reliably mark the game document hidden. Static protection exists, but runtime visibility/cross-tab race coverage remains pending.
- No mobile-device or narrow-viewport browser test yet. Responsive CSS exists, not equivalent to verified mobile behavior.
- Audio, every sorting/filter branch, every inventory boundary and long-running multi-tab stress were not all manually exercised. Relevant engine save/locked-item/cap behavior has independent Node tests.
- Current prototype simulates while visible. Make background online-idle behavior a high-priority follow-up rather than confusing it with offline rewards. Browser suspension must not silently grant unlimited catch-up.

This baseline is accepted as a desktop-first playable prototype with these limits, not full HV parity or final-quality gameplay.
