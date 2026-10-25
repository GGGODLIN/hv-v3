# v0.6 safe-loot independent acceptance — candidate

Recorded 2026-10-25 18:24 UTC. Scope: the independently authored `dot-game/` candidate only. This reviewer owns `tests/v06-acceptance.test.mjs` and this document, plus narrowly authorized compatibility-assertion updates in `tests/engine.test.mjs`, `tests/enemy-roles.test.mjs`, and `tests/v05-acceptance.test.mjs`. **No runtime source was edited by this reviewer.** No excluded implementation/constants/monster dataset/art, user-computer operation, remote mutation, or deployment was used.

**This is source/unit acceptance, not browser acceptance or publication.** Accepted v0.5 and candidate v0.6 remain separate. Parent-owned CUA/browser acceptance, release packaging, source backup, and public-byte verification are separate gates; this audit does not assert those gates passed.

## Result

- Independent v0.6 acceptance: **45/45 passed**.
- Final aggregate at this audit checkpoint: **361/361 passed**, zero failures, skips or todos.
- Every `src/*.js` and `tests/*.test.mjs` passed `node --check`.
- A synthetic accessor case found that preview keeper selection evaluated an unsupported `locked` getter before classification. The engine owner hardened own-data-descriptor ID reads and metadata-filtered keeper selection; the original independent test now passes unchanged. Actual JSON files cannot carry getters, but the pure helper is now safer for direct callers too.
- One initial cross-base test fixture incorrectly replaced an armor item's stats but retained now-orphaned generated roll keys. Correcting that fixture to a valid six-stat vector preserved the intended cross-base assertion; production logic was not relaxed.

Commands from `dot-game/`:

```sh
node --test tests/v06-acceptance.test.mjs
node --test tests/*.test.mjs
for f in src/*.js tests/*.test.mjs; do node --check "$f"; done
```

## Exact policy checked

- `autoSell` is absent/OFF by default. Only Boolean `true` persists; turning OFF removes the optional field. A camp-only opt-in affects **future drops only**, with no inventory or pending-loot sweep.
- Candidates must be unlocked Crude/Fair/Average items whose complete generated identity is known. A same recognized base/slot/family item must already be equipped or explicitly locked in inventory. Pending items and unprotected inventory cannot authorize another sale.
- Attack, defense, HP, crit, evade and block must each be no better than that keeper, with at least one strictly lower. Missing implemented stats mean zero. Power/score/level do not decide eligibility. Equality, every tradeoff, all Superior+ tiers, equipped/locked items, unknown identities and unsupported metadata survive the filter.
- `previewSafeSale` is RNG-free, detached and nonmutating. It exposes exact candidate IDs, keeper IDs/names, strictly better stat keys, per-item price and total. Duplicate live IDs fail closed.
- `sellSafe` is camp-only and revalidates the complete requested ID set before modifying items/gold. Any nonexistent, duplicate, protected, unknown or newly ineligible member aborts the whole batch. Subsets are allowed; no unrequested candidate or newly refilled pending item joins it. Repeated requests cannot credit twice. The existing individual-sale formula remains `max(1, round(level * 3 + power))`.
- Auto-sale runs only after the unchanged generated item/RNG and unique-ID assignment. A sold drop consumes its ID and records the exact credit. Unsold loot remains in inventory/pending; reserve/start guards and overflow safe return remain unchanged. First-clear guaranteed weapon generation and later random slots remain intact.
- UI consent has an additional snapshot boundary: changes to displayed item/keeper data, price, or ownership invalidate the preview even when engine eligibility might still hold. Engine IDs-only actions re-evaluate current eligibility and current price; the UI never silently substitutes a changed displayed transaction.

## Independent behavioral evidence

`tests/v06-acceptance.test.mjs` checks:

