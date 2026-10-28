# v063 independent audit — equip inspection continuity

Scope: source/DOM-model audit of the UI-only equip handler, not browser acceptance or publication approval. Reviewed the actual `src/ui.js` with the existing focus-faithful `comparison-focus-harness.mjs` and real engine transactions. No website or remote writes performed.

## Result

`node --test tests/equip-inspection-audit.test.mjs`: **10 passed, 0 failed, 0 skipped**.

- Successful equip retains the exact weapon in the worn inspector; selected inventory ID clears and selected slot becomes `weapon`.
- Inspector shows the equipped state and no obsolete swap preview, equip button or sell button.
- Keyboard focus follows the same exact item to the newly rendered worn card, including an ID containing quotes, brackets, backslash and punctuation.
- Actual game state, including RNG, equals a direct engine-only equip transaction. Persisted JSON equals that result, with one dispatched transaction. This test explicitly sets the harness ownership `supported` flag to exercise the save branch; it does **not** validate actual browser Web Locks or storage availability.
- Repainting remains presentation-only and retains the inspector.
- A detached old handler cannot overwrite unrelated inventory selection or perform a transaction.
- Removed and changed IDs cause no transaction, save or success claim.
- Battle-time rejection preserves selection and state, reports the unsuccessful swap, and does not claim success.
- Read-only rejection preserves state/selection and causes no transaction or save.
- Replaying the successful old button is inert.
- A candidate disappearing during action dispatch cannot create a false success: the handler verifies the actual equipped ID afterwards.

## Old-version reproduction

Loaded the unchanged v062 `src/ui.js` through the same full UI harness using a valid inventory weapon. Clicked the rendered real equip action, then checked actual engine state and rendered detail.

Observed: equipment contains the candidate ID, but `selectedId === null` and `selectedSlot === null`. Detail becomes `裝備檢視 點選裝備查看屬性與差值；選售請用獨立勾選框。` with a `.detail-placeholder`. The assertion that the inspector still contains the weapon name fails with `ERR_ASSERTION`. Harness faults remain empty. This is a behavioral reproduction, not a source-string check.

## Limitations

No real browser rendering, pointer interaction, accessibility tree, screen-reader, real tab-ownership race or public-site gameplay was tested here. Source-model acceptance is not a published/fully browser-accepted release. Website remains outside this audit's authorization; previous website rejection and pending fresh approval are not bypassed. Full-suite and exact-commit backup verification belong to the integrating parent.

### Reproduction command and exact count

One targeted old-version retention assertion was intentionally checked and failed; the full 10-test audit was **not** run against the old version and is not claimed to have 10 old-version failures. From the workspace root:

```sh
node --input-type=module <<'JS'
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as engine from './hv-v3-dot-v063/dot-game/src/engine.js';
import {fullUI,clone,find,collect} from './hv-v3-dot-v063/dot-game/tests/helpers/comparison-focus-harness.mjs';
const s=engine.createGame(42);
s.inventory=[{...clone(s.equipment.weapon),id:'candidate',name:'待換武器',locked:false}];
const h=fullUI(engine.validateSave(s),{source:readFileSync('hv-v3-dot-v062/dot-game/src/ui.js','utf8')});
await h.card('inventory','candidate').click();
await find(h.dom['item-detail'],e=>e.tag==='button'&&e.textContent==='換上裝備').click();
assert.equal(h.state.equipment.weapon.id,'candidate');
assert.ok(find(h.dom['item-detail'],e=>e.className==='detail-placeholder'));
assert.match(collect(h.dom['item-detail']),/待換武器/); // Expected ERR_ASSERTION on v062.
JS
```

Additional compatibility run: the independent audit plus existing `detail-action-focus.test.mjs` completed **18 passed, 0 failed, 0 skipped**.
