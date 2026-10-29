import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeQualityThreshold} from './helpers/quality-threshold-baseline.mjs';
const hashes={"src/engine.js": "a16e17c82ef5cd581749822a3d74953660768c1610e57ff36aa6c6462f4e8e9a", "src/ui.js": "6779d7364578dcd9efcad7807c054f8d590f903e8820b8826fb0e0a0ab0312ac", "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7", "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a", "index.html": "89d3a32ca1795378baa8fd85f3475490b293aece2a78f59d53d71c977006cae3", "package.json": "d667d0ac96d9864840f6d80e3b410fee0e4503946e23657bfde5cc34f5c034cb", "style.css": "d31722ee0ac457455f10464d2ad454aa6cc0d72e89afb2ac74ea2561164c2203"};
test('v074 exact reversal preserves source v073 runtime and version bytes',()=>{for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeQualityThreshold(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
