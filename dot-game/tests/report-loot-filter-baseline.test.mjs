import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeReportLootFilter} from './helpers/report-loot-filter-baseline.mjs';
const hashes={"src/engine.js": "219109f45c4e23977df4cebce0104e0aee756e1beebc7808ecd83d17e443ee2b", "src/ui.js": "1755123e289680feffc3661d51dabda3f415c5657d2dac6e75786f58ca202035", "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7", "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a", "index.html": "c5c822d21cae53b8244bc24a7519687aa9bfcc6aefa6bdc0c8f0400ff347b20e", "package.json": "1f454e52cb2f9a8ad90724eff44e277a691ffcf1866d4b4cdc7a9db79c1cce82", "style.css": "d31722ee0ac457455f10464d2ad454aa6cc0d72e89afb2ac74ea2561164c2203"};
test('v078 exact reversal preserves v077 runtime and version bytes',()=>{for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeReportLootFilter(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