1. **28 frozen complete OFF trajectories** from actual accepted v0.5: stages 1, 2, 3, 4, 5, 15 and 30, four weapon-family conditions, and balanced/assault/sustain policies. The digest includes state before start, after start and every `.1`-second update through win/defeat. No field is omitted—not role labels, RNG, generated loot, events/logs, clocks, proc statuses, resources or optional-flag absence. High-stage starter defeats are intentionally preserved, not interpreted as clear/balance evidence.
2. **270 complete generated-item fingerprints**, across three slots, levels 1/3/30 and 30 seeds, including every item field, RNG draw count and final RNG state. A separate **270 ordinary v0.5 generated-export roundtrip matrix** preserves equipment, item content, sale price, lock bits and gold.
3. Every one of the **nine bases × three low-quality tiers** requires its own protected base; cross-base, cross-family and cross-slot comparisons fail. Every implemented stat is separately made lower, equal, or traded against another; score and item-level manipulation cannot substitute for componentwise dominance.
4. Frozen-state previews, detached output mutation, exact prices, candidate/keeper protections, live-ID collisions, exact subset sale, all-or-nothing invalid batches, stale equip/unlock/stat/identity changes, repeated clicks/requests, camp-only operation, and pending refill without an expanded transaction.
5. **240 paired seeded guarantee-drop paths** (120 first clear, 120 later clears), comparing ON and OFF RNG, generated IDs, event counts, timing, battle/progression and nonsale hero resources. Expected auto eligibility is independently the low-quality set, because the controlled fixture has one valid all-stat-dominating locked keeper for every base. Each unsold drop is retained unchanged; each sold drop credits its exact formula price. ID wrap/collision handling is exercised before routing.
6. Inventory reserve and pending guards, full-cap retention, and forced camp after unsold overflow. These controlled fixtures validate routing and safety, not genuine progression or difficulty.
7. Unknown item/stat/roll keys, malformed supplied records/arrays/scalars, nonboolean lock values, unsupported scalar field types, nonfinite numeric scalar values, invalid stat/roll values, orphan roll keys, and nonweapon family metadata all reject at equipment/inventory/pending locations without input mutation. Accessor/prototype/symbol cases supplement ordinary JSON schema coverage.
8. Existing invalid v3 bytes block v2 fallback; invalid v2 bytes block v1 fallback. `loadVersionedSave` remains read-only and reports the error without overwriting or silently downgrading.
9. Actual frozen v0.5 sanitizer/validator execution, followed by current validation: the v0.6 opt-in disappears in v0.5 and stays OFF after upgrade; item arrays, equipment, pending items, lock bits, gold, and unknown-family null sentinel survive. No fabricated “old validator” merely deletes the flag.

Implementation-owner suites add 3,000 frozen generation cases, extensive known/legacy identity matrices, ordinary non-guaranteed drops, and UI interaction tests. Those tests are included in the aggregate but are not mislabeled as independent reviewer-authored checks.

## Trusted baseline and narrow historical-test updates

Baseline source was read and executed only from the verified independent v0.5 tree. Its SHA-256 values were:

| Accepted source | SHA-256 |
| --- | --- |
| `src/engine.js` | `2afaaf2ce100607b76e3c3ac86f562ae1019001e40942fff7e9674079bfd83ee` |
| `src/loot.js` | `af7eac11cc264b21f013a9d7cbb70fbee3eaabcdecae46d20e9aa2502d30d8f8` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |

The portable tests embed the baseline digests and exact old sanitizer/validator suffix; they do not require a sibling checkout or network. The old suffix is SHA-256 `158ebd12a17bd231a586667d5cb4333bb1d46ad9e25b0b7f17221049a9199064`; the complete 270-item/RNG fingerprint is `fd35840a9b86a90f51bdaaf797677fc023d4d316d86960218072f230fa45a6bd`.

Historical expectations that deliberately stripped unknown item fields now assert **whole-load rejection without mutation**, then remove the unsupported test field to retain their original root/hero/encounter-state-discard and numeric spawn checks. No combat/role assertion was weakened.

Old whole-module/action/sanitizer freezes would necessarily fail for authorized safe-sale integration. They were replaced only by hashes of **unchanged regions captured from the accepted source**: damage/proc resolvers, player/enemy scheduler, XP and ordinary-drop eligibility, generator tables/weights and generation/scoring, plus unchanged `session.js`. These are not new hashes blessing changed code. Original 24 v0.4 early-game trajectory regressions remain intact, complemented by the new 28 full-state v0.5 OFF regressions.

