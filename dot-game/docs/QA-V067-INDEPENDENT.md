# v067 independent review — soulbound next-level growth

Reviewed 2026-10-28 UTC within `hv-v3-dot-v067/dot-game` only, against the permitted own-project frozen baseline `hv-v3-dot-backups/207-v066-frozen`. Read this project's `docs/ORIGINAL-HV.md`; no other implementation, archive, external design/assets or user computer used.

## Result

No blocking production defect found. `node --test tests/soulbound-growth-audit.test.mjs`: **18 passed, 0 failed**.

This is independent source review plus the existing source-DOM harness and engine tests, **not browser, screenshot, responsive-layout or accessibility-tree verification**. Synthetic fixtures target edge cases; the growth test uses a real engine kill with deliberately prepared XP/enemy HP, not a claim of naturally earned progression.

## Runtime diff review

- `engine.js`, `loot.js`, `session.js` compare byte-identical to the v066 frozen baseline.
- `ui.js` adds only the existing `scaleSoulboundItem` import, an observational renderer, and conditional insertion for binding-bearing detail items.
- Renderer validates the current bound cache and matching character level before displaying the next immutable-anchor result. Level 500 and malformed caches show non-actionable messages.
- It preserves absent stat fields, treats crit/evade/block as percentage rates and parry as a raw rating, and uses the existing signed absolute delta formatter.
- No new action, resource debit, storage write, RNG draw, loot roll, save field, or progression rule was added. Original-HV mechanic claims are not expanded; the copy identifies this as this game's integration preview.
- `style.css` is unchanged at review; `index.html` changes observed were version-label substitutions.

## Independent tests

- Recognized axe, rapier and club in equipped, inventory and pending locations (nine cases), with exact before/after values and signed delta text.
- Repeated preview under a throwing RNG guard: complete serialized state (including currency, RNG seed, item IDs, stats and anchors), action-call log and storage-write log unchanged.
- IW0/IW1 crossed with present/absent legacy parry. IW note appears only with IW1; no fabricated parry row.
- Level 500 gives no next-level rows; unbound item gets no growth section.
- Malformed binding version, damaged current stat cache, mismatched/fractional character level and lost bound lock fail closed without writes or state changes.
- Readonly and active-battle inspection remain available and observational.
- A real kill levels the character from 1 to 2: all three held locations equal their previously previewed scaling result exactly, including immutable anchors. Detail subsequently updates to level 2 → 3.
- Deeply frozen bound item remains untouched; capped crit displays 16% → 16% and “相同”.

A test-authoring fixture initially attempted to mutate a deliberately frozen anchor; that test setup was corrected to replace the anchor object. It was not a production failure.

## Scope / handoff

Only `tests/soulbound-growth-audit.test.mjs` and this review were written by the independent reviewer. No production/helper files were edited. Full-suite execution, packaging, backup/source identity and any browser verification remain with the parent task. All reviewer writers stopped after this report.
