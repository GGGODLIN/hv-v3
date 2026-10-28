import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeCommissionDelta} from './helpers/commission-delta-baseline.mjs';
test('commission delta: exact inverse retains all v058 UI bytes',()=>{
 const src=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(beforeCommissionDelta(src,'src/ui.js')).digest('hex'),'c39d305515efd906cd57fd71763bdf8fdaefafb4e95cf6bc80b86ae0f410c79a');
 assert.throws(()=>beforeCommissionDelta(src.replace('const delta = statDeltaText(key, diff);','const delta = 0;'),'src/ui.js'));
});
