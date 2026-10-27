# v0.39 source-only recovery

Latest source base: `1148c78966dd07a92a9a74a3850597c632ab5999` (v0.38). This candidate is not browser accepted or public. Latest fully accepted recovery remains v0.36 `2a5354689165d7512d279327db8935c3bbef8570`; public site remains `f192fec4eff401948d80156f941c01404816cbba`.

## Restore and run
Retrieve the exact source checkpoint containing this document from GGGODLIN/hv-v3 bot/dot, including the entire dot-game directory. Verify every CHECKPOINT.json payload byte length and SHA-256 before running. No dependencies, bundler or CDN required. Node 20+ and Python 3:

```sh
cd dot-game
npm test
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
python3 -m http.server 8000
```

Open http://localhost:8000. This is an independent equipment-driven automatic-battle RPG: choose a route, start expedition, return to camp, inspect loot and equip upgrades. Source backup is not your browser save: export/import through Settings on your own retained profile. Do not replace saves with test fixtures. Storage format remains v3; obey existing import compatibility warnings.

Only four dialog naming attributes and displayed/package version metadata changed at runtime. Art, style, engine, loot, session, controller and assets retain v038 bytes. Prior research, tests, assets and attribution are retained in full; the source snapshot is not a claim of complete Git history. Repository commit ancestry remains remote; it is not a bundled offline Git archive.

Existing Kenney publication scope refusal remains unresolved. Do not publish any candidate or formal build, change routes, omit provenance or use this version to bypass that refusal. v037/v038 inherited art and this v039 markup remain browser-unaccepted. Formal-v036 300% desktop zoom findings are only baseline evidence, not mobile, screen-reader or v039 visual acceptance. No schedule changes or dot-archive operations.
