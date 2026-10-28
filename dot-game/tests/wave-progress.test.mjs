import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeWaveProgress} from './helpers/wave-progress-baseline.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
test('wave progress: the exact display-only reversal retains complete v057 UI bytes',()=>{
 assert.equal(hash(beforeWaveProgress(read('src/ui.js'),'src/ui.js')), 'bc16b8a75cebfe17bbdedc2d6369ecc264b54d0fb16efeef5e33ab5793eb073a');
 assert.throws(()=>beforeWaveProgress(read('src/ui.js').replace("state._phase === 'intermission'", "state._phase === 'idle'"),'src/ui.js'));
 assert.equal(beforeWaveProgress('unrelated','src/engine.js'),'unrelated');
});