## Import boundary and compatibility limits

Unsupported supplied item/stat/roll metadata is rejected **before** the historical sanitizer can discard it. No auto-lock, hidden marker, quarantine or loss ledger is introduced. Auto-locking unknown items would be unsafe because a newly locked but stripped item could become a keeper authorizing a different sale.

Supported unknown names may load but cannot be candidates or witnesses. An unsupported weapon family retains the existing null sentinel and cannot be resurrected from a familiar name after downgrade/upgrade. Ordinary known v0.5 exports remain accepted. Existing finite scalar clamping remains a legacy normalization rule; the new guard rejects unsupported shapes/types and nonfinite values rather than redefining every historical scalar bound. Root/hero extras and transient enemy/PA/stun state are still discarded by the established safe-camp validator.

**Metadata already stripped by a historical version cannot be reconstructed or detected retroactively.** This change protects new v0.6 imports; it does not claim provenance recovery. Keeping original exported bytes remains important.

UI-owned behavioral tests verify unsupported import errors occur before confirmation and preserve current state/save writes, as well as ownership loss while awaiting `file.text()`, stale preview invalidation, exact confirmation, no duplicate credit, cancel/close/Escape/Back, and long-name text rendering. DOM/VM tests do not replace actual browser visual/focus/keyboard checks.

## Final audited source fingerprints

These identify this local source/unit checkpoint, not an eventual deployment. Recheck after any subsequent edit.

| File | SHA-256 |
| --- | --- |
| `src/engine.js` | `61d6d04f276e20b7e81542c6e091fead333cfbcf8bac249c6351a47dabaf2b0b` |
| `src/loot.js` | `5d3d97d8e8d53d87fdc006d78e053d7bd1220d0f4eb228b733f283577d10d0a5` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `src/ui.js` | `f7c46038cafd036c54f1136382d738735f3b3de8737387c9509bd0e86d024bae` |
| `tests/v06-acceptance.test.mjs` | `14489957b5052b0c43e3908bbdcc00da021ce000835be4b9a06623357631968b` |

## Parent-reported browser checkpoint — partial, not a verdict

At 18:37 UTC the parent reported actual CUA observations: default OFF/fresh state; empty preview with disabled confirmation and safe cancel; a browser-exported natural v0.5 profile imported through the file chooser with cancel preserving the fresh state, then acceptance restoring Lv.19, 8,764 gold and 99 inventory items with auto-sale OFF. Preview listed exactly `loot-123`/`loot-127`, keeper `loot-114`, total 152. Cancel retained the displayed inventory/gold; confirmation removed those two expected item labels, changed count 99→97 and gold 8,764→8,916, and left other labels unchanged. Enabling auto-sale after locking natural keepers did not sweep existing items or alter gold; reload retained the flag/locks.

**Important limit:** the parent's malformed-schema browser import attempt used a synthetic file in an executor `/tmp` not visible to the browser's filesystem. `file.text()` failed with `NotFoundError`; UI state remained intact after reload. This establishes the actual **file-read-failure preservation path**, not schema-specific browser rejection. Schema rejection remains covered by automated engine/DOM tests. No extra computer access or filesystem bypass is warranted solely to turn that observation into a different claim. Live auto-sale and ownership browser checks were still in progress when this checkpoint was supplied; no browser acceptance verdict is inferred here.

## Remaining release gates

- Rerun final aggregate and syntax checks after all edits and record the exact package/source fingerprints.
- Parent performs the authorized CUA play/visual checks; no raw browser automation was used by this reviewer.
- Save-v3 stable/candidate namespace isolation, actual failed import byte retention, sale preview/confirmation readability, focus/keyboard behavior and owner takeover deserve browser observation, not inference from unit tests.
- Source backup/publication, public-byte integrity, real mobile devices, OS suspension/background throttling and universal game balance are not established by this audit.

No denied, pending-permission or uncertain external action occurred in this review.
