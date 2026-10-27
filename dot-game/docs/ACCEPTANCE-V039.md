# v0.39 native dialog naming — source-only acceptance

## Demonstrated defect and minimal repair
Formal v036 native Help and Settings dialogs had visible h2 headings but no aria-label or aria-labelledby, and no heading ID. Root observed that missing relation via read-only DOM and accessibility-tree inspection. No screen-reader speech behavior was tested. The v038 source retained this exact omission.

Add aria-labelledby="help-title" / "settings-title" and corresponding IDs to existing visible h2 headings. Four HTML attributes, no changed dialog text or controller behavior. Two displayed version strings and package metadata update to v039. Existing six other dialogs retain their names unchanged.

## Source verification
- Full Node test suite: 1,944 passed, 0 failed, 0 skipped (1,941 previous plus 3 focused naming tests).
- Four JS syntax checks passed: engine, loot, session, ui.
- Independently reviewed: index normalizes back to exact v038 after removing the four explicit attributes and reverting two version labels. Four JS modules, CSS and all assets are byte-identical to v038.
- Independent focused naming + historical camp-chest suite: 10/10 passed. Historical assertions updated only for exact version labels and four named attributes; no mechanics fixtures relaxed.
- No new standalone natural replay was required for four markup attributes; the full existing suite includes its natural UI-loop regression. Old v038 replay receipts are historical, not new v039 runs.

## Browser baseline, not new-build acceptance
Root used normal 300% zoom on formal v036 in the authorized dot cloud Chrome: CSS viewport 393×252 / devicePixelRatio 3; document scrollWidth 388; primary controls 2×2; route controls wrap; opened native dialogs fit with max-height 218 and normal scrolling. No horizontal main overflow or verified CSS defect. This is desktop zoom, not mobile testing. DOM/AX inspection established missing naming relationships, not speech output.

v039 was not deployed or loaded in a browser; inherited v037 forest and v038 chest are still not browser accepted. No claims of improved rendered art, mobile coverage or screen-reader acceptance.

## Backup and publication
Source-only checkpoint 155, base 1148c78966dd07a92a9a74a3850597c632ab5999. CHECKPOINT.json lists all retained payload bytes/hashes; the external source-verification receipt records the eventual exact source commit/readback. Do not infer upload success from this pre-upload document alone.

Formal site remains v036 f192fec4eff401948d80156f941c01404816cbba; latest fully accepted recovery 2a5354689165d7512d279327db8935c3bbef8570. No website actions, no Kenney changes, no refusal retry or bypass, no schedule mutation or dot-archive access. The pending material authorization remains unanswered.
