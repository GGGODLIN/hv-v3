# Frozen own v0.10 compatibility baseline

Copied byte-for-byte from this independent game's accepted full-source commit `26b01643d4a926fb7abb3669bd823e22dec78e6d` on `GGGODLIN/hv-v3` branch `bot/dot`, paths `dot-game/src/engine.js` and `dot-game/src/loot.js`. Runtime is unchanged from `a2406ee8ae7dfeeb0edeed268c59fd728dba1833`. These are our own implementation, not another author's game.

- engine.js SHA-256: `1d14482e3822c0336618d042f394be0c14eecafa0feeb6db7775a2922ebd68ee`
- loot.js SHA-256: `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc`

Used only as a portable behavioral comparison for pre-rank and rank-1 progression. Preserve these bytes; do not update them to make a regression pass. They are not production imports.
