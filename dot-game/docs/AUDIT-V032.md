# v0.32 independent source / asset audit

## Verdict and boundary

**21/21 new independent focused source/DOM/asset checks pass.** The audit found a keyboard/reading-order mismatch in the first candidate: inventory cards were visually above their sale checkboxes using `column-reverse`, while DOM order placed sale first. The implementation now puts the inspection button before its separate checkbox in DOM and uses ordinary column flow; the independent test verifies both.

This is a **source-only candidate**, not browser visual acceptance. No game page was opened, no browser/headless browser was launched, and no website, candidate ref, CI, deployment, alternate preview or saved browser progress was changed. Existing publication restrictions remain. Source DOM emulation does not establish actual tab behavior, screen-reader output, pixels, viewport fit, zoom behavior or mobile usability.

## Checks performed

`node --test tests/asset-interface-audit.test.mjs` passes all 21 checks:

- All six icon families use a finite local SVG path; the unknown starter/legacy weapon stays generic rather than being mislabeled as a researched axe, rapier or club.
- Pictures are decorative (`alt=""`, hidden icon wrapper). Full names, levels, quality and investment labels remain ordinary readable text. Malicious-looking names are assigned as text and cannot choose an asset URL.
- Bag, equipped and pending comparisons retain exact-item focus through repeated controller replacement. Rendering and inspection do not change complete game state, RNG, actions or storage writes in the source harness.
- Equipped selection has an explicit pressed state. Comparing a tile does not select it for sale; the labeled exact-ID sale checkbox is a separate control.
- Filtered-out manual sale selections stay selected and appear in the complete preview. Locked and bound IW1 items remain unavailable for sale, with textual bound/IW labels. Read-only comparison remains usable while sale controls are disabled.
- Pending items stay in FIFO order and outside backpack filters. They have no sale checkbox or equip/sale/investment actions before claim.
- The comparison section is immediately after the inventory and before manual/safe sale controls. Comparison headings are separate from actual stat rows, and signed deltas remain text rather than color-only information.
- The three Kenney derivatives reproduce byte-for-byte from the preserved original SVGs by only adding `viewBox` and applying the documented color maps. License hash and all derivative hashes match provenance.
- SVGs are self-contained: no scripts, external images/links, text/fonts, gradients, filter effects or event attributes. CSS asset paths are local and exist; no runtime remote media/font fetch is added.
- CSS source explicitly allows long-name wrapping, visible focus outlines, mobile reflow and forced-color button fallback. There is no new sticky/fixed inventory/comparison positioning that would override the normal small-screen flow.

The baseline is exact v0.31 source `e5aa0213f14b9ead85e8b81c3b5b340259e469be`. `src/engine.js`, `src/loot.js`, `src/session.js`, 40 historical fixture files and 2 browser fixture files are **byte-identical** to that baseline (45 files in the independent comparison). No game/schema change is inferred from the visual work.

## Actual asset inspection, not game screenshots

The six exact original equipment SVGs were inspected as a static raster contact sheet at 96px and 48px. Axe, rapier, club, armor, pendant and generic weapon remain distinct at 48px. They share steel, dark outlines, leather and muted copper; no clipping was observed in those asset images. These are original dot code-native drawings, **not Kenney equipment art** and not copied game screenshots.

The three exact Kenney-derived assets were independently rasterized with installed `sharp`/librsvg and inspected: the square inset has a dark opaque center and quiet double edge; primary and secondary buttons share geometry with restrained brass/slate fills. The original square asset is **not transparent in its center**. The implementation deliberately recolors that center rather than claiming a transparent asset.

The original archive SHA256 `a8a14a234911eb648c062622915c93e79e94e97cb7f9f375a70f6617f1174318` was independently recomputed. The preserved `License.txt` and the two selected original SVGs are exact bytes from that archive. `PROVENANCE.json` names the official [Kenney UI Pack](https://kenney.nl/assets/ui-pack) source and CC0 1.0 licensing. The archive and complete research inventory are retained locally in the research evidence; the source tree contains every runtime asset, selected original, license and derivative manifest needed to recover this slice.

## Contrast and remaining risks

Calculated source-color pairs, not screenshots or browser computed styles, give:

| Pair | Contrast |
| --- | ---: |
| Body text / page | 14.03:1 |
| Muted text / panel | 8.30:1 |
| Item name / tile | 13.45:1 |
| Primary button text / fill | 6.98:1 |
| Secondary button text / fill | 9.83:1 |
| Positive / negative comparison deltas | 9.46:1 / 8.01:1 |
| Comparison labels / table | 8.69:1 |
| Keyboard outline / panel | 10.99:1 |

This does **not** certify all legacy component colors, disabled opacity, arbitrary imported rarity colors, actual font rendering or border-image paint. Small equipped-item metadata and dense right-panel content still require real rendered desktop/mobile/zoom review. Long names are intentionally not clipped; they may increase tile/section heights. Therefore equal column widths and minimum slots are a source design, not a claim of uniform measured tile heights or first-screen fit.

Actual game layout, 1174×751 first-screen operation visibility, keyboard visible focus in the browser, mobile overflow and save/reload browser acceptance remain pending. The existing independently drawn canvas scene is unchanged; asset inspection does not establish a finished coherent scene-art redesign.

## Evidence files (implementation workspace)

- `evidence/audit-v032-focused.tap`
- `evidence/audit-v032-unchanged-core.json`
- `evidence/audit-v032-archive-verification.json`
- `evidence/audit-v032-contrast.json`
- `evidence/audit-v032-kenney-derived.png`
- `evidence/equipment-icons-contact-sheet.png`

Full aggregate test counts, runtime syntax checks, source-play results and the exact frozen recovery manifest belong to the final acceptance/checkpoint record; this independent note does not predeclare those outcomes or a remote backup.

## Independent final source-play rerun

The auditor independently reran `scripts/rpg-interface-measurement.mjs` with the separately restored exact v0.31 baseline and installed JSDOM 26.1.0. It exited successfully. The resulting **9,562-byte receipt is byte-for-byte identical** to `docs/measurements/rpg-interface.json` (SHA256 `6f07c738dfc3581c0bc694202752db452cdbfe301d7e3bc3e230edbb8a1fbf45`). All six recorded runtime input hashes match the current files, and the recorded runner hash matches the current measurement script.

The fixed seed42 acquisition completes 20 attempts / 20 wins in 237 one-second source pulses, with full game state and reports equal to exact v0.31 throughout. The retained loss list is empty; this is a known fixed sample, not a win-rate or balance claim. The unchanged earned save then passes 30 paired controller/state/RNG/action/storage-write checkpoints, including start, potion, one-shot return, immediate retreat, comparisons, filters, sale preview/cancel, history dismissal/stale confirmation, simulated binding with earned fragments, IW preview/cancel, actual earned weapon swap, read-only refusal, emulated-owned writes and the explicitly synthetic unsupported-save boundary.

This rerun remains source-engine/JSDOM evidence, **not browser play or native keyboard/layout acceptance**. The ordinary harness uses unsupported-Web-Locks ephemeral mode; separate owned-lock and dialog behavior are explicitly emulated. It neither validates production browser storage nor changes the accepted website or real saves.

Additional external evidence: `evidence/audit-v032-replay.json`, `evidence/audit-v032-replay.log`, and `evidence/audit-v032-replay-verification.json`.
