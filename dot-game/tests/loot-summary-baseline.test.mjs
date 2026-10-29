import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeLootSummary} from './helpers/loot-summary-baseline.mjs';
const hashes={"src/engine.js": "219109f45c4e23977df4cebce0104e0aee756e1beebc7808ecd83d17e443ee2b", "src/ui.js": "3d2372dd02a916ec76dfb316dfa12e674ff1ea5cde166bac094dc2a0d78bed21", "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7", "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a", "index.html": "a472cdf4b8a2d2ff74e2a6fef4f15f0637de0b26cd65be359a93170ebf0a79c7", "package.json": "b0834755d4e338f6250f5b0c3801ee7ec17dee09bb937af857d4bbd8cdeb8d6c", "style.css": "d31722ee0ac457455f10464d2ad454aa6cc0d72e89afb2ac74ea2561164c2203"};
test('v077 exact reversal preserves v076 runtime and version bytes',()=>{for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeLootSummary(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
