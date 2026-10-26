# Exact dot-owned v0.25 compatibility baseline

Copied without edits from the verified full restore of `GGGODLIN/hv-v3` branch `bot/dot`, exact commit `e5962e728ae4c20db80172916f3e1a9b72815a91`, checkpoint `121-v025-publication-receipt`. Only this independent game's own files are included. These are historical readers, not current production modules.

| Original path | SHA256 |
|---|---|
| `dot-game/src/engine.js` | `54dda1cf9982b4eab2336071d43cf398a1ad35fbe4397508f6fed5afedb5d974` |
| `dot-game/src/loot.js` | `8ca322c77ab265d88ebfdf1b64247e9170cbdd47fdb14f68b702903c368259cd` |
| `dot-game/src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `dot-game/src/ui.js` | `9303c16d361ece0c2bec431ee1d16b2b5619326db1e30ff4099e6a08aed3436a` |
| `dot-game/index.html` | `9ce28d081f4d5db6e1130be6bb10bb2f43ef03fb0909e9f6ebd89e8802030c35` |

`tests/exquisite-save-compat.test.mjs` verifies these bytes and runs the actual old UI in a simulated browser with its production ownership controller. Its profile is earned reproducibly from public engine actions; no private export is bundled. The separate actual-export evidence used the same old reader and unchanged v0.25 export, not a fabricated reader rejecting a patched schema.

The existing 31 pre-v0.25 historical fixture files remain unchanged. Their historical aggregate explicitly excludes only this new `v0.25/` directory.
