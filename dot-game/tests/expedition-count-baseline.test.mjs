import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeExpeditionCount} from './helpers/expedition-count-baseline.mjs';
const hashes={"src/engine.js": "cfcbfedb28435537813ed5874abe38ab5e924f9cd1efefa23a9b83223578bf5e", "src/ui.js": "8977adf75d4d94f9b14b00976e87fec6b787a74ce40fa89d62ef84d188248b2d", "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7", "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a", "index.html": "65a02a857785338d39a78b55e09fc944d20a705ebb9bb1ae284c0345cf9ced50", "package.json": "f30e204dddbe517145183f8d9f42e90330a82c0181c33ccd0a4e1996dae1c4c8", "style.css": "d31722ee0ac457455f10464d2ad454aa6cc0d72e89afb2ac74ea2561164c2203"};
test('v076 exact reversal preserves candidate v075 runtime and version bytes',()=>{for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeExpeditionCount(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
