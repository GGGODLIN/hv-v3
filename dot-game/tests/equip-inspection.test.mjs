import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeEquipInspection} from './helpers/equip-inspection-baseline.mjs';
test('v063 exact reverse patch preserves all v062 UI bytes',()=>{const s=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');assert.equal(createHash('sha256').update(beforeEquipInspection(s,'src/ui.js')).digest('hex'),'79e3303c72498f5cce66c88f8c228aca40eb577f1eacf896a1da52feeab88f70');});
