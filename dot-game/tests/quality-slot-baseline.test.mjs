import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeQualitySlot} from './helpers/quality-slot-baseline.mjs';
const hashes={"src/engine.js": "83e38774dab933bc34298ce9849ce0f76fa15b8be36362eed0ac944e2e92b679", "src/ui.js": "0b77a1c959c85eda5ad970a9469b9786f32d7a26e6188b0aa9472458a91cb9dd", "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7", "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a", "index.html": "2c3308e6b419abb6994a72f2d7d8926bec3e0c3ab98511389b0bcaf3ccc55d59", "package.json": "f6fb9b6eb23b77d6ede1d51faf715d23ea828105dcfa9ce2ca3284aca07f8ca0", "style.css": "d31722ee0ac457455f10464d2ad454aa6cc0d72e89afb2ac74ea2561164c2203"};
test('v073 exact reversal preserves accepted v072 runtime and version bytes',()=>{for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeQualitySlot(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
