import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeQualityHunt} from './helpers/quality-hunt-baseline.mjs';
const hashes=JSON.parse(readFileSync(new URL('./helpers/quality-hunt-v071-hashes.json',import.meta.url)));
test('v072 exact reversal preserves accepted v071 runtime and version bytes',()=>{for(const [path,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(beforeQualityHunt(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),hash,path);});
