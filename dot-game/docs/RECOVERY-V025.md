# v0.25 source recovery and publication gates

## Last accepted fallback

Source `02023c017f145d62797459f7fc5170bd38cd060a`, personal `GGGODLIN/hv-v3`, branch `bot/dot`, directory `dot-game/`, is the full accepted v0.24 recovery point. Its website root is `962b1cee329b23dccae58f916ca7c5a74dc43e91` in `GGGODLIN/GGGODLIN.github.io/main`, only under `public/play/hv-v3-dot/`.

Recover the complete `dot-game/` directory, including source, original assets, tests, historical fixtures and docs. Verify all payload sizes/SHA256s in the exact commit's `CHECKPOINT.json`. Serve with `python3 -m http.server 8000`; test with Node20+ and `node --test tests/*.test.mjs`. No installation/build step is required. Source recovery does not restore browser progress, accounts, Library sync, permissions or offline earnings.

## v0.25 scope and gates

This workbench is an independent interface adaptation. Engine, loot and session modules, save format3, item identities/rolls, ordinary progression, Soulbind and IW1 remain unchanged. Filters/selected-sale consent are transient, not saved gear changes. Personal browser exports are QA input only and are not included in source backup.

1. Freeze complete source; run full tests/four runtime syntax checks and the independent audit. Retain exact naturally earned84-item input hash and bounded measurement evidence.
2. Back up source first to `bot/dot` with small immutable blobs, SHA-only tree, expected-HEAD lease and non-force update. Read changed files directly from the exact commit, verify unchanged Git identities and the complete manifest, and preserve all out-of-scope paths/modes.
3. Stage only six runtime files in `public/play/hv-v3-dot/candidates/v0.25/`. The actor must directly read the actual owner question and affirmative answer surrounding the2026-10-26 13:44UTC standing authorization before writing. This permits public unaccepted candidates, not false acceptance claims.
4. Verify exact candidate Pages CI and all six HTTP200 bytes/SHA256s. Actual cloud-browser play uses ordinary UI and unchanged prior export, without hidden-state/RNG/resource injection. The existing stable tab keeps its own save.
5. Back up complete browser-accepted source/readback before replacing the formal root with the identical accepted runtime.
6. Verify exact root Pages/HTTP; parent exercises its existing stable profile and reload. Add a final documents/manifest-only receipt; no runtime rerun/redeploy is required for unchanged runtime.

Uncertain writes require readback before retry; permission denial never authorizes another tool/account/path workaround. Preserve raw errors and pause when no newly relevant evidence authorizes the same operation.

## Current gate

Final source gate passed1,538 tests/four syntax/17 independent checks at2026-10-26 21:08UTC. Candidate publication/browser acceptance pending. Formal root remains accepted v0.24 until the above gates complete. See STATUS and the checkpoint-specific acceptance documents as they are added.
