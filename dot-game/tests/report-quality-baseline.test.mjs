import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeReportQuality} from './helpers/report-quality-baseline.mjs';
const hashes={"src/engine.js": "219109f45c4e23977df4cebce0104e0aee756e1beebc7808ecd83d17e443ee2b", "src/ui.js": "809eb21f4b60fd7eb582be78084fb1bbbd24512933861710e0a392dfc73b26a7", "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7", "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a", "index.html": "2100156a977011bf67877f7c7c7c7e9b4c8defbc2cabb6afdc274b29f8330560", "package.json": "135c968c917644152f5a1517711d66e636ebe099c53e96b11f487ebc5de56b42", "style.css": "d31722ee0ac457455f10464d2ad454aa6cc0d72e89afb2ac74ea2561164c2203"};
test('v079 exact reversal preserves candidate v078 runtime and version bytes',()=>{for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeReportQuality(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
