# v0.19 source acceptance — growth discovery

2026-10-26; development candidate, not yet browser accepted or root-published.

Base accepted full source: `b61a8ed67ea9c58260dab0bb98ea754a6ff33f0a` (v0.18).

## Scope

Read-only `growthReadiness` composes existing ability and Protection views. UI adds truthful per-line learn/slot/upgrade cues to the growth tab and an explicit focus-only shortcut, with separate optional Protection cue. No gameplay formula, RNG, reward, save schema, default allocation or automatic action changes. Current README/STATUS are condensed; all prior paragraphs retained in a clearly historical archive with provenance. Documentation cleanup is not itself a new gameplay mechanic.

## Verified source evidence

- Final aggregate `node --test tests/*.test.mjs`: **1,295 / 1,295 pass**, zero failures/skips.
- `node --check` for engine.js, loot.js, session.js, ui.js: **4 / 4 pass**.
- Independent 29-test pure-view suite: all rank gate boundaries; affordable alternatives and AP remainder; learned-unslotted priority; capped per-line actions; no upgrade for unlearned/uninstalled; maximum ranks; Protection Lv9/10 off/on; blocked states; detached/repeated read purity; active Protection/report session purity.
- Independent 13-test UI suite: exact labels, conditional “separately affordable, not all at once” copy, slot/learn/upgrade focus without actions, optional Protection focus without enabling, stale/repeated shortcuts, readonly/away/inactive controls, keyboard access and no live-region spam.
- Independent baseline check: engine source outside the added pure helper is byte-identical; 12 old/new runs (four seeds × three tactics), 1,200 ticks each, yielded **14,400 exact full-state/RNG/report comparisons**. Tests also retain 2,400 paired instrumentation observations.
- Existing tab, ability, commission, sale, finish-camp, combat, timing, save and migration regression remains passing. Only current-version UI marker assertions were advanced from 0.18 to 0.19.

## Pending release gates

Source exact-commit backup/readback; isolated authorized public candidate; exact CI/HTTP bytes; actual browser focus/learn/slot/fight/Protection/reload/readonly checks; accepted source; root publication and stable smoke. Do not infer those from source tests. Real higher-rank browser play is not claimed from level-gate unit fixtures. No narrow/physical-mobile or OS-suspend acceptance is claimed.
