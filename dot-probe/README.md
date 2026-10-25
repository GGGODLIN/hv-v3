# hv-v3 dot: backup and deployment probe

This is an independently authored infrastructure checkpoint, **not a playable game**. It checks whether a small complete source package can be preserved on the authorized `bot/dot` branch and later recovered without relying on an assistant's temporary workspace or conversation.

## Contents and launch

- `index.html`: self-contained static diagnostic page; all styling is inline, with no dependencies, scripts, network calls, build step, or third-party assets.
- `manifest.json`: checkpoint identity and SHA-256 digests of the HTML and this guide. The manifest does not hash itself.
- `README.md`: this recovery guide.

Open `index.html` directly in a browser. To serve it locally, from this directory run `python3 -m http.server 8000`, then open `http://localhost:8000/`. A successful page load is not proof of backup completeness or game functionality.

## Recover the checkpoint

1. Obtain the verified commit ID from the delivery receipt, rather than assuming the branch tip is the same checkpoint.
2. Clone `https://github.com/GGGODLIN/hv-v3.git`, then check out that exact commit in detached mode. Alternatively, download these three files from that exact commit.
3. Verify that both files listed in `manifest.json` exist, match their byte sizes, and match their SHA-256 digests. For example, use Python's `hashlib.sha256(path.read_bytes()).hexdigest()`.
4. Open `dot-probe/index.html`. Its probe ID must be `hv-v3-dot-probe-20261025-01`.
5. Only this directory is the independent probe. Existing repository contents and history are preserved but are **not** an implementation dependency or a source to reuse.

The final commit ID and independent read-back result are recorded outside this commit to avoid a self-referential receipt. This source package does not restore account access, credentials, hosting permissions, automation schedules, or browser saves. Hosting is a separate check; no deployment is asserted here.

## Project boundary

The intended game direction is equipment-driven automatic combat and loot progression, with online play first and no offline rewards in the first version. Full gameplay implementation has not started at this checkpoint.

This is an isolated capability test. Only inventories and research about the original HentaiVerse may be shared. Existing implementations, generated constants, monster datasets, pixel art, UI, architecture, and other authors' single-player design proposals must not be copied or used. Future game logic, data transcription, presentation, and assets must be independently created from allowed original-game research.

All work for this effort targets `bot/dot` only. Preserve other branches, existing files, and repository history. Do not force-push. This directory is additive and does not replace the repository root application.

## Verification limits

This checkpoint establishes only the files explicitly listed here. It contains no combat engine, equipment generation, growth system, save game, or playable loop. A GitHub write and successful read-back are separate from a browser-render test and from deployment to a personal website. Report each result independently.
