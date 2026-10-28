import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeDetailSale} from './helpers/detail-sale-baseline.mjs';
test('v064 exact reverse patch preserves all v063 UI bytes',()=>{
 const current=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(beforeDetailSale(current,'src/ui.js')).digest('hex'),'958a5b53318bcdc68884d658b48bb2fe061770e5f053f58b8434d75890aa8454');
});
