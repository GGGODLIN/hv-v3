import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeResourcePool} from './helpers/resource-pool-baseline.mjs';
test('resource pool: exact inverse preserves all previous UI bytes',()=>{
 const source=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(beforeResourcePool(source,'src/ui.js')).digest('hex'),'0f06a4daef8e6323b6255845cc09dfe499a6a8190e30d2178833493692d06203');
 assert.throws(()=>beforeResourcePool(source.replace("current < maximum", "current <= maximum"),'src/ui.js'));
 assert.equal(beforeResourcePool('unchanged','src/engine.js'),'unchanged');
});
