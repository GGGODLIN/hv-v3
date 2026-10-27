# v0.38 source-only recovery

## Which version to restore
- Latest fully accepted / public recovery: v0.36, `2a5354689165d7512d279327db8935c3bbef8570`.
- This v0.38 source candidate derives from v0.37 `0de5f53220a7660c1fb0c7a304fcd6aa4ebcac8c`. It is not browser-accepted or published. Read `CHECKPOINT.json` and `ACCEPTANCE-V038.md` for exact source status. A newer source candidate is not a newer accepted public build.
- Existing formal website remains `f192fec4eff401948d80156f941c01404816cbba` (v0.36). No website write was requested/performed in this source slice.

## Rebuild / run
No dependencies, bundler, external CDN or generated production bundle. With Node 20+ and Python 3:

```sh
cd dot-game
node --test tests/*.test.mjs
for f in src/*.js; do node --check "$f"; done
python3 -m http.server 8000
```

Open the served index in a browser on the same authorized machine. This is a normal recovery instruction, not a claim that local browser verification occurred here and not a workaround for the denied website publication. All runtime source, local SVG assets, licenses, tests, old fixtures, measurements and docs are included. `CHECKPOINT.json` enumerates every other tracked dot-game file by byte length and SHA-256. Verify those bytes against the exact Git commit before restoring. Git history is retained in bot/dot; no force push or historical deletion.

## Save safety and publication scope
Data schema/storage remain v3; export through the normal UI before switching builds and preserve the previous copy. Do not inject state or use an older build to overwrite newer item data. Source/controller reload evidence is not actual browser persistence validation.

The pending v037 website Kenney PROVENANCE blob refusal remains unresolved; existing assets and provenance are retained unchanged. Do not remove them, use another path/host/API or publish v038 as a way around it. Actual browser candidate verification and accepted source backup must precede any stable replacement. Old HV / dot-archive remain paused. This checkpoint does not restore platform permissions, login, schedules or private browser saves.
