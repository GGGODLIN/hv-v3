import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeThreeRun} from './helpers/three-run-baseline.mjs';
const hashes={"src/engine.js": "96dc9fefb6a9720dd203df0155df8e1a53da783810a3896184fc7ec4a20aa89b", "src/ui.js": "e4623460ac30d7ccb971e13bd711c1c3724a4b1fd3d3c0233382c176cdc7bb76", "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7", "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a", "index.html": "c9a8b9aba1b5d7705e77aad4aea46dd1e1fb89191eef61328e36c0bb301ac827", "package.json": "b451ae796f4001d9b2bebe35ac4206cc68abfd00cf452e975c8916f7b0f47728", "style.css": "d31722ee0ac457455f10464d2ad454aa6cc0d72e89afb2ac74ea2561164c2203"};
test('v075 exact reversal preserves accepted v074 runtime and version bytes',()=>{for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeThreeRun(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
