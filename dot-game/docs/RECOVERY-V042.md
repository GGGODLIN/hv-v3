# v0.42 source-only recovery

Source base: `87af2c1526ee6a38d1b67834ad3708a0bfd6a68e`. This source candidate is not browser accepted or published. Latest fully accepted recovery remains v0.36 `2a5354689165d7512d279327db8935c3bbef8570`; website `f192fec4eff401948d80156f941c01404816cbba`.

Retrieve the exact checkpoint containing this document from GGGODLIN/hv-v3 bot/dot, including all dot-game files. Verify CHECKPOINT.json payload lengths and SHA-256. Node 20+ and Python 3; no dependencies, build tool or CDN:

```sh
cd dot-game
npm test
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
python3 -m http.server 8000
```

Open http://localhost:8000. Choose a route, run automatic combat, return to camp, compare loot, equip and repeat. Export/import your retained profile through Settings; source backup does not contain browser progress. Save format remains v3. If import says it is only loaded in this tab, do not assume reload preserves it: export immediately. This feedback change does not repair storage permissions or unsupported locks.

All original source/tests/assets/attribution retained. Engine, loot, session, CSS and assets unchanged from v041. Repository ancestry remains available; this is not an offline Git archive. Source tests simulate browser APIs, not actual browser verification. Inherited v037/v038 art is also unaccepted. Existing Kenney website scope refusal unresolved: no candidate/formal publication, no route changes or omitted provenance to bypass it. No dot-archive or schedule operations.
