import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeSelectionRetention} from './helpers/selection-retention-baseline.mjs';
test('selection retention inverse preserves previous UI exactly',()=>{const s=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');assert.equal(createHash('sha256').update(beforeSelectionRetention(s,'src/ui.js')).digest('hex'),'f20f519f5eb33e997b824bded58f1f6ce12064762cf152329551cd146d0837f0');assert.throws(()=>beforeSelectionRetention(s.replace('if (!item || item.locked ||', 'if (!item || false ||'),'src/ui.js'));});
